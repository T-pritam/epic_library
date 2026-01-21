import { Library } from 'lucide-react';
import BookCard from './BookCard';

export default function BookGrid({ books, progressMap, onDelete, emptyMessage }) {
    if (!books || books.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 px-4">
                <div className="h-24 w-24 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-6">
                    <Library className="h-12 w-12 text-gray-400 dark:text-gray-500" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    No books found
                </h3>
                <p className="text-gray-500 dark:text-gray-400 text-center max-w-md">
                    {emptyMessage || 'Upload your first EPUB book to get started with your reading journey.'}
                </p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
            {books.map((book) => (
                <BookCard
                    key={book.id}
                    book={book}
                    progress={progressMap[book.id]}
                    onDelete={onDelete}
                />
            ))}
        </div>
    );
}
