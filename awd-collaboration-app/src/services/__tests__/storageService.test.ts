import { uploadTaskAttachment, deleteTaskAttachment } from '../storageService';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import type { UploadTaskSnapshot, StorageReference } from 'firebase/storage';

jest.mock('../../config/firebase', () => ({
  storage: {
    ref: jest.fn()
  },
  STORAGE_PATHS: {
    TASK_ATTACHMENTS: 'task-attachments'
  }
}));

jest.mock('firebase/storage');

describe('Storage Service', () => {
  // Mock implementations
  const mockStorageRef = {
    fullPath: 'task-attachments/task-1/test.txt',
    bucket: 'test-bucket',
    name: 'test.txt'
  } as StorageReference;

  const mockUploadTaskSnapshot: UploadTaskSnapshot = {
    ref: mockStorageRef,
    bytesTransferred: 100,
    totalBytes: 100,
    state: 'success',
    metadata: {
      fullPath: 'task-attachments/task-1/test.txt',
      name: 'test.txt',
      size: 100,
      contentType: 'text/plain',
      bucket: 'test-bucket',
      generation: '1',
      metageneration: '1',
      timeCreated: new Date().toISOString(),
      updated: new Date().toISOString(),
      md5Hash: 'test-hash',
      downloadTokens: ['token123']
    },
    task: {} as any
  };

  const mockUnsubscribe = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock ref function
    (ref as jest.Mock).mockReturnValue(mockStorageRef);

    // Mock uploadBytesResumable
    (uploadBytesResumable as jest.Mock).mockReturnValue({
      on: jest.fn().mockImplementation((event, onNext, onError, onComplete) => {
        setTimeout(() => {
          if (typeof onNext === 'function') {
            onNext(mockUploadTaskSnapshot);
          } else if (onNext && typeof onNext === 'object') {
            onNext.next?.(mockUploadTaskSnapshot);
            onNext.complete?.();
          }
          onComplete?.();
        }, 0);
        return mockUnsubscribe;
      }),
      then: jest.fn().mockImplementation((onFulfilled) => {
        onFulfilled?.(mockUploadTaskSnapshot);
        return Promise.resolve(mockUploadTaskSnapshot);
      }),
      catch: jest.fn().mockReturnValue(Promise.resolve()),
      pause: jest.fn().mockReturnValue(Promise.resolve()),
      resume: jest.fn().mockReturnValue(Promise.resolve()),
      cancel: jest.fn().mockReturnValue(Promise.resolve()),
      snapshot: mockUploadTaskSnapshot
    });

    // Mock getDownloadURL
    (getDownloadURL as jest.Mock).mockResolvedValue('https://example.com/test.txt');

    // Mock deleteObject
    (deleteObject as jest.Mock).mockResolvedValue(undefined);
  });

  it('should upload file and return attachment data', async () => {
    const mockFile = new File(['test content'], 'test.txt', { type: 'text/plain' });
    const mockProgress = jest.fn();

    const attachment = await uploadTaskAttachment('task-1', mockFile, mockProgress);

    expect(ref).toHaveBeenCalled();
    expect(uploadBytesResumable).toHaveBeenCalledWith(mockStorageRef, mockFile);
    expect(getDownloadURL).toHaveBeenCalledWith(mockStorageRef);
    expect(mockProgress).toHaveBeenCalledWith({ progress: 100 });
    expect(attachment).toEqual({
      id: expect.any(String),
      taskId: 'task-1',
      fileName: 'test.txt',
      fileType: 'text/plain',
      fileSize: expect.any(Number),
      uploadedBy: expect.any(String),
      uploadedAt: expect.any(String),
      downloadUrl: 'https://example.com/test.txt',
      storedFileName: expect.stringContaining('test.txt')
    });
  });

  it('should handle upload failure', async () => {
    const mockFile = new File(['test content'], 'test.txt', { type: 'text/plain' });
    const mockError = new Error('Upload failed');

    (uploadBytesResumable as jest.Mock).mockReturnValue({
      on: jest.fn().mockImplementation((event, onNext, onError) => {
        setTimeout(() => {
          if (typeof onError === 'function') {
            onError(mockError);
          } else if (onNext && typeof onNext === 'object') {
            onNext.error?.(mockError);
          }
        }, 0);
        return mockUnsubscribe;
      })
    });

    await expect(uploadTaskAttachment('task-1', mockFile)).rejects.toThrow('Upload failed');
  });

  it('should delete file', async () => {
    await deleteTaskAttachment('task-1', 'test.txt');
    expect(ref).toHaveBeenCalled();
    expect(deleteObject).toHaveBeenCalledWith(mockStorageRef);
  });

  it('should handle delete failure', async () => {
    const mockError = new Error('Delete failed');
    (deleteObject as jest.Mock).mockRejectedValue(mockError);

    await expect(deleteTaskAttachment('task-1', 'test.txt')).rejects.toThrow('Delete failed');
  });
});
