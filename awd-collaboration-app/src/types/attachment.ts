export interface TaskAttachment {
    id: string;
    taskId: string;
    fileName: string;
    fileType: string;
    fileSize: number;
    uploadedBy: string;
    uploadedAt: string;
    downloadUrl?: string;
    thumbnailUrl?: string;
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