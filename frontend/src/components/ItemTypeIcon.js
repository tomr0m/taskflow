import { jsx as _jsx } from "react/jsx-runtime";
import { FaTasks, FaUsers, FaBell, FaFlag, FaCalendarAlt } from 'react-icons/fa';
const icons = {
    TASK: FaTasks,
    MEETING: FaUsers,
    REMINDER: FaBell,
    DEADLINE: FaFlag,
    EVENT: FaCalendarAlt,
};
const colors = {
    TASK: 'text-gray-400',
    MEETING: 'text-blue-400',
    REMINDER: 'text-yellow-400',
    DEADLINE: 'text-red-400',
    EVENT: 'text-purple-400',
};
export const ItemTypeIcon = ({ type, size = 14 }) => {
    const Icon = icons[type];
    return _jsx(Icon, { size: size, className: colors[type], title: type });
};
