import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState, useAppDispatch } from '../../store';
import { 
  starDocument, 
  unstarDocument, 
  deleteDocumentThunk 
} from '../../store/slices/documentSlice';
import { Document, DocumentType } from '../../types/document';
import { 
  DocumentTextIcon, 
  TableCellsIcon, 
  PresentationChartBarIcon, 
  DocumentIcon,
  StarIcon, 
  TrashIcon, 
  PencilIcon,
  EllipsisVerticalIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';

interface DocumentListProps {
  documents: Document[];
  title?: string;
  emptyMessage?: string;
  showActions?: boolean;
  onDocumentClick?: (document: Document) => void;
}

const DocumentList: React.FC<DocumentListProps> = ({
  documents,
  title = 'Documents',
  emptyMessage = 'No documents found',
  showActions = true,
  onDocumentClick
}) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.auth.user);
  
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);
  
  // Helper to get the appropriate icon for document type
  const getDocumentIcon = (type: DocumentType) => {
    switch (type) {
      case 'text':
        return <DocumentTextIcon className="w-8 h-8 text-blue-600" />;
      case 'spreadsheet':
        return <TableCellsIcon className="w-8 h-8 text-green-600" />;
      case 'presentation':
        return <PresentationChartBarIcon className="w-8 h-8 text-orange-600" />;
      case 'pdf':
        return <DocumentIcon className="w-8 h-8 text-red-600" />;
      default:
        return <DocumentIcon className="w-8 h-8 text-gray-600" />;
    }
  };
  
  // Format date to readable string
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  // Handle document click
  const handleDocumentClick = (document: Document) => {
    if (onDocumentClick) {
      onDocumentClick(document);
    } else {
      navigate(`/documents/${document.id}`);
    }
  };
  
  // Handle star/unstar
  const handleStarToggle = (e: React.MouseEvent, document: Document) => {
    e.stopPropagation();
    if (document.starred) {
      dispatch(unstarDocument(document.id));
    } else {
      dispatch(starDocument(document.id));
    }
  };
  
  // Handle delete
  const handleDelete = async (e: React.MouseEvent, document: Document) => {
    e.stopPropagation();
    
    if (window.confirm(`Are you sure you want to delete "${document.title}"?`)) {
      try {
        await dispatch(deleteDocumentThunk({
          documentId: document.id,
          userId: user!.uid
        })).unwrap();
        
        // Document deleted successfully - handled by Redux state
      } catch (error) {
        console.error('Failed to delete document:', error);
        // Show error alert to user
        window.alert(`Failed to delete document: ${error instanceof Error ? error.message : 'Unknown error occurred'}`);
      }
    }
    
    setActionMenuOpen(null);
  };
  
  // Toggle action menu
  const toggleActionMenu = (e: React.MouseEvent, documentId: string) => {
    e.stopPropagation();
    setActionMenuOpen(actionMenuOpen === documentId ? null : documentId);
  };
  
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {title && (
        <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900">{title}</h3>
          <span className="text-sm text-gray-500">{documents.length} document{documents.length !== 1 ? 's' : ''}</span>
        </div>
      )}
      
      {documents.length === 0 ? (
        <div className="p-6 text-center text-gray-500">
          {emptyMessage}
        </div>
      ) : (
        <ul className="divide-y divide-gray-200">
          {documents.map((document) => (
            <li
              key={document.id}
              className="hover:bg-gray-50 cursor-pointer"
              onClick={() => handleDocumentClick(document)}
            >
              <div className="flex items-center px-4 py-4 sm:px-6">
                <div className="flex-shrink-0">
                  {getDocumentIcon(document.type)}
                </div>
                <div className="ml-4 flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-primary-600 truncate">{document.title}</p>
                    <div className="ml-2 flex-shrink-0 flex">
                      <p className="text-xs text-gray-500 whitespace-nowrap">
                        Updated {formatDate(document.updatedAt)}
                      </p>
                    </div>
                  </div>
                  <div className="mt-1 flex justify-between">
                    <div className="flex items-center text-sm text-gray-500">
                      {document.tags && document.tags.length > 0 && (
                        <div className="flex items-center mr-4">
                          <span className="text-xs text-gray-500">Tags:</span>
                          <div className="ml-1 flex space-x-1">
                            {document.tags.slice(0, 3).map((tag) => (
                              <span
                                key={tag}
                                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
                              >
                                {tag}
                              </span>
                            ))}
                            {document.tags.length > 3 && (
                              <span className="text-xs text-gray-500">+{document.tags.length - 3} more</span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {showActions && (
                      <div className="flex space-x-2">
                        <button
                          type="button"
                          onClick={(e) => handleStarToggle(e, document)}
                          className="text-gray-400 hover:text-yellow-500 focus:outline-none"
                        >
                          {document.starred ? (
                            <StarIconSolid className="h-5 w-5 text-yellow-500" />
                          ) : (
                            <StarIcon className="h-5 w-5" />
                          )}
                          <span className="sr-only">{document.starred ? 'Unstar' : 'Star'}</span>
                        </button>
                        
                        <div className="relative">
                          <button
                            type="button"
                            onClick={(e) => toggleActionMenu(e, document.id)}
                            className="text-gray-400 hover:text-gray-500 focus:outline-none"
                          >
                            <EllipsisVerticalIcon className="h-5 w-5" />
                            <span className="sr-only">Options</span>
                          </button>
                          
                          {actionMenuOpen === document.id && (
                            <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                              <div className="py-1" role="menu" aria-orientation="vertical">
                                <button
                                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/documents/${document.id}/edit`);
                                    setActionMenuOpen(null);
                                  }}
                                >
                                  <PencilIcon className="h-4 w-4 inline mr-2" />
                                  Edit
                                </button>
                                
                                {user && document.createdBy === user.uid && (
                                  <button
                                    className="w-full text-left px-4 py-2 text-sm text-red-700 hover:bg-red-50"
                                    onClick={(e) => handleDelete(e, document)}
                                  >
                                    <TrashIcon className="h-4 w-4 inline mr-2" />
                                    Delete
                                  </button>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default DocumentList;
