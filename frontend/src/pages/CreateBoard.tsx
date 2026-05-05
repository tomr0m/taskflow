import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { boardApi } from '../lib/boardApi';
import { Input } from '../components/Input';
import { Button } from '../components/Button';

export const CreateBoard = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const board = await boardApi.create({
        name: name.trim(),
        description: description.trim() || undefined,
      });
      navigate(`/boards/${board.id}`);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to create board');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen bg-black text-white flex items-center justify-center px-4"
    >
      <div className="w-full max-w-md">
        <button
          onClick={() => navigate('/dashboard')}
          className="text-gray-500 hover:text-white text-sm mb-8 transition-colors"
        >
          ← Back to boards
        </button>
        <h1 className="text-2xl font-bold mb-8">Create Board</h1>
        <form onSubmit={handleSubmit}>
          <Input
            label="Board name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Product Roadmap"
            maxLength={100}
            required
          />
          <div className="mb-4">
            <label className="block text-sm font-medium text-white mb-2">
              Description <span className="text-gray-500">(optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this board for?"
              maxLength={500}
              rows={3}
              className="w-full px-4 py-2 bg-dark-bg border border-dark-border rounded text-white placeholder-gray-600 focus:outline-none focus:border-gray-400 transition resize-none"
            />
          </div>
          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
          <Button type="submit" isLoading={loading}>
            Create Board
          </Button>
        </form>
      </div>
    </motion.div>
  );
};
