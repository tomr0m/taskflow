import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../lib/AuthContext';
import { Spinner } from '../components/Spinner';

export const Home = () => {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      navigate(user ? '/dashboard' : '/login', { replace: true });
    }
  }, [user, isLoading, navigate]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="min-h-screen bg-black flex items-center justify-center"
    >
      <Spinner size={24} className="text-gray-500" />
    </motion.div>
  );
};
