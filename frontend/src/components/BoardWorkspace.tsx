import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Board, Role } from '../lib/boardApi';
import { boardApi } from '../lib/boardApi';
import { itemApi, Item, CreateItemData, UpdateItemData } from '../lib/itemApi';
import { RoleBadge } from './RoleBadge';
import { ListView } from './ListView';
import { FiltersBar } from './FiltersBar';
import { ItemFormModal } from './ItemFormModal';
import { MembersList } from './MembersList';
import { InviteMemberDialog } from './InviteMemberDialog';
import { CalendarView } from './board/CalendarView';
import { Button } from './Button';

type Tab = 'list' | 'calendar' | 'members';

interface BoardWorkspaceProps {
  initialBoard: Board;
  currentUser: { id: number; name: string; email: string; avatarUrl?: string };
}

export const BoardWorkspace = ({ initialBoard, currentUser }: BoardWorkspaceProps) => {
  const navigate = useNavigate();
  const [board, setBoard] = useState<Board>(initialBoard);

  // List view — filtered items (server-side via URL params)
  const [items, setItems] = useState<Item[]>([]);
  const [itemsLoading, setItemsLoading] = useState(true);

  // Calendar view — all items (no filter), fetched once on first calendar open
  const [calendarItems, setCalendarItems] = useState<Item[]>([]);
  const [calendarFetched, setCalendarFetched] = useState(false);

  const [activeTab, setActiveTab] = useState<Tab>('list');
  const [inviteOpen, setInviteOpen] = useState(false);
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | undefined>(undefined);
  const [calendarDefaultDate, setCalendarDefaultDate] = useState<string | undefined>();
  const [searchParams] = useSearchParams();

  const boardId = board.id;
  const myRole = board.myRole;
  const canManageMembers = myRole === 'OWNER' || myRole === 'ADMIN';
  const canCreateItems = myRole !== 'VIEWER';

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
      const fetched = await itemApi.list(boardId, params as any);
      setItems(fetched);
    } catch {
      // silently fail
    } finally {
      setItemsLoading(false);
    }
  }, [boardId, searchParams]);

  // ── Calendar items (all, no filter) ───────────────────────────────────────
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
    if (activeTab === 'calendar' && !calendarFetched) fetchCalendarItems();
  }, [activeTab, fetchItems, fetchCalendarItems, calendarFetched]);

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

  // ── Item management (shared between list + calendar) ──────────────────────
  const handleCreateItem = async (bid: number, data: CreateItemData) =>
    itemApi.create(bid, data);

  const handleUpdateItem = async (bid: number, itemId: number, data: UpdateItemData) =>
    itemApi.update(bid, itemId, data);

  const handleItemSaved = (saved: Item) => {
    // Update list view
    setItems((prev) => {
      const idx = prev.findIndex((i) => i.id === saved.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = saved;
        return next;
      }
      return [saved, ...prev];
    });
    // Update calendar view
    setCalendarItems((prev) => {
      const idx = prev.findIndex((i) => i.id === saved.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = saved;
        return next;
      }
      return [saved, ...prev];
    });
  };

  const handleItemDeleted = async (itemId: number) => {
    await itemApi.delete(boardId, itemId);
    setItems((prev) => prev.filter((i) => i.id !== itemId));
    setCalendarItems((prev) => prev.filter((i) => i.id !== itemId));
  };

  // Update from calendar drag (no API call — CalendarView handles that)
  const handleCalendarItemUpdated = (updated: Item) => {
    setCalendarItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
    setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
  };

  // ── Modal helpers ──────────────────────────────────────────────────────────
  const openCreate = () => {
    setEditingItem(undefined);
    setCalendarDefaultDate(undefined);
    setItemModalOpen(true);
  };

  const openEdit = (item: Item) => {
    setEditingItem(item);
    setCalendarDefaultDate(undefined);
    setItemModalOpen(true);
  };

  const openCreateWithDate = (date: string) => {
    setEditingItem(undefined);
    setCalendarDefaultDate(date);
    setItemModalOpen(true);
  };

  const closeModal = () => {
    setItemModalOpen(false);
    setCalendarDefaultDate(undefined);
  };

  // ── Header member avatars ──────────────────────────────────────────────────
  const visibleMembers = (board.members || []).slice(0, 5);
  const extraCount = Math.max(0, (board.members?.length || 0) - 5);

  const TAB_LABELS: Record<Tab, string> = {
    list: 'List',
    calendar: 'Calendar',
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
            {(['list', 'calendar', 'members'] as Tab[]).map((tab) => (
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
            <button
              disabled
              className="px-4 py-2 text-sm text-gray-800 cursor-not-allowed"
              title="Coming in Phase 5"
            >
              Timeline
            </button>
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
    </motion.div>
  );
};
