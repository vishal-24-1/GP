import { useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';

// --- Interfaces for Type Safety ---

/**
 * Defines the shape of the files state managed by the hook.
 * Each property can hold a File object or be null.
 */
interface UploadFilesState {
  questionPaper: File | null; // Added
  answerKey: File | null;
  responseSheets: File[];
}

// --- useFileUpload Custom Hook ---

/**
 * A custom React hook for managing file uploads, including state for selected files
 * and an asynchronous handler for the upload process.
 *
 * @returns An object containing:
 * - `files`: The current state of selected files (questionPaper, answerKey, responseSheets).
 * - `setFiles`: A function to update the files state.
 * - `isUploading`: A boolean indicating if an upload operation is currently in progress.
 * - `handleUpload`: An asynchronous function to initiate the file upload.
 */
export const useFileUpload = (onStatusUpdate?: (status: { [key: string]: 'idle' | 'uploading' | 'uploaded' | 'error' }) => void) => {
  // State to manage the selected files for upload
  const [files, setFiles] = useState<UploadFilesState>({
    questionPaper: null, // Added
    answerKey: null,
    responseSheets: [],
  });

  // State to track the upload status
  const [isUploading, setIsUploading] = useState<boolean>(false);

  // useCallback hook to handle the file upload process
  const handleUpload = useCallback(async (): Promise<boolean> => {
    setIsUploading(true);
    let status: { [key: string]: 'idle' | 'uploading' | 'uploaded' | 'error' } = {};
    try {
      // Gather all files (answerKey, responseSheets, questionPaper if present)
      if (files.answerKey) status['answerKey'] = 'uploading';
      if (files.responseSheets && files.responseSheets.length > 0) status['responseSheets'] = 'uploading';
      if (files.questionPaper) status['questionPaper'] = 'uploading'; // Added
      onStatusUpdate?.(status);
      // MOCK: Simulate upload delay and always succeed
      await new Promise((resolve) => setTimeout(resolve, 1200));
      // Mark that a mock upload happened so fetchTests can add a new test
      (window as any).__mockUpload = true;
      if (files.answerKey) status['answerKey'] = 'uploaded';
      if (files.responseSheets && files.responseSheets.length > 0) status['responseSheets'] = 'uploaded';
      if (files.questionPaper) status['questionPaper'] = 'uploaded'; // Added
      onStatusUpdate?.(status);
      toast.success('Files uploaded successfully! (mocked)');
      // When resetting files after upload
      setFiles({ questionPaper: null, answerKey: null, responseSheets: [] });
      return true;
    } catch (error) {
      if (files.answerKey) status['answerKey'] = 'error';
      if (files.responseSheets && files.responseSheets.length > 0) status['responseSheets'] = 'error';
      if (files.questionPaper) status['questionPaper'] = 'error'; // Added
      onStatusUpdate?.(status);
      toast.error('Upload failed.');
      return false;
    } finally {
      setIsUploading(false);
    }
  }, [files, onStatusUpdate]); // Re-create the function if 'files' or 'onStatusUpdate' changes

  // Return the state and the upload handler function
  return { files, setFiles, isUploading, handleUpload };
};