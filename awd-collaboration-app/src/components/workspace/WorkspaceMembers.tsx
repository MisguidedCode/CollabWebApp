import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { RootState, useAppDispatch } from '../../store';
import { 
  updateMemberRoleThunk, 
  removeMemberThunk,
  inviteToWorkspace
} from '../../store/slices/workspaceSlice';
import { Workspace, WorkspaceMember, WorkspaceRole } from '../../types/workspace';
import { 
  UserCircleIcon, 
  UserPlusIcon, 
  XMarkIcon 
} from '@heroicons/react/24/outline';

const RoleOptions = [
  { value: 'owner', label: 'Owner', description: 'Full access with administrative control' },
  { value: 'admin', label: 'Admin', description: 'Full access without ownership' },
  { value: 'member', label: 'Member', description: 'Full access to resources but no admin controls' },
  { value: 'guest', label: 'Guest', description: 'Limited access to specific resources' },
];

const WorkspaceMembers = () => {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const dispatch = useAppDispatch();
  
  const { workspaces } = useSelector((state: RootState) => state.workspace);
  const user = useSelector((state: RootState) => state.auth.user);
  
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  
  const [isInviting, setIsInviting] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<WorkspaceRole>('member');
  
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Fetch workspace data and check permissions
  useEffect(() => {
    if (!workspaceId) return;
    
    const foundWorkspace = workspaces.find(w => w.id === workspaceId);
    if (!foundWorkspace) return;
    
    setWorkspace(foundWorkspace);
    setMembers(foundWorkspace.members);
    
    // Check user permissions
    if (!user) return;
    
    const member = foundWorkspace.members.find(m => m.userId === user.uid);
    if (!member) return;
    
    setIsOwner(member.role === 'owner');
    setIsAdmin(member.role === 'owner' || member.role === 'admin');
    
  }, [workspaceId, workspaces, user]);
  
  // Check if user is the last owner
  const isLastOwner = (userId: string): boolean => {
    if (!workspace) return false;
    
    const ownerCount = workspace.members.filter(m => m.role === 'owner').length;
    const userIsOwner = workspace.members.find(m => m.userId === userId)?.role === 'owner';
    
    return ownerCount === 1 && userIsOwner;
  };
  
  // Handle role change
  const handleRoleChange = async (userId: string, newRole: WorkspaceRole) => {
    if (!workspaceId || !user || !isAdmin) return;
    
    // Prevent changing the last owner's role
    if (isLastOwner(userId)) {
      setError('Cannot change the last owner. Please promote another member to owner first.');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      await dispatch(updateMemberRoleThunk({ workspaceId, userId, role: newRole })).unwrap();
      
      // Update local state
      setMembers(prev => prev.map(member => {
        if (member.userId === userId) {
          return { ...member, role: newRole };
        }
        return member;
      }));
      
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle member removal
  const handleRemoveMember = async (userId: string) => {
    if (!workspaceId || !user || !isAdmin) return;
    
    // Prevent removing the last owner
    if (isLastOwner(userId)) {
      setError('Cannot remove the last owner. Please promote another member to owner first.');
      return;
    }
    
    // Prevent removing self if you're not the owner
    if (userId === user.uid && !isOwner) {
      setError('You cannot remove yourself from the workspace.');
      return;
    }
    
    if (!window.confirm('Are you sure you want to remove this member?')) {
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      await dispatch(removeMemberThunk({ workspaceId, userId })).unwrap();
      
      // Update local state
      setMembers(prev => prev.filter(member => member.userId !== userId));
      
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle invitation submission
  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!workspaceId || !user || !isAdmin) return;
    
    if (!inviteEmail.trim()) {
      setError('Email is required');
      return;
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(inviteEmail)) {
      setError('Please enter a valid email address');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      const invitedBy = {
        userId: user.uid,
        displayName: user.displayName || undefined
      };
      
      await dispatch(inviteToWorkspace({ 
        workspaceId, 
        email: inviteEmail.trim(), 
        role: inviteRole,
        invitedBy 
      })).unwrap();
      
      // Reset form
      setInviteEmail('');
      setInviteRole('member');
      setIsInviting(false);
      
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (!workspace) {
    return (
      <div className="p-6 bg-white rounded-lg shadow">
        <p>Loading workspace members...</p>
      </div>
    );
  }
  
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Workspace Members</h1>
          <p className="mt-2 text-sm text-gray-600">
            Manage members and access control for {workspace.name}
          </p>
        </div>
        
        {isAdmin && (
          <button
            type="button"
            onClick={() => setIsInviting(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <UserPlusIcon className="h-5 w-5 mr-2" />
            Invite People
          </button>
        )}
      </div>
      
      {error && (
        <div className="p-3 mb-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm">
          {error}
        </div>
      )}
      
      {/* Invite Form */}
      {isInviting && (
        <div className="mb-6 bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium text-gray-900">Invite People</h2>
            <button
              type="button"
              onClick={() => {
                setIsInviting(false);
                setInviteEmail('');
                setError(null);
              }}
              className="text-gray-400 hover:text-gray-500"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
          
          <form onSubmit={handleInvite}>
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  className="mt-1 block w-full rounded-md border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="colleague@example.com"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                  Role
                </label>
                <select
                  id="role"
                  className="mt-1 block w-full rounded-md border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as WorkspaceRole)}
                >
                  {RoleOptions.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  {RoleOptions.find((r) => r.value === inviteRole)?.description}
                </p>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsInviting(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  disabled={isSubmitting || !inviteEmail.trim()}
                >
                  {isSubmitting ? 'Sending Invitation...' : 'Send Invitation'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
      
      {/* Members List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <ul className="divide-y divide-gray-200">
          {members.map((member) => (
            <li key={member.userId} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  {member.photoURL ? (
                    <img
                      src={member.photoURL}
                      alt={member.displayName || member.email}
                      className="h-10 w-10 rounded-full"
                    />
                  ) : (
                    <UserCircleIcon className="h-10 w-10 text-gray-400" />
                  )}
                  
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">
                      {member.displayName || member.email}
                    </p>
                    <p className="text-sm text-gray-500">{member.email}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  {isAdmin && (
                    <select
                      className={`rounded-md border-gray-300 text-sm ${
                        isLastOwner(member.userId) && member.role === 'owner'
                          ? 'bg-gray-100 cursor-not-allowed'
                          : member.userId === user?.uid && !isOwner
                          ? 'bg-gray-100 cursor-not-allowed'
                          : ''
                      }`}
                      value={member.role}
                      onChange={(e) => handleRoleChange(member.userId, e.target.value as WorkspaceRole)}
                      disabled={
                        isSubmitting || 
                        (isLastOwner(member.userId) && member.role === 'owner') || 
                        (member.userId === user?.uid && !isOwner)
                      }
                    >
                      {RoleOptions.map((role) => (
                        <option key={role.value} value={role.value}>
                          {role.label}
                        </option>
                      ))}
                    </select>
                  )}
                  
                  {!isAdmin && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {RoleOptions.find((r) => r.value === member.role)?.label || member.role}
                    </span>
                  )}
                  
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => handleRemoveMember(member.userId)}
                      className={`text-gray-400 hover:text-red-500 ${
                        isLastOwner(member.userId) || (member.userId === user?.uid && !isOwner)
                          ? 'opacity-50 cursor-not-allowed'
                          : ''
                      }`}
                      disabled={
                        isSubmitting || 
                        isLastOwner(member.userId) || 
                        (member.userId === user?.uid && !isOwner)
                      }
                      title="Remove member"
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default WorkspaceMembers;