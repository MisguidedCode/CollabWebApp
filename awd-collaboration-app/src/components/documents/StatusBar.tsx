import React from 'react';
import type { ProviderAwarenessState } from '../../types/editor';

interface StatusBarProps {
  isConnecting: boolean;
  error: string | null;
  readOnly: boolean;
  nextAutoSaveIn: number;
  lastDraftSavedAt: Date | null;
  collaborators: Record<string, ProviderAwarenessState>;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  isConnecting,
  error,
  readOnly,
  nextAutoSaveIn,
  lastDraftSavedAt,
  collaborators
}) => (
  <div className="flex items-center justify-between p-2 border-t border-gray-200 bg-gray-50">
    {/* Connection Status */}
    <div key="connection-status" className="flex items-center">
      {isConnecting ? (
        <div className="flex items-center text-yellow-600">
          <div className="w-2 h-2 mr-2 rounded-full bg-yellow-500 animate-pulse" />
          Connecting...
        </div>
      ) : error ? (
        <div className="flex items-center text-red-600">
          <div className="w-2 h-2 mr-2 rounded-full bg-red-500" />
          {error}
        </div>
      ) : (
        <div className="flex items-center text-green-600">
          <div className="w-2 h-2 mr-2 rounded-full bg-green-500" />
          Connected
        </div>
      )}
    </div>

    {/* Auto-save Status */}
    {!readOnly && (
      <div key="auto-save-status" className="text-sm text-gray-400">
        <span className="flex items-center">
          <div className={`w-1.5 h-1.5 mr-2 rounded-full ${
            nextAutoSaveIn === 0 ? 'bg-blue-400 animate-ping' : 'bg-gray-400'
          }`} />
          {lastDraftSavedAt ? (
            <>
              Auto-saved {lastDraftSavedAt.toLocaleTimeString()} 
              {nextAutoSaveIn > 0 && ` · Next in ${nextAutoSaveIn}s`}
            </>
          ) : (
            `Auto-save in ${nextAutoSaveIn}s`
          )}
        </span>
      </div>
    )}

    {/* Collaborators */}
    <div key="collaborators" className="flex items-center">
      <div className="flex -space-x-2 mr-2">
        {Object.values(collaborators).map((collaborator) => (
          <div
            key={collaborator.user.id}
            className="w-8 h-8 rounded-full border-2 border-white overflow-hidden"
            style={{ backgroundColor: collaborator.color }}
            title={collaborator.name}
          >
            {collaborator.user.photoURL ? (
              <img
                src={collaborator.user.photoURL}
                alt={collaborator.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white font-medium">
                {collaborator.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="text-sm text-gray-500">
        {Object.values(collaborators).length === 0 ? (
          'You are the only editor'
        ) : (
          `${Object.values(collaborators).length} other ${
            Object.values(collaborators).length === 1 ? 'person' : 'people'
          } editing`
        )}
      </div>
    </div>
  </div>
);

export default StatusBar;
