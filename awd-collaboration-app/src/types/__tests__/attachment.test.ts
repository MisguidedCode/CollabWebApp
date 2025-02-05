import { isValidFileType, isValidFileSize, FILE_CONSTRAINTS } from '../attachment';

describe('File Validation', () => {
  it('should validate allowed file types', () => {
    const validFile = new File([''], 'test.pdf', { type: 'application/pdf' });
    expect(isValidFileType(validFile)).toBe(true);
    
    const invalidFile = new File([''], 'test.exe', { type: 'application/x-msdownload' });
    expect(isValidFileType(invalidFile)).toBe(false);
  });

  it('should validate file size', () => {
    const smallFile = new File(['small'], 'small.txt', { type: 'text/plain' });
    Object.defineProperty(smallFile, 'size', { value: 1024 }); // 1KB
    expect(isValidFileSize(smallFile)).toBe(true);

    const largeFile = new File(['large'], 'large.txt', { type: 'text/plain' });
    Object.defineProperty(largeFile, 'size', { value: FILE_CONSTRAINTS.MAX_FILE_SIZE + 1 });
    expect(isValidFileSize(largeFile)).toBe(false);
  });
});