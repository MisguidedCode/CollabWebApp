import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState, useAppDispatch } from '../store';
import { 
  fetchDocumentByIdThunk,
  starDocument,
  unstarDocument
} from '../store/slices/documentSlice';
import DocumentEditor from '../components/documents/DocumentEditor';
import {
  ArrowLeftIcon,
  PencilIcon,
  ShareIcon,
  StarIcon as StarIconOutline,
  DocumentDuplicateIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import DocumentShareModal from '../components/documents/DocumentShareModal';

const DocumentView: React.FC = () => {
  const { documentId } = useParams<{ documentId: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  
  const user = useSelector((state: RootState) => state.auth.user);
  const { currentDocument, loading, error } = useSelector(
    (state: RootState) => state.documents
  );
  
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  
  // Fetch document when component mounts
  useEffect(() => {
    if (documentId && user) {
      dispatch(fetchDocumentByIdThunk({ documentId, userId: user.uid }));
    }
  }, [dispatch, documentId, user]);
  
  // Handle navigate back
  const handleBack = () => {
    navigate('/documents');
  };
  
  // Handle edit button click
  const handleEdit = () => {
    if (documentId) {
      navigate(`/documents/${documentId}/edit`);
    }
  };
  
  // Handle star/unstar
  const handleStarToggle = () => {
    if (!currentDocument) return;
    
    if (currentDocument.starred) {
      dispatch(unstarDocument(currentDocument.id));
    } else {
      dispatch(starDocument(currentDocument.id));
    }
  };
  
  // Handle download
  const handleDownload = () => {
    if (!currentDocument || !currentDocument.contentUrl) return;
    
    // Open the download URL in a new tab
    window.open(currentDocument.contentUrl, '_blank');
  };
  
  // Determine document info display
  const getDocumentInfo = () => {
    if (!currentDocument) return null;
    
    const updatedDate = new Date(currentDocument.updatedAt).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    return `Last edited on ${updatedDate}`;
  };
  
  // Determine if user can edit the document
  const canEdit = currentDocument && user && (
    currentDocument.createdBy === user.uid ||
    currentDocument.permissions.editors.includes(user.uid)
  );
  
  // Loading state
  if (loading && !currentDocument) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-6">
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
          <p className="font-bold">Error</p>
          <p>{error}</p>
          <button
            className="mt-2 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            onClick={handleBack}
          >
            Go back
          </button>
        </div>
      </div>
    );
  }
  
  // Document not found state
  if (!currentDocument && !loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-6">
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4">
          <p className="font-bold">Document not found</p>
          <p>The document you're looking for doesn't exist or you don't have permission to view it.</p>
          <button
            className="mt-2 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-yellow-700 bg-yellow-100 hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
            onClick={handleBack}
          >
            Go back to documents
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-2">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleBack}
                className="p-1 rounded-full text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <ArrowLeftIcon className="h-5 w-5" />
              </button>
              
              <div>
                <h1 className="text-xl font-medium text-gray-900">{currentDocument?.title}</h1>
                <p className="text-sm text-gray-500">{getDocumentInfo()}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {canEdit && (
                <button
                  onClick={handleEdit}
                  className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  <PencilIcon className="h-4 w-4 mr-1" />
                  Edit
                </button>
              )}
              
              <button
                onClick={() => setIsShareModalOpen(true)}
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <ShareIcon className="h-4 w-4 mr-1" />
                Share
              </button>
              
              <button
                onClick={handleStarToggle}
                className="p-1 rounded-full text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                title={currentDocument?.starred ? 'Remove from starred' : 'Add to starred'}
              >
                {currentDocument?.starred ? (
                  <StarIconSolid className="h-5 w-5 text-yellow-500" />
                ) : (
                  <StarIconOutline className="h-5 w-5" />
                )}
              </button>
              
              <button
                onClick={handleDownload}
                className="p-1 rounded-full text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                title="Download"
                disabled={!currentDocument?.contentUrl}
              >
                <ArrowDownTrayIcon className="h-5 w-5" />
              </button>
              
              <button
                className="p-1 rounded-full text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                title="Make a copy"
              >
                <DocumentDuplicateIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Document Content */}
      <div className="flex-1 overflow-y-auto bg-gray-50 p-6">
        {currentDocument && documentId && (
          <DocumentEditor
            documentId={documentId}
            readOnly={!canEdit}
          />
        )}
      </div>
      
      {/* Share Modal */}
      {currentDocument && (
        <DocumentShareModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          document={currentDocument}
        />
      )}
    </div>
  );
};

export default DocumentView;
