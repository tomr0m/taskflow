import { jsx as _jsx } from "react/jsx-runtime";
import { BoardCard } from './BoardCard';
export const BoardList = ({ boards }) => (_jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4", children: boards.map((board) => (_jsx(BoardCard, { board: board }, board.id))) }));
