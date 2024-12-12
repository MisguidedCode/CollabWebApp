import { useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  DndContext, 
  DragEndEvent, 
  useSensor,
  useSensors,
  PointerSensor,
  MouseSensor,
} from '@dnd-kit/core';
import { RootState } from '../store';
import { TaskColumn as TaskColumnType, Task, TaskStatus } from '../types/task';
import TaskColumn from '../components/TaskColumn';
import TaskModal from '../components/TaskModal';
import { updateTaskStatus, deleteTask } from '../store/slices/taskSlice';

const COLUMN_CONFIG: { id: TaskStatus; title: string }[] = [
  { id: 'todo', title: 'To Do' },
  { id: 'in_progress', title: 'In Progress' },
  { id: 'in_review', title: 'In Review' },
  { id: 'done', title: 'Done' },
];

const TasksPage = () => {
  const dispatch = useDispatch();
  const tasks = useSelector((state: RootState) => state.tasks.tasks);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);
  
  const sensors = useSensors(
    useSensor(MouseSensor),
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const columns: TaskColumnType[] = useMemo(() => {
    return COLUMN_CONFIG.map(col => ({
      ...col,
      tasks: tasks.filter(task => task.status === col.id),
    }));
  }, [tasks]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) return;

    const taskId = active.id as string;
    const newStatus = over.id as TaskStatus;

    if (newStatus && taskId) {
      dispatch(updateTaskStatus({ taskId, status: newStatus }));
    }
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  const handleDeleteTask = (taskId: string) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      dispatch(deleteTask(taskId));
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTask(undefined);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Tasks</h1>
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          Create Task
        </button>
      </div>
      
      <div className="flex-1 flex gap-4 min-h-0">
        <DndContext 
          sensors={sensors}
          onDragEnd={handleDragEnd}
        >
          {columns.map(column => (
            <TaskColumn 
              key={column.id} 
              column={column}
              onEditTask={handleEditTask}
              onDeleteTask={handleDeleteTask}
            />
          ))}
        </DndContext>
      </div>

      <TaskModal 
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        editTask={editingTask}
      />
    </div>
  );
};

export default TasksPage;