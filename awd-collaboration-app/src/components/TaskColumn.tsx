import { useDroppable } from '@dnd-kit/core';
import { TaskColumn as TaskColumnType } from '../types/task';
import TaskCard from './TaskCard';

interface TaskColumnProps {
  column: TaskColumnType;
}

const TaskColumn = ({ column }: TaskColumnProps) => {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
  });

  return (
    <div className="flex-1 flex flex-col bg-gray-50 rounded-lg">
      <div className="p-4 font-medium text-gray-900 border-b border-gray-200">
        {column.title} ({column.tasks.length})
      </div>
      <div
        ref={setNodeRef}
        className={`flex-1 p-2 space-y-2 overflow-y-auto ${
          isOver ? 'bg-blue-50' : ''
        }`}
      >
        {column.tasks.map(task => (
          <TaskCard key={task.id} task={task} />
        ))}
      </div>
    </div>
  );
};

export default TaskColumn;