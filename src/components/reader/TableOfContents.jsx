import { X, ChevronRight } from 'lucide-react';

export default function TableOfContents({
    toc = [],
    isOpen,
    onClose,
    onNavigate,
    currentCfi
}) {
    // Don't return null - just hide with CSS instead
    // This way desktop can show it when isOpen is true

    const renderTocItem = (item, depth = 0) => {
        const hasSubitems = item.subitems && item.subitems.length > 0;

        return (
            <li key={item.id || item.href}>
                <button
                    onClick={() => onNavigate(item.href)}
                    className="w-full text-left px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2 text-sm"
                    style={{ paddingLeft: `${16 + depth * 16}px` }}
                >
                    {hasSubitems && (
                        <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    )}
                    <span className="text-gray-700 dark:text-gray-300 line-clamp-2">
                        {item.label}
                    </span>
                </button>
                {hasSubitems && (
                    <ul>
                        {item.subitems.map(subitem => renderTocItem(subitem, depth + 1))}
                    </ul>
                )}
            </li>
        );
    };

    return (
        <>
            {/* Backdrop - only on mobile */}
            <div
                className="fixed inset-0 bg-black/30 z-40 lg:hidden"
                onClick={onClose}
            />

            {/* Sidebar - overlay on all screens when open */}
            <div className={`fixed inset-y-0 left-0 z-50 w-80 max-w-[80vw] bg-white dark:bg-gray-800 shadow-xl border-r border-gray-200 dark:border-gray-700 flex flex-col h-full transition-transform ${
                isOpen ? 'translate-x-0' : '-translate-x-full'
            }`}>
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        Table of Contents
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        aria-label="Close table of contents"
                    >
                        <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                    </button>
                </div>

                {/* TOC List */}
                <nav className="flex-1 overflow-y-auto py-2">
                    {toc.length > 0 ? (
                        <ul>
                            {toc.map(item => renderTocItem(item))}
                        </ul>
                    ) : (
                        <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                            No table of contents available
                        </div>
                    )}
                </nav>
            </div>
        </>
    );
}
