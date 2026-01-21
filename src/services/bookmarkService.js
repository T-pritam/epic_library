import { supabase } from './supabase';

/**
 * Get all bookmarks for a specific book
 */
export async function getBookmarks(userId, bookId) {
    const { data, error } = await supabase
        .from('bookmarks')
        .select('*')
        .eq('user_id', userId)
        .eq('book_id', bookId)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
}

/**
 * Get all bookmarks for a user
 */
export async function getAllBookmarks(userId) {
    const { data, error } = await supabase
        .from('bookmarks')
        .select(`
      *,
      books (id, title, author)
    `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
}

/**
 * Add a new bookmark
 */
export async function addBookmark(bookmarkData) {
    const { data, error } = await supabase
        .from('bookmarks')
        .insert([bookmarkData])
        .select()
        .single();

    if (error) throw error;
    return data;
}

/**
 * Update a bookmark (add/edit note)
 */
export async function updateBookmark(bookmarkId, updates) {
    const { data, error } = await supabase
        .from('bookmarks')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', bookmarkId)
        .select()
        .single();

    if (error) throw error;
    return data;
}

/**
 * Delete a bookmark
 */
export async function deleteBookmark(bookmarkId) {
    const { error } = await supabase
        .from('bookmarks')
        .delete()
        .eq('id', bookmarkId);

    if (error) throw error;
    return true;
}

/**
 * Check if a location is bookmarked
 */
export async function isBookmarked(userId, bookId, cfi) {
    const { data, error } = await supabase
        .from('bookmarks')
        .select('id')
        .eq('user_id', userId)
        .eq('book_id', bookId)
        .eq('cfi', cfi)
        .single();

    if (error && error.code !== 'PGRST116') throw error;
    return !!data;
}
