import { useState, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { uploadTaskAttachment, deleteTaskAttachment, UploadProgress } from '../services/storageService';
import { addTaskAttachment, removeTaskAttachment } from '../store/slices/taskSlice';
import { validateFile } from '../utils/fileUtils';

export const useTaskAttachment = (taskId: string) => {
  const dispatch = useDispatch();
  const [uploadProgress, setUploadProgress] = useState<Record<string, UploadProgress>>({});

  const uploadFile = useCallback(async (file: File) => {
    const validation = validateFile(file);
    if (!validation.isValid) {
      throw new Error(validation.error);
    }

    try {
      const attachment = await uploadTaskAttachment(taskId, file, (progress) => {
        setUploadProgress(prev => ({
          ...prev,
          [file.name]: progress
        }));
      });

      dispatch(addTaskAttachment({ taskId, attachment }));
      return attachment;
    } catch (error) {
      throw error;
    }
  }, [taskId, dispatch]);

  const deleteFile = useCallback(async (attachmentId: string, fileName: string) => {
    try {
      await deleteTaskAttachment(taskId, fileName);
      dispatch(removeTaskAttachment({ taskId, attachmentId }));
    } catch (error) {
      throw error;
    }
  }, [taskId, dispatch]);

  return {
    uploadFile,
    deleteFile,
    uploadProgress
  };
};