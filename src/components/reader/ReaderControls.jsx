import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function ReaderControls({
    currentPercentage = 0,
    currentPage,
    totalPages,
    onPrevPage,
    onNextPage,
    onProgressChange,
    className = ''
}) {
    const handleSliderChange = (e) => {
        const percentage = parseFloat(e.target.value);
        onProgressChange?.(percentage);
    };

    return (
        <div className={`flex items-center gap-4 ${className}`}>
            {/* Previous Button */}
            <button
                onClick={onPrevPage}
                className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors focus-ring"
                aria-label="Previous page"
            >
                <ChevronLeft className="h-6 w-6 text-gray-600 dark:text-gray-400" />
            </button>

            {/* Progress Section */}
            <div className="flex-1 flex items-center gap-4">
                {/* Progress Slider */}
                <div className="flex-1 relative">
                    <input
                        type="range"
                        min="0"
                        max="100"
                        step="0.1"
                        value={currentPercentage}
                        onChange={handleSliderChange}
                        className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary-500"
                        style={{
                            background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${currentPercentage}%, #e5e7eb ${currentPercentage}%, #e5e7eb 100%)`
                        }}
                    />
                </div>

                {/* Progress Info */}
                <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400 min-w-fit">
                    <span className="font-medium">
                        {Math.round(currentPercentage)}%
                    </span>
                    {currentPage !== undefined && totalPages !== undefined && totalPages > 0 && (
                        <span className="hidden sm:inline">
                            Page {currentPage} / {totalPages}
                        </span>
                    )}
                </div>
            </div>

            {/* Next Button */}
            <button
                onClick={onNextPage}
                className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors focus-ring"
                aria-label="Next page"
            >
                <ChevronRight className="h-6 w-6 text-gray-600 dark:text-gray-400" />
            </button>
        </div>
    );
}
