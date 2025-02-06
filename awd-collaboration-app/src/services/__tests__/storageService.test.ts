import { uploadTaskAttachment, deleteTaskAttachment } from '../storageService';
import { storage } from '../../config/firebase';

jest.mock('../../config/firebase', () => ({
  storage: {
    ref: jest.fn(),
  },
  STORAGE_PATHS: {
    TASK_ATTACHMENTS: 'task-attachments'
  }
}));

describe('Storage Service', () => {
  it('should upload file and return attachment data', async () => {
    const mockFile = new File(['test'], 'test.txt', { type: 'text/plain' });
    const mockProgress = jest.fn();

    const attachment = await uploadTaskAttachment('task-1', mockFile, mockProgress);

    expect(attachment).toHaveProperty('id');
    expect(attachment.fileName).toBe('test.txt');
    expect(mockProgress).toHaveBeenCalled();
  });
});