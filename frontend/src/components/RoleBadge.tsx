import { Role } from '../lib/boardApi';

const styles: Record<Role, string> = {
  OWNER: 'bg-white text-black',
  ADMIN: 'bg-gray-700 text-gray-100',
  MEMBER: 'bg-gray-800 text-gray-300',
  VIEWER: 'bg-gray-900 text-gray-500 border border-gray-700',
};

export const RoleBadge = ({ role }: { role: Role }) => (
  <span className={`text-xs font-medium px-2 py-0.5 rounded ${styles[role]}`}>{role}</span>
);
