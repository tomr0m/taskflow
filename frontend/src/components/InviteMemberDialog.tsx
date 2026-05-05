import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Role } from '../lib/boardApi';
import { Input } from './Input';
import { Button } from './Button';

interface InviteMemberDialogProps {
  open: boolean;
  onClose: () => void;
  onInvite: (email: string, role: Exclude<Role, 'OWNER'>) => Promise<void>;
  myRole: Role;
}

export const InviteMemberDialog = ({ open, onClose, onInvite, myRole }: InviteMemberDialogProps) => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Exclude<Role, 'OWNER'>>('MEMBER');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const roleOptions: Exclude<Role, 'OWNER'>[] =
    myRole === 'OWNER' ? ['ADMIN', 'MEMBER', 'VIEWER'] : ['MEMBER', 'VIEWER'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await onInvite(email.trim(), role);
      setEmail('');
      setRole('MEMBER');
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to invite member');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/70"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="relative bg-dark-surface border border-dark-border rounded-lg p-6 w-full max-w-md"
          >
            <h2 className="text-white font-semibold text-lg mb-4">Invite Member</h2>
            <form onSubmit={handleSubmit}>
              <Input
                label="Email address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
                required
              />
              <div className="mb-4">
                <label className="block text-sm font-medium text-white mb-2">Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as Exclude<Role, 'OWNER'>)}
                  className="w-full px-4 py-2 bg-dark-bg border border-dark-border rounded text-white focus:outline-none focus:border-gray-400"
                >
                  {roleOptions.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
              {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
              <div className="flex gap-3">
                <Button type="button" variant="secondary" onClick={onClose} className="w-auto flex-1">
                  Cancel
                </Button>
                <Button type="submit" isLoading={loading} className="flex-1">
                  Invite
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
