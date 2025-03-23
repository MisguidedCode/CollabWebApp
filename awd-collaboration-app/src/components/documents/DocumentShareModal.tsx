import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState, useAppDispatch } from '../../store';
import { updateDocumentThunk } from '../../store/slices/documentSlice';
import { Document } from '../../types/document';
import { CollaborationPermission } from '../../types/permissions';
import { shareDocumentWithUser } from '../../services/documentService';
import { 
  XMarkIcon, 
  UserPlusIcon, 
  ClipboardDocumentIcon, 
  GlobeAltIcon 
} from '@heroicons/react/24/outline';
import { CheckIcon } from '@heroicons/react/24/solid';

interface DocumentShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: Document;
}

interface ShareOption {
  key: 'readers' | 'editors' | 'commenters';
  label: string;
  description: string;
}

const shareOptions: ShareOption[] = [
  {
    key: 'readers',
    label: 'Viewer',
    description: 'Can view the document but cannot edit or comment'
  },
  {
    key: 'commenters',
    label: 'Commenter',
    description: 'Can view and comment but cannot edit'
  },
  {
    key: 'editors',
    label: 'Editor',
    description: 'Can view, comment, and edit'
  }
];

const DocumentShareModal: React.FC<DocumentShareModalProps> = ({ isOpen, onClose, document }) => {
  const dispatch = useAppDispatch();
  const user = useSelector((state: RootState) => state.auth.user);
  
  const [email, setEmail] = useState('');
  const [selectedOption, setSelectedOption] = useState<'readers' | 'editors' | 'commenters'>('readers');
  const [isPrivate, setIsPrivate] = useState(!document.permissions.public);
  const [publicPermission, setPublicPermission] = useState<CollaborationPermission>(
    document.permissions.publicPermission || 'view'
  );
  const [isSaving, setIsSaving] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  
  // Reset state when document changes
  useEffect(() => {
    setIsPrivate(!document.permissions.public);
    setPublicPermission(document.permissions.publicPermission || 'view');
  }, [document]);
  
  // Generate a share link
  const getShareLink = () => {
    return `${window.location.origin}/documents/${document.id}`;
  };
  
  // Handle email input change
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  };
  
  // Handle share option change
  const handleOptionChange = (option: 'readers' | 'editors' | 'commenters') => {
    setSelectedOption(option);
  };
  
  // Handle privacy change
  const handlePrivacyChange = async (isPrivate: boolean) => {
    if (!user) return;
    
    setIsSaving(true);
    setError(null);
    
    try {
      // Update document permissions
      await dispatch(updateDocumentThunk({
        ...document,
        permissions: {
          ...document.permissions,
          public: !isPrivate,
          publicPermission: publicPermission,
        },
        updatedBy: user.uid,
        updatedAt: new Date().toISOString()
      })).unwrap();
      
      setIsPrivate(isPrivate);
    } catch (err) {
      setError(`Failed to update document privacy: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsSaving(false);
    }
  };
  
  // Handle public permission change
  const handlePublicPermissionChange = async (permission: CollaborationPermission) => {
    if (!user) return;
    
    setIsSaving(true);
    setError(null);
    
    try {
      // Update document permissions
      await dispatch(updateDocumentThunk({
        ...document,
        permissions: {
          ...document.permissions,
          public: !isPrivate,
          publicPermission: permission,
        },
        updatedBy: user.uid,
        updatedAt: new Date().toISOString()
      })).unwrap();
      
      setPublicPermission(permission);
    } catch (err) {
      setError(`Failed to update public permissions: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsSaving(false);
    }
  };
  
  // Handle share with user
  const handleShareWithUser = async () => {
    if (!user || !email) return;
    
    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }
    
    setIsSaving(true);
    setError(null);
    setShareSuccess(false);
    
    try {
      // Share the document with the user
      await shareDocumentWithUser(document.id, email, selectedOption);
      
      setShareSuccess(true);
      setEmail('');
      setTimeout(() => setShareSuccess(false), 3000);
    } catch (err) {
      setError(`Failed to share document: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsSaving(false);
    }
  };
  
  // Handle copy link
  const handleCopyLink = () => {
    navigator.clipboard.writeText(getShareLink())
      .then(() => {
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 3000);
      })
      .catch(() => {
        setError('Failed to copy link to clipboard');
      });
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen p-4 text-center sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose}></div>
        
        <div className="relative inline-block px-4 pt-5 pb-4 overflow-hidden text-left align-bottom transition-all transform bg-white rounded-lg shadow-xl sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
          <div className="absolute top-0 right-0 pt-4 pr-4">
            <button
              type="button"
              className="text-gray-400 bg-white rounded-md hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              onClick={onClose}
            >
              <span className="sr-only">Close</span>
              <XMarkIcon className="w-6 h-6" aria-hidden="true" />
            </button>
          </div>
          
          <div className="sm:flex sm:items-start">
            <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
              <h3 className="text-lg font-medium leading-6 text-gray-900">Share "{document.title}"</h3>
              
              {/* Error message */}
              {error && (
                <div className="mt-2 p-2 bg-red-50 text-sm text-red-600 rounded">
                  {error}
                </div>
              )}
              
              {/* People section */}
              <div className="mt-4">
                <div className="flex items-center space-x-2 mb-2">
                  <UserPlusIcon className="h-5 w-5 text-gray-400" />
                  <h4 className="text-sm font-medium text-gray-900">People</h4>
                </div>
                
                <div className="flex space-x-2">
                  <input
                    type="email"
                    value={email}
                    onChange={handleEmailChange}
                    placeholder="Add people by email"
                    className="flex-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  />
                  
                  <div className="relative inline-block text-left">
                    <select
                      value={selectedOption}
                      onChange={(e) => handleOptionChange(e.target.value as any)}
                      className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                    >
                      {shareOptions.map((option) => (
                        <option key={option.key} value={option.key}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <button
                    type="button"
                    onClick={handleShareWithUser}
                    disabled={!email || isSaving}
                    className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 ${
                      !email || isSaving ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {isSaving ? 'Sharing...' : shareSuccess ? 'Shared!' : 'Share'}
                  </button>
                </div>
                
                {/* Description for selected option */}
                <p className="mt-1 text-xs text-gray-500">
                  {shareOptions.find(option => option.key === selectedOption)?.description}
                </p>
              </div>
              
              {/* Link sharing section */}
              <div className="mt-6">
                <div className="flex items-center space-x-2 mb-2">
                  <ClipboardDocumentIcon className="h-5 w-5 text-gray-400" />
                  <h4 className="text-sm font-medium text-gray-900">Get link</h4>
                </div>
                
                <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-md">
                  <div className="flex-1 overflow-hidden">
                    <p className="text-sm text-gray-600 truncate">{getShareLink()}</p>
                  </div>
                  
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    {copySuccess ? (
                      <>
                        <CheckIcon className="h-4 w-4 mr-1 text-green-500" />
                        Copied
                      </>
                    ) : (
                      'Copy link'
                    )}
                  </button>
                </div>
              </div>
              
              {/* Privacy settings */}
              <div className="mt-6">
                <div className="flex items-center space-x-2 mb-2">
                  <GlobeAltIcon className="h-5 w-5 text-gray-400" />
                  <h4 className="text-sm font-medium text-gray-900">Privacy</h4>
                </div>
                
                <div className="border border-gray-200 rounded-md overflow-hidden">
                  <button
                    type="button"
                    onClick={() => handlePrivacyChange(true)}
                    className={`w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-left ${
                      isPrivate ? 'bg-primary-50 text-primary-700' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div>
                      <p className="font-medium">Restricted</p>
                      <p className="text-xs text-gray-500">Only people added can open</p>
                    </div>
                    {isPrivate && <CheckIcon className="h-5 w-5 text-primary-600" />}
                  </button>
                  
                  <div className="border-t border-gray-200"></div>
                  
                  <button
                    type="button"
                    onClick={() => handlePrivacyChange(false)}
                    className={`w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-left ${
                      !isPrivate ? 'bg-primary-50 text-primary-700' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div>
                      <p className="font-medium">Anyone with the link</p>
                      <p className="text-xs text-gray-500">Anyone on the internet with the link can open</p>
                    </div>
                    {!isPrivate && <CheckIcon className="h-5 w-5 text-primary-600" />}
                  </button>
                </div>
                
                {/* Public access permissions */}
                {!isPrivate && (
                  <div className="mt-3">
                    <p className="text-sm font-medium text-gray-700 mb-2">Anyone with the link can:</p>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => handlePublicPermissionChange('view')}
                        className={`inline-flex items-center px-3 py-1 rounded text-sm border ${
                          publicPermission === 'view'
                            ? 'bg-primary-50 text-primary-700 border-primary-300'
                            : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        View
                        {publicPermission === 'view' && <CheckIcon className="ml-1 h-4 w-4" />}
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => handlePublicPermissionChange('comment')}
                        className={`inline-flex items-center px-3 py-1 rounded text-sm border ${
                          publicPermission === 'comment'
                            ? 'bg-primary-50 text-primary-700 border-primary-300'
                            : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        Comment
                        {publicPermission === 'comment' && <CheckIcon className="ml-1 h-4 w-4" />}
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => handlePublicPermissionChange('edit')}
                        className={`inline-flex items-center px-3 py-1 rounded text-sm border ${
                          publicPermission === 'edit'
                            ? 'bg-primary-50 text-primary-700 border-primary-300'
                            : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        Edit
                        {publicPermission === 'edit' && <CheckIcon className="ml-1 h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:w-auto sm:text-sm"
              onClick={onClose}
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentShareModal;