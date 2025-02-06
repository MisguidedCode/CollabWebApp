import { render, screen, fireEvent } from '@testing-library/react';
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
    attachments: [],
  };

  // Mock functions for onEdit and onDelete
  const mockOnEdit = jest.fn();
  const mockOnDelete = jest.fn();

  const renderWithDnd = (ui: React.ReactElement) => {
    return render(
      <DndContext>
        {ui}
      </DndContext>
    );
  };

  beforeEach(() => {
    // Clear mock function calls before each test
    jest.clearAllMocks();
  });

  it('renders task details correctly', () => {
    renderWithDnd(
      <TaskCard 
        task={mockTask}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );
    
    expect(screen.getByText('Test Task')).toBeInTheDocument();
    expect(screen.getByText('Test Description')).toBeInTheDocument();
    expect(screen.getByText('medium')).toBeInTheDocument();
    expect(screen.getByText('test')).toBeInTheDocument();
  });

  it('applies correct priority styling', () => {
    const highPriorityTask: Task = { ...mockTask, priority: 'high' };
    renderWithDnd(
      <TaskCard 
        task={highPriorityTask}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );
    
    const priorityBadge = screen.getByText('high');
    expect(priorityBadge).toHaveClass('bg-red-100', 'text-red-800');
  });

  it('renders due date when provided', () => {
    const taskWithDueDate: Task = {
      ...mockTask,
      dueDate: '2024-12-31',
    };
    renderWithDnd(
      <TaskCard 
        task={taskWithDueDate}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );
    
    expect(screen.getByText(/Due:/)).toBeInTheDocument();
  });

  // Add new tests for edit and delete functionality
  it('calls onEdit when edit button is clicked', () => {
    renderWithDnd(
      <TaskCard 
        task={mockTask}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );
    
    // Find and click the edit button
    const editButton = screen.getByRole('button', { name: /edit/i });
    fireEvent.click(editButton);
    
    expect(mockOnEdit).toHaveBeenCalledWith(mockTask);
  });

  it('calls onDelete when delete button is clicked', () => {
    renderWithDnd(
      <TaskCard 
        task={mockTask}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );
    
    // Find and click the delete button
    const deleteButton = screen.getByRole('button', { name: /delete/i });
    fireEvent.click(deleteButton);
    
    expect(mockOnDelete).toHaveBeenCalledWith(mockTask.id);
  });
});