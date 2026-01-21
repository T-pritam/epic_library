import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Menu, X, Bookmark, Settings, Maximize, Minimize,
    ChevronLeft, List, BookOpen
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLibrary } from '../contexts/LibraryContext';
import { useReader } from '../contexts/ReaderContext';
import { getBook, updateLastOpened } from '../services/bookService';
import { getProgress, upsertProgress } from '../services/progressService';
import { getBookmarks, addBookmark, deleteBookmark } from '../services/bookmarkService';
import { downloadEpub } from '../utils/storageHelper';
import { PROGRESS_SAVE_INTERVAL, KEYBOARD_SHORTCUTS } from '../utils/constants';
import EpubReader from '../components/reader/EpubReader';
import ReaderControls from '../components/reader/ReaderControls';
import TableOfContents from '../components/reader/TableOfContents';
import BookmarkPanel from '../components/reader/BookmarkPanel';
import SettingsPanel from '../components/reader/SettingsPanel';
import DictionaryTooltip from '../components/reader/DictionaryTooltip';
import { FullPageLoader } from '../components/common/Loader';
import { useDictionary } from '../hooks/useDictionary';

export default function Reader() {
    const { bookId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { updateProgress: updateLibraryProgress } = useLibrary();
    const {
        isTocOpen, setIsTocOpen,
        isBookmarkPanelOpen, setIsBookmarkPanelOpen,
        isSettingsPanelOpen, setIsSettingsPanelOpen,
        isFullscreen, toggleFullscreen,
        getTheme,
        setCurrentBook, setCurrentLocation
    } = useReader();

    const [book, setBook] = useState(null);
    const [bookUrl, setBookUrl] = useState(null);
    const [toc, setToc] = useState([]);
    const [bookmarks, setBookmarks] = useState([]);
    const [progress, setProgress] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isAddingBookmark, setIsAddingBookmark] = useState(false);
    const [showControls, setShowControls] = useState(true);
    const [currentPercentage, setCurrentPercentage] = useState(0);
    const [currentCfi, setCurrentCfi] = useState(null);

    // Dictionary
    const {
        word: dictWord,
        definition,
        loading: dictLoading,
        error: dictError,
        lookup,
        clear: clearDictionary
    } = useDictionary();
    const [dictPosition, setDictPosition] = useState({ x: 0, y: 0 });
    const [showDictionary, setShowDictionary] = useState(false);

    const progressSaveRef = useRef(null);
    const containerRef = useRef(null);

    // Load book data
    useEffect(() => {
        async function loadBook() {
            if (!bookId || !user) return;

            setLoading(true);
            setError(null);

            try {
                // Fetch book metadata
                const bookData = await getBook(bookId);
                if (!bookData) {
                    throw new Error('Book not found');
                }
                setBook(bookData);
                setCurrentBook(bookData);

                // Update last opened
                await updateLastOpened(bookId);

                // Download EPUB file as ArrayBuffer
                // Passing ArrayBuffer directly to EPUB.js is more robust than Blob URLs
                const epubData = await downloadEpub(bookData.file_path);
                setBookUrl(epubData);

                // Fetch reading progress
                const progressData = await getProgress(user.id, bookId);
                setProgress(progressData);
                if (progressData) {
                    setCurrentPercentage(progressData.progress_percentage || 0);
                    setCurrentCfi(progressData.current_cfi);
                }

                // Fetch bookmarks
                const bookmarksData = await getBookmarks(user.id, bookId);
                setBookmarks(bookmarksData || []);

            } catch (err) {
                console.error('Error loading book:', err);
                setError(err.message || 'Failed to load book');
            } finally {
                setLoading(false);
            }
        }

        loadBook();

        return () => {
            setCurrentBook(null);
        };
    }, [bookId, user, setCurrentBook]);

    // Auto-save progress
    useEffect(() => {
        if (!bookId || !user) return;

        const saveProgress = async () => {
            if (!currentCfi) return;

            try {
                await upsertProgress({
                    user_id: user.id,
                    book_id: bookId,
                    current_cfi: currentCfi,
                    progress_percentage: currentPercentage,
                    reading_status: currentPercentage >= 95 ? 'completed' : 'reading'
                });

                // Update library context
                updateLibraryProgress(bookId, {
                    current_cfi: currentCfi,
                    progress_percentage: currentPercentage,
                    reading_status: currentPercentage >= 95 ? 'completed' : 'reading'
                });
            } catch (err) {
                console.error('Error saving progress:', err);
            }
        };

        progressSaveRef.current = setInterval(saveProgress, PROGRESS_SAVE_INTERVAL);

        return () => {
            if (progressSaveRef.current) {
                clearInterval(progressSaveRef.current);
            }
            // Save on unmount
            saveProgress();
        };
    }, [bookId, user, currentCfi, currentPercentage, updateLibraryProgress]);

    // Handle location change from reader
    const handleLocationChange = useCallback((location) => {
        setCurrentCfi(location.cfi);
        setCurrentPercentage(location.percentage);
        setCurrentLocation(location);
    }, [setCurrentLocation]);

    // Handle TOC loaded
    const handleTocLoaded = useCallback((tocData) => {
        setToc(tocData);
    }, []);

    // Navigation
    const handlePrevPage = useCallback(() => {
        window.__epubReader?.prevPage();
    }, []);

    const handleNextPage = useCallback(() => {
        window.__epubReader?.nextPage();
    }, []);

    const handleProgressChange = useCallback((percentage) => {
        window.__epubReader?.goToPercentage(percentage);
    }, []);

    const handleTocNavigate = useCallback((href) => {
        window.__epubReader?.getRendition()?.display(href);
        setIsTocOpen(false);
    }, [setIsTocOpen]);

    // Bookmarks
    const handleAddBookmark = useCallback(async () => {
        if (!currentCfi || !user || !bookId) return;

        setIsAddingBookmark(true);
        try {
            const newBookmark = await addBookmark({
                user_id: user.id,
                book_id: bookId,
                cfi: currentCfi,
                page_number: Math.round(currentPercentage)
            });
            setBookmarks(prev => [newBookmark, ...prev]);
        } catch (err) {
            console.error('Error adding bookmark:', err);
        } finally {
            setIsAddingBookmark(false);
        }
    }, [currentCfi, user, bookId, currentPercentage]);

    const handleDeleteBookmark = useCallback(async (bookmarkId) => {
        try {
            await deleteBookmark(bookmarkId);
            setBookmarks(prev => prev.filter(b => b.id !== bookmarkId));
        } catch (err) {
            console.error('Error deleting bookmark:', err);
        }
    }, []);

    const handleBookmarkNavigate = useCallback((cfi) => {
        window.__epubReader?.goToLocation(cfi);
        setIsBookmarkPanelOpen(false);
    }, [setIsBookmarkPanelOpen]);

    // Dictionary - Text selection handling
    useEffect(() => {
        const handleSelection = () => {
            const selection = window.getSelection();
            const selectedText = selection?.toString().trim();

            if (selectedText && selectedText.length > 1 && selectedText.length < 50) {
                // Get selection position
                const range = selection.getRangeAt(0);
                const rect = range.getBoundingClientRect();

                setDictPosition({
                    x: rect.left + (rect.width / 2) - 160, // Center tooltip
                    y: rect.bottom
                });

                lookup(selectedText);
                setShowDictionary(true);
            }
        };

        // Listen for mouseup/touchend in the epub container
        const container = containerRef.current;
        if (container) {
            container.addEventListener('mouseup', handleSelection);
            container.addEventListener('touchend', handleSelection);
        }

        return () => {
            if (container) {
                container.removeEventListener('mouseup', handleSelection);
                container.removeEventListener('touchend', handleSelection);
            }
        };
    }, [lookup]);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e) => {
            // Don't trigger shortcuts when typing in inputs
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

            if (KEYBOARD_SHORTCUTS.nextPage.includes(e.key)) {
                e.preventDefault();
                handleNextPage();
            } else if (KEYBOARD_SHORTCUTS.prevPage.includes(e.key)) {
                e.preventDefault();
                handlePrevPage();
            } else if (KEYBOARD_SHORTCUTS.toggleToc.includes(e.key)) {
                e.preventDefault();
                setIsTocOpen(prev => !prev);
            } else if (KEYBOARD_SHORTCUTS.toggleFullscreen.includes(e.key)) {
                e.preventDefault();
                toggleFullscreen();
            } else if (KEYBOARD_SHORTCUTS.toggleBookmark.includes(e.key)) {
                e.preventDefault();
                handleAddBookmark();
            } else if (KEYBOARD_SHORTCUTS.toggleSettings.includes(e.key)) {
                e.preventDefault();
                setIsSettingsPanelOpen(prev => !prev);
            } else if (KEYBOARD_SHORTCUTS.escape.includes(e.key)) {
                setIsTocOpen(false);
                setIsBookmarkPanelOpen(false);
                setIsSettingsPanelOpen(false);
                setShowDictionary(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [
        handleNextPage, handlePrevPage, handleAddBookmark,
        toggleFullscreen, setIsTocOpen, setIsBookmarkPanelOpen, setIsSettingsPanelOpen
    ]);

    // Touch gestures for mobile - only horizontal swipes for page navigation
    const touchStartRef = useRef(null);

    useEffect(() => {
        const handleTouchStart = (e) => {
            touchStartRef.current = {
                x: e.touches[0].clientX,
                y: e.touches[0].clientY
            };
        };

        const handleTouchEnd = (e) => {
            if (!touchStartRef.current) return;

            const touchEnd = {
                x: e.changedTouches[0].clientX,
                y: e.changedTouches[0].clientY
            };

            const diffX = touchStartRef.current.x - touchEnd.x;
            const diffY = touchStartRef.current.y - touchEnd.y;
            const threshold = 50;

            // Only navigate if horizontal swipe is significantly larger than vertical
            // This allows vertical scrolling within the epub content
            if (Math.abs(diffX) > threshold && Math.abs(diffX) > Math.abs(diffY) * 2) {
                if (diffX > 0) {
                    handleNextPage();
                } else {
                    handlePrevPage();
                }
            }

            touchStartRef.current = null;
        };

        const container = containerRef.current;
        if (container) {
            container.addEventListener('touchstart', handleTouchStart, { passive: true });
            container.addEventListener('touchend', handleTouchEnd, { passive: true });
        }

        return () => {
            if (container) {
                container.removeEventListener('touchstart', handleTouchStart);
                container.removeEventListener('touchend', handleTouchEnd);
            }
        };
    }, [handleNextPage, handlePrevPage]);

    // Auto-hide controls in fullscreen
    useEffect(() => {
        if (!isFullscreen) {
            setShowControls(true);
            return;
        }

        let timeout;
        const handleMouseMove = () => {
            setShowControls(true);
            clearTimeout(timeout);
            timeout = setTimeout(() => setShowControls(false), 3000);
        };

        window.addEventListener('mousemove', handleMouseMove);
        timeout = setTimeout(() => setShowControls(false), 3000);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            clearTimeout(timeout);
        };
    }, [isFullscreen]);

    if (loading) {
        return <FullPageLoader message="Loading book..." />;
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
                <div className="text-center">
                    <BookOpen className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                        Unable to load book
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
                    <button
                        onClick={() => navigate('/library')}
                        className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition-colors"
                    >
                        Back to Library
                    </button>
                </div>
            </div>
        );
    }

    const theme = getTheme();

    return (
        <div
            className={`min-h-screen flex flex-col ${isFullscreen ? 'fullscreen-reader' : ''}`}
            style={{ backgroundColor: theme.background }}
        >
            {/* Header */}
            <header
                className={`
          sticky top-0 z-30 glass border-b border-gray-200 dark:border-gray-700 
          transition-transform duration-300
          ${isFullscreen && !showControls ? '-translate-y-full' : 'translate-y-0'}
        `}
                style={{ backgroundColor: `${theme.background}ee` }}
            >
                <div className="flex items-center justify-between px-4 h-14">
                    {/* Left Section */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => navigate('/library')}
                            className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                            aria-label="Back to library"
                        >
                            <ChevronLeft className="h-5 w-5" style={{ color: theme.text }} />
                        </button>
                        <button
                            onClick={() => setIsTocOpen(!isTocOpen)}
                            className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                            aria-label="Toggle table of contents"
                        >
                            {isTocOpen ? (
                                <X className="h-5 w-5" style={{ color: theme.text }} />
                            ) : (
                                <List className="h-5 w-5" style={{ color: theme.text }} />
                            )}
                        </button>
                    </div>

                    {/* Title */}
                    <h1
                        className="text-sm sm:text-base font-medium truncate max-w-[40%] sm:max-w-[50%]"
                        style={{ color: theme.text }}
                    >
                        {book?.title}
                    </h1>

                    {/* Right Section */}
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setIsBookmarkPanelOpen(!isBookmarkPanelOpen)}
                            className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                            aria-label="Bookmarks"
                        >
                            <Bookmark
                                className="h-5 w-5"
                                style={{ color: theme.text }}
                                fill={bookmarks.some(b => b.cfi === currentCfi) ? theme.text : 'none'}
                            />
                        </button>
                        <button
                            onClick={() => setIsSettingsPanelOpen(!isSettingsPanelOpen)}
                            className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                            aria-label="Settings"
                        >
                            <Settings className="h-5 w-5" style={{ color: theme.text }} />
                        </button>
                        <button
                            onClick={toggleFullscreen}
                            className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors hidden sm:block"
                            aria-label="Toggle fullscreen"
                        >
                            {isFullscreen ? (
                                <Minimize className="h-5 w-5" style={{ color: theme.text }} />
                            ) : (
                                <Maximize className="h-5 w-5" style={{ color: theme.text }} />
                            )}
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden">
                {/* Table of Contents Sidebar */}
                <TableOfContents
                    toc={toc}
                    isOpen={isTocOpen}
                    onClose={() => setIsTocOpen(false)}
                    onNavigate={handleTocNavigate}
                    currentCfi={currentCfi}
                />

                {/* Reader */}
                <div
                    ref={containerRef}
                    className="flex-1 relative no-zoom"
                    style={{ backgroundColor: theme.background }}
                >
                    {bookUrl && (
                        <EpubReader
                            bookUrl={bookUrl}
                            initialLocation={progress?.current_cfi}
                            onLocationChange={handleLocationChange}
                            onTocLoaded={handleTocLoaded}
                            onError={(err) => setError(err.message)}
                        />
                    )}
                </div>

                {/* Bookmark Panel */}
                <BookmarkPanel
                    isOpen={isBookmarkPanelOpen}
                    onClose={() => setIsBookmarkPanelOpen(false)}
                    bookmarks={bookmarks}
                    onAddBookmark={handleAddBookmark}
                    onDeleteBookmark={handleDeleteBookmark}
                    onNavigate={handleBookmarkNavigate}
                    isAdding={isAddingBookmark}
                />
            </div>

            {/* Footer Controls */}
            <footer
                className={`
          sticky bottom-0 z-30 glass border-t border-gray-200 dark:border-gray-700 py-3 px-4
          transition-transform duration-300
          ${isFullscreen && !showControls ? 'translate-y-full' : 'translate-y-0'}
        `}
                style={{ backgroundColor: `${theme.background}ee` }}
            >
                <ReaderControls
                    currentPercentage={currentPercentage}
                    onPrevPage={handlePrevPage}
                    onNextPage={handleNextPage}
                    onProgressChange={handleProgressChange}
                />
            </footer>

            {/* Settings Panel */}
            <SettingsPanel
                isOpen={isSettingsPanelOpen}
                onClose={() => setIsSettingsPanelOpen(false)}
            />

            {/* Dictionary Tooltip */}
            <DictionaryTooltip
                isOpen={showDictionary}
                onClose={() => {
                    setShowDictionary(false);
                    clearDictionary();
                }}
                word={dictWord}
                definition={definition}
                loading={dictLoading}
                error={dictError}
                position={dictPosition}
            />
        </div>
    );
}
