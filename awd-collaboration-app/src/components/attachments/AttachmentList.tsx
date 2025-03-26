import { TaskAttachment } from '../../types/attachment';
import FilePreview from './FilePreview';
import { useTaskAttachment } from '../../hooks/useTaskAttachment';

interface AttachmentListProps {
  taskId: string;
  attachments: TaskAttachment[];
  onAttachmentDeleted?: (attachment: TaskAttachment) => void;
}

const AttachmentList = ({ taskId, attachments, onAttachmentDeleted }: AttachmentListProps) => {
  const { deleteFile } = useTaskAttachment(taskId);

  const handleDelete = async (attachment: TaskAttachment) => {
    try {
      // First notify the parent that this attachment is being deleted
      // This allows for immediate UI update
      if (onAttachmentDeleted) {
        onAttachmentDeleted(attachment);
      }
      
      // Then attempt to delete the actual file
      await deleteFile(attachment.id, attachment.storedFileName || attachment.id);
    } catch (error) {
      console.error('Failed to delete attachment:', error);
    }
  };

  if (!attachments?.length) {
    return null;
  }

  return (
    <div className="mt-4 space-y-4">
      <h4 className="text-sm font-medium text-gray-900">Attachments</h4>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {attachments.map((attachment) => (
          <FilePreview
            key={attachment.id}
            attachment={attachment}
            onDelete={handleDelete}
          />
        ))}
      </div>
    </div>
  );
};

export default AttachmentList;