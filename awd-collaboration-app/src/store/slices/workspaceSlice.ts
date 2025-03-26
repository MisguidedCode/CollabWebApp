import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { Workspace, WorkspaceState, WorkspaceInvitation, WorkspaceRole } from '../../types/workspace';
import {
  createWorkspace as createWorkspaceInFirestore,
  getUserWorkspaces,
  updateWorkspace as updateWorkspaceInFirestore,
  deleteWorkspace as deleteWorkspaceFromFirestore,
  getWorkspaceById,
  addWorkspaceMember,
  removeWorkspaceMember,
  updateMemberRole,
  createInvitation,
  getUserInvitations,
  joinWorkspace,
  subscribeToUserWorkspaces,
  subscribeToUserInvitations
} from '../../services/workspaceService';
import { User } from '../../types/auth';
import {
  registerSubscription,
  unregisterSubscriptionsByPrefix
} from '../../utils/subscriptionManager';

const initialState: WorkspaceState = {
  workspaces: [],
  currentWorkspaceId: null,
  invitations: [],
  loading: false,
  error: null,
};

// Async Thunks
export const fetchUserWorkspaces = createAsyncThunk(
  'workspace/fetchUserWorkspaces',
  async (userId: string, { dispatch, rejectWithValue }) => {
    try {
      console.log("Fetching workspaces for user:", userId);
      const workspaces = await getUserWorkspaces(userId);
      console.log("Fetched workspaces:", workspaces);
      
      // Setup real-time subscription for workspaces
      const unsubscribe = subscribeToUserWorkspaces(userId, (updatedWorkspaces) => {
        console.log("Got updated workspaces from subscription:", updatedWorkspaces);
        dispatch(setWorkspaces(updatedWorkspaces));
      });
      
      // Register subscription for cleanup
      registerSubscription('userWorkspaces', unsubscribe);
      
      return workspaces;
    } catch (error) {
      console.error("Error fetching user workspaces:", error);
      return rejectWithValue(error instanceof Error ? error.message : String(error));
    }
  }
);

export const fetchUserInvitations = createAsyncThunk(
  'workspace/fetchUserInvitations',
  async (email: string, { dispatch, rejectWithValue }) => {
    try {
      console.log("Fetching invitations for email:", email);
      const invitations = await getUserInvitations(email);
      console.log("Fetched invitations:", invitations);
      
      // Setup real-time subscription for invitations
      const unsubscribe = subscribeToUserInvitations(email, (updatedInvitations) => {
        console.log("Got updated invitations from subscription:", updatedInvitations);
        dispatch(setInvitations(updatedInvitations));
      });
      
      // Register subscription for cleanup
      registerSubscription('userInvitations', unsubscribe);
      
      return invitations;
    } catch (error) {
      console.error("Error fetching user invitations:", error);
      return rejectWithValue(error instanceof Error ? error.message : String(error));
    }
  }
);

export const createNewWorkspace = createAsyncThunk(
  'workspace/createWorkspace',
  async (workspaceData: Omit<Workspace, 'id' | 'createdAt' | 'updatedAt'>, { rejectWithValue }) => {
    try {
      console.log("Starting workspace creation with data:", workspaceData);
      
      // Validate input data
      if (!workspaceData.name) {
        throw new Error("Workspace name is required");
      }
      
      if (!workspaceData.members || workspaceData.members.length === 0) {
        throw new Error("Workspace must have at least one member");
      }
      
      const workspace = await createWorkspaceInFirestore(workspaceData);
      console.log("Workspace created successfully:", workspace);
      return workspace;
    } catch (error) {
      console.error("Error creating workspace:", error);
      return rejectWithValue(error instanceof Error ? error.message : String(error));
    }
  }
);

export const updateWorkspaceDetails = createAsyncThunk(
  'workspace/updateWorkspace',
  async (workspace: Workspace, { rejectWithValue }) => {
    try {
      await updateWorkspaceInFirestore(workspace);
      return workspace;
    } catch (error) {
      console.error("Error updating workspace:", error);
      return rejectWithValue(error instanceof Error ? error.message : String(error));
    }
  }
);

export const deleteWorkspaceThunk = createAsyncThunk(
  'workspace/deleteWorkspace',
  async (workspaceId: string, { rejectWithValue }) => {
    try {
      await deleteWorkspaceFromFirestore(workspaceId);
      return workspaceId;
    } catch (error) {
      console.error("Error deleting workspace:", error);
      return rejectWithValue(error instanceof Error ? error.message : String(error));
    }
  }
);

export const inviteToWorkspace = createAsyncThunk(
  'workspace/inviteToWorkspace',
  async ({ 
    workspaceId, 
    email, 
    role, 
    invitedBy 
  }: { 
    workspaceId: string; 
    email: string; 
    role: WorkspaceRole; 
    invitedBy: { userId: string; displayName?: string; }
  }, { rejectWithValue }) => {
    try {
      console.log("Inviting to workspace with params:", { workspaceId, email, role, invitedBy });
      
      // Verify the workspace exists
      const workspace = await getWorkspaceById(workspaceId);
      
      if (!workspace) {
        throw new Error('Workspace not found');
      }
      
      // Create a clean invitation object without undefined values
      const cleanInvitedBy = {
        userId: invitedBy.userId,
        // Only include displayName if it exists and is not null
        ...(invitedBy.displayName ? { displayName: invitedBy.displayName } : {})
      };
      
      const invitation: Omit<WorkspaceInvitation, 'id' | 'invitedAt'> = {
        workspaceId,
        workspaceName: workspace.name,
        email,
        role,
        invitedBy: cleanInvitedBy,
        status: 'pending',
      };
      
      console.log("Creating invitation with data:", invitation);
      return await createInvitation(invitation);
    } catch (error) {
      console.error("Error inviting to workspace:", error);
      return rejectWithValue(error instanceof Error ? error.message : String(error));
    }
  }
);

export const acceptWorkspaceInvitation = createAsyncThunk(
  'workspace/acceptInvitation',
  async ({ invitation, user }: { invitation: WorkspaceInvitation; user: User }, { rejectWithValue }) => {
    try {
      console.log("Accepting invitation:", invitation);
      console.log("User:", user);
      
      await joinWorkspace(invitation, user);
      return invitation.id;
    } catch (error) {
      console.error("Error accepting workspace invitation:", error);
      return rejectWithValue(error instanceof Error ? error.message : String(error));
    }
  }
);

export const updateMemberRoleThunk = createAsyncThunk(
  'workspace/updateMemberRole',
  async ({ 
    workspaceId, 
    userId, 
    role 
  }: { 
    workspaceId: string; 
    userId: string; 
    role: WorkspaceRole 
  }, { rejectWithValue }) => {
    try {
      await updateMemberRole(workspaceId, userId, role);
      return { workspaceId, userId, role };
    } catch (error) {
      console.error("Error updating member role:", error);
      return rejectWithValue(error instanceof Error ? error.message : String(error));
    }
  }
);

export const removeMemberThunk = createAsyncThunk(
  'workspace/removeMember',
  async ({ 
    workspaceId, 
    userId
  }: {
    workspaceId: string;
    userId: string;
  }, { rejectWithValue }) => {
    try {
      await removeWorkspaceMember(workspaceId, userId);
      return { workspaceId, userId };
    } catch (error) {
      console.error("Error removing member:", error);
      return rejectWithValue(error instanceof Error ? error.message : String(error));
    }
  }
);

// Function to unsubscribe from workspace subscriptions - call on cleanup
export const unsubscribeWorkspaces = () => {
  unregisterSubscriptionsByPrefix('userWorkspaces');
  unregisterSubscriptionsByPrefix('userInvitations');
};

const workspaceSlice = createSlice({
  name: 'workspace',
  initialState,
  reducers: {
    setWorkspaces: (state, action: PayloadAction<Workspace[]>) => {
      console.log("Setting workspaces with payload:", action.payload);
      
      // Deduplicate workspaces based on ID
      const uniqueWorkspaces = Array.from(
        new Map(action.payload.map(workspace => [workspace.id, workspace])).values()
      );
      
      // Sort workspaces for consistency
      uniqueWorkspaces.sort((a, b) => a.name.localeCompare(b.name));
      
      // Update state with deduplicated workspaces
      state.workspaces = uniqueWorkspaces;
      
      // If current workspace is not in the new list, reset it
      if (state.currentWorkspaceId && !uniqueWorkspaces.some(w => w.id === state.currentWorkspaceId)) {
        state.currentWorkspaceId = uniqueWorkspaces.length > 0 ? uniqueWorkspaces[0].id : null;
      }
    },
    
    setCurrentWorkspace: (state, action: PayloadAction<string | null>) => {
      state.currentWorkspaceId = action.payload;
    },
    
    setInvitations: (state, action: PayloadAction<WorkspaceInvitation[]>) => {
      state.invitations = action.payload;
    },
    
    // Reset workspace state completely
    resetWorkspaceState: () => initialState,

    // Clear workspace state completely on logout
    clearWorkspaceState: () => initialState,
  },
  extraReducers: (builder) => {
    // fetchUserWorkspaces
    builder.addCase(fetchUserWorkspaces.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchUserWorkspaces.fulfilled, (state, action) => {
      // Use setWorkspaces reducer to deduplicate
      const uniqueWorkspaces = Array.from(
        new Map(action.payload.map(workspace => [workspace.id, workspace])).values()
      );
      state.workspaces = uniqueWorkspaces;
      state.workspaces.sort((a, b) => a.name.localeCompare(b.name));
      state.loading = false;
      
      // Set first workspace as current if none selected
      if (!state.currentWorkspaceId && uniqueWorkspaces.length > 0) {
        state.currentWorkspaceId = uniqueWorkspaces[0].id;
      }
    });
    builder.addCase(fetchUserWorkspaces.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
    
    // fetchUserInvitations
    builder.addCase(fetchUserInvitations.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchUserInvitations.fulfilled, (state, action) => {
      state.invitations = action.payload;
      state.loading = false;
    });
    builder.addCase(fetchUserInvitations.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
    
    // createNewWorkspace
    builder.addCase(createNewWorkspace.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(createNewWorkspace.fulfilled, (state, action) => {
      // Don't push to workspaces array as the subscription will handle it
      state.currentWorkspaceId = action.payload.id;
      state.loading = false;
    });
    builder.addCase(createNewWorkspace.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
    
    // updateWorkspaceDetails
    builder.addCase(updateWorkspaceDetails.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(updateWorkspaceDetails.fulfilled, (state, action) => {
      // Subscription will handle the update
      state.loading = false;
    });
    builder.addCase(updateWorkspaceDetails.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
    
    // deleteWorkspaceThunk
    builder.addCase(deleteWorkspaceThunk.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(deleteWorkspaceThunk.fulfilled, (state, action) => {
      // Filter out the deleted workspace
      state.workspaces = state.workspaces.filter(workspace => workspace.id !== action.payload);
      
      // If the deleted workspace was the current one, set to null or the first available
      if (state.currentWorkspaceId === action.payload) {
        state.currentWorkspaceId = state.workspaces.length > 0 ? state.workspaces[0].id : null;
      }
      
      state.loading = false;
    });
    builder.addCase(deleteWorkspaceThunk.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
    
    // inviteToWorkspace
    builder.addCase(inviteToWorkspace.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(inviteToWorkspace.fulfilled, (state) => {
      state.loading = false;
    });
    builder.addCase(inviteToWorkspace.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
    
    // acceptWorkspaceInvitation
    builder.addCase(acceptWorkspaceInvitation.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(acceptWorkspaceInvitation.fulfilled, (state, action) => {
      // Remove accepted invitation
      state.invitations = state.invitations.filter(inv => inv.id !== action.payload);
      state.loading = false;
    });
    builder.addCase(acceptWorkspaceInvitation.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
    
    // updateMemberRoleThunk
    builder.addCase(updateMemberRoleThunk.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(updateMemberRoleThunk.fulfilled, (state, action) => {
      // Subscription will handle the update
      state.loading = false;
    });
    builder.addCase(updateMemberRoleThunk.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
    
    // removeMemberThunk
    builder.addCase(removeMemberThunk.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(removeMemberThunk.fulfilled, (state, action) => {
      // Subscription will handle the update
      state.loading = false;
    });
    builder.addCase(removeMemberThunk.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
  }
});

export const {
  setWorkspaces,
  setCurrentWorkspace,
  setInvitations,
  resetWorkspaceState,
  clearWorkspaceState
} = workspaceSlice.actions;

export default workspaceSlice.reducer;
