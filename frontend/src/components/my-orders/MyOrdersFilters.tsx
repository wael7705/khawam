import { Search } from 'lucide-react';

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
    <div className="my-orders__controls">
      <div className="my-orders__search">
        <Search size={18} />
        <input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={labels.search}
        />
      </div>
      <div className="my-orders__tabs">
        {STATUS_FILTERS.map((s) => (
          <button
            key={s}
            type="button"
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
