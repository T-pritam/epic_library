// Font colors for text
export const TEXT_COLORS = {
    dark: {
        id: 'dark',
        name: 'Dark',
        color: '#1f2937'
    },
    black: {
        id: 'black',
        name: 'Black',
        color: '#000000'
    },
    brown: {
        id: 'brown',
        name: 'Brown',
        color: '#92400e'
    },
    gray: {
        id: 'gray',
        name: 'Gray',
        color: '#4b5563'
    },
    white: {
        id: 'white',
        name: 'White',
        color: '#ddd'
    }

};

// Reading themes
export const THEMES = {
    light: {
        id: 'light',
        name: 'Light',
        background: '#ffffff',
        text: '#1f2937'
    },
    sepia: {
        id: 'sepia',
        name: 'Sepia',
        background: '#f4ecd8',
        text: '#5c4b37'
    },
    dark: {
        id: 'dark',
        name: 'Dark',
        background: '#1f2937',
        text: '#f9fafb'
    }
};

// Font families
export const FONTS = {
    serif: {
        id: 'serif',
        name: 'Serif',
        family: 'Georgia, Cambria, "Times New Roman", serif'
    },
    sans: {
        id: 'sans',
        name: 'Sans-serif',
        family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    },
    mono: {
        id: 'mono',
        name: 'Monospace',
        family: '"Courier New", Courier, monospace'
    }
};

// Font sizes
export const FONT_SIZES = {
    small: {
        id: 'small',
        name: 'Small',
        size: '14px',
        value: 90
    },
    medium: {
        id: 'medium',
        name: 'Medium',
        size: '18px',
        value: 100
    },
    large: {
        id: 'large',
        name: 'Large',
        size: '22px',
        value: 120
    },
    xlarge: {
        id: 'xlarge',
        name: 'Extra Large',
        size: '26px',
        value: 140
    }
};

// Line heights
export const LINE_HEIGHTS = {
    normal: {
        id: 'normal',
        name: 'Normal',
        value: 1.5
    },
    relaxed: {
        id: 'relaxed',
        name: 'Relaxed',
        value: 1.75
    },
    loose: {
        id: 'loose',
        name: 'Loose',
        value: 2
    }
};

// Text alignment
export const TEXT_ALIGN = {
    left: {
        id: 'left',
        name: 'Left'
    },
    justify: {
        id: 'justify',
        name: 'Justify'
    }
};

// Reading statuses
export const READING_STATUS = {
    not_started: {
        id: 'not_started',
        name: 'Not Started',
        color: 'gray'
    },
    reading: {
        id: 'reading',
        name: 'Reading',
        color: 'blue'
    },
    completed: {
        id: 'completed',
        name: 'Completed',
        color: 'green'
    }
};

// Maximum file size (50MB)
export const MAX_FILE_SIZE = parseInt(import.meta.env.VITE_MAX_FILE_SIZE) || 52428800;

// App name
export const APP_NAME = import.meta.env.VITE_APP_NAME || 'Epic eBook Library';

// Default reader settings
export const DEFAULT_READER_SETTINGS = {
    theme: 'light',
    font: 'serif',
    fontSize: 'medium',
    lineHeight: 'relaxed',
    textAlign: 'justify',
    textColor: 'dark'
};

// Keyboard shortcuts
export const KEYBOARD_SHORTCUTS = {
    nextPage: ['ArrowRight', 'Space'],
    prevPage: ['ArrowLeft'],
    toggleToc: ['t', 'T'],
    toggleFullscreen: ['f', 'F', 'F11'],
    toggleBookmark: ['b', 'B'],
    toggleSettings: ['s', 'S'],
    escape: ['Escape']
};

// Progress auto-save interval (ms)
export const PROGRESS_SAVE_INTERVAL = 5000;
