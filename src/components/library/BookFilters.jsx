import { Library, BookOpen, CheckCircle, Clock } from 'lucide-react';

const FILTERS = [
    { id: 'all', label: 'All Books', icon: Library },
    { id: 'reading', label: 'Reading', icon: BookOpen },
    { id: 'completed', label: 'Completed', icon: CheckCircle },
    { id: 'not_started', label: 'Not Started', icon: Clock }
];

export default function BookFilters({ activeFilter, onFilterChange, bookCounts }) {
    return (
        <div className="flex flex-wrap gap-2">
            {FILTERS.map(({ id, label, icon: Icon }) => {
                const isActive = activeFilter === id;
                const count = bookCounts?.[id] ?? 0;

                return (
                    <button
                        key={id}
                        onClick={() => onFilterChange(id)}
                        className={`
              flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200
              ${isActive
                                ? 'bg-primary-500 text-white shadow-md'
                                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
                            }
            `}
                    >
                        <Icon className="h-4 w-4" />
                        <span>{label}</span>
                        {count > 0 && (
                            <span className={`
                px-1.5 py-0.5 rounded-full text-xs font-semibold
                ${isActive
                                    ? 'bg-white/20 text-white'
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                                }
              `}>
                                {count}
                            </span>
                        )}
                    </button>
                );
            })}
        </div>
    );
}
