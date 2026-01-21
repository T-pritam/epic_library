import { supabase } from './supabase';

/**
 * Get reading progress for a specific book
 */
export async function getProgress(userId, bookId) {
    const { data, error } = await supabase
        .from('reading_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('book_id', bookId)
        .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned
    return data;
}

/**
 * Get all reading progress for a user
 */
export async function getAllProgress(userId) {
    const { data, error } = await supabase
        .from('reading_progress')
        .select('*')
        .eq('user_id', userId);

    if (error) throw error;
    return data;
}

/**
 * Upsert reading progress (insert or update)
 */
export async function upsertProgress(progressData) {
    const { data, error } = await supabase
        .from('reading_progress')
        .upsert({
            ...progressData,
            last_read_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        }, {
            onConflict: 'user_id,book_id'
        })
        .select()
        .single();

    if (error) throw error;
    return data;
}

/**
 * Update reading status
 */
export async function updateReadingStatus(userId, bookId, status) {
    const { data, error } = await supabase
        .from('reading_progress')
        .upsert({
            user_id: userId,
            book_id: bookId,
            reading_status: status,
            last_read_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        }, {
            onConflict: 'user_id,book_id'
        })
        .select()
        .single();

    if (error) throw error;
    return data;
}

/**
 * Get books by reading status
 */
export async function getBooksByStatus(userId, status) {
    let query = supabase
        .from('reading_progress')
        .select(`
      *,
      books (*)
    `)
        .eq('user_id', userId);

    if (status !== 'all') {
        query = query.eq('reading_status', status);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data;
}
