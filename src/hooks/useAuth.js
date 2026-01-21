import { useAuth as useAuthContext } from '../contexts/AuthContext';

/**
 * Custom hook for authentication operations
 * Re-exports the auth context for easier imports
 */
export function useAuth() {
    return useAuthContext();
}

export default useAuth;
