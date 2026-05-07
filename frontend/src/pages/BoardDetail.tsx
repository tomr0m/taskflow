import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../lib/AuthContext';
import { boardApi, Board } from '../lib/boardApi';
import { BoardWorkspace } from '../components/BoardWorkspace';
import { Spinner } from '../components/Spinner';

export const BoardDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [board, setBoard] = useState<Board | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const boardId = parseInt(id!);

  useEffect(() => {
    boardApi
      .get(boardId)
      .then(setBoard)
      .catch(() => setError('Board not found or access denied'))
      .finally(() => setLoading(false));
  }, [boardId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Spinner size={24} className="text-gray-500" />
      </div>
    );
  }

  if (error || !board) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen bg-black text-white flex items-center justify-center"
      >
        <div className="text-center">
          <p className="text-gray-400 mb-4">{error || 'Board not found'}</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="text-gray-500 hover:text-white text-sm transition-colors"
          >
            ← Back to boards
          </button>
        </div>
      </motion.div>
    );
  }

  return <BoardWorkspace initialBoard={board} currentUser={user!} />;
};
