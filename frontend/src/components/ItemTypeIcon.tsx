import { FaTasks, FaUsers, FaBell, FaFlag, FaCalendarAlt } from 'react-icons/fa';
import { ItemType } from '../lib/itemApi';

const icons: Record<ItemType, React.ElementType> = {
  TASK: FaTasks,
  MEETING: FaUsers,
  REMINDER: FaBell,
  DEADLINE: FaFlag,
  EVENT: FaCalendarAlt,
};

const colors: Record<ItemType, string> = {
  TASK: 'text-gray-400',
  MEETING: 'text-blue-400',
  REMINDER: 'text-yellow-400',
  DEADLINE: 'text-red-400',
  EVENT: 'text-purple-400',
};

interface ItemTypeIconProps {
  type: ItemType;
  size?: number;
}

export const ItemTypeIcon = ({ type, size = 14 }: ItemTypeIconProps) => {
  const Icon = icons[type];
  return <Icon size={size} className={colors[type]} title={type} />;
};
