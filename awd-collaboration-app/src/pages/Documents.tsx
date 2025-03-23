import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { RootState, useAppDispatch } from '../store';
import { 
  fetchUserDocumentsThunk, 
  fetchSharedDocumentsThunk,
  fetchRecentDocumentsThunk,
  createDocumentThunk 
} from '../store/slices/documentSlice';
import { Document, DocumentType } from '../types/document';
import DocumentList from '../components/documents/DocumentList';
import {
  PlusIcon,
  DocumentTextIcon,
  TableCellsIcon,
  PresentationChartBarIcon,
  DocumentIcon
} from '@heroicons/react/24/outline';

const DocumentsPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  
  const user = useSelector((state: RootState) => state.auth.user);
  const { documents, recentDocuments, starredDocuments, loading, error } = useSelector(
    (state: RootState) => state.documents
  );
  
  const [isCreateMenuOpen, setIsCreateMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'recent' | 'starred'>('all');
  
  // Fetch documents on mount
  useEffect(() => {
    if (user) {
      dispatch(fetchUserDocumentsThunk(user.uid));
      dispatch(fetchSharedDocumentsThunk(user.uid));
      dispatch(fetchRecentDocumentsThunk({ userId: user.uid, maxCount: 5 }));
    }
  }, [dispatch, user]);
  
  // Filter starred documents
  const filteredStarredDocuments = documents.filter(doc => doc.starred);
  
  // Create new document
  const handleCreateDocument = async (type: DocumentType) => {
    if (!user) return;
    
    try {
      // Create document metadata
      const newDocument: Omit<Document, 'id' | 'createdAt' | 'updatedAt'> = {
        title: `Untitled ${type} document`,
        type,
        createdBy: user.uid,
        updatedBy: user.uid,
        status: 'draft',
        permissions: {
          owner: user.uid,
          readers: [],
          editors: [],
          commenters: [],
          public: false
        }
      };
      
      const createdDocument = await dispatch(createDocumentThunk(newDocument)).unwrap();
      
      // Navigate to the document edit page
      navigate(`/documents/${createdDocument.id}/edit`);
    } catch (error) {
      console.error('Failed to create document:', error);
    } finally {
      setIsCreateMenuOpen(false);
    }
  };
  
  // Handle document click
  const handleDocumentClick = (document: Document) => {
    navigate(`/documents/${document.id}`);
  };
  
  // Loading state
  if (loading && documents.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
        <p className="font-bold">Error</p>
        <p>{error}</p>
      </div>
    );
  }
  
  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Documents</h1>
          
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsCreateMenuOpen(!isCreateMenuOpen)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
              Create
            </button>
            
            {isCreateMenuOpen && (
              <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                <div className="py-1" role="menu" aria-orientation="vertical">
                  <button
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                    onClick={() => handleCreateDocument('text')}
                  >
                    <DocumentTextIcon className="mr-3 h-5 w-5 text-blue-600" />
                    Text Document
                  </button>
                  <button
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                    onClick={() => handleCreateDocument('spreadsheet')}
                  >
                    <TableCellsIcon className="mr-3 h-5 w-5 text-green-600" />
                    Spreadsheet
                  </button>
                  <button
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                    onClick={() => handleCreateDocument('presentation')}
                  >
                    <PresentationChartBarIcon className="mr-3 h-5 w-5 text-orange-600" />
                    Presentation
                  </button>
                  <button
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                    onClick={() => handleCreateDocument('other')}
                  >
                    <DocumentIcon className="mr-3 h-5 w-5 text-gray-600" />
                    Other Document
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'all'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                onClick={() => setActiveTab('all')}
              >
                All Documents
              </button>
              <button
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'recent'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                onClick={() => setActiveTab('recent')}
              >
                Recent
              </button>
              <button
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'starred'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                onClick={() => setActiveTab('starred')}
              >
                Starred
              </button>
            </nav>
          </div>
        </div>
        
        {/* Document lists */}
        <div className="space-y-6">
          {activeTab === 'all' && (
            <DocumentList
              documents={documents}
              title="All Documents"
              emptyMessage="You don't have any documents yet. Create a new one to get started."
              onDocumentClick={handleDocumentClick}
            />
          )}
          
          {activeTab === 'recent' && (
            <DocumentList
              documents={recentDocuments}
              title="Recent Documents"
              emptyMessage="You haven't opened any documents recently."
              onDocumentClick={handleDocumentClick}
            />
          )}
          
          {activeTab === 'starred' && (
            <DocumentList
              documents={filteredStarredDocuments}
              title="Starred Documents"
              emptyMessage="You haven't starred any documents yet."
              onDocumentClick={handleDocumentClick}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentsPage;