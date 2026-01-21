import { useState } from 'react';
import { X, Bookmark, Trash2, Plus, Loader2 } from 'lucide-react';

export default function BookmarkPanel({
    isOpen,
    onClose,
    bookmarks = [],
    onAddBookmark,
    onDeleteBookmark,
    onNavigate,
    isAdding = false
}) {
    const [deletingId, setDeletingId] = useState(null);

    if (!isOpen) return null;

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const handleDelete = async (id) => {
        setDeletingId(id);
        try {
            await onDeleteBookmark?.(id);
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <>
            {/* Backdrop - only when open */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/30 z-40 lg:hidden"
                    onClick={onClose}
                />
            )}

            {/* Panel */}
            <div className={`
        fixed lg:relative inset-y-0 right-0 z-50 
        w-80 max-w-[80vw] bg-white dark:bg-gray-800 
        shadow-xl lg:shadow-none border-l border-gray-200 dark:border-gray-700
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
        flex flex-col
      `}>
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                        <Bookmark className="h-5 w-5" />
                        Bookmarks
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors lg:hidden"
                        aria-label="Close bookmarks"
                    >
                        <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                    </button>
                </div>

                {/* Add Bookmark Button */}
                <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                    <button
                        onClick={onAddBookmark}
                        disabled={isAdding}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                    >
                        {isAdding ? (
                            <>
                                <Loader2 className="h-5 w-5 animate-spin" />
                                <span>Adding...</span>
                            </>
                        ) : (
                            <>
                                <Plus className="h-5 w-5" />
                                <span>Add Bookmark</span>
                            </>
                        )}
                    </button>
                </div>

                {/* Bookmarks List */}
                <div className="flex-1 overflow-y-auto">
                    {bookmarks.length > 0 ? (
                        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                            {bookmarks.map((bookmark) => (
                                <li
                                    key={bookmark.id}
                                    className="group hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                                >
                                    <div className="px-4 py-3">
                                        <div className="flex items-start justify-between gap-2">
                                            <button
                                                onClick={() => onNavigate?.(bookmark.cfi)}
                                                className="flex-1 text-left"
                                            >
                                                <p className="text-sm text-gray-900 dark:text-gray-100 line-clamp-2">
                                                    {bookmark.highlighted_text || bookmark.note || 'Bookmarked location'}
                                                </p>
                                                <div className="flex items-center gap-2 mt-1 text-xs text-gray-500 dark:text-gray-400">
                                                    {bookmark.page_number && (
                                                        <span>Page {bookmark.page_number}</span>
                                                    )}
                                                    <span>{formatDate(bookmark.created_at)}</span>
                                                </div>
                                            </button>
                                            <button
                                                onClick={() => handleDelete(bookmark.id)}
                                                disabled={deletingId === bookmark.id}
                                                className="p-1.5 opacity-0 group-hover:opacity-100 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 transition-all"
                                                aria-label="Delete bookmark"
                                            >
                                                {deletingId === bookmark.id ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <Trash2 className="h-4 w-4" />
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="px-4 py-12 text-center">
                            <Bookmark className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                            <p className="text-gray-500 dark:text-gray-400">
                                No bookmarks yet
                            </p>
                            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                                Click the button above to bookmark your current location
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
