import { useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { RootState } from '../store';
import { 
  UserGroupIcon, 
  PlusIcon, 
  CogIcon,
  UserIcon
} from '@heroicons/react/24/outline';

const WorkspaceManagement = () => {
  const navigate = useNavigate();
  const { workspaces, invitations } = useSelector((state: RootState) => state.workspace);
  const user = useSelector((state: RootState) => state.auth.user);
  
  // Filter workspaces by role
  const ownedWorkspaces = workspaces.filter(w => 
    w.members.some(m => m.userId === user?.uid && m.role === 'owner')
  );
  
  const adminWorkspaces = workspaces.filter(w => 
    w.members.some(m => m.userId === user?.uid && m.role === 'admin')
  );
  
  const memberWorkspaces = workspaces.filter(w => 
    w.members.some(m => m.userId === user?.uid && 
      m.role !== 'owner' && m.role !== 'admin')
  );
  
  // Function to get member count display
  const getMemberCount = (count: number) => {
    return count === 1 ? '1 member' : `${count} members`;
  };
  
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Workspace Management</h1>
        <p className="mt-2 text-sm text-gray-600">
          Create, join and manage your workspaces
        </p>
      </div>
      
      <div className="space-y-10">
        {/* Pending Invitations */}
        {invitations.length > 0 && (
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-3">Pending Invitations</h2>
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {invitations.map((invitation) => (
                <div key={invitation.id} className="bg-blue-50 border border-blue-200 rounded-lg shadow p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-medium text-blue-900">{invitation.workspaceName}</h3>
                      <p className="text-sm text-blue-600 mt-1">
                        Invited by {invitation.invitedBy.displayName || 'a workspace admin'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex space-x-2">
                    <button
                      type="button"
                      onClick={() => navigate(`/invitations/${invitation.id}/accept`)}
                      className="flex-1 bg-blue-600 text-white text-sm font-medium py-2 px-4 rounded-md hover:bg-blue-700"
                    >
                      Accept
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate(`/invitations/${invitation.id}/decline`)}
                      className="flex-1 bg-white text-gray-700 text-sm font-medium py-2 px-4 border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Workspaces You Own */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-medium text-gray-900">Workspaces You Own</h2>
            <Link
              to="/workspaces/create"
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-primary-600 bg-primary-50 hover:bg-primary-100"
            >
              <PlusIcon className="h-4 w-4 mr-1" />
              Create Workspace
            </Link>
          </div>
          
          {ownedWorkspaces.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
              <UserGroupIcon className="h-12 w-12 mx-auto text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No workspaces</h3>
              <p className="mt-1 text-sm text-gray-500">
                You don't own any workspaces yet
              </p>
              <div className="mt-6">
                <Link
                  to="/workspaces/create"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                >
                  <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                  Create Workspace
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {ownedWorkspaces.map((workspace) => (
                <div key={workspace.id} className="bg-white rounded-lg shadow overflow-hidden">
                  <div className="p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">{workspace.name}</h3>
                        <p className="text-sm text-gray-500 mt-1">
                          {getMemberCount(workspace.members.length)}
                        </p>
                      </div>
                      <div>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Owner
                        </span>
                      </div>
                    </div>
                    
                    {workspace.description && (
                      <p className="mt-3 text-sm text-gray-600">{workspace.description}</p>
                    )}
                    
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Link
                        to={`/workspaces/${workspace.id}/settings`}
                        className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                      >
                        <CogIcon className="-ml-0.5 mr-1 h-4 w-4" />
                        Settings
                      </Link>
                      <Link
                        to={`/workspaces/${workspace.id}/members`}
                        className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                      >
                        <UserIcon className="-ml-0.5 mr-1 h-4 w-4" />
                        Members
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Workspaces Where You're an Admin */}
        {adminWorkspaces.length > 0 && (
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-3">Workspaces Where You're an Admin</h2>
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {adminWorkspaces.map((workspace) => (
                <div key={workspace.id} className="bg-white rounded-lg shadow overflow-hidden">
                  <div className="p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">{workspace.name}</h3>
                        <p className="text-sm text-gray-500 mt-1">
                          {getMemberCount(workspace.members.length)}
                        </p>
                      </div>
                      <div>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Admin
                        </span>
                      </div>
                    </div>
                    
                    {workspace.description && (
                      <p className="mt-3 text-sm text-gray-600">{workspace.description}</p>
                    )}
                    
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Link
                        to={`/workspaces/${workspace.id}/settings`}
                        className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                      >
                        <CogIcon className="-ml-0.5 mr-1 h-4 w-4" />
                        Settings
                      </Link>
                      <Link
                        to={`/workspaces/${workspace.id}/members`}
                        className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                      >
                        <UserIcon className="-ml-0.5 mr-1 h-4 w-4" />
                        Members
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Workspaces You're a Member Of */}
        {memberWorkspaces.length > 0 && (
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-3">Workspaces You're a Member Of</h2>
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {memberWorkspaces.map((workspace) => (
                <div key={workspace.id} className="bg-white rounded-lg shadow overflow-hidden">
                  <div className="p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">{workspace.name}</h3>
                        <p className="text-sm text-gray-500 mt-1">
                          {getMemberCount(workspace.members.length)}
                        </p>
                      </div>
                      <div>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {workspace.members.find(m => m.userId === user?.uid)?.role || 'Member'}
                        </span>
                      </div>
                    </div>
                    
                    {workspace.description && (
                      <p className="mt-3 text-sm text-gray-600">{workspace.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkspaceManagement;