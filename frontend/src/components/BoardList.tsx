import { Board } from '../lib/boardApi';
import { BoardCard } from './BoardCard';

export const BoardList = ({ boards }: { boards: Board[] }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {boards.map((board) => (
      <BoardCard key={board.id} board={board} />
    ))}
  </div>
);
