import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Board } from '../lib/boardApi';
import { RoleBadge } from './RoleBadge';

export const BoardCard = ({ board }: { board: Board }) => {
  const navigate = useNavigate();

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      transition={{ duration: 0.15 }}
      onClick={() => navigate(`/boards/${board.id}`)}
      className="bg-dark-surface border border-dark-border rounded-lg p-6 cursor-pointer hover:border-gray-600 transition-colors"
    >
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-white font-semibold text-lg leading-tight truncate pr-3">{board.name}</h3>
        <RoleBadge role={board.myRole} />
      </div>
      {board.description && (
        <p className="text-gray-500 text-sm mb-4 line-clamp-2">{board.description}</p>
      )}
      <div className="text-gray-600 text-xs mt-auto">
        {board.memberCount} {board.memberCount === 1 ? 'member' : 'members'}
      </div>
    </motion.div>
  );
};
