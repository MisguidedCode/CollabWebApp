import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Task } from '../types/task';
import { getFileTypeInfo } from '../utils/fileUtils';

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
}

const TaskCard = ({ task, onEdit, onDelete }: TaskCardProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: task.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    opacity: isDragging ? 0.5 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="relative bg-white p-4 rounded-md shadow-sm border border-gray-200 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow group"
    >
      {/* Add action buttons */}
      <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit(task);
          }}
          className="p-1 text-gray-400 hover:text-blue-500 rounded-full hover:bg-gray-100"
        >
          <PencilIcon className="h-4 w-4" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(task.id);
          }}
          className="p-1 text-gray-400 hover:text-red-500 rounded-full hover:bg-gray-100"
        >
          <TrashIcon className="h-4 w-4" />
        </button>
      </div>

      {/* Task content */}
      <div className="flex justify-between items-start">
        <h3 className="text-sm font-medium text-gray-900">{task.title}</h3>
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
          task.priority === 'high' 
            ? 'bg-red-100 text-red-800'
            : task.priority === 'medium'
            ? 'bg-yellow-100 text-yellow-800'
            : 'bg-green-100 text-green-800'
        }`}>
          {task.priority}
        </span>
      </div>
      <p className="mt-1 text-sm text-gray-600 line-clamp-2">{task.description}</p>
      
      {task.dueDate && (
        <div className="mt-2 text-xs text-gray-500">
          Due: {new Date(task.dueDate).toLocaleDateString()}
        </div>
      )}
      
      {task.tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {task.tags.map(tag => (
            <span
              key={tag}
              className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Attachments section */}
      {task.attachments?.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {task.attachments.map(attachment => {
            const { icon: Icon, color } = getFileTypeInfo(attachment.fileType);
            return (
              <div
                key={attachment.id}
                className="inline-flex items-center text-xs text-gray-500"
                title={attachment.fileName}
              >
                <Icon className={`h-4 w-4 mr-1 ${color}`} />
                {attachment.fileName}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TaskCard;