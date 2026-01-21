import { supabase } from './supabase';

/**
 * Get all books for the current user
 */
export async function getBooks(userId) {
    const { data, error } = await supabase
        .from('books')
        .select('*')
        .eq('user_id', userId)
        .order('last_opened', { ascending: false, nullsFirst: false });

    if (error) throw error;
    return data;
}

/**
 * Get a single book by ID
 */
export async function getBook(bookId) {
    const { data, error } = await supabase
        .from('books')
        .select('*')
        .eq('id', bookId)
        .single();

    if (error) throw error;
    return data;
}

/**
 * Add a new book
 */
export async function addBook(bookData) {
    const { data, error } = await supabase
        .from('books')
        .insert([bookData])
        .select()
        .single();

    if (error) throw error;
    return data;
}

/**
 * Update book metadata
 */
export async function updateBook(bookId, updates) {
    const { data, error } = await supabase
        .from('books')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', bookId)
        .select()
        .single();

    if (error) throw error;
    return data;
}

/**
 * Delete a book
 */
export async function deleteBook(bookId) {
    const { error } = await supabase
        .from('books')
        .delete()
        .eq('id', bookId);

    if (error) throw error;
    return true;
}

/**
 * Update last opened timestamp
 */
export async function updateLastOpened(bookId) {
    const { data, error } = await supabase
        .from('books')
        .update({ last_opened: new Date().toISOString() })
        .eq('id', bookId)
        .select()
        .single();

    if (error) throw error;
    return data;
}

/**
 * Search books by title or author
 */
export async function searchBooks(userId, query) {
    const { data, error } = await supabase
        .from('books')
        .select('*')
        .eq('user_id', userId)
        .or(`title.ilike.%${query}%,author.ilike.%${query}%`)
        .order('last_opened', { ascending: false, nullsFirst: false });

    if (error) throw error;
    return data;
}
