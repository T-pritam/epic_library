import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MoreVertical, Trash2, BookOpen, Clock } from 'lucide-react';
import { ConfirmModal } from '../common/Modal';

export default function BookCard({ book, progress, onDelete }) {
    const navigate = useNavigate();
    const [showMenu, setShowMenu] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const progressPercent = progress?.progress_percentage || 0;
    const status = progress?.reading_status || 'not_started';
    const lastRead = progress?.last_read_at;

    const handleClick = (e) => {
        // Don't navigate if clicking menu
        if (e.target.closest('.book-menu')) return;
        navigate(`/reader/${book.id}`);
    };

    const handleDelete = () => {
        setShowMenu(false);
        setShowDeleteConfirm(true);
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return null;
        const date = new Date(dateStr);
        const now = new Date();
        const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        return date.toLocaleDateString();
    };

    const getStatusBadge = () => {
        const badges = {
            reading: {
                bg: 'bg-blue-100 dark:bg-blue-900/30',
                text: 'text-blue-700 dark:text-blue-400',
                label: 'Reading'
            },
            completed: {
                bg: 'bg-green-100 dark:bg-green-900/30',
                text: 'text-green-700 dark:text-green-400',
                label: 'Completed'
            },
            not_started: null
        };

        const badge = badges[status];
        if (!badge) return null;

        return (
            <span className={`absolute top-2 left-2 px-2 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
                {badge.label}
            </span>
        );
    };

    return (
        <>
            <div
                onClick={handleClick}
                className="book-card bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-md hover:shadow-xl cursor-pointer group"
            >
                {/* Cover Image */}
                <div className="relative aspect-[2/3] bg-gradient-to-br from-primary-100 to-accent-100 dark:from-primary-900 dark:to-accent-900">
                    {book.cover_url ? (
                        <img
                            src={book.cover_url}
                            alt={book.title}
                            className="w-full h-full object-cover"
                            loading="lazy"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <BookOpen className="h-16 w-16 text-primary-300 dark:text-primary-600" />
                        </div>
                    )}

                    {/* Status Badge */}
                    {getStatusBadge()}

                    {/* Menu Button */}
                    <div className="book-menu absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowMenu(!showMenu);
                            }}
                            className="p-1.5 bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                            <MoreVertical className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                        </button>

                        {showMenu && (
                            <div className="absolute right-0 mt-1 w-36 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 animate-fade-in z-10">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDelete();
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                >
                                    <Trash2 className="h-4 w-4" />
                                    Delete
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Progress Overlay */}
                    {progressPercent > 0 && (
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/20">
                            <div
                                className="h-full bg-primary-500 progress-bar"
                                style={{ width: `${progressPercent}%` }}
                            />
                        </div>
                    )}
                </div>

                {/* Book Info */}
                <div className="p-3 sm:p-4">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 line-clamp-2 text-sm sm:text-base">
                        {book.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1 truncate">
                        {book.author || 'Unknown Author'}
                    </p>

                    {/* Progress and Last Read */}
                    <div className="mt-3 flex items-center justify-between text-xs text-gray-400 dark:text-gray-500">
                        <span className="font-medium">
                            {Math.round(progressPercent)}% complete
                        </span>
                        {lastRead && (
                            <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatDate(lastRead)}
                            </span>
                        )}
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-2 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-primary-500 to-accent-500 rounded-full progress-bar"
                            style={{ width: `${progressPercent}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Click outside to close menu */}
            {showMenu && (
                <div
                    className="fixed inset-0 z-0"
                    onClick={() => setShowMenu(false)}
                />
            )}

            {/* Delete Confirmation */}
            <ConfirmModal
                isOpen={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                onConfirm={() => onDelete?.(book.id)}
                title="Delete Book"
                message={`Are you sure you want to delete "${book.title}"? This action cannot be undone.`}
                confirmText="Delete"
                variant="danger"
            />
        </>
    );
}
