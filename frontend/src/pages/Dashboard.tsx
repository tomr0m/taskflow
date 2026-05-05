import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../lib/AuthContext';
import { boardApi, Board } from '../lib/boardApi';
import { BoardList } from '../components/BoardList';
import { Button } from '../components/Button';

export const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    boardApi
      .list()
      .then(setBoards)
      .catch(() => setError('Failed to load boards'))
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen bg-black text-white"
    >
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-3xl font-bold">Boards</h1>
            <p className="text-gray-500 text-sm mt-1">Welcome back, {user?.name}</p>
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={() => navigate('/boards/new')} className="w-auto px-5">
              + New Board
            </Button>
            <Button onClick={handleLogout} variant="secondary" className="w-auto px-5">
              Logout
            </Button>
          </div>
        </div>

        {loading && <p className="text-gray-500">Loading boards...</p>}
        {error && <p className="text-red-500">{error}</p>}
        {!loading && !error && boards.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-24 text-center"
          >
            <div className="text-6xl mb-6 select-none">▦</div>
            <h2 className="text-white text-xl font-semibold mb-2">No boards yet</h2>
            <p className="text-gray-500 mb-6">Create your first one to get started.</p>
            <Button onClick={() => navigate('/boards/new')} className="w-auto px-8">
              Create Board
            </Button>
          </motion.div>
        )}
        {!loading && boards.length > 0 && <BoardList boards={boards} />}
      </div>
    </motion.div>
  );
};
