import { useEffect, useRef, useMemo } from 'react';
import Header from '../components/common/Header';
import BookGrid from '../components/library/BookGrid';
import BookFilters from '../components/library/BookFilters';
import UploadButton from '../components/library/UploadButton';
import { SkeletonGrid } from '../components/common/Loader';
import { useLibrary } from '../contexts/LibraryContext';
import { deleteEpub } from '../utils/storageHelper';
import { Upload } from 'lucide-react';

export default function Library() {
    const {
        books,
        filteredBooks,
        progressMap,
        loading,
        error,
        filter,
        setFilter,
        setSearchQuery,
        fetchBooks,
        deleteBook
    } = useLibrary();

    const uploadRef = useRef(null);

    // Fetch books on mount
    useEffect(() => {
        fetchBooks();
    }, [fetchBooks]);

    // Calculate book counts for filters
    const bookCounts = useMemo(() => {
        const counts = {
            all: books.length,
            reading: 0,
            completed: 0,
            not_started: 0
        };

        books.forEach(book => {
            const status = progressMap[book.id]?.reading_status || 'not_started';
            counts[status] = (counts[status] || 0) + 1;
        });

        return counts;
    }, [books, progressMap]);

    const handleSearch = (query) => {
        setSearchQuery(query);
    };

    const handleDelete = async (bookId) => {
        const book = books.find(b => b.id === bookId);
        if (!book) return;

        try {
            // Delete file from storage
            if (book.file_path) {
                try {
                    await deleteEpub(book.file_path);
                } catch (err) {
                    console.error('Error deleting file from storage:', err);
                    // Continue with database deletion even if storage deletion fails
                }
            }

            // Delete from database
            await deleteBook(bookId);
        } catch (err) {
            console.error('Error deleting book:', err);
        }
    };

    const handleUploadClick = () => {
        // Trigger the hidden file input in UploadButton
        const uploadBtn = document.querySelector('[data-upload-trigger]');
        if (uploadBtn) uploadBtn.click();
    };

    const getEmptyMessage = () => {
        if (filter === 'reading') {
            return "You're not currently reading any books. Start reading a book to see it here!";
        }
        if (filter === 'completed') {
            return "You haven't completed any books yet. Keep reading!";
        }
        if (filter === 'not_started') {
            return "All your books have been started. Upload more books to add to your collection!";
        }
        return 'Upload your first EPUB book to get started with your reading journey.';
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <Header
                onSearch={handleSearch}
                onUpload={handleUploadClick}
            />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Page Title */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                            My Library
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">
                            {books.length} {books.length === 1 ? 'book' : 'books'} in your collection
                        </p>
                    </div>

                    {/* Mobile Upload Button */}
                    <div className="sm:hidden">
                        <UploadButton onSuccess={fetchBooks} />
                    </div>
                </div>

                {/* Filters */}
                <div className="mb-8">
                    <BookFilters
                        activeFilter={filter}
                        onFilterChange={setFilter}
                        bookCounts={bookCounts}
                    />
                </div>

                {/* Error State */}
                {error && (
                    <div className="mb-8 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                        <p className="text-red-600 dark:text-red-400">{error}</p>
                        <button
                            onClick={fetchBooks}
                            className="mt-2 text-sm text-red-700 dark:text-red-300 underline hover:no-underline"
                        >
                            Try again
                        </button>
                    </div>
                )}

                {/* Loading State */}
                {loading && books.length === 0 && (
                    <SkeletonGrid count={8} />
                )}

                {/* Book Grid */}
                {!loading && (
                    <BookGrid
                        books={filteredBooks}
                        progressMap={progressMap}
                        onDelete={handleDelete}
                        emptyMessage={getEmptyMessage()}
                    />
                )}

                {/* Empty State with Upload CTA */}
                {!loading && books.length === 0 && (
                    <div className="mt-8 flex flex-col items-center">
                        <div className="relative">
                            <UploadButton onSuccess={fetchBooks} />
                        </div>
                    </div>
                )}
            </main>

            {/* Floating Upload Button (Desktop) */}
            <div className="hidden sm:block fixed bottom-8 right-8">
                <UploadButton onSuccess={fetchBooks} />
            </div>
        </div>
    );
}
