import { useEffect, useRef } from 'react';
import { X, Volume2, Loader2 } from 'lucide-react';

export default function DictionaryTooltip({
    isOpen,
    onClose,
    word,
    definition,
    loading,
    error,
    position = { x: 0, y: 0 }
}) {
    const tooltipRef = useRef(null);

    // Adjust position to keep tooltip in viewport
    useEffect(() => {
        if (!tooltipRef.current || !isOpen) return;

        const tooltip = tooltipRef.current;
        const rect = tooltip.getBoundingClientRect();
        const viewport = {
            width: window.innerWidth,
            height: window.innerHeight
        };

        // Adjust horizontal position
        if (rect.right > viewport.width - 20) {
            tooltip.style.left = `${viewport.width - rect.width - 20}px`;
        }
        if (rect.left < 20) {
            tooltip.style.left = '20px';
        }

        // Adjust vertical position
        if (rect.bottom > viewport.height - 20) {
            tooltip.style.top = `${position.y - rect.height - 10}px`;
        }
    }, [isOpen, position]);

    if (!isOpen) return null;

    const playAudio = () => {
        if (definition?.audio) {
            const audio = new Audio(definition.audio);
            audio.play().catch(console.error);
        }
    };

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 z-40"
                onClick={onClose}
            />

            {/* Tooltip */}
            <div
                ref={tooltipRef}
                className="fixed z-50 w-80 max-w-[90vw] bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 animate-fade-in overflow-hidden"
                style={{
                    left: `${position.x}px`,
                    top: `${position.y + 10}px`
                }}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                            {word}
                        </h3>
                        {definition?.phonetic && (
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                                {definition.phonetic}
                            </span>
                        )}
                        {definition?.audio && (
                            <button
                                onClick={playAudio}
                                className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                aria-label="Play pronunciation"
                            >
                                <Volume2 className="h-4 w-4 text-primary-500" />
                            </button>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        aria-label="Close"
                    >
                        <X className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 max-h-64 overflow-y-auto">
                    {loading && (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-6 w-6 text-primary-500 animate-spin" />
                        </div>
                    )}

                    {error && !loading && (
                        <div className="text-center py-4">
                            <p className="text-gray-500 dark:text-gray-400">{error}</p>
                        </div>
                    )}

                    {definition && !loading && (
                        <div className="space-y-4">
                            {definition.meanings.map((meaning, idx) => (
                                <div key={idx}>
                                    <span className="inline-block px-2 py-0.5 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 text-xs font-medium rounded">
                                        {meaning.partOfSpeech}
                                    </span>
                                    <ol className="mt-2 space-y-2">
                                        {meaning.definitions.map((def, defIdx) => (
                                            <li key={defIdx} className="text-sm">
                                                <p className="text-gray-700 dark:text-gray-300">
                                                    <span className="text-gray-400 dark:text-gray-500 mr-1">
                                                        {defIdx + 1}.
                                                    </span>
                                                    {def.definition}
                                                </p>
                                                {def.example && (
                                                    <p className="mt-1 text-gray-500 dark:text-gray-400 italic text-xs">
                                                        "{def.example}"
                                                    </p>
                                                )}
                                            </li>
                                        ))}
                                    </ol>

                                    {meaning.synonyms?.length > 0 && (
                                        <div className="mt-2">
                                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                                Synonyms:{' '}
                                            </span>
                                            <span className="text-xs text-gray-600 dark:text-gray-300">
                                                {meaning.synonyms.join(', ')}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
