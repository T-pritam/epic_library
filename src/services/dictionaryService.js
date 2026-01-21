const DICTIONARY_API_URL = 'https://api.dictionaryapi.dev/api/v2/entries/en';
const CACHE_KEY = 'dictionary_cache';
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Get cached dictionary entries from localStorage
 */
function getCache() {
    try {
        const cache = localStorage.getItem(CACHE_KEY);
        if (!cache) return {};

        const parsed = JSON.parse(cache);
        const now = Date.now();

        // Clean expired entries
        const cleaned = {};
        for (const [word, entry] of Object.entries(parsed)) {
            if (now - entry.timestamp < CACHE_EXPIRY) {
                cleaned[word] = entry;
            }
        }

        return cleaned;
    } catch {
        return {};
    }
}

/**
 * Save to cache
 */
function setCache(word, data) {
    try {
        const cache = getCache();
        cache[word.toLowerCase()] = {
            data,
            timestamp: Date.now()
        };
        localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    } catch {
        // Cache storage failed, ignore
    }
}

/**
 * Get from cache
 */
function getCachedWord(word) {
    const cache = getCache();
    const entry = cache[word.toLowerCase()];
    if (entry && Date.now() - entry.timestamp < CACHE_EXPIRY) {
        return entry.data;
    }
    return null;
}

/**
 * Fetch word definition from Free Dictionary API
 */
export async function fetchDefinition(word) {
    // Clean the word
    const cleanWord = word.trim().toLowerCase().replace(/[^a-z'-]/g, '');

    if (!cleanWord || cleanWord.length < 2) {
        throw new Error('Invalid word');
    }

    // Check cache first
    const cached = getCachedWord(cleanWord);
    if (cached) {
        return cached;
    }

    try {
        const response = await fetch(`${DICTIONARY_API_URL}/${encodeURIComponent(cleanWord)}`);

        if (!response.ok) {
            if (response.status === 404) {
                throw new Error('Definition not found');
            }
            throw new Error('Unable to fetch definition');
        }

        const data = await response.json();

        if (!data || !data.length) {
            throw new Error('Definition not found');
        }

        // Parse the response into a simpler format
        const entry = data[0];
        const result = {
            word: entry.word,
            phonetic: entry.phonetic || entry.phonetics?.[0]?.text || '',
            audio: entry.phonetics?.find(p => p.audio)?.audio || '',
            meanings: entry.meanings.map(meaning => ({
                partOfSpeech: meaning.partOfSpeech,
                definitions: meaning.definitions.slice(0, 3).map(def => ({
                    definition: def.definition,
                    example: def.example || ''
                })),
                synonyms: meaning.synonyms?.slice(0, 5) || []
            }))
        };

        // Cache the result
        setCache(cleanWord, result);

        return result;
    } catch (error) {
        if (error.message === 'Definition not found' || error.message === 'Invalid word') {
            throw error;
        }
        throw new Error('Unable to fetch definition');
    }
}

/**
 * Clear dictionary cache
 */
export function clearDictionaryCache() {
    localStorage.removeItem(CACHE_KEY);
}
