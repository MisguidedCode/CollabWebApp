import { 
  ref, 
  uploadBytesResumable, 
  getDownloadURL, 
  deleteObject,
  StorageReference,
  StorageError,
  listAll
} from 'firebase/storage';
import { storage, STORAGE_PATHS } from '../config/firebase';
import { TaskAttachment } from '../types/attachment';

export interface UploadProgress {
  progress: number;
  downloadUrl?: string;
  error?: string;
}

export const getStorageRef = (taskId: string, fileName: string): StorageReference => {
  return ref(storage, `${STORAGE_PATHS.TASK_ATTACHMENTS}/${taskId}/${fileName}`);
};

export const getTaskStorageFolder = (taskId: string): StorageReference => {
  return ref(storage, `${STORAGE_PATHS.TASK_ATTACHMENTS}/${taskId}`);
};

export const uploadTaskAttachment = (
  taskId: string,
  file: File,
  onProgress?: (progress: UploadProgress) => void
): Promise<TaskAttachment> => {
  return new Promise((resolve, reject) => {
    const storedFileName = `${Date.now()}-${file.name}`;
    const storageRef = getStorageRef(taskId, storedFileName);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        onProgress?.({ progress });
      },
      (error) => {
        onProgress?.({ progress: 0, error: error.message });
        reject(error);
      },
      async () => {
        try {
          const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
          const attachment: TaskAttachment = {
            id: storedFileName, 
            taskId,
            fileName: file.name, 
            fileType: file.type,
            fileSize: file.size,
            uploadedBy: 'user1', 
            uploadedAt: new Date().toISOString(),
            downloadUrl,
            storedFileName: storedFileName 
          };
          onProgress?.({ progress: 100, downloadUrl });
          resolve(attachment);
        } catch (error) {
          reject(error);
        }
      }
    );
  });
};

export const deleteTaskAttachment = async (taskId: string, attachmentId: string): Promise<void> => {
  try {
    // Try with the direct ID first (which should be the storedFileName)
    const storageRef = getStorageRef(taskId, attachmentId);
    await deleteObject(storageRef);
  } catch (error) {
    const storageError = error as StorageError;
    
    if (storageError.code === 'storage/object-not-found') {
      console.warn(`File ${attachmentId} not found with direct path. Attempting to find by prefix...`);
      
      try {
        // If we can't find the exact file, try listing files with the same timestamp prefix
        // This handles cases where the ID doesn't exactly match the stored filename
        const folderRef = getTaskStorageFolder(taskId);
        const fileList = await listAll(folderRef);
        
        // Extract the timestamp prefix (if the format is timestamp-filename)
        const attachmentPrefix = attachmentId.split('-')[0];
        
        // Find any file that starts with this prefix
        const matchingFile = fileList.items.find(item => {
          const fileName = item.name;
          return fileName.startsWith(attachmentPrefix) || fileName.includes(attachmentId);
        });
        
        if (matchingFile) {
          // Delete the found file
          console.log(`Found matching file: ${matchingFile.name}`);
          await deleteObject(matchingFile);
        } else {
          console.warn(`No matching files found for ${attachmentId}`);
        }
      } catch (listError) {
        console.error('Error listing files in storage folder:', listError);
      }
    } else {
      // For any other errors, rethrow
      throw error;
    }
  }
};