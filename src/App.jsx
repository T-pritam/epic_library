import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { LibraryProvider } from './contexts/LibraryContext';
import { ReaderProvider } from './contexts/ReaderContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Login from './pages/Login';
import Library from './pages/Library';
import Reader from './pages/Reader';

function App() {
    return (
        <AuthProvider>
            <LibraryProvider>
                <ReaderProvider>
                    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
                        <Routes>
                            <Route path="/login" element={<Login />} />
                            <Route
                                path="/library"
                                element={
                                    <ProtectedRoute>
                                        <Library />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/reader/:bookId"
                                element={
                                    <ProtectedRoute>
                                        <Reader />
                                    </ProtectedRoute>
                                }
                            />
                            <Route path="/" element={<Navigate to="/library" replace />} />
                            <Route path="*" element={<Navigate to="/library" replace />} />
                        </Routes>
                    </div>
                </ReaderProvider>
            </LibraryProvider>
        </AuthProvider>
    );
}

export default App;
