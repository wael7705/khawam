import { Search, SlidersHorizontal } from 'lucide-react';

const STATUS_FILTERS = ['all', 'active', 'completed', 'cancelled'] as const;
export type StatusFilter = (typeof STATUS_FILTERS)[number];

interface MyOrdersFiltersProps {
  search: string;
  onSearchChange: (v: string) => void;
  statusFilter: StatusFilter;
  onStatusFilterChange: (s: StatusFilter) => void;
  labels: { search: string; all: string; active: string; completed: string; cancelled: string };
}

export { STATUS_FILTERS };

export function MyOrdersFilters({
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  labels,
}: MyOrdersFiltersProps) {
  return (
    <div className="my-orders__controls my-orders__controls--hero">
      <div className="my-orders__search my-orders__search--hero">
        <Search size={20} className="my-orders__search-icon" />
        <input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={labels.search}
          aria-label={labels.search}
        />
      </div>
      <div className="my-orders__tabs" role="tablist">
        <span className="my-orders__tabs-label">
          <SlidersHorizontal size={14} aria-hidden />
        </span>
        {STATUS_FILTERS.map((s) => (
          <button
            key={s}
            type="button"
            role="tab"
            aria-selected={statusFilter === s}
            className={statusFilter === s ? 'my-orders__tab my-orders__tab--active' : 'my-orders__tab'}
            onClick={() => onStatusFilterChange(s)}
          >
            {labels[s]}
          </button>
        ))}
      </div>
    </div>
  );
}
