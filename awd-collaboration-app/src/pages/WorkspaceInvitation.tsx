import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import { RootState, useAppDispatch } from '../store';
import { acceptWorkspaceInvitation } from '../store/slices/workspaceSlice';
import { WorkspaceInvitation } from '../types/workspace';
import { 
  CheckCircleIcon, 
  XCircleIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';

type ActionType = 'accept' | 'decline';

const WorkspaceInvitationPage = () => {
  const { invitationId, action } = useParams<{ invitationId: string; action: ActionType }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  
  const { invitations } = useSelector((state: RootState) => state.workspace);
  const user = useSelector((state: RootState) => state.auth.user);
  
  const [invitation, setInvitation] = useState<WorkspaceInvitation | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Find the invitation in state
  useEffect(() => {
    if (!invitationId) {
      navigate('/workspaces/manage');
      return;
    }
    
    const foundInvitation = invitations.find(inv => inv.id === invitationId);
    if (!foundInvitation) {
      setError('Invitation not found or has expired.');
      return;
    }
    
    setInvitation(foundInvitation);
  }, [invitationId, invitations, navigate]);
  
  // Handle accept/decline action
  useEffect(() => {
    if (!invitation || !action || !user) return;
    
    const handleAction = async () => {
      if (action === 'accept') {
        try {
          setIsSubmitting(true);
          await dispatch(acceptWorkspaceInvitation({ invitation, user })).unwrap();
          setSuccess(`You have successfully joined the workspace: ${invitation.workspaceName}`);
          setTimeout(() => {
            navigate('/');
          }, 3000);
        } catch (err) {
          setError((err as Error).message);
        } finally {
          setIsSubmitting(false);
        }
      } else if (action === 'decline') {
        // Handle decline (to be implemented)
        setSuccess(`You have declined the invitation to join: ${invitation.workspaceName}`);
        setTimeout(() => {
          navigate('/workspaces/manage');
        }, 3000);
      }
    };
    
    handleAction();
  }, [invitation, action, user, dispatch, navigate]);
  
  return (
    <div className="max-w-md mx-auto mt-10 px-4">
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6 text-center">
          <UserGroupIcon className="h-16 w-16 mx-auto text-primary-600" />
          
          <h2 className="mt-4 text-lg font-medium text-gray-900">
            {action === 'accept' ? 'Join Workspace' : 'Decline Invitation'}
          </h2>
          
          {invitation && (
            <p className="mt-2 text-sm text-gray-600">
              {action === 'accept' 
                ? `You're joining ${invitation.workspaceName}`
                : `You're declining the invitation to join ${invitation.workspaceName}`
              }
            </p>
          )}
          
          {error && (
            <div className="mt-4 flex items-center justify-center">
              <XCircleIcon className="h-5 w-5 text-red-500 mr-2" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
          
          {success && (
            <div className="mt-4 flex items-center justify-center">
              <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
              <p className="text-sm text-green-600">{success}</p>
            </div>
          )}
          
          {isSubmitting && (
            <div className="mt-6 flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          )}
          
          {!isSubmitting && !success && (
            <div className="mt-6 flex justify-center space-x-3">
              <button
                type="button"
                onClick={() => navigate('/workspaces/manage')}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Go Back
              </button>
              
              {action === 'accept' && (
                <button
                  type="button"
                  onClick={async () => {
                    if (!invitation || !user) return;
                    try {
                      setIsSubmitting(true);
                      await dispatch(acceptWorkspaceInvitation({ invitation, user })).unwrap();
                      setSuccess(`You have successfully joined the workspace: ${invitation.workspaceName}`);
                      setTimeout(() => {
                        navigate('/');
                      }, 3000);
                    } catch (err) {
                      setError((err as Error).message);
                    } finally {
                      setIsSubmitting(false);
                    }
                  }}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Confirm Join
                </button>
              )}
              
              {action === 'decline' && (
                <button
                  type="button"
                  onClick={() => {
                    // Handle decline action here
                    setSuccess(`You have declined the invitation to join: ${invitation?.workspaceName}`);
                    setTimeout(() => {
                      navigate('/workspaces/manage');
                    }, 3000);
                  }}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Confirm Decline
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WorkspaceInvitationPage;