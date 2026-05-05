import { BoardMember, Role } from '../lib/boardApi';
import { RoleBadge } from './RoleBadge';

const ROLE_OPTIONS: Exclude<Role, 'OWNER'>[] = ['ADMIN', 'MEMBER', 'VIEWER'];

interface MembersListProps {
  members: BoardMember[];
  myRole: Role;
  currentUserId: number;
  onChangeRole?: (userId: number, role: Exclude<Role, 'OWNER'>) => void;
  onRemove?: (userId: number) => void;
}

export const MembersList = ({
  members,
  myRole,
  currentUserId,
  onChangeRole,
  onRemove,
}: MembersListProps) => {
  const canManage = myRole === 'OWNER' || myRole === 'ADMIN';

  return (
    <div className="space-y-2">
      {members.map((m) => {
        const isSelf = m.userId === currentUserId;
        const isOwner = m.role === 'OWNER';
        const canEdit = canManage && !isOwner && !isSelf && myRole === 'OWNER';
        const canRemove =
          canManage &&
          !isOwner &&
          !isSelf &&
          (myRole === 'OWNER' || (myRole === 'ADMIN' && m.role !== 'ADMIN'));

        return (
          <div
            key={m.id}
            className="flex items-center justify-between bg-dark-bg border border-dark-border rounded-lg px-4 py-3"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-sm font-medium text-white shrink-0">
                {m.user.name[0].toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="text-white text-sm font-medium truncate">
                  {m.user.name} {isSelf && <span className="text-gray-500 font-normal">(you)</span>}
                </div>
                <div className="text-gray-500 text-xs truncate">{m.user.email}</div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 ml-3">
              {canEdit && onChangeRole ? (
                <select
                  value={m.role}
                  onChange={(e) => onChangeRole(m.userId, e.target.value as Exclude<Role, 'OWNER'>)}
                  className="bg-dark-surface border border-dark-border text-white text-xs rounded px-2 py-1 focus:outline-none focus:border-gray-400"
                >
                  {ROLE_OPTIONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              ) : (
                <RoleBadge role={m.role} />
              )}
              {canRemove && onRemove && (
                <button
                  onClick={() => onRemove(m.userId)}
                  className="text-gray-600 hover:text-red-400 transition-colors text-xs px-2 py-1"
                >
                  Remove
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
