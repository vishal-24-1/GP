import React, { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  File as FileIconBase,
  UploadSimple,
  Trash,
  CheckCircle,
  XCircle,
  ArrowClockwise,
  FilePdf,
  FileCsv,
  Question,
} from '@phosphor-icons/react';
import type { IconProps } from '@phosphor-icons/react';
import { toast } from 'react-hot-toast';

/**
 * Props for the DropZone component.
 */
interface DropZoneProps {
  label?: string; // Optional label for the file type (e.g., "PDF document")
  file: File | null; // The currently selected file, or null if none
  setFile: React.Dispatch<React.SetStateAction<File | null>>; // Function to update the file state
  icon: React.ElementType<IconProps>; // The default icon component to display when no file is selected
  accept: string; // Accepted file types (e.g., ".pdf", ".csv")
  disabled?: boolean; // Whether the drop zone is disabled
  onFileValidation?: (file: File) => void; // Callback after successful file validation
}

/**
 * Reusable DropZone component for file uploads with drag and drop, validation, and feedback.
 */
const DropZone: React.FC<DropZoneProps> = ({
  label,
  file,
  setFile,
  icon: DefaultIcon,
  accept,
  disabled = false,
  onFileValidation,
}) => {
  // State to manage drag and drop visual cues and validation status
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [dragTimeout, setDragTimeout] = useState<NodeJS.Timeout | null>(null);
  // Ref for the hidden file input element
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Function to determine the appropriate file icon based on the filename extension
  const getFileIcon = useCallback((filename: string): React.ElementType<IconProps> => {
    if (filename.endsWith('.pdf')) return FilePdf;
    if (filename.endsWith('.csv')) return FileCsv;
    return FileIconBase; // Use the renamed base File icon
  }, []);

  // Dynamically determine which icon to display (user-provided or file-specific)
  const FileIcon = file ? getFileIcon(file.name) : DefaultIcon;

  // Asynchronous function to handle file validation and update state
  const handleFileValidation = useCallback(
    async (selectedFile: File): Promise<void> => {
      setIsValidating(true);
      try {
        setFile(selectedFile);
        onFileValidation?.(selectedFile); // Call optional callback
        toast.success('File uploaded!', {
          icon: <CheckCircle weight="fill" size={20} className="text-blue-500" />,
          duration: 2000,
        });
      } catch (error: any) {
        // No error thrown in original logic, but kept for consistency
        toast.error('File upload failed!', {
          icon: <XCircle weight="fill" size={20} className="text-red-500" />,
          duration: 2000,
        });
      } finally {
        setIsValidating(false);
      }
    },
    [setFile, onFileValidation]
  );

  // Handles the drag enter event to visually indicate the drop zone is active
  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    if (disabled) return;
    if (dragTimeout) clearTimeout(dragTimeout);
    setIsDragging(true);
  };

  // Handles the drag leave event, with a slight delay to prevent visual flickering
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    const timeout = setTimeout(() => setIsDragging(false), 100);
    setDragTimeout(timeout);
  };

  // Handles the drop event, preventing default behavior and processing the dropped file
  const handleDrop = (e: React.DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    if (dragTimeout) clearTimeout(dragTimeout);
    setIsDragging(false);

    if (disabled) {
      toast.error('File upload is currently disabled', {
        icon: <XCircle weight="fill" size={20} className="text-red-500" />,
      });
      return;
    }

    if (e.dataTransfer.files?.[0]) {
      handleFileValidation(e.dataTransfer.files[0]);
    }
  };

  // Programmatically triggers the hidden file input's click event
  const handleClick = (): void => {
    if (disabled) {
      toast.error('File upload is currently disabled', {
        icon: <XCircle weight="fill" size={20} className="text-red-500" />,
      });
      return;
    }
    fileInputRef.current?.click();
  };

  // Handles the removal of the currently selected file
  const handleRemoveFile = (e: React.MouseEvent<HTMLButtonElement>): void => {
    e.stopPropagation(); // Prevent triggering the parent onClick (which opens file dialog)
    setFile(null);
    toast.success('File removed', {
      icon: <CheckCircle weight="fill" size={20} className="text-blue-500" />,
    });
  };

  // Returns a user-friendly label for the accepted file types
  const getAcceptLabel = (): string => {
    if (accept === '.pdf') return 'PDF documents';
    if (accept === '.csv') return 'CSV spreadsheets';
    return accept.toUpperCase(); // Fallback for other types
  };

  // Drop zone area: darken background, strong contrast text/icons
  const dropZoneClass = `w-full mx-auto border-2 rounded-xl cursor-pointer transition-all duration-300 flex flex-col items-center justify-center p-6 min-h-[220px] 
    ${isDragging ? 'border-dashed border-blue-500 bg-blue-100 shadow-lg transform scale-[1.01]' : file ? 'border-solid border-blue-300 hover:border-blue-400 hover:shadow bg-blue-50' : 'border-dashed border-blue-300 hover:border-blue-400 hover:shadow bg-blue-50'}
    ${disabled ? 'opacity-70 cursor-not-allowed bg-gray-100 border-gray-200 text-gray-500' : ''}`;

  return (
    <div className="w-full">
      <motion.div
        onDrop={handleDrop}
        onDragOver={(e: React.DragEvent<HTMLDivElement>) => {
          e.preventDefault();
          handleDragEnter(e);
        }}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onClick={handleClick}
        className={dropZoneClass}
        aria-label={file ? `Selected file: ${file.name}` : `Upload ${label?.toLowerCase() || 'file'}`}
        role="button"
        tabIndex={0}
        onKeyDown={(e: React.KeyboardEvent<HTMLDivElement>) => {
          if (e.key === 'Enter' || e.key === ' ') {
            handleClick();
          }
        }}
        initial={{ opacity: 0.9, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={!disabled ? { scale: 1.005 } : {}}
        transition={{ duration: 0.2 }}
      >
        {file ? (
          <div className="flex flex-col items-center justify-center w-full p-2">
            <motion.div
              className="p-3 rounded-full bg-blue-100 text-blue-700 mb-3 border border-blue-200"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', damping: 10, stiffness: 200 }}
            >
              {/* Always use FileCsv for CSV, with strong blue contrast */}
              {file && file.name.endsWith('.csv') ? (
                <FileCsv size={32} weight="fill" className="text-blue-700" />
              ) : (
                <FileIcon size={28} weight="fill" className="text-blue-700" />
              )}
            </motion.div>

            <div className="flex items-center justify-center space-x-2 w-full max-w-full mb-1">
              <p className=" text-center break-all line-clamp-1 text-blue-800">{file.name}</p>
            </div>
            <div className="flex items-center text-xs gap-2 mb-4">
              <span className="px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                {((file.size) / (1024 * 1024)).toFixed(2)} MB
              </span>
              <span className="px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                {file.name.split('.').pop()?.toUpperCase() || 'UNKNOWN'}
              </span>
            </div>

            {!disabled && (
              <div className="flex gap-2">
                <button
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 flex items-center"
                  onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                >
                  <ArrowClockwise size={16} className="mr-1" /> Replace
                </button>

                <button
                  onClick={handleRemoveFile}
                  className="px-4 py-2 text-sm font-medium text-red-700 bg-red-100 border border-red-200 rounded-md hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 flex items-center"
                  title="Remove file"
                  disabled={isValidating}
                  aria-label="Remove file"
                >
                  <Trash size={16} className="mr-1" /> Remove
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center p-3">
            {isValidating ? (
              <motion.div
                className="flex flex-col items-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <span className="loading loading-spinner loading-md text-blue-500 mb-3"></span>
                <p className="text-sm font-medium text-blue-800">Validating file...</p>
                <p className="text-xs text-blue-600 mt-1">Please wait while we check your file</p>
              </motion.div>
            ) : (
              <>
                <motion.div
                  className={`p-4 rounded-full ${isDragging ? 'bg-blue-200' : 'bg-blue-100'}`}
                  animate={{
                    scale: isDragging ? 1.1 : 1,
                  }}
                  transition={{ duration: 0.2 }}
                >
                  <UploadSimple
                    size={40}
                    weight={isDragging ? 'fill' : 'regular'}
                    className={`${isDragging ? 'text-blue-600' : 'text-blue-500'}`}
                  />
                </motion.div>

                <motion.p
                  className="text-md  text-blue-900 mt-4 mb-1"
                  animate={{ scale: isDragging ? 1.05 : 1 }}
                >
                  {isDragging ? 'Drop to upload' : disabled ? 'Upload disabled' : `Drag & drop your ${label?.toLowerCase() || 'file'}`}
                </motion.p>
                {!isDragging && (
                  <p className="text-sm text-blue-700 mb-3">
                    or <span className="text-blue-600 underline cursor-pointer">browse files</span>
                  </p>
                )}
                {!isDragging && (
                  <>
                    <div className="flex items-center text-xs text-blue-600 gap-1 mt-2">
                      <span className="px-2 py-1 rounded-full bg-blue-100 flex items-center gap-1">
                        <DefaultIcon size={12} className="text-blue-500" /> {getAcceptLabel()}
                      </span>
                      <span className="px-2 py-1 rounded-full bg-blue-100">Max 50MB</span>
                      <div className="relative group">
                        <Question size={14} className="text-blue-400 cursor-help" />
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 p-2 bg-blue-50 text-xs text-left rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none border border-blue-200 z-10 text-blue-700">
                          Only files matching the required format will be accepted. Make sure your file is properly
                          formatted.
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        )}

        {/* Visual cue for drag and drop */}
        {isDragging && !disabled && (
          <motion.div
            className="absolute inset-0 border-2 border-dashed border-blue-500 rounded-xl pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
        )}
      </motion.div>

      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept={accept}
        disabled={disabled || isValidating}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
          const selectedFile = e.target.files?.[0];
          if (selectedFile) {
            handleFileValidation(selectedFile);
          }
          e.target.value = ''; // Reset input to allow re-uploading same file
        }}
        aria-hidden="true"
      />
    </div>
  );
};

export default React.memo(DropZone);