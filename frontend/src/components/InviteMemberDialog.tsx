import { useEffect, useRef, useState } from 'react';
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
  const emailRef = useRef<HTMLInputElement>(null);

  const roleOptions: Exclude<Role, 'OWNER'>[] =
    myRole === 'OWNER' ? ['ADMIN', 'MEMBER', 'VIEWER'] : ['MEMBER', 'VIEWER'];

  // Auto-focus + Escape
  useEffect(() => {
    if (!open) return;
    setTimeout(() => emailRef.current?.focus(), 50);
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  // Reset on close
  useEffect(() => {
    if (!open) { setEmail(''); setRole('MEMBER'); setError(''); }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await onInvite(email.trim(), role);
      onClose();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })
        ?.response?.data?.error?.message;
      setError(msg || 'Failed to invite member');
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
            className="absolute inset-0 bg-black/75"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="relative bg-dark-surface border border-dark-border rounded-xl p-6 w-full max-w-md shadow-2xl"
          >
            <h2 className="text-white font-semibold text-lg mb-5">Invite Member</h2>
            <form onSubmit={handleSubmit}>
              <Input
                ref={emailRef}
                label="Email address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
                required
                autoComplete="email"
              />
              <div className="mb-5">
                <label className="block text-sm font-medium text-white mb-2">Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as Exclude<Role, 'OWNER'>)}
                  className="w-full px-4 py-2 bg-dark-bg border border-dark-border rounded text-white focus:outline-none focus:border-gray-400 transition"
                >
                  {roleOptions.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
              {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
              <div className="flex gap-3">
                <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
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
