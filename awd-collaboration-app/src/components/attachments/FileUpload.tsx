import { ChangeEvent, useRef } from 'react';
import { PaperClipIcon } from '@heroicons/react/24/outline';
import { useTaskAttachment } from '../../hooks/useTaskAttachment';
import { validateFile } from '../../utils/fileUtils';
import { TaskAttachment } from '../../types/attachment';

interface FileUploadProps {
  taskId: string;
  onUploadComplete?: (attachment: TaskAttachment) => void;
  onError?: (error: string) => void;
}

const FileUpload = ({ taskId, onUploadComplete, onError }: FileUploadProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadFile, uploadProgress } = useTaskAttachment(taskId);

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;

    const file = files[0];
    const validation = validateFile(file);
    
    if (!validation.isValid) {
      onError?.(validation.error || 'Invalid file');
      return;
    }

    try {
      const attachment = await uploadFile(file);
      console.log("File uploaded successfully:", attachment);
      
      // Pass the attachment to the parent component
      if (onUploadComplete) {
        onUploadComplete(attachment);
      }
    } catch (error) {
      console.error("Upload failed:", error);
      onError?.(error instanceof Error ? error.message : 'Upload failed');
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileChange}
      />
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
      >
        <PaperClipIcon className="-ml-0.5 mr-2 h-4 w-4" aria-hidden="true" />
        Attach File
      </button>
      {Object.entries(uploadProgress).map(([fileName, progress]) => (
        progress.progress < 100 && (
          <div key={fileName} className="mt-2">
            <div className="text-sm text-gray-600">{fileName}</div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-primary-600 h-2.5 rounded-full"
                style={{ width: `${progress.progress}%` }}
              />
            </div>
          </div>
        )
      ))}
    </div>
  );
};

export default FileUpload;