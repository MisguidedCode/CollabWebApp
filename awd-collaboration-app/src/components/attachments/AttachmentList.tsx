import { TaskAttachment } from '../../types/attachment';
import FilePreview from './FilePreview';
import { useTaskAttachment } from '../../hooks/useTaskAttachment';

interface AttachmentListProps {
  taskId: string;
  attachments: TaskAttachment[];
}

const AttachmentList = ({ taskId, attachments }: AttachmentListProps) => {
  const { deleteFile } = useTaskAttachment(taskId);

  const handleDelete = async (attachment: TaskAttachment) => {
    try {
      await deleteFile(attachment.id, attachment.fileName);
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