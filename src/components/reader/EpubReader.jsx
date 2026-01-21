import { useEffect, useRef, useState } from 'react';
import ePub from 'epubjs';
import { useReader } from '../../contexts/ReaderContext';

export default function EpubReader({
    bookUrl,
    initialLocation,
    onLocationChange,
    onReady,
    onTocLoaded,
    onError
}) {
    const containerRef = useRef(null);
    const bookRef = useRef(null);
    const renditionRef = useRef(null);
    const locationsGeneratedRef = useRef(false);
    const { getTheme, getFont, getFontSize, getLineHeight, getTextAlign, getTextColor } = useReader();
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState(null);

    // Apply theme and styles to rendition
    const applyStyles = () => {
        if (!renditionRef.current) return;

        const theme = getTheme();
        const font = getFont();
        const fontSize = getFontSize();
        const lineHeight = getLineHeight();
        const textAlign = getTextAlign();
        const textColor = getTextColor();

        try {
            // Re-inject styles into all visible iframes
            const iframes = document.querySelectorAll('.epub-container iframe');
            iframes.forEach(iframe => {
                try {
                    const doc = iframe.contentDocument || iframe.contentWindow.document;
                    if (!doc) return;
                    
                    // Remove old style if exists
                    const oldStyle = doc.getElementById('book-theme-style');
                    if (oldStyle) oldStyle.remove();
                    
                    // Create new style element
                    const style = doc.createElement('style');
                    style.id = 'book-theme-style';
                    style.textContent = `
                        * {
                            color: ${textColor.color} !important;
                        }
                        html, body {
                            background-color: ${theme.background} !important;
                            color: ${textColor.color} !important;
                            font-family: ${font.family} !important;
                            font-size: ${fontSize.value}% !important;
                            line-height: ${lineHeight.value} !important;
                        }
                        body {
                            margin: 0 !important;
                            padding: 1em !important;
                        }
                        p, div, span, h1, h2, h3, h4, h5, h6, li, dt, dd, a {
                            color: ${textColor.color} !important;
                            font-family: ${font.family} !important;
                            font-size: ${fontSize.value}% !important;
                            line-height: ${lineHeight.value} !important;
                            text-align: ${textAlign.id} !important;
                        }
                        h1, h2, h3, h4, h5, h6 {
                            text-align: center !important;
                            font-size: ${fontSize.value * 1.8}% !important;
                            margin-top: 1.5em !important;
                            margin-bottom: 1.5em !important;
                        }
                        a {
                            color: ${textColor.color} !important;
                            text-decoration: none !important;
                        }
                        img {
                            max-width: 100% !important;
                            height: auto !important;
                        }
                        table {
                            width: 100% !important;
                            border-collapse: collapse !important;
                        }
                        td, th {
                            color: ${textColor.color} !important;
                        }
                    `;
                    doc.head.appendChild(style);
                } catch (e) {
                    // Ignore CORS errors
                }
            });
            
            console.log('✓ Styles applied to all iframes:', font.id, fontSize.id, theme.id);
        } catch (err) {
            console.warn('Error applying styles:', err);
        }
    };

    // Initialize book
    useEffect(() => {
        if (!containerRef.current || !bookUrl) return;

        let isMounted = true;
        setIsLoading(true);
        setLoadError(null);
        locationsGeneratedRef.current = false;

        // Clean up previous instance
        if (renditionRef.current) {
            try {
                renditionRef.current.destroy();
            } catch (e) {
                console.warn('Error destroying rendition:', e);
            }
            renditionRef.current = null;
        }
        if (bookRef.current) {
            try {
                bookRef.current.destroy();
            } catch (e) {
                console.warn('Error destroying book:', e);
            }
            bookRef.current = null;
        }

        const initBook = async () => {
            try {
                console.log('📖 Initializing EPUB...');

                // Create book instance
                const book = ePub(bookUrl);
                bookRef.current = book;

                // Wait for book to be ready
                await book.ready;
                console.log('✓ Book ready');

                if (!isMounted) return;

                // Create rendition with paginated flow to show chapters separately
                const rendition = book.renderTo(containerRef.current, {
                    width: '100%',
                    height: '100%',
                    spread: 'none',
                    flow: 'scrolled-doc',
                    manager: 'default',
                    allowScriptedContent: false
                });
                renditionRef.current = rendition;
                console.log('✓ Rendition created');

                // Hook to inject styles into each new section as it loads
                rendition.hooks.content.register((contents) => {
                    const doc = contents.document;
                    
                    // Get current settings
                    const theme = getTheme();
                    const font = getFont();
                    const fontSize = getFontSize();
                    const lineHeight = getLineHeight();
                    const textAlign = getTextAlign();
                    const textColor = getTextColor();
                    
                    // Inject comprehensive styles with uniform text color and no decorations
                    const style = doc.createElement('style');
                    style.id = 'book-theme-style';
                    style.textContent = `
                        * {
                            color: ${textColor.color} !important;
                            text-decoration: none !important;
                        }
                        html, body {
                            background-color: ${theme.background} !important;
                            color: ${textColor.color} !important;
                            font-family: ${font.family} !important;
                            font-size: ${fontSize.value}% !important;
                            line-height: ${lineHeight.value} !important;
                        }
                        body {
                            margin: 0 !important;
                            padding: 1em !important;
                        }
                        p, div, span, h1, h2, h3, h4, h5, h6, li, dt, dd, a, em, strong, b, i {
                            color: ${textColor.color} !important;
                            text-decoration: none !important;
                            font-family: ${font.family} !important;
                            font-size: ${fontSize.value}% !important;
                            line-height: ${lineHeight.value} !important;
                            text-align: ${textAlign.id} !important;
                        }
                        h1, h2, h3, h4, h5, h6 {
                            text-align: center !important;
                            font-size: ${fontSize.value * 1.8}% !important;
                            margin-top: 1.5em !important;
                            margin-bottom: 1.5em !important;
                        }
                        a {
                            color: ${textColor.color} !important;
                            text-decoration: none !important;
                        }
                        img {
                            max-width: 100% !important;
                            height: auto !important;
                        }
                        table {
                            width: 100% !important;
                            border-collapse: collapse !important;
                        }
                        td, th {
                            color: ${textColor.color} !important;
                        }
                    `;
                    doc.head.appendChild(style);
                });

                // Apply initial styles after display
                setTimeout(() => {
                    applyStyles();
                }, 100);

                // Display book content
                const displayed = initialLocation ? 
                    await rendition.display(initialLocation) : 
                    await rendition.display();
                
                console.log('✓ Book displayed');

                if (!isMounted) return;

                setIsLoading(false);

                // Notify ready
                if (onReady) {
                    onReady(book);
                }

                // Load TOC
                book.loaded.navigation.then((nav) => {
                    if (isMounted && onTocLoaded) {
                        console.log('✓ TOC loaded:', nav.toc.length, 'items');
                        onTocLoaded(nav.toc);
                    }
                }).catch((err) => {
                    console.warn('⚠ Error loading navigation:', err);
                });

                // Generate locations in background
                console.log('⏳ Generating locations...');
                book.locations.generate(1024).then(() => {
                    if (isMounted) {
                        locationsGeneratedRef.current = true;
                        console.log('✓ Locations generated:', book.locations.total);
                        
                        // Trigger location change to get initial progress
                        if (rendition.location) {
                            const loc = rendition.location.start;
                            if (loc && loc.cfi) {
                                const progress = book.locations.percentageFromCfi(loc.cfi) || 0;
                                if (onLocationChange) {
                                    onLocationChange({
                                        cfi: loc.cfi,
                                        percentage: progress * 100,
                                        displayed: loc.displayed
                                    });
                                }
                            }
                        }
                    }
                }).catch((err) => {
                    console.warn('⚠ Error generating locations:', err);
                });

                // Set up location change handler
                rendition.on('relocated', (location) => {
                    if (!location || !location.start) return;

                    let progress = 0;
                    if (locationsGeneratedRef.current && bookRef.current?.locations) {
                        try {
                            progress = bookRef.current.locations.percentageFromCfi(location.start.cfi) || 0;
                        } catch (e) {
                            console.warn('Error calculating progress:', e);
                        }
                    }

                    if (onLocationChange) {
                        onLocationChange({
                            cfi: location.start.cfi,
                            percentage: progress * 100,
                            displayed: location.start.displayed
                        });
                    }
                });

                // Handle rendering events for debugging
                rendition.on('rendered', (section) => {
                    console.log('✓ Section rendered:', section.href);
                });

            } catch (err) {
                console.error('❌ Error initializing book:', err);
                if (isMounted) {
                    setLoadError(err.message || 'Failed to load book');
                    setIsLoading(false);
                    if (onError) {
                        onError(err);
                    }
                }
            }
        };

        initBook();

        // Cleanup
        return () => {
            isMounted = false;
            if (renditionRef.current) {
                try {
                    renditionRef.current.destroy();
                } catch (e) {
                    console.warn('Cleanup: Error destroying rendition:', e);
                }
                renditionRef.current = null;
            }
            if (bookRef.current) {
                try {
                    bookRef.current.destroy();
                } catch (e) {
                    console.warn('Cleanup: Error destroying book:', e);
                }
                bookRef.current = null;
            }
        };
    }, [bookUrl, initialLocation]);

    // Apply styles when settings change
    useEffect(() => {
        applyStyles();
    }, [getTheme, getFont, getFontSize, getLineHeight, getTextAlign]);

    // Expose navigation methods via window object
    useEffect(() => {
        window.__epubReader = {
            nextPage: () => {
                if (renditionRef.current) {
                    renditionRef.current.next();
                }
            },
            prevPage: () => {
                if (renditionRef.current) {
                    renditionRef.current.prev();
                }
            },
            goToLocation: (cfi) => {
                if (renditionRef.current && cfi) {
                    renditionRef.current.display(cfi);
                }
            },
            goToPercentage: (percentage) => {
                if (!locationsGeneratedRef.current || !bookRef.current?.locations) {
                    console.warn('⚠ Locations not yet generated');
                    return;
                }
                try {
                    const cfi = bookRef.current.locations.cfiFromPercentage(percentage / 100);
                    if (cfi && renditionRef.current) {
                        renditionRef.current.display(cfi);
                    }
                } catch (e) {
                    console.warn('Error navigating to percentage:', e);
                }
            },
            getRendition: () => renditionRef.current,
            getBook: () => bookRef.current
        };

        return () => {
            delete window.__epubReader;
        };
    });

    const theme = getTheme();

    return (
        <div className="relative w-full h-full">
            {isLoading && !loadError && (
                <div className="absolute inset-0 flex items-center justify-center bg-white dark:bg-gray-900 z-10">
                    <div className="flex flex-col items-center">
                        <div className="h-10 w-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mb-4" />
                        <p className="text-gray-500 dark:text-gray-400">Loading book...</p>
                    </div>
                </div>
            )}
            {loadError && (
                <div className="absolute inset-0 flex items-center justify-center bg-white dark:bg-gray-900 z-10">
                    <div className="flex flex-col items-center text-center p-4">
                        <p className="text-red-500 mb-2">Error loading book</p>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">{loadError}</p>
                    </div>
                </div>
            )}
            <div
                ref={containerRef}
                className="epub-container w-full h-full"
                style={{
                    backgroundColor: theme.background
                }}
            />
        </div>
    );
}
