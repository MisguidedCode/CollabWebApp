import { useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { uploadTaskAttachment, deleteTaskAttachment, UploadProgress } from '../services/storageService';
import { addTaskAttachment, removeTaskAttachment } from '../store/slices/taskSlice';
import { validateFile } from '../utils/fileUtils';
import { RootState } from '../store';

export const useTaskAttachment = (taskId: string) => {
  const dispatch = useDispatch();
  const [uploadProgress, setUploadProgress] = useState<Record<string, UploadProgress>>({});
  // Get all tasks from the store to track state
  const allTasks = useSelector((state: RootState) => state.tasks.tasks);
  const currentTask = allTasks.find(task => task.id === taskId);

  // Debug current task attachments
  console.log("[DEBUG useTaskAttachment] Current task attachments:", 
    currentTask?.attachments || "No attachments or task not found");

  const uploadFile = useCallback(async (file: File) => {
    console.log("[DEBUG useTaskAttachment] uploadFile called with:", file.name);
    
    const validation = validateFile(file);
    if (!validation.isValid) {
      console.log("[DEBUG useTaskAttachment] File validation failed:", validation.error);
      throw new Error(validation.error);
    }

    try {
      // Track progress in state
      const trackProgress = (progress: UploadProgress) => {
        console.log("[DEBUG useTaskAttachment] Upload progress:", progress);
        setUploadProgress(prev => ({
          ...prev,
          [file.name]: progress
        }));
      };

      console.log("[DEBUG useTaskAttachment] Starting file upload to Firebase");
      const attachment = await uploadTaskAttachment(taskId, file, trackProgress);
      console.log("[DEBUG useTaskAttachment] Upload successful, attachment:", attachment);

      // Get the current task again to ensure we have latest data
      const updatedTask = allTasks.find(task => task.id === taskId);
      console.log("[DEBUG useTaskAttachment] Current task before dispatch:", updatedTask);

      // Dispatch action to update Redux store
      console.log("[DEBUG useTaskAttachment] Dispatching addTaskAttachment");
      dispatch(addTaskAttachment({ taskId, attachment }));
      
      return attachment;
    } catch (error) {
      console.error("[DEBUG useTaskAttachment] Error in uploadFile:", error);
      throw error;
    }
  }, [taskId, dispatch, allTasks]);

  const deleteFile = useCallback(async (attachmentId: string, fileName: string) => {
    console.log("[DEBUG useTaskAttachment] deleteFile called:", { attachmentId, fileName });
    
    try {
      // Get current task to log its state
      const task = allTasks.find(t => t.id === taskId);
      console.log("[DEBUG useTaskAttachment] Current task before deletion:", task);
      console.log("[DEBUG useTaskAttachment] Current attachments:", task?.attachments);
      
      // First update the Redux store
      console.log("[DEBUG useTaskAttachment] Dispatching removeTaskAttachment");
      dispatch(removeTaskAttachment({ taskId, attachmentId }));
      
      // Then try to delete the file from storage
      console.log("[DEBUG useTaskAttachment] Deleting file from storage:", fileName);
      await deleteTaskAttachment(taskId, fileName);
      console.log("[DEBUG useTaskAttachment] File deletion successful");
      
      // Get updated task to confirm deletion
      const updatedTasks = (window as any).__REDUX_DEVTOOLS_EXTENSION__?.getData()?.state?.tasks.tasks;
      const updatedTask = updatedTasks?.find((t: any) => t.id === taskId);
      console.log("[DEBUG useTaskAttachment] Task after deletion:", updatedTask);
      
    } catch (error) {
      console.error("[DEBUG useTaskAttachment] Error in deleteFile:", error);
      // We don't rethrow the error since we've already updated the UI
    }
  }, [taskId, dispatch, allTasks]);

  return {
    uploadFile,
    deleteFile,
    uploadProgress
  };
};