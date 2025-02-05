import { FILE_CONSTRAINTS, isValidFileType, isValidFileSize } from '../types/attachment';

export interface FileValidationResult {
  isValid: boolean;
  error?: string;
}

export const validateFile = (file: File): FileValidationResult => {
  if (!isValidFileType(file)) {
    return {
      isValid: false,
      error: 'File type not supported'
    };
  }

  if (!isValidFileSize(file)) {
    return {
      isValid: false,
      error: `File size must be less than ${FILE_CONSTRAINTS.MAX_FILE_SIZE / (1024 * 1024)}MB`
    };
  }

  return { isValid: true };
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};