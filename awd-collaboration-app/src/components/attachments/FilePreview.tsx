import { DocumentIcon, PhotoIcon, ArchiveBoxIcon } from '@heroicons/react/24/outline';
import { TaskAttachment } from '../../types/attachment';
import { formatFileSize } from '../../utils/fileUtils';

interface FilePreviewProps {
  attachment: TaskAttachment;
  onDelete?: (attachment: TaskAttachment) => void;
}

const FilePreview = ({ attachment, onDelete }: FilePreviewProps) => {
  const isImage = attachment.fileType.startsWith('image/');
  const isPDF = attachment.fileType === 'application/pdf';

  const getIcon = () => {
    if (attachment.fileType.includes('archive')) return ArchiveBoxIcon;
    if (attachment.fileType.includes('image')) return PhotoIcon;
    return DocumentIcon;
  };

  const Icon = getIcon();

  return (
    <div className="relative group">
      {isImage && attachment.downloadUrl ? (
        <div className="relative w-full h-32 bg-gray-100 rounded-lg overflow-hidden">
          <img
            src={attachment.downloadUrl}
            alt={attachment.fileName}
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div className="flex items-center p-4 bg-gray-50 rounded-lg">
          <Icon className="h-8 w-8 text-gray-400" />
          <div className="ml-4 flex-1">
            <h4 className="text-sm font-medium text-gray-900">
              {attachment.fileName}
            </h4>
            <p className="text-sm text-gray-500">
              {formatFileSize(attachment.fileSize)}
            </p>
          </div>
        </div>
      )}

      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black bg-opacity-30 rounded-lg">
        <div className="flex space-x-2">
            <a
            href={attachment.downloadUrl}
            download={attachment.fileName}
            className="px-2 py-1 text-sm text-white bg-primary-600 rounded hover:bg-primary-700"
          >
            Download
          </a>
          {onDelete && (
            <button
              onClick={() => onDelete(attachment)}
              className="px-2 py-1 text-sm text-white bg-red-600 rounded hover:bg-red-700"
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default FilePreview;