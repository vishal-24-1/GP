import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Key,
  File as FileIconBase, // Renamed to avoid conflict with 'File' type
  X,
  Spinner,
  ArrowLeft,
  ArrowRight,
  CheckCircle,
} from '@phosphor-icons/react';
import type { IconProps } from '@phosphor-icons/react'; // Import IconProps as type-only
import DropZone from '../../pages/upload/dropzone'; // Assuming this is now a .ts file
import { toast } from 'react-hot-toast';

// ------------------------------------------
// 1. Define Interfaces for Props and Data Structures
// ------------------------------------------

/**
 * Defines the structure of the files object managed by the modal.
 * Each property is a File object or null.
 */
interface UploadFilesState {
  questionPaper: File | null;
  answerKey: File | null;
  responseSheets: File[];
}

/**
 * Defines the structure for each step configuration within the modal.
 */
interface StepConfig {
  key: keyof UploadFilesState; // Key for the file type, e.g., 'questionPaper'
  label: string;
  icon: React.ElementType<IconProps>; // Type for Phosphor icon components
  file: File | null | File[];
  setFile: (file: File | null | File[]) => void;
  accept: string;
  actionText: string;
  description: string;
}

/**
 * Props for the UploadModal component.
 */
interface UploadModalProps {
  step: number;
  setStep: React.Dispatch<React.SetStateAction<number>>; // Function to update the current step
  files: UploadFilesState; // The object containing all uploaded files
  setFiles: React.Dispatch<React.SetStateAction<UploadFilesState>>; // Function to update the files object
  onSubmit: () => Promise<void>; // Function to handle form submission (uploading all files)
  onClose: () => void; // Function to close the modal
  isUploading: boolean; // Indicates if files are currently being uploaded
  uploadStatus: { [key: string]: 'idle' | 'uploading' | 'uploaded' | 'error' };
}

// ------------------------------------------
// 2. UploadModal Component (TypeScript)
// ------------------------------------------

/**
 * Modal component for handling multi-step file uploads.
 * It guides the user through uploading different types of files.
 */
const UploadModal: React.FC<UploadModalProps> = ({
  step,
  setStep,
  files,
  setFiles,
  onSubmit,
  onClose,
  isUploading,
  uploadStatus,
}) => {
  // Configuration for each upload step, memoized for performance
  const stepsConfig: StepConfig[] = useMemo(
    () => [
      {
        key: 'answerKey',
        label: 'Answer Key',
        icon: Key,
        file: files.answerKey,
        setFile: (file: File | null | File[]) => setFiles((prevFiles) => ({ ...prevFiles, answerKey: (file instanceof File || file === null) ? file : null })),
        accept: '.csv',
        actionText: 'Upload Answer Key',
        description: 'Upload the answer key in CSV format with correct answers',
      },
      {
        key: 'responseSheets',
        label: 'Response Sheet',
        icon: FileIconBase,
        file: files.responseSheets,
        setFile: (file: File[] | File | null) => setFiles((prevFiles) => ({ ...prevFiles, responseSheets: Array.isArray(file) ? file : file ? [file] : [] })),
        accept: '.csv',
        actionText: 'Upload Response Sheet',
        description: 'Upload the student response sheet in CSV format',
      },
    ],
    [files, setFiles]
  );

  // Get the configuration for the current step
  const currentStep = stepsConfig[step];
  // Determine if the user can proceed to the next step
  const canProceed = !!currentStep?.file; // Check if the current step has a file
  // Check if the current step is the last one
  const isLastStep = step === stepsConfig.length - 1;

  // Calculate the progress percentage for the progress bar
  const progressPercentage = useMemo(() => {
    // Add a partial step for the current active file if it's uploaded
    const currentStepProgress = currentStep?.file ? 1 : 0;
    return Math.round(((step + currentStepProgress) / stepsConfig.length) * 100);
  }, [step, currentStep?.file, stepsConfig.length]);

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={(e: React.MouseEvent<HTMLDivElement>) => {
          if (isUploading) {
            // Prevent close during upload
            e.stopPropagation();
            return;
          }
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <motion.div
          className="relative bg-white rounded-2xl shadow-2xl w-full max-w-xl p-8 border border-blue-200"
          initial={{ scale: 0.8, y: 20, opacity: 0.8 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.8, y: 20, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        >
          {/* Close button */}
          <button
            onClick={() => {
              if (isUploading) {
                toast.error('Cannot close while uploading.');
                return;
              }
              onClose();
            }}
            className="btn btn-circle btn-ghost absolute right-4 top-4 hover:bg-blue-100 text-blue-500"
            disabled={isUploading}
            aria-label="Close"
          >
            <X weight="bold" size={20} />
          </button>

          {/* Header with progress indicators */}
          <div className="mb-6">
            <div className="flex items-center mb-1">
              <span className="badge badge-ghost badge-sm mr-2">
                Step {step + 1}/{stepsConfig.length}
              </span>
              <h3 className="text-xl font-bold text-blue-800">{currentStep?.actionText}</h3>
            </div>
            <p className="text-blue-600 text-sm">{currentStep?.description}</p>
          </div>

          {/* Progress bar */}
          <div className="w-full h-1 bg-blue-100 rounded-full mb-6 overflow-hidden">
            <motion.div
              className="h-full bg-blue-500"
              initial={{ width: `0%` }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>

          {/* Step indicators */}
          <div className="flex justify-between mb-6 px-2">
            {stepsConfig.map((s, index) => (
              <div key={s.key} className="flex flex-col items-center">
                <motion.div
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                    index < step
                      ? 'bg-blue-500 border-blue-500 text-white'
                      : index === step
                        ? 'border-blue-500 text-blue-500'
                        : 'border-blue-200 text-blue-300'
                  }`}
                  whileHover={index < step && !isUploading ? { scale: 1.05 } : {}} // Only hover if clickable and not uploading
                  onClick={() => index < step && !isUploading && setStep(index)} // Only allow click if prior step and not uploading
                  style={{ cursor: index < step && !isUploading ? 'pointer' : 'default' }}
                >
                  {index < step ? (
                    <CheckCircle weight="fill" size={18} />
                  ) : (
                    <s.icon size={18} />
                  )}
                </motion.div>
                <span
                  className={`text-xs mt-1 ${index === step ? 'font-medium text-blue-600' : 'text-blue-400'}`}
                >
                  {s.label}
                </span>
              </div>
            ))}
          </div>

          {/* Dropzone */}
          <div className="mb-8">
            <DropZone
              label={currentStep?.label}
              file={Array.isArray(currentStep?.file) ? (currentStep.file[0] ?? null) : currentStep?.file}
              setFile={(fileOrFn) => {
                if (!currentStep) return;
                let file: File | null;
                if (typeof fileOrFn === 'function') {
                  const currentFile = Array.isArray(currentStep.file)
                    ? (currentStep.file[0] ?? null)
                    : currentStep.file;
                  file = fileOrFn(currentFile);
                } else {
                  file = fileOrFn;
                }
                if (currentStep.key === 'responseSheets') {
                  currentStep.setFile(file ? [file] : []);
                } else {
                  currentStep.setFile(file);
                }
              }}
              icon={currentStep?.icon}
              accept={currentStep?.accept}
              disabled={isUploading}
            />
            {/* Upload status */}
            {isUploading && (
              <div className="flex items-center justify-center mt-4">
                <span className="loading loading-spinner loading-md text-blue-500 mr-2"></span>
                <span className="text-blue-600 font-medium">Uploading...</span>
              </div>
            )}
            {/* Only show 'Uploaded' if backend confirmed */}
            {!isUploading && uploadStatus[currentStep.key] === 'uploaded' && (
              <div className="flex items-center justify-center mt-4">
                <CheckCircle size={20} className="text-blue-600 mr-1" />
                <span className="text-blue-700 font-medium">Uploaded</span>
              </div>
            )}
            {/* Show error if upload failed */}
            {!isUploading && uploadStatus[currentStep.key] === 'error' && (
              <div className="flex items-center justify-center mt-4">
                <span className="text-red-500 font-medium">Upload failed. Please try again.</span>
              </div>
            )}
            {!canProceed && (
              <motion.p
                className="text-error text-sm text-center mt-3"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                Please upload a file to continue
              </motion.p>
            )}
          </div>

          {/* Navigation buttons */}
          <div className="flex justify-between items-center mt-6">
            <button
              className={`btn btn-sm ${step > 0 ? '' : 'invisible'}`}
              onClick={() => step > 0 && setStep(step - 1)}
              disabled={isUploading}
            >
              <ArrowLeft size={16} className="mr-1" /> Back
            </button>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
              {!isLastStep ? (
                <button
                  className={`btn btn-secondary btn-sm bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200 ${!canProceed || isUploading ? 'btn-disabled opacity-50' : ''}`}
                  onClick={() => canProceed && setStep(step + 1)}
                  disabled={!canProceed || isUploading}
                >
                  Next <ArrowRight size={16} className="ml-1" />
                </button>
              ) : (
                <button
                  className={`btn bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-all hover:shadow-md ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  onClick={onSubmit}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <>
                      <Spinner size={16} className="animate-spin mr-2" />
                      Uploading...
                    </>
                  ) : (
                    'Submit All'
                  )}
                </button>
              )}
            </motion.div>
          </div>

          {/* Help text */}
          {isLastStep && canProceed && !isUploading && (
            <motion.p
              className="text-xs text-center mt-4 text-blue-400"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              Click Submit All to process your files and generate results
            </motion.p>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default React.memo(UploadModal);