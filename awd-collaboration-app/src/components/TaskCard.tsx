import { Task } from '../types/task';

interface TaskCardProps {
  task: Task;
}

const TaskCard = ({ task }: TaskCardProps) => {
  return (
    <div className="bg-white p-4 rounded-md shadow-sm border border-gray-200 cursor-pointer hover:shadow-md transition-shadow">
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
    </div>
  );
};

export default TaskCard;