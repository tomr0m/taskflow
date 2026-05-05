import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { Button } from '../components/Button';
import { motion } from 'framer-motion';

export const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

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
        <div className="flex items-center justify-between mb-12">
          <h1 className="text-4xl font-bold">Welcome, {user?.name}!</h1>
          <Button onClick={handleLogout} variant="secondary" className="w-auto px-6">
            Logout
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-dark-surface border border-dark-border rounded-lg p-6">
            <div className="text-gray-400 text-sm mb-2">Email</div>
            <div className="text-white font-medium">{user?.email}</div>
          </div>

          <div className="bg-dark-surface border border-dark-border rounded-lg p-6">
            <div className="text-gray-400 text-sm mb-2">User ID</div>
            <div className="text-white font-medium">{user?.id}</div>
          </div>

          <div className="bg-dark-surface border border-dark-border rounded-lg p-6">
            <div className="text-gray-400 text-sm mb-2">Status</div>
            <div className="text-green-400 font-medium">Authenticated</div>
          </div>
        </div>

        <div className="bg-dark-surface border border-dark-border rounded-lg p-8">
          <h2 className="text-xl font-bold mb-4">Phase 1 Placeholder</h2>
          <p className="text-gray-400">
            Welcome to TaskFlow Phase 1! This is your dashboard. Future phases will include:
          </p>
          <ul className="text-gray-400 mt-4 space-y-2 list-disc list-inside">
            <li>Project boards and task management</li>
            <li>Team collaboration and calendaring</li>
            <li>Advanced workflows and automation</li>
          </ul>
        </div>
      </div>
    </motion.div>
  );
};
