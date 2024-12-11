import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { TaskColumn, TaskStatus } from '../types/task';
import TaskCard from '../components/TaskCard';

const COLUMN_CONFIG: { id: TaskStatus; title: string }[] = [
  { id: 'todo', title: 'To Do' },
  { id: 'in_progress', title: 'In Progress' },
  { id: 'in_review', title: 'In Review' },
  { id: 'done', title: 'Done' },
];

const TasksPage = () => {
  const tasks = useSelector((state: RootState) => state.tasks.tasks);
  
  const columns: TaskColumn[] = useMemo(() => {
    return COLUMN_CONFIG.map(col => ({
      ...col,
      tasks: tasks.filter(task => task.status === col.id),
    }));
  }, [tasks]);

  return (
    <div className="h-full">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Tasks</h1>
        <button
          type="button"
          className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          Create Task
        </button>
      </div>
      
      <div className="flex space-x-4 h-full">
        {columns.map(column => (
          <div
            key={column.id}
            className="flex flex-col w-80 bg-gray-50 rounded-lg"
          >
            <div className="p-4 font-medium text-gray-900 border-b border-gray-200">
              {column.title} ({column.tasks.length})
            </div>
            <div className="flex-1 p-2 space-y-2 overflow-y-auto">
              {column.tasks.map(task => (
                <TaskCard key={task.id} task={task} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TasksPage;