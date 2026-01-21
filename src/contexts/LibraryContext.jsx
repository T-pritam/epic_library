import { createContext, useContext, useState, useCallback } from 'react';
import * as bookService from '../services/bookService';
import * as progressService from '../services/progressService';
import { useAuth } from './AuthContext';

const LibraryContext = createContext(null);

export function LibraryProvider({ children }) {
    const { user } = useAuth();
    const [books, setBooks] = useState([]);
    const [progressMap, setProgressMap] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    const fetchBooks = useCallback(async () => {
        if (!user) return;

        setLoading(true);
        setError(null);

        try {
            const [booksData, progressData] = await Promise.all([
                bookService.getBooks(user.id),
                progressService.getAllProgress(user.id)
            ]);

            setBooks(booksData || []);

            // Create a map of book_id -> progress
            const progressMapObj = {};
            (progressData || []).forEach(p => {
                progressMapObj[p.book_id] = p;
            });
            setProgressMap(progressMapObj);
        } catch (err) {
            console.error('Error fetching books:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [user]);

    const addBook = useCallback(async (bookData) => {
        if (!user) return;

        try {
            const newBook = await bookService.addBook({
                ...bookData,
                user_id: user.id
            });

            setBooks(prev => [newBook, ...prev]);
            return newBook;
        } catch (err) {
            console.error('Error adding book:', err);
            throw err;
        }
    }, [user]);

    const deleteBook = useCallback(async (bookId) => {
        try {
            await bookService.deleteBook(bookId);
            setBooks(prev => prev.filter(b => b.id !== bookId));

            // Also remove from progress map
            setProgressMap(prev => {
                const updated = { ...prev };
                delete updated[bookId];
                return updated;
            });
        } catch (err) {
            console.error('Error deleting book:', err);
            throw err;
        }
    }, []);

    const updateProgress = useCallback(async (bookId, progressData) => {
        if (!user) return;

        try {
            const updated = await progressService.upsertProgress({
                user_id: user.id,
                book_id: bookId,
                ...progressData
            });

            setProgressMap(prev => ({
                ...prev,
                [bookId]: updated
            }));

            return updated;
        } catch (err) {
            console.error('Error updating progress:', err);
            throw err;
        }
    }, [user]);

    const getProgress = useCallback((bookId) => {
        return progressMap[bookId] || null;
    }, [progressMap]);

    // Filter and search books
    const filteredBooks = books.filter(book => {
        const progress = progressMap[book.id];
        const status = progress?.reading_status || 'not_started';

        // Apply filter
        if (filter !== 'all' && status !== filter) {
            return false;
        }

        // Apply search
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            return (
                book.title?.toLowerCase().includes(query) ||
                book.author?.toLowerCase().includes(query)
            );
        }

        return true;
    });

    const value = {
        books,
        filteredBooks,
        progressMap,
        loading,
        error,
        filter,
        searchQuery,
        setFilter,
        setSearchQuery,
        fetchBooks,
        addBook,
        deleteBook,
        updateProgress,
        getProgress
    };

    return (
        <LibraryContext.Provider value={value}>
            {children}
        </LibraryContext.Provider>
    );
}

export function useLibrary() {
    const context = useContext(LibraryContext);
    if (!context) {
        throw new Error('useLibrary must be used within a LibraryProvider');
    }
    return context;
}

export default LibraryContext;
