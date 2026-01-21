import { useReader as useReaderContext } from '../contexts/ReaderContext';

/**
 * Custom hook for reader operations
 * Re-exports the reader context for easier imports
 */
export function useReader() {
    return useReaderContext();
}

export default useReader;
