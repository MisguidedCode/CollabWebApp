import { uploadTaskAttachment, deleteTaskAttachment } from '../storageService';
import { storage } from '../../config/firebase';
import { 
  UploadTask, 
  UploadTaskSnapshot,
  StorageReference,
  StorageObserver
} from 'firebase/storage';

// Create mock implementations
const mockStorageRef = {
  fullPath: 'task-attachments/task-1/test.txt',
  bucket: 'test-bucket',
  name: 'test.txt',
  parent: null,
  root: null,
  storage: storage
} as unknown as StorageReference;

const mockDownloadURL = 'https://example.com/test.txt';

const mockUploadTaskSnapshot = {
  ref: mockStorageRef,
  bytesTransferred: 100,
  totalBytes: 100,
  state: 'success',
  metadata: {},
  task: {} as UploadTask
} as UploadTaskSnapshot;

type MockUploadTask = {
  on: jest.Mock;
  snapshot: UploadTaskSnapshot;
  then: () => Promise<UploadTaskSnapshot>;
  catch: () => Promise<UploadTaskSnapshot>;
};

const mockUploadTask: MockUploadTask = {
  on: jest.fn((event, observer, errorFn, completeFn) => {
    if (typeof observer === 'function') {
      observer(mockUploadTaskSnapshot);
    }
    completeFn?.();
    return mockUploadTask;
  }),
  snapshot: mockUploadTaskSnapshot,
  then: () => Promise.resolve(mockUploadTaskSnapshot),
  catch: () => Promise.resolve(mockUploadTaskSnapshot)
};

jest.mock('../../config/firebase', () => ({
  storage: {
    ref: jest.fn().mockReturnValue(mockStorageRef),
  },
  STORAGE_PATHS: {
    TASK_ATTACHMENTS: 'task-attachments'
  }
}));

jest.mock('firebase/storage', () => ({
  ref: jest.fn().mockReturnValue(mockStorageRef),
  uploadBytesResumable: jest.fn().mockReturnValue(mockUploadTask as unknown as UploadTask),
  getDownloadURL: jest.fn().mockResolvedValue('https://example.com/test.txt'),
  deleteObject: jest.fn().mockResolvedValue(undefined),
}));

describe('Storage Service', () => {
  it('should upload file and return attachment data', async () => {
    const mockFile = new File(['test'], 'test.txt', { type: 'text/plain' });
    const mockProgress = jest.fn();

    const attachment = await uploadTaskAttachment('task-1', mockFile, mockProgress);

    expect(attachment).toHaveProperty('id');
    expect(attachment.fileName).toBe('test.txt');
    expect(attachment.downloadUrl).toBe('https://example.com/test.txt');
    expect(mockProgress).toHaveBeenCalledWith({ progress: 100 });
  });
});
