import { X, Sun, Moon, Sunset, Type, AlignLeft, AlignJustify, Minus, Plus } from 'lucide-react';
import { useReader } from '../../contexts/ReaderContext';
import { THEMES, FONTS, FONT_SIZES, LINE_HEIGHTS, TEXT_ALIGN, TEXT_COLORS } from '../../utils/constants';

export default function SettingsPanel({ isOpen, onClose }) {
    const { settings, updateSetting } = useReader();

    if (!isOpen) return null;

    const themeIcons = {
        light: Sun,
        sepia: Sunset,
        dark: Moon
    };

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/20 z-30"
                onClick={onClose}
            />

            {/* Panel */}
            <div className="fixed inset-x-4 bottom-4 sm:inset-auto sm:right-4 sm:bottom-20 sm:w-80 z-40 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 animate-slide-up overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        Reading Settings
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        aria-label="Close settings"
                    >
                        <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                    </button>
                </div>

                {/* Settings */}
                <div className="p-4 space-y-6 max-h-[60vh] overflow-y-auto">
                    {/* Theme */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                            Theme
                        </label>
                        <div className="flex gap-2 justify-center">
                            {Object.entries(THEMES).map(([key, theme]) => {
                                const Icon = themeIcons[key];
                                const isActive = settings.theme === key;

                                return (
                                    <button
                                        key={key}
                                        onClick={() => updateSetting('theme', key)}
                                        className={`
                      flex-1 flex flex-col items-center gap-2 py-3 px-4 rounded-lg border-2 transition-all
                      ${isActive
                                                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                            }
                    `}
                                        style={{ backgroundColor: isActive ? undefined : theme.background }}
                                    >
                                        <Icon className={`h-5 w-5 ${isActive ? 'text-primary-500' : 'text-gray-600'}`} />
                                        <span className={`text-xs font-medium ${isActive ? 'text-primary-500' : ''}`} style={{ color: isActive ? undefined : theme.text }}>
                                            {theme.name}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Font Family */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                            Font
                        </label>
                        <div className="flex gap-2 justify-center">
                            {Object.entries(FONTS).map(([key, font]) => {
                                const isActive = settings.font === key;

                                return (
                                    <button
                                        key={key}
                                        onClick={() => updateSetting('font', key)}
                                        className={`
                      flex-1 py-2 px-3 rounded-lg border-2 transition-all text-sm
                      ${isActive
                                                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-600'
                                                : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'
                                            }
                    `}
                                        style={{ fontFamily: font.family }}
                                    >
                                        {font.name}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Font Size */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                            Font Size
                        </label>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => {
                                    const sizes = Object.keys(FONT_SIZES);
                                    const currentIdx = sizes.indexOf(settings.fontSize);
                                    if (currentIdx > 0) {
                                        updateSetting('fontSize', sizes[currentIdx - 1]);
                                    }
                                }}
                                className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                disabled={settings.fontSize === 'small'}
                            >
                                <Minus className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                            </button>
                            <div className="flex-1 flex justify-center gap-1">
                                {Object.entries(FONT_SIZES).map(([key, size]) => {
                                    const isActive = settings.fontSize === key;
                                    return (
                                        <button
                                            key={key}
                                            onClick={() => updateSetting('fontSize', key)}
                                            className={`
                        w-8 h-8 rounded-full text-xs font-medium transition-all
                        ${isActive
                                                    ? 'bg-primary-500 text-white'
                                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                                                }
                      `}
                                        >
                                            {size.name.charAt(0)}
                                        </button>
                                    );
                                })}
                            </div>
                            <button
                                onClick={() => {
                                    const sizes = Object.keys(FONT_SIZES);
                                    const currentIdx = sizes.indexOf(settings.fontSize);
                                    if (currentIdx < sizes.length - 1) {
                                        updateSetting('fontSize', sizes[currentIdx + 1]);
                                    }
                                }}
                                className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                disabled={settings.fontSize === 'xlarge'}
                            >
                                <Plus className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                            </button>
                        </div>
                        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-2">
                            {FONT_SIZES[settings.fontSize]?.name}
                        </p>
                    </div>

                    {/* Line Height */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                            Line Spacing
                        </label>
                        <div className="flex gap-2 justify-center">
                            {Object.entries(LINE_HEIGHTS).map(([key, lineHeight]) => {
                                const isActive = settings.lineHeight === key;

                                return (
                                    <button
                                        key={key}
                                        onClick={() => updateSetting('lineHeight', key)}
                                        className={`
                      flex-1 py-2 px-3 rounded-lg border-2 transition-all text-sm
                      ${isActive
                                                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-600'
                                                : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'
                                            }
                    `}
                                    >
                                        {lineHeight.name}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Text Alignment */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                            Text Alignment
                        </label>
                        <div className="flex gap-2 justify-center">
                            {Object.entries(TEXT_ALIGN).map(([key, align]) => {
                                const isActive = settings.textAlign === key;
                                const Icon = key === 'left' ? AlignLeft : AlignJustify;

                                return (
                                    <button
                                        key={key}
                                        onClick={() => updateSetting('textAlign', key)}
                                        className={`
                      flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg border-2 transition-all
                      ${isActive
                                                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                            }
                    `}
                                    >
                                        <Icon className={`h-4 w-4 ${isActive ? 'text-primary-500' : 'text-gray-600 dark:text-gray-400'}`} />
                                        <span className={`text-sm ${isActive ? 'text-primary-600' : 'text-gray-600 dark:text-gray-400'}`}>
                                            {align.name}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Text Color */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                            Text Color
                        </label>
                        <div className="flex gap-2 flex-wrap justify-center">
                            {Object.entries(TEXT_COLORS).map(([key, color]) => {
                                const isActive = settings.textColor === key;

                                return (
                                    <button
                                        key={key}
                                        onClick={() => updateSetting('textColor', key)}
                                        className={`
                      w-12 h-10 rounded-lg border-2 transition-all flex items-center justify-center
                      ${isActive
                                                ? 'border-primary-500'
                                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                            }
                    `}
                                        style={{ backgroundColor: color.color }}
                                        title={color.name}
                                    >
                                        {isActive && (
                                            <span className="text-white text-xs font-bold">✓</span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
