import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { boardApi } from '../lib/boardApi';
import { itemApi } from '../lib/itemApi';
import { getSocket } from '../lib/socket';
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
function payloadToItem(p) { return p; }
function payloadToMember(p) { return p; }
export const BoardWorkspace = ({ initialBoard, currentUser }) => {
    const navigate = useNavigate();
    const [board, setBoard] = useState(initialBoard);
    const [items, setItems] = useState([]);
    const [itemsLoading, setItemsLoading] = useState(true);
    const [calendarItems, setCalendarItems] = useState([]);
    const [calendarFetched, setCalendarFetched] = useState(false);
    const [activeTab, setActiveTab] = useState('list');
    const [inviteOpen, setInviteOpen] = useState(false);
    const [itemModalOpen, setItemModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(undefined);
    const [calendarDefaultDate, setCalendarDefaultDate] = useState();
    const [rtToasts, setRtToasts] = useState([]);
    const toastIdRef = useRef(0);
    const [presenceIds, setPresenceIds] = useState([]);
    const [searchParams, setSearchParams] = useSearchParams();
    const boardId = board.id;
    const myRole = board.myRole;
    const canManageMembers = myRole === 'OWNER' || myRole === 'ADMIN';
    const canCreateItems = myRole !== 'VIEWER';
    const boardRef = useRef(board);
    useEffect(() => { boardRef.current = board; }, [board]);
    // ── Cmd+K: open create modal from anywhere ─────────────────────────────────
    useEffect(() => {
        if (!canCreateItems)
            return;
        const handler = (e) => {
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
    const showRtToast = useCallback((text) => {
        const id = ++toastIdRef.current;
        setRtToasts((prev) => [...prev.slice(-2), { id, text }]);
        setTimeout(() => setRtToasts((prev) => prev.filter((t) => t.id !== id)), 3000);
    }, []);
    // ── List items (with filters) ──────────────────────────────────────────────
    const fetchItems = useCallback(async () => {
        setItemsLoading(true);
        try {
            const params = {};
            const type = searchParams.get('type');
            const status = searchParams.get('status');
            const assigneeId = searchParams.get('assigneeId');
            if (type)
                params.type = type;
            if (status)
                params.status = status;
            if (assigneeId)
                params.assigneeId = parseInt(assigneeId);
            const fetched = await itemApi.list(boardId, params);
            setItems(fetched);
        }
        catch {
            // silently fail; global interceptor shows toast
        }
        finally {
            setItemsLoading(false);
        }
    }, [boardId, searchParams]);
    // ── Calendar / Timeline items (all, no filter) ─────────────────────────────
    const fetchCalendarItems = useCallback(async () => {
        try {
            const fetched = await itemApi.list(boardId);
            setCalendarItems(fetched);
            setCalendarFetched(true);
        }
        catch {
            // silently fail
        }
    }, [boardId]);
    useEffect(() => {
        if (activeTab === 'list')
            fetchItems();
        if ((activeTab === 'calendar' || activeTab === 'timeline') && !calendarFetched)
            fetchCalendarItems();
    }, [activeTab, fetchItems, fetchCalendarItems, calendarFetched]);
    // ── Socket ─────────────────────────────────────────────────────────────────
    useEffect(() => {
        const socket = getSocket();
        if (!socket)
            return;
        socket.emit('board:join', boardId);
        let needsRefetch = false;
        const onConnect = () => {
            if (!needsRefetch)
                return;
            needsRefetch = false;
            fetchItems();
            if (calendarFetched)
                fetchCalendarItems();
        };
        const onDisconnect = () => { needsRefetch = true; };
        const onItemCreated = ({ item: raw }) => {
            const item = payloadToItem(raw);
            setItems((prev) => prev.some((i) => i.id === item.id) ? prev : [item, ...prev]);
            setCalendarItems((prev) => prev.some((i) => i.id === item.id) ? prev : [item, ...prev]);
            if (item.createdById !== currentUser.id) {
                showRtToast(`${item.createdBy?.name ?? 'Someone'} added "${item.title}"`);
            }
        };
        const onItemUpdated = ({ item: raw, actorId }) => {
            const item = payloadToItem(raw);
            setItems((prev) => prev.map((i) => (i.id === item.id ? item : i)));
            setCalendarItems((prev) => prev.map((i) => (i.id === item.id ? item : i)));
            if (actorId !== currentUser.id) {
                const actor = boardRef.current.members?.find((m) => m.userId === actorId)?.user.name ?? 'Someone';
                showRtToast(`${actor} updated "${item.title}"`);
            }
        };
        const onItemDeleted = ({ id, title, actorId }) => {
            setItems((prev) => prev.filter((i) => i.id !== id));
            setCalendarItems((prev) => prev.filter((i) => i.id !== id));
            if (actorId !== currentUser.id) {
                const actor = boardRef.current.members?.find((m) => m.userId === actorId)?.user.name ?? 'Someone';
                showRtToast(`${actor} removed "${title}"`);
            }
        };
        const onMemberJoined = ({ member: raw }) => {
            const member = payloadToMember(raw);
            setBoard((prev) => ({
                ...prev,
                members: prev.members?.some((m) => m.userId === member.userId)
                    ? prev.members : [...(prev.members ?? []), member],
                memberCount: prev.members?.some((m) => m.userId === member.userId)
                    ? prev.memberCount : prev.memberCount + 1,
            }));
        };
        const onMemberRoleChanged = ({ userId, newRole }) => {
            setBoard((prev) => ({
                ...prev,
                members: prev.members?.map((m) => m.userId === userId ? { ...m, role: newRole } : m),
            }));
        };
        const onMemberRemoved = ({ userId }) => {
            setBoard((prev) => ({
                ...prev,
                members: prev.members?.filter((m) => m.userId !== userId),
                memberCount: Math.max(0, prev.memberCount - 1),
            }));
        };
        const onPresenceUpdate = ({ userIds }) => setPresenceIds(userIds);
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
    const handleInvite = async (email, role) => {
        const member = await boardApi.inviteMember(boardId, { email, role });
        setBoard((prev) => ({
            ...prev,
            members: [...(prev.members || []), member],
            memberCount: prev.memberCount + 1,
        }));
    };
    const handleChangeRole = async (userId, role) => {
        const updated = await boardApi.updateMemberRole(boardId, userId, role);
        setBoard((prev) => ({
            ...prev,
            members: prev.members?.map((m) => (m.userId === userId ? { ...m, role: updated.role } : m)),
        }));
    };
    const handleRemoveMember = async (userId) => {
        await boardApi.removeMember(boardId, userId);
        setBoard((prev) => ({
            ...prev,
            members: prev.members?.filter((m) => m.userId !== userId),
            memberCount: prev.memberCount - 1,
        }));
    };
    // ── Item management ────────────────────────────────────────────────────────
    const handleCreateItem = async (bid, data) => itemApi.create(bid, data);
    const handleUpdateItem = async (bid, itemId, data) => itemApi.update(bid, itemId, data);
    const handleItemSaved = (saved) => {
        setItems((prev) => {
            const idx = prev.findIndex((i) => i.id === saved.id);
            if (idx >= 0) {
                const next = [...prev];
                next[idx] = saved;
                return next;
            }
            return [saved, ...prev];
        });
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
    const handleItemDeleted = async (itemId) => {
        await itemApi.delete(boardId, itemId);
        setItems((prev) => prev.filter((i) => i.id !== itemId));
        setCalendarItems((prev) => prev.filter((i) => i.id !== itemId));
    };
    const handleCalendarItemUpdated = (updated) => {
        setCalendarItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
        setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
    };
    // ── Modal helpers ──────────────────────────────────────────────────────────
    const openCreate = () => { setEditingItem(undefined); setCalendarDefaultDate(undefined); setItemModalOpen(true); };
    const openEdit = (item) => { setEditingItem(item); setCalendarDefaultDate(undefined); setItemModalOpen(true); };
    const openCreateWithDate = (date) => { setEditingItem(undefined); setCalendarDefaultDate(date); setItemModalOpen(true); };
    const closeModal = () => { setItemModalOpen(false); setCalendarDefaultDate(undefined); };
    // ── Filters state (for empty state message) ────────────────────────────────
    const hasFilters = !!(searchParams.get('type') || searchParams.get('status') || searchParams.get('assigneeId'));
    const clearFilters = () => setSearchParams({});
    // ── Presence ───────────────────────────────────────────────────────────────
    const allMembers = board.members ?? [];
    const presenceMembers = presenceIds
        .map((uid) => allMembers.find((m) => m.userId === uid))
        .filter((m) => m !== undefined);
    const visiblePresence = presenceMembers.slice(0, 3);
    const extraPresence = Math.max(0, presenceMembers.length - 3);
    const visibleMembers = allMembers.slice(0, 5);
    const extraCount = Math.max(0, allMembers.length - 5);
    const TAB_LABELS = {
        list: 'List',
        calendar: 'Calendar',
        timeline: 'Timeline',
        members: `Members (${board.memberCount})`,
    };
    return (_jsxs(motion.div, { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -8 }, transition: { duration: 0.2 }, className: "min-h-screen bg-black text-white", children: [_jsx("div", { className: "border-b border-dark-border", children: _jsxs("div", { className: "max-w-5xl mx-auto px-4 py-5", children: [_jsxs("div", { className: "flex items-start justify-between mb-4 gap-4", children: [_jsxs("div", { className: "min-w-0", children: [_jsx("button", { onClick: () => navigate('/dashboard'), className: "text-gray-600 hover:text-gray-400 text-xs mb-2 transition-colors block", children: "\u2190 All Boards" }), _jsxs("div", { className: "flex items-center gap-3 flex-wrap", children: [_jsx("h1", { className: "text-xl sm:text-2xl font-bold truncate", children: board.name }), _jsx(RoleBadge, { role: myRole })] }), board.description && (_jsx("p", { className: "text-gray-500 text-sm mt-1 truncate", children: board.description }))] }), _jsxs("div", { className: "flex items-center gap-2 sm:gap-3 shrink-0 mt-1", children: [visiblePresence.length > 0 && (_jsxs("div", { className: "flex -space-x-1.5", title: "Currently viewing", children: [visiblePresence.map((m) => (_jsxs("div", { title: `${m.user.name} is viewing`, className: "relative w-6 h-6 rounded-full bg-gray-700 border border-black flex items-center justify-center text-xs text-white", children: [m.user.name[0].toUpperCase(), _jsx("span", { className: "absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-green-500 border border-black" })] }, m.userId))), extraPresence > 0 && (_jsxs("div", { className: "w-6 h-6 rounded-full bg-gray-800 border border-black flex items-center justify-center text-xs text-gray-400", children: ["+", extraPresence] }))] })), _jsxs("div", { className: "hidden sm:flex -space-x-2", children: [visibleMembers.map((m) => (_jsx("div", { title: m.user.name, className: "w-7 h-7 rounded-full bg-gray-700 border border-black flex items-center justify-center text-xs text-white", children: m.user.name[0].toUpperCase() }, m.userId))), extraCount > 0 && (_jsxs("div", { className: "w-7 h-7 rounded-full bg-gray-800 border border-black flex items-center justify-center text-xs text-gray-400", children: ["+", extraCount] }))] }), myRole === 'OWNER' && (_jsx(Button, { onClick: () => navigate(`/boards/${boardId}/settings`), variant: "secondary", className: "w-auto px-3 text-sm", children: "Settings" }))] })] }), _jsx("div", { className: "flex gap-1 overflow-x-auto scrollbar-none -mx-1 px-1 pb-px", children: ['list', 'calendar', 'timeline', 'members'].map((tab) => (_jsx("button", { onClick: () => setActiveTab(tab), className: `px-4 py-2 text-sm rounded-t transition-colors whitespace-nowrap shrink-0 ${activeTab === tab
                                    ? 'text-white border-b-2 border-white'
                                    : 'text-gray-600 hover:text-gray-400'}`, children: TAB_LABELS[tab] }, tab))) })] }) }), _jsxs("div", { className: "max-w-5xl mx-auto px-4 py-6", children: [activeTab === 'list' && (_jsxs("div", { children: [_jsxs("div", { className: "flex items-center justify-between mb-4 gap-2 flex-wrap", children: [_jsx(FiltersBar, { members: board.members || [], currentUserId: currentUser.id }), canCreateItems && (_jsx(Button, { onClick: openCreate, className: "w-auto px-4 shrink-0", title: "New item (\u2318K)", children: "+ New Item" }))] }), itemsLoading ? (_jsx("div", { className: "flex justify-center py-16", children: _jsx(Spinner, { size: 20, className: "text-gray-600" }) })) : (_jsx(ListView, { items: items, onItemClick: openEdit, hasFilters: hasFilters, onClearFilters: clearFilters }))] })), activeTab === 'calendar' && (_jsxs("div", { children: [_jsxs("div", { className: "flex items-center justify-between mb-4 gap-2 flex-wrap", children: [_jsx("p", { className: "text-gray-600 text-xs", children: "Items without a start date don't appear on the calendar." }), canCreateItems && (_jsx(Button, { onClick: openCreate, className: "w-auto px-4 shrink-0", children: "+ New Item" }))] }), _jsx(CalendarView, { boardId: boardId, items: calendarItems, members: board.members || [], myRole: myRole, currentUserId: currentUser.id, canCreateItems: canCreateItems, onItemUpdated: handleCalendarItemUpdated, onCreateWithDate: openCreateWithDate, onEditItem: openEdit })] })), activeTab === 'timeline' && (_jsx(TimelineView, { boardId: boardId, items: calendarItems, members: board.members || [], myRole: myRole, currentUserId: currentUser.id, canCreateItems: canCreateItems, onItemUpdated: handleCalendarItemUpdated, onEditItem: openEdit })), activeTab === 'members' && (_jsxs("div", { children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsxs("h2", { className: "text-white font-semibold", children: ["Members ", _jsxs("span", { className: "text-gray-600 font-normal", children: ["(", board.memberCount, ")"] })] }), canManageMembers && (_jsx(Button, { onClick: () => setInviteOpen(true), className: "w-auto px-4", children: "+ Invite" }))] }), _jsx(MembersList, { members: board.members || [], myRole: myRole, currentUserId: currentUser.id, onChangeRole: canManageMembers ? handleChangeRole : undefined, onRemove: canManageMembers ? handleRemoveMember : undefined })] }))] }), _jsx(ItemFormModal, { open: itemModalOpen, boardId: boardId, members: board.members || [], item: editingItem, myRole: myRole, currentUserId: currentUser.id, defaultStartDate: calendarDefaultDate, onClose: closeModal, onSaved: handleItemSaved, onDeleted: editingItem ? handleItemDeleted : undefined, onCreateItem: handleCreateItem, onUpdateItem: handleUpdateItem }), _jsx(InviteMemberDialog, { open: inviteOpen, onClose: () => setInviteOpen(false), onInvite: handleInvite, myRole: myRole }), _jsx("div", { className: "fixed bottom-20 right-6 z-50 flex flex-col gap-2 pointer-events-none", children: _jsx(AnimatePresence, { children: rtToasts.map((t) => (_jsx(motion.div, { initial: { opacity: 0, x: 40 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: 40 }, transition: { duration: 0.2 }, className: "bg-dark-surface border border-dark-border text-white text-sm px-4 py-2.5 rounded-xl shadow-xl max-w-xs", children: t.text }, t.id))) }) })] }));
};
