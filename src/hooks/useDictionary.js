import { useState, useCallback } from 'react';
import { fetchDefinition } from '../services/dictionaryService';

/**
 * Custom hook for dictionary lookups
 */
export function useDictionary() {
    const [definition, setDefinition] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [word, setWord] = useState('');

    const lookup = useCallback(async (searchWord) => {
        if (!searchWord || searchWord.trim().length < 2) {
            setError('Please select a word');
            return;
        }

        setWord(searchWord.trim());
        setLoading(true);
        setError(null);
        setDefinition(null);

        try {
            const result = await fetchDefinition(searchWord);
            setDefinition(result);
        } catch (err) {
            setError(err.message || 'Unable to fetch definition');
        } finally {
            setLoading(false);
        }
    }, []);

    const clear = useCallback(() => {
        setDefinition(null);
        setError(null);
        setWord('');
        setLoading(false);
    }, []);

    return {
        word,
        definition,
        loading,
        error,
        lookup,
        clear
    };
}

export default useDictionary;
