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
import type { Document } from '../../types/document';
import type { EditorState, ProviderAwarenessState } from '../../types/editor';
import { connectionManager } from '../../utils/WebSocketConnectionManager';
import { getRandomColor } from '../../utils/editorUtils';
import StatusBar from './StatusBar';
import EditorToolbar from './EditorToolbar';
import { debounce } from 'lodash';

const AUTOSAVE_DELAY = 2000;
const DRAFT_KEY_PREFIX = 'doc_draft_';
const LOCAL_STORAGE_VERSION = '1.0';
const RECONNECT_INTERVAL = 3000;
const MAX_RECONNECT_ATTEMPTS = 5;

interface DocumentEditorProps {
  documentId: string;
  readOnly?: boolean;
  onSave?: (document: Document) => void;
}

const DocumentEditor: React.FC<DocumentEditorProps> = ({
  documentId,
  readOnly = false,
  onSave
}) => {
  const dispatch = useAppDispatch();
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const document = useSelector((state: RootState) => 
    state.documents.documents.find((doc: Document) => doc.id === documentId)
  );

  const [editorState, setEditorState] = useState<EditorState>({
    initialized: false,
    collaborationState: {
      connected: false,
      usersOnline: []
    },
    unsavedChanges: false,
    lastSavedAt: undefined,
    error: null
  });

  const [autoSaveCountdown, setAutoSaveCountdown] = useState(AUTOSAVE_DELAY / 1000);
  const ydoc = useRef<Y.Doc>(new Y.Doc());
  const provider = useRef<WebsocketProvider | null>(null);
  const reconnectAttempts = useRef(0);
  const isRestoringDraft = useRef(false);

  // Basic editor setup without collaboration features initially
  const editor = useEditor({
    extensions: [
      StarterKit,
      Collaboration.configure({
        document: ydoc.current,
        field: 'content'
      })
    ],
    editable: !readOnly,
    content: document?.content || ''
  });

  // Initialize WebSocket connection and collaboration features
  const initializeCollaboration = useCallback(() => {
    if (!editor || !currentUser) return;
    
    // Skip collaboration setup if it's not enabled or metadata is missing
    if (!document?.metadata?.collaborativeEditingEnabled) {
      setEditorState(prev => ({
        ...prev,
        initialized: true,
        collaborationState: {
          ...prev.collaborationState,
          connected: true
        }
      }));
      return;
    }

    try {
      if (provider.current) {
        provider.current.destroy();
      }

      provider.current = new WebsocketProvider(
        process.env.VITE_WEBSOCKET_URL || 'ws://localhost:1234',
        `document-${documentId}`,
        ydoc.current,
        {
          connect: true
        }
      );

      // Add collaboration cursor extension after provider is ready
      editor.setOptions({
        extensions: [
          StarterKit,
          Collaboration.configure({
            document: ydoc.current,
            field: 'content'
          }),
          CollaborationCursor.configure({
            provider: provider.current,
            user: {
              name: currentUser.displayName || 'Anonymous',
              color: getRandomColor(),
              id: currentUser.uid
            }
          })
        ]
      });

      provider.current.on('status', ({ status }) => {
        setEditorState(prev => ({
          ...prev,
          initialized: true,
          collaborationState: {
            ...prev.collaborationState,
            connected: status === 'connected'
          },
          error: status === 'disconnected' ? 'Connection lost' : null
        }));
      });

      if (provider.current.awareness) {
        provider.current.awareness.on('change', () => {
          if (!provider.current?.awareness) return;
          
          const states = Array.from(provider.current.awareness.getStates().values());
          const mappedStates: ProviderAwarenessState[] = states.map(state => ({
            name: (state as any).name || 'Anonymous',
            color: (state as any).color || getRandomColor(),
            user: {
              id: (state as any).clientID,
              name: (state as any).name || 'Anonymous'
            }
          }));

          setEditorState(prev => ({
            ...prev,
            collaborationState: {
              ...prev.collaborationState,
              usersOnline: mappedStates
            }
          }));
        });
      }

      reconnectAttempts.current = 0;
    } catch (error) {
      console.error('Failed to initialize collaboration:', error);
      setEditorState(prev => ({
        ...prev,
        error: 'Failed to initialize collaboration'
      }));
      handleReconnection();
    }
  }, [documentId, currentUser, document, editor]);

  // Handle WebSocket reconnection
  const handleReconnection = useCallback(() => {
    if (reconnectAttempts.current >= MAX_RECONNECT_ATTEMPTS) {
      setEditorState(prev => ({
        ...prev,
        error: 'Failed to reconnect after multiple attempts'
      }));
      return;
    }

    setTimeout(() => {
      reconnectAttempts.current++;
      initializeCollaboration();
    }, RECONNECT_INTERVAL);
  }, [initializeCollaboration]);

  // Autosave with debounce
  const debouncedSave = useCallback(
    debounce(async (content: string) => {
      if (!document || !currentUser) return;

      try {
        await dispatch(uploadDocumentContentThunk({
          documentId,
          content,
          userId: currentUser.uid
        }));

        setEditorState(prev => ({
          ...prev,
          unsavedChanges: false,
          lastSavedAt: new Date(),
          error: null
        }));

        onSave?.(document);
      } catch (error) {
        console.error('Failed to save document:', error);
        setEditorState(prev => ({
          ...prev,
          error: 'Failed to save changes'
        }));
        // Store as draft if save fails
        documentStorage.saveDraft(documentId, content);
      }
    }, AUTOSAVE_DELAY),
    [document, currentUser, documentId, onSave]
  );

  // Initialize collaboration when document and editor are ready
  useEffect(() => {
    if (!document || !editor || readOnly) return;
    initializeCollaboration();
  }, [document, editor, readOnly, initializeCollaboration]);

  // Handle editor updates
  useEffect(() => {
    if (!editor || readOnly) return;

    const handleUpdate = () => {
      const content = editor.getHTML();
      setEditorState(prev => ({ ...prev, unsavedChanges: true }));
      setAutoSaveCountdown(AUTOSAVE_DELAY / 1000);
      debouncedSave(content);
    };

    editor.on('update', handleUpdate);

    return () => {
      editor.off('update', handleUpdate);
    };
  }, [editor, readOnly, debouncedSave]);

  // Handle cleanup
  useEffect(() => {
    return () => {
      if (provider.current) {
        provider.current.destroy();
      }
      debouncedSave.cancel();
      ydoc.current.destroy();
    };
  }, [debouncedSave]);

  // Auto-save countdown
  useEffect(() => {
    if (!editorState.unsavedChanges || readOnly) return;

    const timer = setInterval(() => {
      setAutoSaveCountdown(prev => {
        if (prev <= 0) return 0;
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [editorState.unsavedChanges, readOnly]);

  // Monitor connection status
  useEffect(() => {
    return connectionManager.subscribe('connectionStatus', (connected: boolean) => {
      if (!connected) {
        handleReconnection();
      }
    });
  }, [handleReconnection]);

  if (!document || !editor) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex flex-col h-full">
      <EditorToolbar editor={editor} />
      <div className="flex-1 overflow-y-auto p-4">
        <EditorContent editor={editor} className="prose max-w-none" />
      </div>
      <StatusBar
        isConnecting={!editorState.collaborationState.connected}
        error={editorState.error}
        readOnly={readOnly}
        nextAutoSaveIn={autoSaveCountdown}
        lastDraftSavedAt={editorState.lastSavedAt || null}
        collaborators={editorState.collaborationState.usersOnline.reduce((acc, user) => {
          acc[user.user.id] = user;
          return acc;
        }, {} as Record<string, ProviderAwarenessState>)}
      />
    </div>
  );
};

export default DocumentEditor;
