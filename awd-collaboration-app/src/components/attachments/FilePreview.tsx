import { ArrowDownTrayIcon, TrashIcon } from '@heroicons/react/24/outline';
import { TaskAttachment } from '../../types/attachment';
import { formatFileSize, getFileTypeInfo } from '../../utils/fileUtils';

interface FilePreviewProps {
  attachment: TaskAttachment;
  onDelete?: (attachment: TaskAttachment) => void;
}

const FilePreview = ({ attachment, onDelete }: FilePreviewProps) => {
  const { icon: Icon, label: fileTypeLabel, color } = getFileTypeInfo(attachment.fileType);
  const isImage = attachment.fileType.startsWith('image/');
  const uploadDate = new Date(attachment.uploadedAt).toLocaleDateString();

  return (
    <div className="group relative rounded-lg border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow">
      {isImage && attachment.downloadUrl ? (
        <div className="aspect-video w-full rounded-t-lg overflow-hidden bg-gray-100">
          <img
            src={attachment.downloadUrl}
            alt={attachment.fileName}
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div className="aspect-video w-full rounded-t-lg flex items-center justify-center bg-gray-50">
          <Icon className={`h-16 w-16 ${color}`} />
        </div>
      )}
      
      <div className="p-4">
        <div className="mb-2 flex items-start justify-between">
          <div className="truncate">
            <h4 className="text-sm font-medium text-gray-900 truncate" title={attachment.fileName}>
              {attachment.fileName}
            </h4>
            <p className="text-xs text-gray-500">
              {fileTypeLabel} • {formatFileSize(attachment.fileSize)}
            </p>
          </div>
        </div>

        <div className="text-xs text-gray-500 mb-3">
          Uploaded {uploadDate}
        </div>

        <div className="flex gap-2">
          <a
            href={attachment.downloadUrl}
            download={attachment.fileName}
            className="flex-1 inline-flex items-center justify-center px-3 py-1.5 text-sm font-medium rounded-md text-gray-700 bg-gray-50 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
            Download
          </a>
          {onDelete && (
            <button
              onClick={() => onDelete(attachment)}
              className="inline-flex items-center justify-center px-3 py-1.5 text-sm font-medium rounded-md text-red-700 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              title="Delete attachment"
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default FilePreview;