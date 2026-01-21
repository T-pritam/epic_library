import { useRef, useState } from 'react';
import { Upload, FileText, X, Loader2, AlertCircle } from 'lucide-react';
import Modal from '../common/Modal';
import { validateEpub, extractMetadata, formatFileSize, getCoverBlob } from '../../utils/epubParser';
import { uploadEpub, uploadCover, generateFileName } from '../../utils/storageHelper';
import { useAuth } from '../../contexts/AuthContext';
import { useLibrary } from '../../contexts/LibraryContext';

export default function UploadButton({ onSuccess }) {
    const { user } = useAuth();
    const { addBook } = useLibrary();
    const fileInputRef = useRef(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [metadata, setMetadata] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isExtracting, setIsExtracting] = useState(false);
    const [error, setError] = useState(null);

    const handleClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileSelect = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Reset state
        setError(null);
        setMetadata(null);
        setSelectedFile(null);

        // Validate file
        const validation = validateEpub(file);
        if (!validation.valid) {
            setError(validation.errors.join('. '));
            return;
        }

        setSelectedFile(file);
        setIsModalOpen(true);
        setIsExtracting(true);

        try {
            const meta = await extractMetadata(file);
            setMetadata(meta);
        } catch (err) {
            console.error('Error extracting metadata:', err);
            setMetadata({
                title: file.name.replace(/\.epub$/i, ''),
                author: 'Unknown Author',
                cover: null,
                fileSize: file.size
            });
        } finally {
            setIsExtracting(false);
        }

        // Reset file input
        e.target.value = '';
    };

    const handleUpload = async () => {
        if (!selectedFile || !user) return;

        setIsUploading(true);
        setError(null);

        try {
            // Generate unique filename
            const fileName = generateFileName(selectedFile.name);

            // Upload EPUB file
            const filePath = await uploadEpub(user.id, selectedFile, fileName);

            // Upload cover if available
            let coverUrl = null;
            try {
                const coverBlob = await getCoverBlob(selectedFile);
                if (coverBlob) {
                    // We'll use the file path as book ID placeholder
                    coverUrl = metadata?.cover || null;
                }
            } catch {
                // Cover upload failed, continue without it
            }

            // Add book to database
            const bookData = {
                title: metadata?.title || selectedFile.name.replace(/\.epub$/i, ''),
                author: metadata?.author || 'Unknown Author',
                file_path: filePath,
                file_size: selectedFile.size,
                cover_url: coverUrl,
                total_pages: metadata?.totalPages || 0
            };

            const newBook = await addBook(bookData);

            // Upload cover with actual book ID if we have the cover blob
            if (newBook && !coverUrl) {
                try {
                    const coverBlob = await getCoverBlob(selectedFile);
                    if (coverBlob) {
                        coverUrl = await uploadCover(user.id, newBook.id, coverBlob);
                        // We could update the book with the cover URL here
                    }
                } catch {
                    // Cover upload failed, continue
                }
            }

            setIsModalOpen(false);
            setSelectedFile(null);
            setMetadata(null);
            onSuccess?.();
        } catch (err) {
            console.error('Upload error:', err);
            setError(err.message || 'Failed to upload book. Please try again.');
        } finally {
            setIsUploading(false);
        }
    };

    const handleClose = () => {
        if (isUploading) return;
        setIsModalOpen(false);
        setSelectedFile(null);
        setMetadata(null);
        setError(null);
    };

    return (
        <>
            <input
                ref={fileInputRef}
                type="file"
                accept=".epub"
                onChange={handleFileSelect}
                className="hidden"
            />

            <button
                onClick={handleClick}
                className="flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition-colors focus-ring"
            >
                <Upload className="h-5 w-5" />
                <span>Upload</span>
            </button>

            <Modal
                isOpen={isModalOpen}
                onClose={handleClose}
                title="Upload Book"
                size="medium"
            >
                {error && (
                    <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                    </div>
                )}

                {isExtracting ? (
                    <div className="py-8 flex flex-col items-center">
                        <Loader2 className="h-8 w-8 text-primary-500 animate-spin mb-4" />
                        <p className="text-gray-600 dark:text-gray-400">Extracting book information...</p>
                    </div>
                ) : selectedFile && (
                    <div className="space-y-6">
                        {/* Book Preview */}
                        <div className="flex gap-4">
                            {/* Cover */}
                            <div className="flex-shrink-0 w-24 h-36 rounded-lg overflow-hidden bg-gradient-to-br from-primary-100 to-accent-100 dark:from-primary-900 dark:to-accent-900">
                                {metadata?.cover ? (
                                    <img
                                        src={metadata.cover}
                                        alt="Book cover"
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <FileText className="h-10 w-10 text-primary-300 dark:text-primary-600" />
                                    </div>
                                )}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 line-clamp-2">
                                    {metadata?.title || selectedFile.name}
                                </h3>
                                <p className="text-gray-500 dark:text-gray-400 mt-1">
                                    {metadata?.author || 'Unknown Author'}
                                </p>
                                <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                                    {formatFileSize(selectedFile.size)}
                                </p>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3 justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
                            <button
                                onClick={handleClose}
                                disabled={isUploading}
                                className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors font-medium disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleUpload}
                                disabled={isUploading}
                                className="flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                            >
                                {isUploading ? (
                                    <>
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                        <span>Uploading...</span>
                                    </>
                                ) : (
                                    <>
                                        <Upload className="h-5 w-5" />
                                        <span>Upload</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </>
    );
}
