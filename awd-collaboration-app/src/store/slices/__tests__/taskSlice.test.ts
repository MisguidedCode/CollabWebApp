import taskReducer, { 
    addTask, 
    updateTask, 
    updateTaskStatus, 
    deleteTask 
  } from '../taskSlice';
  import { Task } from '../../../types/task';
  
  describe('taskSlice', () => {
    const initialState = {
      tasks: [],
      loading: false,
      error: null,
    };
  
    const sampleTask: Task = {
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
  
    it('should handle initial state', () => {
      expect(taskReducer(undefined, { type: 'unknown' })).toEqual({
        tasks: expect.any(Array),
        loading: false,
        error: null,
      });
    });
  
    it('should handle addTask', () => {
      const actual = taskReducer(initialState, addTask(sampleTask));
      expect(actual.tasks).toHaveLength(1);
      expect(actual.tasks[0]).toEqual(sampleTask);
    });
  
    it('should handle updateTask', () => {
      const state = {
        ...initialState,
        tasks: [sampleTask],
      };
  
      const updatedTask = {
        ...sampleTask,
        title: 'Updated Title',
      };
  
      const actual = taskReducer(state, updateTask(updatedTask));
      expect(actual.tasks[0].title).toEqual('Updated Title');
    });
  
    it('should handle updateTaskStatus', () => {
      const state = {
        ...initialState,
        tasks: [sampleTask],
      };
  
      const actual = taskReducer(
        state,
        updateTaskStatus({ taskId: '1', status: 'in_progress' })
      );
      expect(actual.tasks[0].status).toEqual('in_progress');
    });
  
    it('should handle deleteTask', () => {
      const state = {
        ...initialState,
        tasks: [sampleTask],
      };
  
      const actual = taskReducer(state, deleteTask('1'));
      expect(actual.tasks).toHaveLength(0);
    });
  });