import { 
  DocumentIcon, 
  PhotoIcon, 
  ArchiveBoxIcon, 
  TableCellsIcon, 
  DocumentTextIcon, 
  PresentationChartBarIcon 
} from '@heroicons/react/24/outline';

type HeroIcon = typeof DocumentIcon;

export interface FileValidationResult {
  isValid: boolean;
  error?: string;
}

export interface FileTypeInfo {
  icon: HeroIcon;
  label: string;
  color: string;
}

export const ALLOWED_FILE_TYPES = [
  // Documents
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  // Images
  'image/jpeg',
  'image/png',
  'image/gif',
  // Archives
  'application/zip',
  // Data
  'application/json',
  'text/csv',
  'text/markdown'
];

export const FILE_CONSTRAINTS = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB in bytes
  MAX_TOTAL_SIZE: 50 * 1024 * 1024, // 50MB in bytes
} as const;

export const isValidFileType = (file: File): boolean => {
  return ALLOWED_FILE_TYPES.includes(file.type);
};

export const isValidFileSize = (file: File): boolean => {
  return file.size <= FILE_CONSTRAINTS.MAX_FILE_SIZE;
};

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

export const getFileTypeInfo = (fileType: string): FileTypeInfo => {
  // Document types
  if (fileType === 'application/pdf') {
    return {
      icon: DocumentIcon,
      label: 'PDF',
      color: 'text-red-600',
    };
  }
  if (fileType.includes('spreadsheet') || fileType.includes('excel')) {
    return {
      icon: TableCellsIcon,
      label: 'Spreadsheet',
      color: 'text-green-600',
    };
  }
  if (fileType.includes('presentation') || fileType.includes('powerpoint')) {
    return {
      icon: PresentationChartBarIcon,
      label: 'Presentation',
      color: 'text-orange-600',
    };
  }
  if (fileType.includes('document') || fileType.includes('text')) {
    return {
      icon: DocumentTextIcon,
      label: 'Document',
      color: 'text-blue-600',
    };
  }
  // Image types
  if (fileType.startsWith('image/')) {
    return {
      icon: PhotoIcon,
      label: 'Image',
      color: 'text-purple-600',
    };
  }
  // Archive types
  if (fileType.includes('zip') || fileType.includes('archive')) {
    return {
      icon: ArchiveBoxIcon,
      label: 'Archive',
      color: 'text-gray-600',
    };
  }
  // Default
  return {
    icon: DocumentIcon,
    label: 'File',
    color: 'text-gray-600',
  };
};