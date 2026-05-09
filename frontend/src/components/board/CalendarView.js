import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useCallback, useMemo } from 'react';
import { Calendar, momentLocalizer, Views } from 'react-big-calendar';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import moment from 'moment';
import { motion, AnimatePresence } from 'framer-motion';
import { itemApi } from '../../lib/itemApi';
import { ItemTypeIcon } from '../ItemTypeIcon';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';
import './calendar.css';
const localizer = momentLocalizer(moment);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const DnDCalendar = withDragAndDrop(Calendar);
// ── Event styling by type ────────────────────────────────────────────────────
const TYPE_STYLE = {
    TASK: { background: '#272727', color: '#d1d5db' },
    MEETING: { background: '#1c1c24', color: '#a5b4fc' },
    REMINDER: { background: 'transparent', color: '#9ca3af', outline: '1px solid #3a3a3a' },
    DEADLINE: { background: '#231616', color: '#fca5a5' },
    EVENT: { background: '#302e2e', color: '#e5e7eb' },
};
function getEventStyle(item) {
    const base = TYPE_STYLE[item.type];
    const urgentBorder = item.priority === 'URGENT'
        ? { borderLeft: '3px solid var(--accent)' }
        : { borderLeft: '3px solid transparent' };
    return { ...base, ...urgentBorder };
}
// ── Helpers ──────────────────────────────────────────────────────────────────
function toCalDates(item) {
    const start = new Date(item.startDate);
    const endBase = item.endDate ? new Date(item.endDate) : new Date(item.startDate);
    // react-big-calendar allDay end is exclusive — add 1 day so it renders inclusive
    const end = new Date(endBase.getTime() + 24 * 60 * 60 * 1000);
    return { start, end };
}
// ── Custom event renderer ────────────────────────────────────────────────────
function CalEventComponent({ event }) {
    const item = event.resource;
    return (_jsxs("div", { className: "flex items-center gap-1 overflow-hidden w-full px-0.5", children: [_jsx("span", { className: "shrink-0 opacity-80", children: _jsx(ItemTypeIcon, { type: item.type, size: 9 }) }), _jsx("span", { className: "truncate leading-tight", children: item.title })] }));
}
// ── Component ────────────────────────────────────────────────────────────────
export const CalendarView = ({ boardId, items, myRole, currentUserId, canCreateItems, onItemUpdated, onCreateWithDate, onEditItem, }) => {
    const [view, setView] = useState(Views.MONTH);
    const [date, setDate] = useState(new Date());
    const [toast, setToast] = useState('');
    const showToast = useCallback((msg) => {
        setToast(msg);
        setTimeout(() => setToast(''), 2200);
    }, []);
    // ── Convert items → calendar events (only those with a startDate) ──────────
    const events = useMemo(() => items
        .filter((i) => !!i.startDate)
        .map((i) => {
        const { start, end } = toCalDates(i);
        return { id: i.id, title: i.title, start, end, allDay: true, resource: i };
    }), [items]);
    // ── Event style getter ────────────────────────────────────────────────────
    const eventPropGetter = useCallback((event) => {
        return { style: getEventStyle(event.resource) };
    }, []);
    // ── Draggable access (VIEWER and non-creators cannot drag) ────────────────
    const draggableAccessor = useCallback((event) => {
        const item = event.resource;
        if (myRole === 'VIEWER')
            return false;
        if (myRole === 'MEMBER' && item.createdById !== currentUserId)
            return false;
        return true;
    }, [myRole, currentUserId]);
    // ── Drag-drop handler ─────────────────────────────────────────────────────
    const handleEventDrop = useCallback(async ({ event, start }) => {
        const item = event.resource;
        const newStart = moment(start).format('YYYY-MM-DD');
        let newEnd = null;
        if (item.endDate && item.startDate) {
            const duration = moment(item.endDate).diff(moment(item.startDate), 'days');
            newEnd = moment(start).add(duration, 'days').format('YYYY-MM-DD');
        }
        const originalItem = { ...item };
        // Optimistic update
        onItemUpdated({ ...item, startDate: newStart, endDate: newEnd ?? undefined });
        try {
            const updated = await itemApi.update(boardId, item.id, {
                startDate: newStart,
                endDate: newEnd,
            });
            onItemUpdated(updated);
            showToast('Item moved');
        }
        catch {
            // Revert
            onItemUpdated(originalItem);
            showToast('Failed to move item');
        }
    }, [boardId, onItemUpdated, showToast]);
    // ── Click on empty slot ───────────────────────────────────────────────────
    const handleSelectSlot = useCallback(({ start, action }) => {
        if (!canCreateItems)
            return;
        if (action === 'click' || action === 'select') {
            onCreateWithDate(moment(start).format('YYYY-MM-DD'));
        }
    }, [canCreateItems, onCreateWithDate]);
    // ── Click on event ────────────────────────────────────────────────────────
    const handleSelectEvent = useCallback((event) => {
        onEditItem(event.resource);
    }, [onEditItem]);
    return (_jsxs("div", { className: "relative", children: [_jsx(motion.div, { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.2 }, style: { height: 680 }, children: _jsx(DnDCalendar, { localizer: localizer, events: events, view: view, date: date, onView: (v) => setView(v), onNavigate: (d) => setDate(d), onSelectEvent: handleSelectEvent, onSelectSlot: handleSelectSlot, onEventDrop: handleEventDrop, draggableAccessor: draggableAccessor, eventPropGetter: eventPropGetter, selectable: canCreateItems, components: { event: CalEventComponent }, popup: true, style: { height: '100%' }, views: [Views.MONTH, Views.WEEK, Views.DAY], defaultView: Views.MONTH, step: 60, showMultiDayTimes: false }) }, view), _jsx(AnimatePresence, { children: toast && (_jsx(motion.div, { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: 8 }, transition: { duration: 0.18 }, className: "fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-dark-surface border border-dark-border text-white text-sm px-4 py-2 rounded-lg shadow-lg pointer-events-none", children: toast }, "toast")) })] }));
};
