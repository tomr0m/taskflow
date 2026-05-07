import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Board, BoardMember, Role } from '../lib/boardApi';
import { boardApi } from '../lib/boardApi';
import { itemApi, Item, CreateItemData, UpdateItemData } from '../lib/itemApi';
import { getSocket, ItemPayload, MemberPayload } from '../lib/socket';
import { RoleBadge } from './RoleBadge';
import { ListView } from './ListView';
import { FiltersBar } from './FiltersBar';
import { ItemFormModal } from './ItemFormModal';
import { MembersList } from './MembersList';
import { InviteMemberDialog } from './InviteMemberDialog';
import { CalendarView } from './board/CalendarView';
import { TimelineView } from './board/TimelineView';
import { Button } from './Button';

type Tab = 'list' | 'calendar' | 'timeline' | 'members';

interface BoardWorkspaceProps {
  initialBoard: Board;
  currentUser: { id: number; name: string; email: string; avatarUrl?: string };
}

interface RtToast {
  id: number;
  text: string;
}

// Convert socket ItemPayload → Item (same shape; just assert type)
function payloadToItem(p: ItemPayload): Item {
  return p as unknown as Item;
}

function payloadToMember(p: MemberPayload): BoardMember {
  return p as unknown as BoardMember;
}

export const BoardWorkspace = ({ initialBoard, currentUser }: BoardWorkspaceProps) => {
  const navigate = useNavigate();
  const [board, setBoard] = useState<Board>(initialBoard);

  // List view — filtered items (server-side via URL params)
  const [items, setItems] = useState<Item[]>([]);
  const [itemsLoading, setItemsLoading] = useState(true);

  // Calendar + Timeline — all items (no filter), fetched once on first open
  const [calendarItems, setCalendarItems] = useState<Item[]>([]);
  const [calendarFetched, setCalendarFetched] = useState(false);

  const [activeTab, setActiveTab] = useState<Tab>('list');
  const [inviteOpen, setInviteOpen] = useState(false);
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | undefined>(undefined);
  const [calendarDefaultDate, setCalendarDefaultDate] = useState<string | undefined>();

  // Real-time toasts
  const [rtToasts, setRtToasts] = useState<RtToast[]>([]);
  const toastIdRef = useRef(0);

  // Presence: userIds currently viewing this board
  const [presenceIds, setPresenceIds] = useState<number[]>([]);

  const [searchParams] = useSearchParams();

  const boardId = board.id;
  const myRole = board.myRole;
  const canManageMembers = myRole === 'OWNER' || myRole === 'ADMIN';
  const canCreateItems = myRole !== 'VIEWER';

  // Keep a ref to board so socket callbacks don't get stale
  const boardRef = useRef(board);
  useEffect(() => { boardRef.current = board; }, [board]);

  // ── Toast helper ───────────────────────────────────────────────────────────
  const showRtToast = useCallback((text: string) => {
    const id = ++toastIdRef.current;
    setRtToasts((prev) => [...prev.slice(-2), { id, text }]); // keep max 3
    setTimeout(() => setRtToasts((prev) => prev.filter((t) => t.id !== id)), 3000);
  }, []);

  // ── List items (with filters) ──────────────────────────────────────────────
  const fetchItems = useCallback(async () => {
    setItemsLoading(true);
    try {
      const params: Record<string, string | number> = {};
      const type = searchParams.get('type');
      const status = searchParams.get('status');
      const assigneeId = searchParams.get('assigneeId');
      if (type) params.type = type;
      if (status) params.status = status;
      if (assigneeId) params.assigneeId = parseInt(assigneeId);
      const fetched = await itemApi.list(boardId, params as never);
      setItems(fetched);
    } catch {
      // silently fail
    } finally {
      setItemsLoading(false);
    }
  }, [boardId, searchParams]);

  // ── Calendar / Timeline items (all, no filter) ─────────────────────────────
  const fetchCalendarItems = useCallback(async () => {
    try {
      const fetched = await itemApi.list(boardId);
      setCalendarItems(fetched);
      setCalendarFetched(true);
    } catch {
      // silently fail
    }
  }, [boardId]);

  useEffect(() => {
    if (activeTab === 'list') fetchItems();
    if ((activeTab === 'calendar' || activeTab === 'timeline') && !calendarFetched) fetchCalendarItems();
  }, [activeTab, fetchItems, fetchCalendarItems, calendarFetched]);

  // ── Socket: join board room, handle events, presence ──────────────────────
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    socket.emit('board:join', boardId);

    // Track whether we need a full refetch after a reconnect
    let needsRefetch = false;

    const onConnect = () => {
      if (!needsRefetch) return;
      needsRefetch = false;
      fetchItems();
      if (calendarFetched) fetchCalendarItems();
    };

    const onDisconnect = () => {
      needsRefetch = true;
    };

    // ── item:created ─────────────────────────────────────────────────────────
    const onItemCreated = ({ item: raw }: { item: ItemPayload }) => {
      const item = payloadToItem(raw);

      // Add to list view (dedup by ID)
      setItems((prev) => prev.some((i) => i.id === item.id) ? prev : [item, ...prev]);
      // Add to calendar/timeline (dedup)
      setCalendarItems((prev) => prev.some((i) => i.id === item.id) ? prev : [item, ...prev]);

      // Toast only for other users' actions
      if (item.createdById !== currentUser.id) {
        const actor = item.createdBy?.name ?? 'Someone';
        showRtToast(`${actor} added "${item.title}"`);
      }
    };

    // ── item:updated ─────────────────────────────────────────────────────────
    const onItemUpdated = ({ item: raw, actorId }: { item: ItemPayload; actorId: number }) => {
      const item = payloadToItem(raw);

      setItems((prev) => prev.map((i) => (i.id === item.id ? item : i)));
      setCalendarItems((prev) => prev.map((i) => (i.id === item.id ? item : i)));

      if (actorId !== currentUser.id) {
        const members = boardRef.current.members ?? [];
        const actor = members.find((m) => m.userId === actorId)?.user.name ?? 'Someone';
        showRtToast(`${actor} updated "${item.title}"`);
      }
    };

    // ── item:deleted ─────────────────────────────────────────────────────────
    const onItemDeleted = ({ id, title, actorId }: { id: number; title: string; actorId: number }) => {
      setItems((prev) => prev.filter((i) => i.id !== id));
      setCalendarItems((prev) => prev.filter((i) => i.id !== id));

      if (actorId !== currentUser.id) {
        const members = boardRef.current.members ?? [];
        const actor = members.find((m) => m.userId === actorId)?.user.name ?? 'Someone';
        showRtToast(`${actor} removed "${title}"`);
      }
    };

    // ── member:joined ─────────────────────────────────────────────────────────
    const onMemberJoined = ({ member: raw }: { member: MemberPayload }) => {
      const member = payloadToMember(raw);
      setBoard((prev) => ({
        ...prev,
        members: prev.members?.some((m) => m.userId === member.userId)
          ? prev.members
          : [...(prev.members ?? []), member],
        memberCount: prev.members?.some((m) => m.userId === member.userId)
          ? prev.memberCount
          : prev.memberCount + 1,
      }));
    };

    // ── member:role_changed ───────────────────────────────────────────────────
    const onMemberRoleChanged = ({ userId, newRole }: { userId: number; newRole: string }) => {
      setBoard((prev) => ({
        ...prev,
        members: prev.members?.map((m) =>
          m.userId === userId ? { ...m, role: newRole as Role } : m
        ),
      }));
    };

    // ── member:removed ────────────────────────────────────────────────────────
    const onMemberRemoved = ({ userId }: { userId: number }) => {
      setBoard((prev) => ({
        ...prev,
        members: prev.members?.filter((m) => m.userId !== userId),
        memberCount: Math.max(0, prev.memberCount - 1),
      }));
    };

    // ── presence:update ───────────────────────────────────────────────────────
    const onPresenceUpdate = ({ userIds }: { userIds: number[] }) => {
      setPresenceIds(userIds);
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('item:created', onItemCreated);
    socket.on('item:updated', onItemUpdated);
    socket.on('item:deleted', onItemDeleted);
    socket.on('member:joined', onMemberJoined);
    socket.on('member:role_changed', onMemberRoleChanged);
    socket.on('member:removed', onMemberRemoved);
    socket.on('presence:update', onPresenceUpdate);

    return () => {
      socket.emit('board:leave', boardId);
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('item:created', onItemCreated);
      socket.off('item:updated', onItemUpdated);
      socket.off('item:deleted', onItemDeleted);
      socket.off('member:joined', onMemberJoined);
      socket.off('member:role_changed', onMemberRoleChanged);
      socket.off('member:removed', onMemberRemoved);
      socket.off('presence:update', onPresenceUpdate);
    };
  }, [boardId, currentUser.id, fetchItems, fetchCalendarItems, calendarFetched, showRtToast]);

  // ── Member management ──────────────────────────────────────────────────────
  const handleInvite = async (email: string, role: Exclude<Role, 'OWNER'>) => {
    const member = await boardApi.inviteMember(boardId, { email, role });
    setBoard((prev) => ({
      ...prev,
      members: [...(prev.members || []), member],
      memberCount: prev.memberCount + 1,
    }));
  };

  const handleChangeRole = async (userId: number, role: Exclude<Role, 'OWNER'>) => {
    const updated = await boardApi.updateMemberRole(boardId, userId, role);
    setBoard((prev) => ({
      ...prev,
      members: prev.members?.map((m) => (m.userId === userId ? { ...m, role: updated.role } : m)),
    }));
  };

  const handleRemoveMember = async (userId: number) => {
    await boardApi.removeMember(boardId, userId);
    setBoard((prev) => ({
      ...prev,
      members: prev.members?.filter((m) => m.userId !== userId),
      memberCount: prev.memberCount - 1,
    }));
  };

  // ── Item management ────────────────────────────────────────────────────────
  const handleCreateItem = async (bid: number, data: CreateItemData) =>
    itemApi.create(bid, data);

  const handleUpdateItem = async (bid: number, itemId: number, data: UpdateItemData) =>
    itemApi.update(bid, itemId, data);

  const handleItemSaved = (saved: Item) => {
    setItems((prev) => {
      const idx = prev.findIndex((i) => i.id === saved.id);
      if (idx >= 0) { const next = [...prev]; next[idx] = saved; return next; }
      return [saved, ...prev];
    });
    setCalendarItems((prev) => {
      const idx = prev.findIndex((i) => i.id === saved.id);
      if (idx >= 0) { const next = [...prev]; next[idx] = saved; return next; }
      return [saved, ...prev];
    });
  };

  const handleItemDeleted = async (itemId: number) => {
    await itemApi.delete(boardId, itemId);
    setItems((prev) => prev.filter((i) => i.id !== itemId));
    setCalendarItems((prev) => prev.filter((i) => i.id !== itemId));
  };

  const handleCalendarItemUpdated = (updated: Item) => {
    setCalendarItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
    setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
  };

  // ── Modal helpers ──────────────────────────────────────────────────────────
  const openCreate = () => { setEditingItem(undefined); setCalendarDefaultDate(undefined); setItemModalOpen(true); };
  const openEdit = (item: Item) => { setEditingItem(item); setCalendarDefaultDate(undefined); setItemModalOpen(true); };
  const openCreateWithDate = (date: string) => { setEditingItem(undefined); setCalendarDefaultDate(date); setItemModalOpen(true); };
  const closeModal = () => { setItemModalOpen(false); setCalendarDefaultDate(undefined); };

  // ── Presence avatars ───────────────────────────────────────────────────────
  const allMembers = board.members ?? [];
  const presenceMembers = presenceIds
    .map((uid) => allMembers.find((m) => m.userId === uid))
    .filter((m): m is BoardMember => m !== undefined);
  const visiblePresence = presenceMembers.slice(0, 3);
  const extraPresence = Math.max(0, presenceMembers.length - 3);

  // Header member avatars (existing)
  const visibleMembers = allMembers.slice(0, 5);
  const extraCount = Math.max(0, allMembers.length - 5);

  const TAB_LABELS: Record<Tab, string> = {
    list: 'List',
    calendar: 'Calendar',
    timeline: 'Timeline',
    members: `Members (${board.memberCount})`,
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen bg-black text-white"
    >
      {/* Header */}
      <div className="border-b border-dark-border">
        <div className="max-w-5xl mx-auto px-4 py-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <button
                onClick={() => navigate('/dashboard')}
                className="text-gray-600 hover:text-gray-400 text-xs mb-2 transition-colors block"
              >
                ← All Boards
              </button>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold">{board.name}</h1>
                <RoleBadge role={myRole} />
              </div>
              {board.description && (
                <p className="text-gray-500 text-sm mt-1">{board.description}</p>
              )}
            </div>

            <div className="flex items-center gap-3 shrink-0 mt-1">
              {/* Presence avatars */}
              {visiblePresence.length > 0 && (
                <div className="flex -space-x-1.5 items-center" title="Currently viewing">
                  {visiblePresence.map((m) => (
                    <div
                      key={m.userId}
                      title={`${m.user.name} is viewing`}
                      className="relative w-6 h-6 rounded-full bg-gray-700 border border-black flex items-center justify-center text-xs text-white"
                    >
                      {m.user.name[0].toUpperCase()}
                      {/* Green live dot */}
                      <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-green-500 border border-black" />
                    </div>
                  ))}
                  {extraPresence > 0 && (
                    <div className="w-6 h-6 rounded-full bg-gray-800 border border-black flex items-center justify-center text-xs text-gray-400">
                      +{extraPresence}
                    </div>
                  )}
                </div>
              )}

              {/* Member count avatars */}
              <div className="flex -space-x-2">
                {visibleMembers.map((m) => (
                  <div
                    key={m.userId}
                    title={m.user.name}
                    className="w-7 h-7 rounded-full bg-gray-700 border border-black flex items-center justify-center text-xs text-white"
                  >
                    {m.user.name[0].toUpperCase()}
                  </div>
                ))}
                {extraCount > 0 && (
                  <div className="w-7 h-7 rounded-full bg-gray-800 border border-black flex items-center justify-center text-xs text-gray-400">
                    +{extraCount}
                  </div>
                )}
              </div>

              {myRole === 'OWNER' && (
                <Button
                  onClick={() => navigate(`/boards/${boardId}/settings`)}
                  variant="secondary"
                  className="w-auto px-3 text-sm"
                >
                  Settings
                </Button>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1">
            {(['list', 'calendar', 'timeline', 'members'] as Tab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-sm rounded-t transition-colors ${
                  activeTab === tab
                    ? 'text-white border-b-2 border-white'
                    : 'text-gray-600 hover:text-gray-400'
                }`}
              >
                {TAB_LABELS[tab]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 py-6">
        {activeTab === 'list' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <FiltersBar members={board.members || []} currentUserId={currentUser.id} />
              {canCreateItems && (
                <Button onClick={openCreate} className="w-auto px-4 shrink-0 ml-3">
                  + New Item
                </Button>
              )}
            </div>
            {itemsLoading ? (
              <p className="text-gray-600 text-sm">Loading items...</p>
            ) : (
              <ListView items={items} onItemClick={openEdit} />
            )}
          </div>
        )}

        {activeTab === 'calendar' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <p className="text-gray-600 text-xs">
                Items without a start date don't appear on the calendar.
              </p>
              {canCreateItems && (
                <Button onClick={openCreate} className="w-auto px-4 shrink-0 ml-3">
                  + New Item
                </Button>
              )}
            </div>
            <CalendarView
              boardId={boardId}
              items={calendarItems}
              members={board.members || []}
              myRole={myRole}
              currentUserId={currentUser.id}
              canCreateItems={canCreateItems}
              onItemUpdated={handleCalendarItemUpdated}
              onCreateWithDate={openCreateWithDate}
              onEditItem={openEdit}
            />
          </div>
        )}

        {activeTab === 'timeline' && (
          <TimelineView
            boardId={boardId}
            items={calendarItems}
            members={board.members || []}
            myRole={myRole}
            currentUserId={currentUser.id}
            canCreateItems={canCreateItems}
            onItemUpdated={handleCalendarItemUpdated}
            onEditItem={openEdit}
          />
        )}

        {activeTab === 'members' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-semibold">
                Members <span className="text-gray-600 font-normal">({board.memberCount})</span>
              </h2>
              {canManageMembers && (
                <Button onClick={() => setInviteOpen(true)} className="w-auto px-4">
                  + Invite
                </Button>
              )}
            </div>
            <MembersList
              members={board.members || []}
              myRole={myRole}
              currentUserId={currentUser.id}
              onChangeRole={canManageMembers ? handleChangeRole : undefined}
              onRemove={canManageMembers ? handleRemoveMember : undefined}
            />
          </div>
        )}
      </div>

      {/* Modals */}
      <ItemFormModal
        open={itemModalOpen}
        boardId={boardId}
        members={board.members || []}
        item={editingItem}
        myRole={myRole}
        currentUserId={currentUser.id}
        defaultStartDate={calendarDefaultDate}
        onClose={closeModal}
        onSaved={handleItemSaved}
        onDeleted={editingItem ? handleItemDeleted : undefined}
        onCreateItem={handleCreateItem}
        onUpdateItem={handleUpdateItem}
      />

      <InviteMemberDialog
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        onInvite={handleInvite}
        myRole={myRole}
      />

      {/* Real-time toasts */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {rtToasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 40 }}
              transition={{ duration: 0.2 }}
              className="bg-dark-surface border border-dark-border text-white text-sm px-4 py-2.5 rounded-lg shadow-xl max-w-xs"
            >
              {t.text}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};
