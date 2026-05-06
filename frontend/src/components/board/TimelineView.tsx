import { useRef, useEffect, useState, useCallback, useMemo, CSSProperties } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Item, ItemType, itemApi } from '../../lib/itemApi';
import { BoardMember, Role } from '../../lib/boardApi';
import { ItemTypeIcon } from '../ItemTypeIcon';

// ── Constants ────────────────────────────────────────────────────────────────

const LABEL_W = 220;
const ROW_H = 44;
const DAY_MS = 86_400_000;

type Scale = 'days' | 'weeks' | 'months';

const PX_PER_DAY: Record<Scale, number> = {
  days: 44,
  weeks: 11,
  months: 3.5,
};

// How many days visible on each side of today to anchor the default window
const WINDOW_DAYS_BEFORE = 14;
const WINDOW_DAYS_AFTER = 60;

// ── Types ────────────────────────────────────────────────────────────────────

interface TimelineViewProps {
  boardId: number;
  items: Item[];
  members: BoardMember[];
  myRole: Role;
  currentUserId: number;
  canCreateItems: boolean;
  onItemUpdated: (item: Item) => void;
  onEditItem: (item: Item) => void;
}

interface DragState {
  type: 'move' | 'resize-start' | 'resize-end';
  itemId: number;
  startX: number;
  originalStart: string;
  originalEnd: string | null;
  pxPerDay: number;
}

interface TooltipState {
  item: Item;
  x: number;
  y: number;
}

// ── Bar styles ────────────────────────────────────────────────────────────────

const TYPE_BORDER: Record<ItemType, string> = {
  TASK: '#3a3a3a',
  MEETING: '#3a4a7a',
  REMINDER: '#4a4a2a',
  DEADLINE: '#5a2a2a',
  EVENT: '#2a4a2a',
};

function barStyle(item: Item): CSSProperties {
  const isUrgent = item.priority === 'URGENT';
  const isDone = item.status === 'DONE';
  const isCancelled = item.status === 'CANCELLED';

  const base: CSSProperties = {
    background: isUrgent
      ? 'color-mix(in srgb, var(--accent) 30%, #111)'
      : '#1f1f1f',
    borderLeft: `3px solid ${isUrgent ? 'var(--accent)' : TYPE_BORDER[item.type]}`,
    opacity: isCancelled ? 0.25 : isDone ? 0.5 : 1,
    color: isUrgent ? 'var(--accent)' : '#d1d5db',
  };
  return base;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function startOfDay(d: Date): Date {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
}

function dateStrToDay(str: string): Date {
  return startOfDay(new Date(str));
}

function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / DAY_MS);
}

function addDays(d: Date, n: number): Date {
  return new Date(d.getTime() + n * DAY_MS);
}

function toIso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function canDragItem(item: Item, myRole: Role, currentUserId: number): boolean {
  if (myRole === 'VIEWER') return false;
  if (myRole === 'MEMBER' && item.createdById !== currentUserId) return false;
  return true;
}

// ── Header column generator ──────────────────────────────────────────────────

interface Col {
  label: string;
  span: number; // in days
  isToday?: boolean;
  isMajor?: boolean;
}

function buildColumns(rangeStart: Date, totalDays: number, scale: Scale): Col[] {
  const cols: Col[] = [];
  const today = startOfDay(new Date());

  if (scale === 'days') {
    for (let i = 0; i < totalDays; i++) {
      const d = addDays(rangeStart, i);
      const dow = d.getDay();
      const isMajor = dow === 1; // Monday
      cols.push({
        label: isMajor
          ? d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          : String(d.getDate()),
        span: 1,
        isToday: d.getTime() === today.getTime(),
        isMajor,
      });
    }
  } else if (scale === 'weeks') {
    // One col per week (7 days)
    let cur = new Date(rangeStart);
    while (daysBetween(rangeStart, cur) < totalDays) {
      const label = cur.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const weekStart = cur.getTime();
      const weekEnd = Math.min(addDays(cur, 7).getTime(), addDays(rangeStart, totalDays).getTime());
      const span = Math.round((weekEnd - weekStart) / DAY_MS);
      const isToday = today >= cur && today < addDays(cur, 7);
      cols.push({ label, span, isToday });
      cur = addDays(cur, 7);
    }
  } else {
    // months
    let cur = new Date(rangeStart.getFullYear(), rangeStart.getMonth(), 1);
    while (cur < addDays(rangeStart, totalDays)) {
      const monthEnd = new Date(cur.getFullYear(), cur.getMonth() + 1, 1);
      const effectiveStart = cur < rangeStart ? rangeStart : cur;
      const effectiveEnd = monthEnd > addDays(rangeStart, totalDays) ? addDays(rangeStart, totalDays) : monthEnd;
      const span = daysBetween(effectiveStart, effectiveEnd);
      const isToday = today >= cur && today < monthEnd;
      cols.push({
        label: cur.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        span: Math.max(1, span),
        isToday,
      });
      cur = monthEnd;
    }
  }
  return cols;
}

// ── Component ─────────────────────────────────────────────────────────────────

export const TimelineView = ({
  boardId,
  items,
  myRole,
  currentUserId,
  onItemUpdated,
  onEditItem,
}: TimelineViewProps) => {
  const today = useMemo(() => startOfDay(new Date()), []);

  // Compute range from items + a default window around today
  const rangeStart = useMemo(() => {
    const dates = items
      .filter((i) => i.startDate)
      .map((i) => dateStrToDay(i.startDate!));
    const earliest = dates.length ? new Date(Math.min(...dates.map((d) => d.getTime()))) : today;
    const anchor = addDays(today, -WINDOW_DAYS_BEFORE);
    return startOfDay(earliest < anchor ? earliest : anchor);
  }, [items, today]);

  const rangeEnd = useMemo(() => {
    const dates = items
      .filter((i) => i.endDate || i.startDate)
      .map((i) => dateStrToDay(i.endDate ?? i.startDate!));
    const latest = dates.length ? new Date(Math.max(...dates.map((d) => d.getTime()))) : today;
    const anchor = addDays(today, WINDOW_DAYS_AFTER);
    return startOfDay(latest > anchor ? latest : anchor);
  }, [items, today]);

  const totalDays = useMemo(() => Math.max(1, daysBetween(rangeStart, rangeEnd) + 1), [rangeStart, rangeEnd]);

  const [scale, setScale] = useState<Scale>('weeks');
  const [localItems, setLocalItems] = useState<Item[]>(items);
  const [toast, setToast] = useState('');
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  // Keep localItems in sync when prop changes (e.g., new item created externally)
  useEffect(() => { setLocalItems(items); }, [items]);

  const scaleRef = useRef<Scale>('weeks');
  useEffect(() => { scaleRef.current = scale; }, [scale]);

  const localItemsRef = useRef<Item[]>(localItems);
  useEffect(() => { localItemsRef.current = localItems; }, [localItems]);

  const dragRef = useRef<DragState | null>(null);
  const didDragRef = useRef(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2200);
  }, []);

  // Scroll so today is visible on mount
  useEffect(() => {
    if (!scrollRef.current) return;
    const pxPerDay = PX_PER_DAY[scale];
    const todayPx = daysBetween(rangeStart, today) * pxPerDay;
    scrollRef.current.scrollLeft = Math.max(0, todayPx - 120);
  // only run on mount / scale change
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scale]);

  // ── Sort: items with a startDate first, then alphabetical ─────────────────
  const sortedItems = useMemo(
    () =>
      [...localItems].sort((a, b) => {
        if (a.startDate && !b.startDate) return -1;
        if (!a.startDate && b.startDate) return 1;
        if (a.startDate && b.startDate) return a.startDate.localeCompare(b.startDate);
        return a.title.localeCompare(b.title);
      }),
    [localItems]
  );

  // ── Header columns ─────────────────────────────────────────────────────────
  const cols = useMemo(
    () => buildColumns(rangeStart, totalDays, scale),
    [rangeStart, totalDays, scale]
  );

  // ── Drag handlers ──────────────────────────────────────────────────────────
  const handleMouseDown = useCallback(
    (e: React.MouseEvent, item: Item, type: DragState['type']) => {
      if (!canDragItem(item, myRole, currentUserId)) return;
      if (!item.startDate) return;
      e.stopPropagation();
      didDragRef.current = false;
      dragRef.current = {
        type,
        itemId: item.id,
        startX: e.clientX,
        originalStart: item.startDate,
        originalEnd: item.endDate ?? null,
        pxPerDay: PX_PER_DAY[scaleRef.current],
      };
    },
    [myRole, currentUserId]
  );

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const drag = dragRef.current;
      if (!drag) return;

      const dx = e.clientX - drag.startX;
      const daysDelta = Math.round(dx / drag.pxPerDay);
      if (Math.abs(dx) > 3) didDragRef.current = true;

      const origStart = dateStrToDay(drag.originalStart);
      const origEnd = drag.originalEnd ? dateStrToDay(drag.originalEnd) : null;

      let newStart = origStart;
      let newEnd = origEnd;

      if (drag.type === 'move') {
        newStart = addDays(origStart, daysDelta);
        newEnd = origEnd ? addDays(origEnd, daysDelta) : null;
      } else if (drag.type === 'resize-start') {
        const maxStart = origEnd ? addDays(origEnd, -1) : addDays(origStart, 30);
        newStart = addDays(origStart, daysDelta);
        if (newStart > maxStart) newStart = maxStart;
      } else {
        const minEnd = addDays(origStart, 1);
        newEnd = origEnd ? addDays(origEnd, daysDelta) : addDays(origStart, daysDelta);
        if (newEnd && newEnd < minEnd) newEnd = minEnd;
      }

      setLocalItems((prev) =>
        prev.map((i) =>
          i.id === drag.itemId
            ? { ...i, startDate: toIso(newStart), endDate: newEnd ? toIso(newEnd) : i.endDate }
            : i
        )
      );
    };

    const onUp = async () => {
      const drag = dragRef.current;
      dragRef.current = null;
      if (!drag || !didDragRef.current) return;

      const current = localItemsRef.current.find((i) => i.id === drag.itemId);
      if (!current || !current.startDate) return;

      try {
        const updated = await itemApi.update(boardId, drag.itemId, {
          startDate: current.startDate,
          endDate: current.endDate ?? null,
        });
        setLocalItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
        onItemUpdated(updated);
        showToast('Item updated');
      } catch {
        // Revert
        setLocalItems((prev) =>
          prev.map((i) =>
            i.id === drag.itemId
              ? { ...i, startDate: drag.originalStart, endDate: drag.originalEnd ?? undefined }
              : i
          )
        );
        showToast('Failed to update item');
      }
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [boardId, onItemUpdated, showToast]);

  // ── Render ─────────────────────────────────────────────────────────────────
  const pxPerDay = PX_PER_DAY[scale];
  const totalGridW = totalDays * pxPerDay;
  const todayPx = daysBetween(rangeStart, today) * pxPerDay;

  return (
    <div className="relative select-none">
      {/* Scale controls */}
      <div className="flex items-center gap-1 mb-3">
        {(['days', 'weeks', 'months'] as Scale[]).map((s) => (
          <button
            key={s}
            onClick={() => setScale(s)}
            className={`px-3 py-1 text-xs rounded transition-colors ${
              scale === s
                ? 'bg-white text-black'
                : 'text-gray-500 hover:text-gray-300 border border-dark-border'
            }`}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
        <span className="ml-auto text-gray-700 text-xs">
          {sortedItems.filter((i) => i.startDate).length} of {sortedItems.length} items shown
        </span>
      </div>

      {/* Timeline table */}
      <div
        ref={scrollRef}
        className="overflow-x-auto rounded border border-dark-border"
        style={{ cursor: dragRef.current ? 'grabbing' : 'default' }}
      >
        <div style={{ minWidth: LABEL_W + totalGridW }}>

          {/* ── Header ── */}
          <div className="flex sticky top-0 z-10 bg-black border-b border-dark-border">
            {/* Label column header */}
            <div
              className="shrink-0 border-r border-dark-border px-3 flex items-center text-gray-600 text-xs font-medium"
              style={{ width: LABEL_W, height: ROW_H }}
            >
              Item
            </div>

            {/* Day/week/month column headers */}
            <div className="relative overflow-hidden" style={{ width: totalGridW, height: ROW_H }}>
              {/* Today highlight strip */}
              <div
                className="absolute top-0 bottom-0 pointer-events-none"
                style={{
                  left: todayPx,
                  width: pxPerDay,
                  background: 'color-mix(in srgb, var(--accent) 8%, transparent)',
                }}
              />
              <div className="flex h-full">
                {cols.map((col, ci) => (
                  <div
                    key={ci}
                    className={`flex items-center justify-center text-center shrink-0 border-r border-dark-border overflow-hidden ${
                      col.isToday ? 'text-accent' : col.isMajor ? 'text-gray-400' : 'text-gray-700'
                    }`}
                    style={{
                      width: col.span * pxPerDay,
                      fontSize: 10,
                      color: col.isToday ? 'var(--accent)' : undefined,
                    }}
                  >
                    <span className="truncate px-1">{col.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Rows ── */}
          {sortedItems.map((item) => {
            const draggable = canDragItem(item, myRole, currentUserId) && !!item.startDate;
            const startDay = item.startDate ? dateStrToDay(item.startDate) : null;
            const endDay = item.endDate ? dateStrToDay(item.endDate) : startDay;
            const barLeft = startDay ? daysBetween(rangeStart, startDay) * pxPerDay : null;
            const barWidth = startDay && endDay
              ? Math.max(pxPerDay, (daysBetween(startDay, endDay) + 1) * pxPerDay)
              : startDay ? pxPerDay : null;

            return (
              <div
                key={item.id}
                className="flex border-b border-dark-border hover:bg-white/[0.02] group"
                style={{ height: ROW_H }}
              >
                {/* Label */}
                <div
                  className="shrink-0 flex items-center gap-2 px-3 border-r border-dark-border overflow-hidden cursor-pointer"
                  style={{ width: LABEL_W }}
                  onClick={() => {
                    if (!didDragRef.current) onEditItem(item);
                  }}
                >
                  <span className="text-gray-600 shrink-0">
                    <ItemTypeIcon type={item.type} size={11} />
                  </span>
                  <span className="text-gray-300 text-xs truncate group-hover:text-white transition-colors">
                    {item.title}
                  </span>
                </div>

                {/* Bar area */}
                <div className="relative" style={{ width: totalGridW, height: ROW_H }}>
                  {/* Today line */}
                  <div
                    className="absolute top-0 bottom-0 pointer-events-none"
                    style={{
                      left: todayPx,
                      width: pxPerDay,
                      background: 'color-mix(in srgb, var(--accent) 4%, transparent)',
                    }}
                  />
                  <div
                    className="absolute top-0 bottom-0 w-px pointer-events-none"
                    style={{ left: todayPx, background: 'color-mix(in srgb, var(--accent) 40%, transparent)' }}
                  />

                  {/* Vertical grid lines */}
                  {cols.map((_col, ci) => {
                    const x = cols.slice(0, ci).reduce((acc, c) => acc + c.span * pxPerDay, 0);
                    return (
                      <div
                        key={ci}
                        className="absolute top-0 bottom-0 w-px pointer-events-none"
                        style={{ left: x, background: '#1a1a1a' }}
                      />
                    );
                  })}

                  {/* Bar */}
                  {barLeft !== null && barWidth !== null && (
                    <div
                      className="absolute top-[6px] rounded overflow-hidden flex items-center"
                      style={{
                        left: barLeft,
                        width: barWidth,
                        height: ROW_H - 12,
                        cursor: draggable ? 'grab' : 'default',
                        ...barStyle(item),
                      }}
                      onMouseDown={(e) => handleMouseDown(e, item, 'move')}
                      onMouseEnter={(e) => setTooltip({ item, x: e.clientX, y: e.clientY })}
                      onMouseLeave={() => setTooltip(null)}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!didDragRef.current) onEditItem(item);
                      }}
                    >
                      {/* Resize-start handle */}
                      {draggable && (
                        <div
                          className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize z-10"
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            handleMouseDown(e, item, 'resize-start');
                          }}
                        />
                      )}

                      <span className="truncate text-xs px-2 pointer-events-none leading-none">
                        {item.title}
                      </span>

                      {/* Resize-end handle */}
                      {draggable && (
                        <div
                          className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize z-10"
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            handleMouseDown(e, item, 'resize-end');
                          }}
                        />
                      )}
                    </div>
                  )}

                  {/* No-date indicator */}
                  {!item.startDate && (
                    <div className="absolute inset-0 flex items-center px-3">
                      <span className="text-gray-800 text-xs italic">No date</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Empty state */}
          {sortedItems.length === 0 && (
            <div
              className="flex items-center justify-center text-gray-700 text-sm"
              style={{ height: 120 }}
            >
              No items yet.
            </div>
          )}
        </div>
      </div>

      {/* Tooltip */}
      <AnimatePresence>
        {tooltip && (
          <motion.div
            key="tooltip"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
            className="fixed z-50 bg-dark-surface border border-dark-border rounded-md px-3 py-2 text-xs text-white shadow-xl pointer-events-none"
            style={{ left: tooltip.x + 12, top: tooltip.y - 60 }}
          >
            <div className="font-medium mb-1">{tooltip.item.title}</div>
            <div className="text-gray-400">
              {tooltip.item.startDate ?? '—'}
              {tooltip.item.endDate && tooltip.item.endDate !== tooltip.item.startDate
                ? ` → ${tooltip.item.endDate}`
                : ''}
            </div>
            <div className="text-gray-600 mt-0.5">
              {tooltip.item.type.charAt(0) + tooltip.item.type.slice(1).toLowerCase()} ·{' '}
              {tooltip.item.status.replace('_', ' ').charAt(0) +
                tooltip.item.status.replace('_', ' ').slice(1).toLowerCase()}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            key="toast"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.18 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-dark-surface border border-dark-border text-white text-sm px-4 py-2 rounded-lg shadow-lg pointer-events-none"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
