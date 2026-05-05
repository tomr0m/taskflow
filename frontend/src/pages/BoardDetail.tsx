import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../lib/AuthContext';
import { boardApi, Board, Role } from '../lib/boardApi';
import { MembersList } from '../components/MembersList';
import { InviteMemberDialog } from '../components/InviteMemberDialog';
import { RoleBadge } from '../components/RoleBadge';
import { Button } from '../components/Button';

export const BoardDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [board, setBoard] = useState<Board | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [inviteOpen, setInviteOpen] = useState(false);

  const boardId = parseInt(id!);

  useEffect(() => {
    boardApi
      .get(boardId)
      .then(setBoard)
      .catch(() => setError('Board not found or access denied'))
      .finally(() => setLoading(false));
  }, [boardId]);

  const handleInvite = async (email: string, role: Exclude<Role, 'OWNER'>) => {
    const member = await boardApi.inviteMember(boardId, { email, role });
    setBoard((prev) =>
      prev
        ? {
            ...prev,
            members: [...(prev.members || []), member],
            memberCount: prev.memberCount + 1,
          }
        : prev
    );
  };

  const handleChangeRole = async (userId: number, role: Exclude<Role, 'OWNER'>) => {
    const updated = await boardApi.updateMemberRole(boardId, userId, role);
    setBoard((prev) =>
      prev
        ? {
            ...prev,
            members: prev.members?.map((m) =>
              m.userId === userId ? { ...m, role: updated.role } : m
            ),
          }
        : prev
    );
  };

  const handleRemoveMember = async (userId: number) => {
    await boardApi.removeMember(boardId, userId);
    setBoard((prev) =>
      prev
        ? {
            ...prev,
            members: prev.members?.filter((m) => m.userId !== userId),
            memberCount: prev.memberCount - 1,
          }
        : prev
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (error || !board) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 mb-4">{error || 'Board not found'}</p>
          <button onClick={() => navigate('/dashboard')} className="text-gray-500 hover:text-white text-sm">
            ← Back to boards
          </button>
        </div>
      </div>
    );
  }

  const canManage = board.myRole === 'OWNER' || board.myRole === 'ADMIN';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen bg-black text-white"
    >
      <div className="max-w-4xl mx-auto px-4 py-12">
        <button
          onClick={() => navigate('/dashboard')}
          className="text-gray-500 hover:text-white text-sm mb-8 transition-colors"
        >
          ← Back to boards
        </button>

        <div className="flex items-start justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold">{board.name}</h1>
              <RoleBadge role={board.myRole} />
            </div>
            {board.description && <p className="text-gray-500">{board.description}</p>}
          </div>
          {board.myRole === 'OWNER' && (
            <Button
              onClick={() => navigate(`/boards/${board.id}/settings`)}
              variant="secondary"
              className="w-auto px-4"
            >
              Settings
            </Button>
          )}
        </div>

        <div className="bg-dark-surface border border-dark-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-semibold">
              Members <span className="text-gray-600 font-normal">({board.memberCount})</span>
            </h2>
            {canManage && (
              <Button onClick={() => setInviteOpen(true)} className="w-auto px-4 text-sm">
                + Invite
              </Button>
            )}
          </div>
          <MembersList
            members={board.members || []}
            myRole={board.myRole}
            currentUserId={user!.id}
            onChangeRole={canManage ? handleChangeRole : undefined}
            onRemove={canManage ? handleRemoveMember : undefined}
          />
        </div>
      </div>

      <InviteMemberDialog
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        onInvite={handleInvite}
        myRole={board.myRole}
      />
    </motion.div>
  );
};
