import { 
    ref, 
    uploadBytesResumable, 
    getDownloadURL, 
    deleteObject,
    StorageReference 
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
  
  export const uploadTaskAttachment = (
    taskId: string,
    file: File,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<TaskAttachment> => {
    return new Promise((resolve, reject) => {
      const fileName = `${Date.now()}-${file.name}`;
      const storageRef = getStorageRef(taskId, fileName);
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
              id: fileName,
              taskId,
              fileName: file.name,
              fileType: file.type,
              fileSize: file.size,
              uploadedBy: 'user1', // TODO: Get from auth context
              uploadedAt: new Date().toISOString(),
              downloadUrl,
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
  
  export const deleteTaskAttachment = async (taskId: string, fileName: string): Promise<void> => {
    const storageRef = getStorageRef(taskId, fileName);
    await deleteObject(storageRef);
  };