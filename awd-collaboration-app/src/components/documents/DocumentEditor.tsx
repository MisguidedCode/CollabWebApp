import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Collaboration from '@tiptap/extension-collaboration';
import CollaborationCursor from '@tiptap/extension-collaboration-cursor';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { useSelector } from 'react-redux';
import { documentStorage } from '../../utils/documentStorage';
import { RootState, useAppDispatch } from '../../store';
import {
  updateDocumentThunk,
  uploadDocumentContentThunk
} from '../../store/slices/documentSlice';
import { Document } from '../../types/document';
import { connectionManager } from '../../utils/WebSocketConnectionManager';

// Import toolbar components
import {
  Bold,
  Italic,
  Underline,
  Code,
  Heading1,
  Heading2,
  BulletList,
  OrderedList,
  CodeBlock,
  Blockquote,
  HorizontalRule,
  Undo,
  Redo,
  Save
} from './EditorToolbar';

// Typing for provider awareness state
interface ProviderAwarenessState {
  name: string;
  color: string;
  user: {
    id: string;
    name: string;
    photoURL?: string;
  };
}

interface DocumentEditorProps {
  documentId: string;
  readOnly?: boolean;
  onSave?: (document: Document) => void;
}

// Helper function to get a random color
const getRandomColor = () => {
  const colors = [
    '#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5',
    '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4caf50',
    '#8bc34a', '#cddc39', '#ffeb3b', '#ffc107', '#ff9800',
    '#ff5722', '#795548', '#607d8b'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

const DocumentEditor: React.FC<DocumentEditorProps> = ({ documentId, readOnly = false, onSave }) => {
  const dispatch = useAppDispatch();
  const user = useSelector((state: RootState) => state.auth.user);
  const document = useSelector((state: RootState) => 
    state.documents.currentDocument?.id === documentId 
      ? state.documents.currentDocument 
      : null
  );
  
  const [isSaving, setIsSaving] = useState(false);
  const [isConnecting, setIsConnecting] = useState(true);
  const [isProviderReady, setIsProviderReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasDraft, setHasDraft] = useState(false);
  const [collaborators, setCollaborators] = useState<{[key: string]: ProviderAwarenessState}>({});
  const [isRestoringDraft, setIsRestoringDraft] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [lastDraftSavedAt, setLastDraftSavedAt] = useState<Date | null>(null);
  const [nextAutoSaveIn, setNextAutoSaveIn] = useState<number>(30);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [editorKey, setEditorKey] = useState(0);
  
  // References for Yjs and WebsocketProvider
  const ydocRef = useRef<Y.Doc | null>(null);
  const providerRef = useRef<WebsocketProvider | null>(null);
  const fragmentRef = useRef<Y.XmlFragment | null>(null);

  // Initialize Y.js document
  useEffect(() => {
    if (!ydocRef.current) {
      ydocRef.current = new Y.Doc();
      fragmentRef.current = ydocRef.current.getXmlFragment('document-content');
      console.log("Created new Y.js document");
    }
    
    return () => {
      if (ydocRef.current) {
        ydocRef.current.destroy();
        ydocRef.current = null;
        fragmentRef.current = null;
        console.log("Destroyed Y.js document");
      }
    };
  }, []);
  
  // Setup WebSocket connection for collaboration
  useEffect(() => {
    if (!documentId || !user || !ydocRef.current) return;
    
    try {
      const wsUrl = 'ws://localhost:4444';
      console.log(`Connecting to WebSocket at ${wsUrl} for document ${documentId}`);
      
      const provider = new WebsocketProvider(
        wsUrl,
        `document-${documentId}`,
        ydocRef.current
      );
      
      providerRef.current = provider;
      
      provider.awareness.setLocalStateField('user', {
        id: user.uid,
        name: user.displayName || user.email || 'Anonymous',
        photoURL: user.photoURL,
      });
      
      provider.awareness.setLocalStateField('color', getRandomColor());
      provider.awareness.setLocalStateField('name', user.displayName || user.email || 'Anonymous');
      
      const componentId = `DocEditor_${documentId}`;
      const statusHandler = (event: { status: string }) => {
        console.log("WebSocket status changed:", event.status);
        if (event.status === 'connected') {
          setIsProviderReady(true);
          setIsConnecting(false);
          setError(null);
        } else if (event.status === 'disconnected') {
          setIsProviderReady(false);
          setIsConnecting(true);
          setError('Disconnected from collaboration server. Trying to reconnect...');
        }
      };

      const awarenessHandler = () => {
        const states = provider.awareness.getStates() as Map<number, ProviderAwarenessState>;
        const collaboratorsObj: {[key: string]: ProviderAwarenessState} = {};
        
        states.forEach((state, clientId) => {
          if (state.user && state.user.id !== user.uid) {
            collaboratorsObj[state.user.id] = state;
          }
        });
        
        setCollaborators(collaboratorsObj);
      };

      provider.on('status', statusHandler);
      provider.awareness.on('update', awarenessHandler);
      
      // Register with the connection manager
      connectionManager.registerListener(documentId, componentId);

      console.log("WebSocket connection established");
      
      return () => {
        console.log("Disconnecting from WebSocket server");
        provider.off('status', statusHandler);
        provider.awareness.off('update', awarenessHandler);
        connectionManager.unregisterListener(documentId, componentId);
        provider.disconnect();
        providerRef.current = null;
        setIsProviderReady(false);
      };
    } catch (err) {
      console.error("Error connecting to WebSocket server:", err);
      setError(`Failed to connect to collaboration server: ${err instanceof Error ? err.message : String(err)}`);
      setIsConnecting(false);
      setIsProviderReady(false);
    }
  }, [documentId, user]);
  
  // Initialize TipTap editor with Yjs support
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        history: false,
      }),
      Collaboration.configure({
        document: ydocRef.current || new Y.Doc(),
        fragment: fragmentRef.current || undefined,
      }),
      // Only add CollaborationCursor when provider is ready
      ...(isProviderReady && providerRef.current ? [
        CollaborationCursor.configure({
          provider: providerRef.current,
          user: user ? {
            name: user.displayName || user.email || 'Anonymous',
            color: getRandomColor(),
          } : undefined,
        })
      ] : []),
    ],
    editable: !readOnly,
    content: '',
    onUpdate: ({ editor }) => {
      setHasUnsavedChanges(true);
    }
  }, [user, readOnly, isProviderReady, editorKey]);

  // Update collaboration settings when provider status changes
  useEffect(() => {
    if (editor && providerRef.current && isProviderReady) {
      // Force editor recreation when provider becomes ready
      setEditorKey(prev => prev + 1);
    }
  }, [editor, isProviderReady]);

  // Handle unsaved changes warning
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        const message = 'You have unsaved changes. Are you sure you want to leave?';
        e.returnValue = message;
        return message;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Check for existing draft on load
  useEffect(() => {
    if (!documentId || !user || readOnly) return;
    
    const draft = documentStorage.getDraft(documentId);
    if (draft) {
      setHasDraft(true);
    }
  }, [documentId, user, readOnly]);

  // Handle draft restoration
  useEffect(() => {
    if (!documentId || !user || !editor || !hasDraft || isRestoringDraft || readOnly) return;

    const restoreDraft = async () => {
      const draft = documentStorage.getDraft(documentId);
      if (!draft) return;

      const shouldRestore = window.confirm(
        `A draft from ${new Date(draft.lastModified).toLocaleString()} was found. Would you like to restore it?`
      );

      if (shouldRestore) {
        setIsRestoringDraft(true);
        editor.commands.setContent(draft.content);
        documentStorage.removeDraft(documentId);
        setHasDraft(false);
        setIsRestoringDraft(false);
      } else {
        documentStorage.removeDraft(documentId);
        setHasDraft(false);
      }
    };

    restoreDraft();
  }, [documentId, user, editor, hasDraft, isRestoringDraft, readOnly]);

  // Auto-save draft every 30 seconds
  useEffect(() => {
    if (!documentId || !editor || !user || readOnly) return;

    const autoSaveInterval = setInterval(async () => {
      const content = editor.getHTML();
      await documentStorage.saveDraft(documentId, content);
      setLastDraftSavedAt(new Date());
      setNextAutoSaveIn(30);
    }, 30000);

    const countdownInterval = setInterval(() => {
      setNextAutoSaveIn(prev => Math.max(0, prev - 1));
    }, 1000);

    return () => {
      clearInterval(autoSaveInterval);
      clearInterval(countdownInterval);
    };
  }, [documentId, editor, user, readOnly]);

  // Save document content
  const saveDocument = useCallback(async () => {
    if (!document || !editor || !user) return;
    
    try {
      setIsSaving(true);
      const htmlContent = editor.getHTML();
      
      const uploadSuccess = await dispatch(uploadDocumentContentThunk({
        documentId: document.id,
        content: htmlContent,
        userId: user.uid,
      })).unwrap();

      if (uploadSuccess) {
        await dispatch(updateDocumentThunk({
          document: {
            ...document,
            updatedBy: user.uid,
            updatedAt: new Date().toISOString()
          },
          userId: user.uid
        })).unwrap();

        await documentStorage.saveMetadata(document);
        documentStorage.removeDraft(document.id);
        setLastSavedAt(new Date());
        setHasUnsavedChanges(false);
        
        if (onSave) {
          onSave(document);
        }
        
        setError(null);
      }
    } catch (err) {
      setError(`Failed to save document: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsSaving(false);
    }
  }, [document, editor, user, dispatch, onSave]);
  
  // Create keyboard shortcut handler for Ctrl+S / Cmd+S to save
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveDocument();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [saveDocument]);
  
  if (!user) {
    return <div className="p-4 text-center">Please log in to edit documents</div>;
  }
  
  return (
    <div className="flex flex-col h-full border border-gray-200 rounded-lg shadow-sm bg-white relative">
      {/* Editor Loading State */}
      {!editor && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-10">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-2 animate-spin" />
            <div className="text-gray-600">Initializing editor...</div>
          </div>
        </div>
      )}
      
      {/* Editor Toolbar */}
      {!readOnly && editor && (
        <div className="flex flex-wrap items-center gap-1 p-2 border-b border-gray-200 bg-gray-50">
          <Bold editor={editor} />
          <Italic editor={editor} />
          <Underline editor={editor} />
          <Code editor={editor} />
          <div key="divider-1" className="w-px h-6 mx-1 bg-gray-300" />
          <Heading1 editor={editor} />
          <Heading2 editor={editor} />
          <div key="divider-2" className="w-px h-6 mx-1 bg-gray-300" />
          <BulletList editor={editor} />
          <OrderedList editor={editor} />
          <div key="divider-3" className="w-px h-6 mx-1 bg-gray-300" />
          <Blockquote editor={editor} />
          <CodeBlock editor={editor} />
          <HorizontalRule editor={editor} />
          <div key="divider-4" className="w-px h-6 mx-1 bg-gray-300" />
          <Undo editor={editor} />
          <Redo editor={editor} />
          <div key="flex-grow" className="flex-grow" />
          {hasUnsavedChanges && (
            <div key="unsaved-changes" className="text-sm text-yellow-600 mr-2 flex items-center">
              <div key="unsaved-indicator" className="w-2 h-2 mr-1 rounded-full bg-yellow-500 animate-pulse" />
              Unsaved changes
            </div>
          )}
          <Save 
            onClick={saveDocument} 
            isSaving={isSaving}
          />
        </div>
      )}
      
      {/* Status Bar */}
      <div key="status-bar" className="flex items-center justify-between p-2 border-b border-gray-200 bg-gray-50">
        {/* Connection Status */}
        <div key="connection-status" className="flex items-center">
          {isConnecting ? (
            <div key="connecting" className="flex items-center text-yellow-600">
              <div className="w-2 h-2 mr-2 rounded-full bg-yellow-500 animate-pulse" />
              Connecting to collaboration server...
            </div>
          ) : error ? (
            <div key="error" className="flex items-center text-red-600">
              <div className="w-2 h-2 mr-2 rounded-full bg-red-500" />
              {error}
            </div>
          ) : (
            <div key="connected" className="flex items-center text-green-600">
              <div className="w-2 h-2 mr-2 rounded-full bg-green-500" />
              Connected
            </div>
          )}
        </div>
        
        {/* Save Status & Draft Info */}
        <div key="save-status" className="flex items-center gap-4">
          {/* Save Status */}
          <div className="text-sm text-gray-500">
            <span className="flex items-center">
              {isSaving ? (
                <React.Fragment key="saving-indicator">
                  <div className="w-2 h-2 mr-2 rounded-full bg-blue-500 animate-pulse" />
                  Saving...
                </React.Fragment>
              ) : (
                <React.Fragment key="saved-indicator">
                  <div className="w-2 h-2 mr-2 rounded-full bg-green-500" />
                  {lastSavedAt ? (
                    <>
                      Saved {lastSavedAt.toLocaleTimeString()} 
                      {lastSavedAt.toDateString() !== new Date().toDateString() && 
                        ` on ${lastSavedAt.toLocaleDateString()}`
                      }
                    </>
                  ) : (
                    'All changes saved'
                  )}
                </React.Fragment>
              )}
            </span>
          </div>

          {/* Auto-save Status */}
          {!readOnly && (
            <div key="auto-save-status" className="text-sm text-gray-400">
              <span className="flex items-center">
                <div className={`w-1.5 h-1.5 mr-2 rounded-full ${
                  nextAutoSaveIn === 0 ? 'bg-blue-400 animate-ping' : 'bg-gray-400'
                }`} />
                {lastDraftSavedAt ? (
                  <React.Fragment key="draft-saved">
                    Auto-saved {lastDraftSavedAt.toLocaleTimeString()} 
                    {nextAutoSaveIn > 0 && ` · Next in ${nextAutoSaveIn}s`}
                  </React.Fragment>
                ) : (
                  <React.Fragment key="draft-pending">
                    {`Auto-save in ${nextAutoSaveIn}s`}
                  </React.Fragment>
                )}
              </span>
            </div>
          )}

          {/* Draft Available */}
          {hasDraft && !isRestoringDraft && (
            <div key="draft-available" className="text-sm text-yellow-600">
              <span className="flex items-center">
                <div className="w-2 h-2 mr-2 rounded-full bg-yellow-500" />
                Unsaved draft available
              </span>
            </div>
          )}
        </div>

        {/* Collaborators */}
        <div key="collaborators-section" className="flex items-center ml-4">
          {Object.values(collaborators).length > 0 && (
            <div key={`collaborators-container-${Object.values(collaborators).length}`} className="flex items-center space-x-1 mr-2">
              {Object.values(collaborators).map((collaborator, index) => (
                <div
                  key={`${collaborator.user.id}-${index}`}
                  className="flex items-center rounded-full px-2 py-1 text-xs text-white"
                  style={{ backgroundColor: collaborator.color }}
                  title={collaborator.name}
                >
                  {collaborator.user.photoURL ? (
                    <img
                      key={`avatar-${collaborator.user.id}`}
                      src={collaborator.user.photoURL}
                      alt={collaborator.name}
                      className="w-5 h-5 rounded-full mr-1"
                    />
                  ) : (
                    <div
                      key={`initial-${collaborator.user.id}`}
                      className="w-5 h-5 rounded-full mr-1 flex items-center justify-center text-white"
                      style={{ backgroundColor: collaborator.color }}
                    >
                      {collaborator.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span>{collaborator.name}</span>
                </div>
              ))}
            </div>
          )}
          <div key="collaborator-count" className="text-sm text-gray-500">
            {Object.values(collaborators).length === 0
              ? 'You are the only editor'
              : `${Object.values(collaborators).length} other ${
                  Object.values(collaborators).length === 1 ? 'person' : 'people'
                } editing`}
          </div>
        </div>
      </div>
      
      {/* Editor Content */}
      <div key="editor-content" className="flex-grow overflow-auto p-4">
        <div className="max-w-4xl mx-auto">
          <EditorContent editor={editor} className="prose max-w-none" />
        </div>
      </div>
      
      {/* Debug Information */}
      {process.env.NODE_ENV !== 'production' && (
        <div key="debug-info" className="p-2 border-t border-gray-200 bg-gray-50 text-xs text-gray-500">
          <details>
            <summary>Debug Info</summary>
            <div className="mt-1 space-y-1">
              <div key="debug-document-id">Document ID: {documentId}</div>
              <div key="debug-ydoc">Y.js Doc Initialized: {ydocRef.current ? 'Yes' : 'No'}</div>
              <div key="debug-fragment">XML Fragment Initialized: {fragmentRef.current ? 'Yes' : 'No'}</div>
              <div key="debug-provider">WebSocket Provider: {providerRef.current ? 'Connected' : 'Not Connected'}</div>
              <div key="debug-editor">Editor Initialized: {editor ? 'Yes' : 'No'}</div>
              <div key="debug-provider-ready">Provider Ready: {isProviderReady ? 'Yes' : 'No'}</div>
              <div key="debug-collaborators">Collaborators: {Object.keys(collaborators).length}</div>
            </div>
          </details>
        </div>
      )}
    </div>
  );
};

export default DocumentEditor;
