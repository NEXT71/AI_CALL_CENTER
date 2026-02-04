import { memo } from 'react';

/**
 * Skeleton loading component for cards
 */
export const CardSkeleton = memo(({ count = 1 }) => (
  <>
    {[...Array(count)].map((_, i) => (
      <div key={i} className="card animate-pulse">
        <div className="h-4 bg-slate-blue-light rounded w-3/4 mb-4"></div>
        <div className="h-8 bg-slate-blue-light rounded w-1/2 mb-2"></div>
        <div className="h-4 bg-slate-blue-light rounded w-full"></div>
      </div>
    ))}
  </>
));

CardSkeleton.displayName = 'CardSkeleton';

/**
 * Skeleton loading component for tables
 */
export const TableSkeleton = memo(({ rows = 5, columns = 4 }) => (
  <div className="animate-pulse">
    {/* Table Header */}
    <div className="flex gap-4 mb-4 pb-4 border-b border-slate-blue-light">
      {[...Array(columns)].map((_, i) => (
        <div key={i} className="flex-1 h-4 bg-slate-blue-light rounded"></div>
      ))}
    </div>
    
    {/* Table Rows */}
    {[...Array(rows)].map((_, rowIndex) => (
      <div key={rowIndex} className="flex gap-4 mb-3 py-3 border-b border-slate-blue-light/50">
        {[...Array(columns)].map((_, colIndex) => (
          <div key={colIndex} className="flex-1 h-4 bg-slate-blue-light rounded"></div>
        ))}
      </div>
    ))}
  </div>
));

TableSkeleton.displayName = 'TableSkeleton';

/**
 * Skeleton loading component for statistics/KPI cards
 */
export const StatSkeleton = memo(({ count = 4 }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    {[...Array(count)].map((_, i) => (
      <div key={i} className="kpi-card-enhanced animate-pulse">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="h-3 bg-slate-200 rounded w-24 mb-3"></div>
            <div className="h-8 bg-slate-200 rounded w-32 mb-2"></div>
            <div className="h-3 bg-slate-200 rounded w-16"></div>
          </div>
          <div className="w-12 h-12 bg-slate-200 rounded-xl"></div>
        </div>
      </div>
    ))}
  </div>
));

StatSkeleton.displayName = 'StatSkeleton';

/**
 * Skeleton loading component for list items
 */
export const ListSkeleton = memo(({ count = 3 }) => (
  <div className="space-y-4">
    {[...Array(count)].map((_, i) => (
      <div key={i} className="flex items-center gap-4 p-4 bg-slate-blue rounded-lg animate-pulse">
        <div className="w-12 h-12 bg-slate-blue-light rounded-full flex-shrink-0"></div>
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-slate-blue-light rounded w-3/4"></div>
          <div className="h-3 bg-slate-blue-light rounded w-1/2"></div>
        </div>
        <div className="w-20 h-8 bg-slate-blue-light rounded"></div>
      </div>
    ))}
  </div>
));

ListSkeleton.displayName = 'ListSkeleton';

/**
 * Skeleton loading component for text content
 */
export const TextSkeleton = memo(({ lines = 3 }) => (
  <div className="space-y-3 animate-pulse">
    {[...Array(lines)].map((_, i) => (
      <div 
        key={i} 
        className="h-4 bg-slate-blue-light rounded" 
        style={{ width: i === lines - 1 ? '60%' : '100%' }}
      ></div>
    ))}
  </div>
));

TextSkeleton.displayName = 'TextSkeleton';

/**
 * Full page skeleton loader
 */
export const PageSkeleton = memo(() => (
  <div className="space-y-6 p-6 animate-fade-in">
    {/* Header */}
    <div className="animate-pulse">
      <div className="h-8 bg-slate-blue-light rounded w-64 mb-2"></div>
      <div className="h-4 bg-slate-blue-light rounded w-96"></div>
    </div>

    {/* Stats */}
    <StatSkeleton count={4} />

    {/* Content Card */}
    <div className="card p-6">
      <div className="animate-pulse space-y-4">
        <div className="h-6 bg-slate-blue-light rounded w-48"></div>
        <TableSkeleton rows={5} columns={4} />
      </div>
    </div>
  </div>
));

PageSkeleton.displayName = 'PageSkeleton';

/**
 * Chart skeleton loader
 */
export const ChartSkeleton = memo(() => (
  <div className="h-64 bg-slate-blue-light rounded-lg animate-pulse flex items-end justify-around p-4 gap-2">
    {[...Array(7)].map((_, i) => (
      <div 
        key={i}
        className="bg-slate-blue-dark rounded-t"
        style={{ 
          width: '12%',
          height: `${Math.random() * 60 + 40}%`
        }}
      ></div>
    ))}
  </div>
));

ChartSkeleton.displayName = 'ChartSkeleton';

export default {
  Card: CardSkeleton,
  Table: TableSkeleton,
  Stat: StatSkeleton,
  List: ListSkeleton,
  Text: TextSkeleton,
  Page: PageSkeleton,
  Chart: ChartSkeleton,
};
