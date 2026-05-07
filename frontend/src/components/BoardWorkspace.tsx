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
import { Spinner } from './Spinner';

type Tab = 'list' | 'calendar' | 'timeline' | 'members';

interface BoardWorkspaceProps {
  initialBoard: Board;
  currentUser: { id: number; name: string; email: string; avatarUrl?: string };
}

interface RtToast {
  id: number;
  text: string;
}

function payloadToItem(p: ItemPayload): Item { return p as unknown as Item; }
function payloadToMember(p: MemberPayload): BoardMember { return p as unknown as BoardMember; }

export const BoardWorkspace = ({ initialBoard, currentUser }: BoardWorkspaceProps) => {
  const navigate = useNavigate();
  const [board, setBoard] = useState<Board>(initialBoard);

  const [items, setItems] = useState<Item[]>([]);
  const [itemsLoading, setItemsLoading] = useState(true);

  const [calendarItems, setCalendarItems] = useState<Item[]>([]);
  const [calendarFetched, setCalendarFetched] = useState(false);

  const [activeTab, setActiveTab] = useState<Tab>('list');
  const [inviteOpen, setInviteOpen] = useState(false);
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | undefined>(undefined);
  const [calendarDefaultDate, setCalendarDefaultDate] = useState<string | undefined>();

  const [rtToasts, setRtToasts] = useState<RtToast[]>([]);
  const toastIdRef = useRef(0);
  const [presenceIds, setPresenceIds] = useState<number[]>([]);

  const [searchParams, setSearchParams] = useSearchParams();

  const boardId = board.id;
  const myRole = board.myRole;
  const canManageMembers = myRole === 'OWNER' || myRole === 'ADMIN';
  const canCreateItems = myRole !== 'VIEWER';

  const boardRef = useRef(board);
  useEffect(() => { boardRef.current = board; }, [board]);

  // ── Cmd+K: open create modal from anywhere ─────────────────────────────────
  useEffect(() => {
    if (!canCreateItems) return;
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        openCreate();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canCreateItems]);

  // ── Toast helper ───────────────────────────────────────────────────────────
  const showRtToast = useCallback((text: string) => {
    const id = ++toastIdRef.current;
    setRtToasts((prev) => [...prev.slice(-2), { id, text }]);
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
      // silently fail; global interceptor shows toast
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

  // ── Socket ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    socket.emit('board:join', boardId);

    let needsRefetch = false;
    const onConnect = () => {
      if (!needsRefetch) return;
      needsRefetch = false;
      fetchItems();
      if (calendarFetched) fetchCalendarItems();
    };
    const onDisconnect = () => { needsRefetch = true; };

    const onItemCreated = ({ item: raw }: { item: ItemPayload }) => {
      const item = payloadToItem(raw);
      setItems((prev) => prev.some((i) => i.id === item.id) ? prev : [item, ...prev]);
      setCalendarItems((prev) => prev.some((i) => i.id === item.id) ? prev : [item, ...prev]);
      if (item.createdById !== currentUser.id) {
        showRtToast(`${item.createdBy?.name ?? 'Someone'} added "${item.title}"`);
      }
    };

    const onItemUpdated = ({ item: raw, actorId }: { item: ItemPayload; actorId: number }) => {
      const item = payloadToItem(raw);
      setItems((prev) => prev.map((i) => (i.id === item.id ? item : i)));
      setCalendarItems((prev) => prev.map((i) => (i.id === item.id ? item : i)));
      if (actorId !== currentUser.id) {
        const actor = boardRef.current.members?.find((m) => m.userId === actorId)?.user.name ?? 'Someone';
        showRtToast(`${actor} updated "${item.title}"`);
      }
    };

    const onItemDeleted = ({ id, title, actorId }: { id: number; title: string; actorId: number }) => {
      setItems((prev) => prev.filter((i) => i.id !== id));
      setCalendarItems((prev) => prev.filter((i) => i.id !== id));
      if (actorId !== currentUser.id) {
        const actor = boardRef.current.members?.find((m) => m.userId === actorId)?.user.name ?? 'Someone';
        showRtToast(`${actor} removed "${title}"`);
      }
    };

    const onMemberJoined = ({ member: raw }: { member: MemberPayload }) => {
      const member = payloadToMember(raw);
      setBoard((prev) => ({
        ...prev,
        members: prev.members?.some((m) => m.userId === member.userId)
          ? prev.members : [...(prev.members ?? []), member],
        memberCount: prev.members?.some((m) => m.userId === member.userId)
          ? prev.memberCount : prev.memberCount + 1,
      }));
    };

    const onMemberRoleChanged = ({ userId, newRole }: { userId: number; newRole: string }) => {
      setBoard((prev) => ({
        ...prev,
        members: prev.members?.map((m) =>
          m.userId === userId ? { ...m, role: newRole as Role } : m
        ),
      }));
    };

    const onMemberRemoved = ({ userId }: { userId: number }) => {
      setBoard((prev) => ({
        ...prev,
        members: prev.members?.filter((m) => m.userId !== userId),
        memberCount: Math.max(0, prev.memberCount - 1),
      }));
    };

    const onPresenceUpdate = ({ userIds }: { userIds: number[] }) => setPresenceIds(userIds);

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
  const handleCreateItem = async (bid: number, data: CreateItemData) => itemApi.create(bid, data);
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

  // ── Filters state (for empty state message) ────────────────────────────────
  const hasFilters = !!(searchParams.get('type') || searchParams.get('status') || searchParams.get('assigneeId'));
  const clearFilters = () => setSearchParams({});

  // ── Presence ───────────────────────────────────────────────────────────────
  const allMembers = board.members ?? [];
  const presenceMembers = presenceIds
    .map((uid) => allMembers.find((m) => m.userId === uid))
    .filter((m): m is BoardMember => m !== undefined);
  const visiblePresence = presenceMembers.slice(0, 3);
  const extraPresence = Math.max(0, presenceMembers.length - 3);

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
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
      className="min-h-screen bg-black text-white"
    >
      {/* Header */}
      <div className="border-b border-dark-border">
        <div className="max-w-5xl mx-auto px-4 py-5">
          <div className="flex items-start justify-between mb-4 gap-4">
            <div className="min-w-0">
              <button
                onClick={() => navigate('/dashboard')}
                className="text-gray-600 hover:text-gray-400 text-xs mb-2 transition-colors block"
              >
                ← All Boards
              </button>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold truncate">{board.name}</h1>
                <RoleBadge role={myRole} />
              </div>
              {board.description && (
                <p className="text-gray-500 text-sm mt-1 truncate">{board.description}</p>
              )}
            </div>

            <div className="flex items-center gap-2 sm:gap-3 shrink-0 mt-1">
              {/* Presence avatars */}
              {visiblePresence.length > 0 && (
                <div className="flex -space-x-1.5" title="Currently viewing">
                  {visiblePresence.map((m) => (
                    <div
                      key={m.userId}
                      title={`${m.user.name} is viewing`}
                      className="relative w-6 h-6 rounded-full bg-gray-700 border border-black flex items-center justify-center text-xs text-white"
                    >
                      {m.user.name[0].toUpperCase()}
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

              {/* Member avatars */}
              <div className="hidden sm:flex -space-x-2">
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

          {/* Tabs — horizontally scrollable on mobile */}
          <div className="flex gap-1 overflow-x-auto scrollbar-none -mx-1 px-1 pb-px">
            {(['list', 'calendar', 'timeline', 'members'] as Tab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-sm rounded-t transition-colors whitespace-nowrap shrink-0 ${
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
            <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
              <FiltersBar members={board.members || []} currentUserId={currentUser.id} />
              {canCreateItems && (
                <Button
                  onClick={openCreate}
                  className="w-auto px-4 shrink-0"
                  title="New item (⌘K)"
                >
                  + New Item
                </Button>
              )}
            </div>
            {itemsLoading ? (
              <div className="flex justify-center py-16">
                <Spinner size={20} className="text-gray-600" />
              </div>
            ) : (
              <ListView
                items={items}
                onItemClick={openEdit}
                hasFilters={hasFilters}
                onClearFilters={clearFilters}
              />
            )}
          </div>
        )}

        {activeTab === 'calendar' && (
          <div>
            <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
              <p className="text-gray-600 text-xs">
                Items without a start date don't appear on the calendar.
              </p>
              {canCreateItems && (
                <Button onClick={openCreate} className="w-auto px-4 shrink-0">
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

      {/* Real-time toasts (bottom-right, slide in from right) */}
      <div className="fixed bottom-20 right-6 z-50 flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {rtToasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 40 }}
              transition={{ duration: 0.2 }}
              className="bg-dark-surface border border-dark-border text-white text-sm px-4 py-2.5 rounded-xl shadow-xl max-w-xs"
            >
              {t.text}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};
