import { render, screen } from '@testing-library/react';
import { DndContext } from '@dnd-kit/core';
import TaskCard from '../TaskCard';
import { Task } from '../../types/task';

describe('TaskCard', () => {
  const mockTask: Task = {
    id: '1',
    title: 'Test Task',
    description: 'Test Description',
    status: 'todo',
    priority: 'medium',
    createdBy: 'user1',
    createdAt: new Date().toISOString(),
    tags: ['test'],
  };

  const renderWithDnd = (ui: React.ReactElement) => {
    return render(
      <DndContext>
        {ui}
      </DndContext>
    );
  };

  it('renders task details correctly', () => {
    renderWithDnd(<TaskCard task={mockTask} />);
    
    expect(screen.getByText('Test Task')).toBeInTheDocument();
    expect(screen.getByText('Test Description')).toBeInTheDocument();
    expect(screen.getByText('medium')).toBeInTheDocument();
    expect(screen.getByText('test')).toBeInTheDocument();
  });

  it('applies correct priority styling', () => {
    const highPriorityTask: Task = { ...mockTask, priority: 'high' };
    renderWithDnd(<TaskCard task={highPriorityTask} />);
    
    const priorityBadge = screen.getByText('high');
    expect(priorityBadge).toHaveClass('bg-red-100', 'text-red-800');
  });

  it('renders due date when provided', () => {
    const taskWithDueDate: Task = {
      ...mockTask,
      dueDate: '2024-12-31',
    };
    renderWithDnd(<TaskCard task={taskWithDueDate} />);
    
    expect(screen.getByText(/Due:/)).toBeInTheDocument();
  });
});