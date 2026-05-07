import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { boardApi, Board } from '../lib/boardApi';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { DeleteBoardDialog } from '../components/DeleteBoardDialog';
import { Spinner } from '../components/Spinner';

export const BoardSettings = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [board, setBoard] = useState<Board | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);

  const boardId = parseInt(id!);

  useEffect(() => {
    boardApi
      .get(boardId)
      .then((b) => {
        setBoard(b);
        setName(b.name);
        setDescription(b.description || '');
      })
      .catch(() => setError('Board not found or access denied'))
      .finally(() => setLoading(false));
  }, [boardId]);

  useEffect(() => {
    if (!loading) nameRef.current?.focus();
  }, [loading]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setSaving(true);
    try {
      const updated = await boardApi.update(boardId, {
        name: name.trim(),
        description: description.trim() || undefined,
      });
      setBoard(updated);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2500);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })
        ?.response?.data?.error?.message;
      setError(msg || 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    await boardApi.delete(boardId);
    navigate('/dashboard');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Spinner size={24} className="text-gray-500" />
      </div>
    );
  }

  if (error && !board) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 mb-4">{error}</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="text-gray-500 hover:text-white text-sm transition-colors"
          >
            ← Back to boards
          </button>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
      className="min-h-screen bg-black text-white"
    >
      <div className="max-w-xl mx-auto px-4 py-10 sm:py-14">
        <button
          onClick={() => navigate(`/boards/${boardId}`)}
          className="text-gray-500 hover:text-white text-sm mb-8 transition-colors"
        >
          ← Back to board
        </button>

        <h1 className="text-2xl font-bold mb-8">Board Settings</h1>

        <div className="bg-dark-surface border border-dark-border rounded-xl p-6 mb-6">
          <h2 className="text-white font-semibold mb-5">General</h2>
          <form onSubmit={handleSave}>
            <Input
              ref={nameRef}
              label="Board name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
              required
            />
            <div className="mb-5">
              <label className="block text-sm font-medium text-white mb-2">
                Description <span className="text-gray-500 font-normal">(optional)</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={500}
                rows={3}
                className="w-full px-4 py-2 bg-dark-bg border border-dark-border rounded text-white placeholder-gray-600 focus:outline-none focus:border-gray-400 transition resize-none"
              />
            </div>
            {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
            {success && <p className="text-green-400 text-sm mb-3">Changes saved.</p>}
            <Button type="submit" isLoading={saving}>
              Save Changes
            </Button>
          </form>
        </div>

        <div className="bg-dark-surface border border-red-900/40 rounded-xl p-6">
          <h2 className="text-white font-semibold mb-2">Danger Zone</h2>
          <p className="text-gray-500 text-sm mb-5">
            Permanently delete this board and all its data. This cannot be undone.
          </p>
          <Button
            variant="danger"
            onClick={() => setDeleteOpen(true)}
            className="w-auto px-5 text-sm"
          >
            Delete Board
          </Button>
        </div>
      </div>

      <DeleteBoardDialog
        open={deleteOpen}
        boardName={board?.name || ''}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
      />
    </motion.div>
  );
};
