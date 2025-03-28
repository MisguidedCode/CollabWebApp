import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { TaskAssignee } from '../../types/task';
import { UserCircleIcon } from '@heroicons/react/24/outline';
import { WorkspaceMember } from '../../types/workspace';

interface MemberSelectorProps {
  value?: TaskAssignee;
  onChange: (assignee: TaskAssignee | undefined) => void;
  className?: string;
}

const MemberSelector = ({ value, onChange, className = '' }: MemberSelectorProps) => {
  const { workspaces } = useSelector((state: RootState) => state.workspace);
  const currentWorkspaceId = useSelector((state: RootState) => state.workspace.currentWorkspaceId);
  const [searchTerm, setSearchTerm] = useState('');
  const [members, setMembers] = useState<WorkspaceMember[]>([]);

  useEffect(() => {
    if (currentWorkspaceId) {
      const workspace = workspaces.find(w => w.id === currentWorkspaceId);
      if (workspace) {
        setMembers(workspace.members);
      }
    }
  }, [currentWorkspaceId, workspaces]);

  const filteredMembers = searchTerm
    ? members.filter(member => 
        member.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.email.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : members;

  const handleSelectMember = (member: WorkspaceMember) => {
    onChange({
      userId: member.userId,
      displayName: member.displayName || null,
      photoURL: member.photoURL || null,
      email: member.email
    });
  };

  const handleUnassign = () => {
    onChange(undefined);
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <input
          type="text"
          className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          placeholder="Search members..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {(searchTerm || !value) && (
        <ul className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none text-sm">
          <li
            className="relative cursor-pointer select-none py-2 px-3 text-gray-900 hover:bg-primary-50"
            onClick={handleUnassign}
          >
            <div className="flex items-center">
              <UserCircleIcon className="h-6 w-6 text-gray-400 mr-2" />
              <span>Unassigned</span>
            </div>
          </li>
          
          {filteredMembers.map((member) => (
            <li
              key={member.userId}
              className="relative cursor-pointer select-none py-2 px-3 text-gray-900 hover:bg-primary-50"
              onClick={() => handleSelectMember(member)}
            >
              <div className="flex items-center">
                {member.photoURL ? (
                  <img
                    src={member.photoURL}
                    alt={member.displayName || member.email}
                    className="h-6 w-6 rounded-full mr-2"
                  />
                ) : (
                  <UserCircleIcon className="h-6 w-6 text-gray-400 mr-2" />
                )}
                <div>
                  <div className="font-medium">
                    {member.displayName || member.email}
                  </div>
                  {member.displayName && (
                    <div className="text-xs text-gray-500">{member.email}</div>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {value && !searchTerm && (
        <div className="flex items-center mt-2">
          {value.photoURL ? (
            <img
              src={value.photoURL}
              alt={value.displayName || value.email}
              className="h-6 w-6 rounded-full mr-2"
            />
          ) : (
            <UserCircleIcon className="h-6 w-6 text-gray-400 mr-2" />
          )}
          <div>
            <div className="font-medium">
              {value.displayName || value.email}
            </div>
            {value.displayName && (
              <div className="text-xs text-gray-500">{value.email}</div>
            )}
          </div>
          <button
            type="button"
            onClick={handleUnassign}
            className="ml-auto text-sm text-gray-500 hover:text-gray-700"
          >
            Change
          </button>
        </div>
      )}
    </div>
  );
};

export default MemberSelector;
