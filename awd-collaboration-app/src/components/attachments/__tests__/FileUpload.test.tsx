import { render, fireEvent, screen } from '@testing-library/react';
import FileUpload from '../FileUpload';

jest.mock('../../../hooks/useTaskAttachment', () => ({
  useTaskAttachment: () => ({
    uploadFile: jest.fn(),
    uploadProgress: {},
  }),
}));

describe('FileUpload', () => {
  it('renders upload button', () => {
    render(<FileUpload taskId="test-task" />);
    expect(screen.getByText('Attach File')).toBeInTheDocument();
  });

});