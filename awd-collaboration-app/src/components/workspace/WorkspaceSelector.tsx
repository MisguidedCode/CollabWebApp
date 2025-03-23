import { useState, useRef, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { PlusIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import { RootState, useAppDispatch } from '../../store';
import { setCurrentWorkspace } from '../../store/slices/workspaceSlice';
import { Link } from 'react-router-dom';

const WorkspaceSelector = () => {
  const dispatch = useAppDispatch();
  const { workspaces, currentWorkspaceId } = useSelector((state: RootState) => state.workspace);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentWorkspace = workspaces.find(w => w.id === currentWorkspaceId);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Handle switching workspaces
  const handleSelectWorkspace = (workspaceId: string) => {
    dispatch(setCurrentWorkspace(workspaceId));
    setIsOpen(false);
  };

  if (!currentWorkspace && workspaces.length === 0) {
    return (
      <Link
        to="/workspaces/create"
        className="inline-flex items-center gap-x-1 px-3 py-2 text-sm font-medium leading-6 text-primary-600 hover:text-primary-800"
      >
        <PlusIcon className="h-5 w-5" />
        Create Workspace
      </Link>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        className="inline-flex items-center gap-x-1 px-3 py-2 text-sm font-medium leading-6 text-gray-700 hover:text-gray-900"
        onClick={() => setIsOpen(!isOpen)}
      >
        {currentWorkspace?.logoUrl ? (
          <img
            src={currentWorkspace.logoUrl}
            alt={currentWorkspace.name}
            className="h-6 w-6 rounded-md mr-2"
          />
        ) : (
          <div className="h-6 w-6 rounded-md bg-primary-100 text-primary-800 flex items-center justify-center text-sm font-medium mr-2">
            {currentWorkspace?.name.charAt(0)}
          </div>
        )}
        <span className="font-medium">{currentWorkspace?.name}</span>
        {isOpen ? (
          <ChevronUpIcon className="h-5 w-5" />
        ) : (
          <ChevronDownIcon className="h-5 w-5" />
        )}
      </button>

      {isOpen && (
        <div className="absolute left-0 z-10 mt-2 w-56 origin-top-left rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div className="py-1">
            <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Your Workspaces
            </div>
            {workspaces.map((workspace) => (
              <button
                key={workspace.id}
                onClick={() => handleSelectWorkspace(workspace.id)}
                className={`block w-full text-left px-4 py-2 text-sm ${
                  workspace.id === currentWorkspaceId
                    ? 'bg-gray-100 text-gray-900'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center">
                  {workspace.logoUrl ? (
                    <img
                      src={workspace.logoUrl}
                      alt={workspace.name}
                      className="h-5 w-5 rounded-md mr-2"
                    />
                  ) : (
                    <div className="h-5 w-5 rounded-md bg-primary-100 text-primary-800 flex items-center justify-center text-xs font-medium mr-2">
                      {workspace.name.charAt(0)}
                    </div>
                  )}
                  <span>{workspace.name}</span>
                </div>
              </button>
            ))}
            <hr className="my-1" />
            <Link
              to="/workspaces/create"
              className="block w-full text-left px-4 py-2 text-sm text-primary-600 hover:bg-gray-50"
              onClick={() => setIsOpen(false)}
            >
              <div className="flex items-center">
                <PlusIcon className="h-5 w-5 mr-2" />
                <span>Create New Workspace</span>
              </div>
            </Link>
            <Link
              to="/workspaces/manage"
              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              onClick={() => setIsOpen(false)}
            >
              <div className="flex items-center">
                <span>Manage Workspaces</span>
              </div>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkspaceSelector;