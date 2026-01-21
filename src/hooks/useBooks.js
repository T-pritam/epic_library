import { useLibrary as useLibraryContext } from '../contexts/LibraryContext';

/**
 * Custom hook for book operations
 * Re-exports the library context for easier imports
 */
export function useBooks() {
    return useLibraryContext();
}

export default useBooks;
