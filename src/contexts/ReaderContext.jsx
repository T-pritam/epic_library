import { createContext, useContext, useState, useEffect } from 'react';
import { DEFAULT_READER_SETTINGS, THEMES, FONTS, FONT_SIZES, LINE_HEIGHTS, TEXT_ALIGN, TEXT_COLORS } from '../utils/constants';

const SETTINGS_KEY = 'reader_settings';

const ReaderContext = createContext(null);

function loadSettings() {
    try {
        const saved = localStorage.getItem(SETTINGS_KEY);
        if (saved) {
            return { ...DEFAULT_READER_SETTINGS, ...JSON.parse(saved) };
        }
    } catch {
        // Ignore
    }
    return DEFAULT_READER_SETTINGS;
}

function saveSettings(settings) {
    try {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch {
        // Ignore
    }
}

export function ReaderProvider({ children }) {
    const [settings, setSettings] = useState(loadSettings);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isTocOpen, setIsTocOpen] = useState(false);
    const [isBookmarkPanelOpen, setIsBookmarkPanelOpen] = useState(false);
    const [isSettingsPanelOpen, setIsSettingsPanelOpen] = useState(false);
    const [currentBook, setCurrentBook] = useState(null);
    const [currentLocation, setCurrentLocation] = useState(null);

    // Save settings when they change
    useEffect(() => {
        saveSettings(settings);
    }, [settings]);

    // Handle fullscreen changes
    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    const updateSetting = (key, value) => {
        setSettings(prev => ({
            ...prev,
            [key]: value
        }));
    };

    const toggleFullscreen = async () => {
        try {
            if (!document.fullscreenElement) {
                await document.documentElement.requestFullscreen();
            } else {
                await document.exitFullscreen();
            }
        } catch (err) {
            console.error('Fullscreen error:', err);
        }
    };

    const getTheme = () => THEMES[settings.theme] || THEMES.light;
    const getFont = () => FONTS[settings.font] || FONTS.serif;
    const getFontSize = () => FONT_SIZES[settings.fontSize] || FONT_SIZES.medium;
    const getLineHeight = () => LINE_HEIGHTS[settings.lineHeight] || LINE_HEIGHTS.relaxed;
    const getTextAlign = () => TEXT_ALIGN[settings.textAlign] || TEXT_ALIGN.justify;
    const getTextColor = () => TEXT_COLORS[settings.textColor] || TEXT_COLORS.dark;

    const value = {
        settings,
        updateSetting,
        isFullscreen,
        setIsFullscreen,
        toggleFullscreen,
        isTocOpen,
        setIsTocOpen,
        isBookmarkPanelOpen,
        setIsBookmarkPanelOpen,
        isSettingsPanelOpen,
        setIsSettingsPanelOpen,
        currentBook,
        setCurrentBook,
        currentLocation,
        setCurrentLocation,
        getTheme,
        getFont,
        getFontSize,
        getLineHeight,
        getTextAlign,
        getTextColor
    };

    return (
        <ReaderContext.Provider value={value}>
            {children}
        </ReaderContext.Provider>
    );
}

export function useReader() {
    const context = useContext(ReaderContext);
    if (!context) {
        throw new Error('useReader must be used within a ReaderProvider');
    }
    return context;
}

export default ReaderContext;
