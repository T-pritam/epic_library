import ePub from 'epubjs';

/**
 * Extract metadata from an EPUB file
 */
export async function extractMetadata(file) {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const book = ePub(arrayBuffer);

        await book.ready;

        const metadata = await book.loaded.metadata;
        const cover = await extractCover(book);
        const spine = await book.loaded.spine;

        // Calculate approximate page count (rough estimate)
        const totalPages = spine?.items?.length * 20 || 0;

        return {
            title: metadata.title || file.name.replace(/\.epub$/i, ''),
            author: metadata.creator || 'Unknown Author',
            publisher: metadata.publisher || '',
            language: metadata.language || 'en',
            description: metadata.description || '',
            cover: cover,
            totalPages: totalPages,
            fileSize: file.size
        };
    } catch (error) {
        console.error('Error extracting EPUB metadata:', error);

        // Return basic info if extraction fails
        return {
            title: file.name.replace(/\.epub$/i, ''),
            author: 'Unknown Author',
            publisher: '',
            language: 'en',
            description: '',
            cover: null,
            totalPages: 0,
            fileSize: file.size
        };
    }
}

/**
 * Extract cover image from EPUB
 */
async function extractCover(book) {
    try {
        const coverUrl = await book.coverUrl();

        if (!coverUrl) {
            return null;
        }

        // Fetch the cover image and convert to blob
        const response = await fetch(coverUrl);
        const blob = await response.blob();

        // Convert to base64 for preview
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = () => resolve(null);
            reader.readAsDataURL(blob);
        });
    } catch (error) {
        console.error('Error extracting cover:', error);
        return null;
    }
}

/**
 * Get cover image as Blob for storage upload
 */
export async function getCoverBlob(file) {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const book = ePub(arrayBuffer);

        await book.ready;

        const coverUrl = await book.coverUrl();

        if (!coverUrl) {
            return null;
        }

        const response = await fetch(coverUrl);
        return await response.blob();
    } catch (error) {
        console.error('Error getting cover blob:', error);
        return null;
    }
}

/**
 * Validate EPUB file
 */
export function validateEpub(file) {
    const errors = [];

    // Check file extension
    if (!file.name.toLowerCase().endsWith('.epub')) {
        errors.push('File must be an EPUB file');
    }

    // Check file size (max 50MB)
    const maxSize = parseInt(import.meta.env.VITE_MAX_FILE_SIZE) || 52428800;
    if (file.size > maxSize) {
        errors.push(`File size exceeds maximum limit of ${Math.round(maxSize / 1024 / 1024)}MB`);
    }

    // Check MIME type
    const validTypes = ['application/epub+zip', 'application/octet-stream'];
    if (!validTypes.includes(file.type) && file.type !== '') {
        // Some browsers don't set MIME type for epub files, so we rely on extension check
        // Only add error if type is set and not valid
    }

    return {
        valid: errors.length === 0,
        errors
    };
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
