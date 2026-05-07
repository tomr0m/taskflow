import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LayoutGrid, LogOut, Plus } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { boardApi, Board } from '../lib/boardApi';
import { BoardList } from '../components/BoardList';
import { Button } from '../components/Button';
import { SkeletonCard } from '../components/SkeletonCard';

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
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
      className="min-h-screen bg-black text-white"
    >
      <div className="max-w-6xl mx-auto px-4 py-10 sm:py-14">
        {/* Header */}
        <div className="flex items-center justify-between mb-10 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Boards</h1>
            <p className="text-gray-500 text-sm mt-1">Welcome back, {user?.name}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              onClick={() => navigate('/boards/new')}
              className="w-auto px-4 sm:px-5 text-sm"
            >
              <Plus size={14} />
              <span className="hidden sm:inline">New Board</span>
              <span className="sm:hidden">New</span>
            </Button>
            <Button
              onClick={handleLogout}
              variant="secondary"
              className="w-auto px-3 sm:px-5 text-sm"
              title="Logout"
            >
              <LogOut size={14} />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>

        {/* Loading skeleton */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-red-400 mb-3">{error}</p>
            <Button
              variant="secondary"
              className="w-auto px-6"
              onClick={() => { setError(''); setLoading(true); boardApi.list().then(setBoards).catch(() => setError('Failed to load boards')).finally(() => setLoading(false)); }}
            >
              Retry
            </Button>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && boards.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-24 text-center"
          >
            <div className="w-16 h-16 rounded-2xl bg-dark-surface border border-dark-border flex items-center justify-center mb-5">
              <LayoutGrid size={28} className="text-gray-600" />
            </div>
            <h2 className="text-white text-lg font-semibold mb-2">No boards yet</h2>
            <p className="text-gray-500 text-sm mb-6">Create your first board to get started.</p>
            <Button onClick={() => navigate('/boards/new')} className="w-auto px-8">
              <Plus size={14} />
              Create Board
            </Button>
          </motion.div>
        )}

        {/* Board list */}
        {!loading && boards.length > 0 && <BoardList boards={boards} />}
      </div>
    </motion.div>
  );
};
