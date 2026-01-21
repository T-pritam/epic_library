import { supabase } from '../services/supabase';

/**
 * Upload an EPUB file to Supabase Storage
 */
export async function uploadEpub(userId, file, fileName) {
    const filePath = `${userId}/${fileName}`;

    const { data, error } = await supabase.storage
        .from('epub-files')
        .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
        });

    if (error) throw error;
    return data.path;
}

/**
 * Get a signed URL for downloading an EPUB file
 */
export async function getSignedUrl(filePath, expiresIn = 3600) {
    const { data, error } = await supabase.storage
        .from('epub-files')
        .createSignedUrl(filePath, expiresIn);

    if (error) throw error;
    return data.signedUrl;
}

/**
 * Download an EPUB file as ArrayBuffer
 */
export async function downloadEpub(filePath) {
    const { data, error } = await supabase.storage
        .from('epub-files')
        .download(filePath);

    if (error) throw error;
    return await data.arrayBuffer();
}

/**
 * Download an EPUB file as Blob (for EPUB.js)
 * This downloads the entire EPUB file so EPUB.js can read it locally
 */
export async function downloadEpubAsBlob(filePath) {
    const { data, error } = await supabase.storage
        .from('epub-files')
        .download(filePath);

    if (error) throw error;
    return data; // Returns Blob directly
}

/**
 * Delete an EPUB file from storage
 */
export async function deleteEpub(filePath) {
    const { error } = await supabase.storage
        .from('epub-files')
        .remove([filePath]);

    if (error) throw error;
    return true;
}

/**
 * Upload a cover image and return the public URL
 */
export async function uploadCover(userId, bookId, coverBlob) {
    const filePath = `${userId}/covers/${bookId}.jpg`;

    const { data, error } = await supabase.storage
        .from('epub-files')
        .upload(filePath, coverBlob, {
            cacheControl: '86400',
            upsert: true,
            contentType: 'image/jpeg'
        });

    if (error) throw error;

    // Get signed URL for the cover
    const { data: urlData } = await supabase.storage
        .from('epub-files')
        .createSignedUrl(filePath, 86400 * 30); // 30 days

    return urlData?.signedUrl || null;
}

/**
 * Generate a unique filename for an EPUB file
 */
export function generateFileName(originalName) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const cleanName = originalName
        .replace(/[^a-zA-Z0-9.-]/g, '_')
        .replace(/\.epub$/i, '');

    return `${cleanName}_${timestamp}_${random}.epub`;
}
