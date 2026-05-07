export const SkeletonCard = () => (
  <div className="bg-dark-surface border border-dark-border rounded-lg p-6 animate-pulse">
    <div className="flex items-start justify-between mb-3">
      <div className="h-5 bg-gray-800 rounded w-2/3" />
      <div className="h-4 bg-gray-800 rounded w-14" />
    </div>
    <div className="h-3 bg-gray-800 rounded w-full mb-2" />
    <div className="h-3 bg-gray-800 rounded w-4/5 mb-4" />
    <div className="h-3 bg-gray-800 rounded w-20" />
  </div>
);

export const SkeletonItemRow = () => (
  <div className="flex items-center gap-3 px-4 py-3 border-b border-dark-border animate-pulse">
    <div className="w-4 h-4 bg-gray-800 rounded shrink-0" />
    <div className="flex-1 min-w-0">
      <div className="h-3.5 bg-gray-800 rounded w-3/4 mb-1" />
      <div className="h-2.5 bg-gray-800 rounded w-1/2" />
    </div>
    <div className="h-3 bg-gray-800 rounded w-16 shrink-0" />
  </div>
);
