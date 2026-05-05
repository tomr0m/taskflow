import { Role } from '../lib/boardApi';

const accentStyle = {
  background: 'color-mix(in srgb, var(--accent) 15%, transparent)',
  color: 'var(--accent)',
  border: '1px solid color-mix(in srgb, var(--accent) 30%, transparent)',
};

const grayscaleStyles: Partial<Record<Role, string>> = {
  ADMIN: 'bg-gray-700 text-gray-100',
  MEMBER: 'bg-gray-800 text-gray-300',
  VIEWER: 'bg-gray-900 text-gray-500 border border-gray-700',
};

export const RoleBadge = ({ role }: { role: Role }) => {
  if (role === 'OWNER') {
    return (
      <span className="text-xs font-medium px-2 py-0.5 rounded" style={accentStyle}>
        {role}
      </span>
    );
  }
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded ${grayscaleStyles[role]}`}>
      {role}
    </span>
  );
};
