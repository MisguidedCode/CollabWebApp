import { 
    collection,
    doc,
    setDoc,
    getDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    query,
    where,
    onSnapshot,
    serverTimestamp,
    Timestamp,
    orderBy,
    arrayUnion,
    arrayRemove
  } from 'firebase/firestore';
  import { db, COLLECTIONS } from '../config/firebase';
  import { Workspace, WorkspaceMember, WorkspaceRole, WorkspaceInvitation } from '../types/workspace';
  import { User } from '../types/auth';
  
  // Update Firebase config to include workspaces collection
  const UPDATED_COLLECTIONS = {
    ...COLLECTIONS,
    WORKSPACES: 'workspaces',
    WORKSPACE_INVITATIONS: 'workspace-invitations'
  };
  
  // Helper function to safely convert Firestore timestamps to ISO strings
  const convertTimestampToString = (timestamp: any): string | undefined => {
    if (!timestamp) return undefined;
    
    // Handle Firestore Timestamp
    if (timestamp.toDate && typeof timestamp.toDate === 'function') {
      return timestamp.toDate().toISOString();
    }
    
    // Handle Date objects
    if (timestamp instanceof Date) {
      return timestamp.toISOString();
    }
    
    // Already a string
    if (typeof timestamp === 'string') {
      return timestamp;
    }
    
    return undefined;
  };
  
  const workspaceConverter = {
    fromFirestore: (snapshot: any, options?: any) => {
      const data = snapshot.data(options);
      
      // Process members array to convert timestamps
      const members = data.members?.map((member: any) => ({
        ...member,
        addedAt: convertTimestampToString(member.addedAt) || new Date().toISOString(),
        joinedAt: convertTimestampToString(member.joinedAt)
      })) || [];
      
      return {
        ...data,
        id: snapshot.id,
        createdAt: convertTimestampToString(data.createdAt) || new Date().toISOString(),
        updatedAt: convertTimestampToString(data.updatedAt) || new Date().toISOString(),
        members
      } as Workspace;
    },
    toFirestore: (workspace: Workspace) => {
      const { id, ...workspaceData } = workspace;
      
      // Process members array to convert date strings to timestamps
      const members = workspace.members?.map(member => {
        // Create a clean member object without undefined values
        const cleanMember: Record<string, any> = {
          userId: member.userId,
          role: member.role,
          email: member.email,
          addedAt: member.addedAt ? Timestamp.fromDate(new Date(member.addedAt)) : serverTimestamp(),
          invitedBy: member.invitedBy,
          status: member.status
        };
        
        // Only add optional fields if they exist
        if (member.displayName) cleanMember.displayName = member.displayName;
        if (member.photoURL) cleanMember.photoURL = member.photoURL;
        if (member.joinedAt) cleanMember.joinedAt = Timestamp.fromDate(new Date(member.joinedAt));
        
        return cleanMember;
      }) || [];
      
      // Clean the workspace data to remove any undefined values
      const cleanData: Record<string, any> = {
        name: workspaceData.name,
        createdBy: workspaceData.createdBy,
        members,
        settings: workspaceData.settings,
        createdAt: workspace.createdAt ? Timestamp.fromDate(new Date(workspace.createdAt)) : serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      // Only add optional fields if they exist
      if (workspaceData.description) cleanData.description = workspaceData.description;
      if (workspaceData.logoUrl) cleanData.logoUrl = workspaceData.logoUrl;
      
      return cleanData;
    }
  };
  
  // Convert Firestore data to WorkspaceInvitation object
  const invitationConverter = {
    fromFirestore: (snapshot: any, options?: any) => {
      const data = snapshot.data(options);
      
      // Create a clean invitedBy object
      const invitedBy = {
        userId: data.invitedBy.userId,
        ...(data.invitedBy.displayName ? { displayName: data.invitedBy.displayName } : {})
      };
      
      return {
        ...data,
        id: snapshot.id,
        invitedBy,
        invitedAt: convertTimestampToString(data.invitedAt) || new Date().toISOString(),
      } as WorkspaceInvitation;
    },
    toFirestore: (invitation: WorkspaceInvitation) => {
      const { id, ...invitationData } = invitation;
      
      // Create a clean invitedBy object
      const invitedBy = {
        userId: invitation.invitedBy.userId,
        ...(invitation.invitedBy.displayName ? { displayName: invitation.invitedBy.displayName } : {})
      };
      
      return {
        ...invitationData,
        invitedBy,
        invitedAt: invitation.invitedAt ? Timestamp.fromDate(new Date(invitation.invitedAt)) : serverTimestamp(),
      };
    }
  };
  
  // Create a new workspace
  export const createWorkspace = async (workspaceData: Omit<Workspace, 'id' | 'createdAt' | 'updatedAt'>): Promise<Workspace> => {
    const workspacesCollection = collection(db, UPDATED_COLLECTIONS.WORKSPACES);
    const docRef = doc(workspacesCollection);
    const newWorkspace: Workspace = {
      ...workspaceData,
      id: docRef.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    await setDoc(docRef, workspaceConverter.toFirestore(newWorkspace));
    
    // Get the document back to ensure timestamps are converted correctly
    const snapshot = await getDoc(docRef);
    return workspaceConverter.fromFirestore(snapshot);
  };
  
  // Get a workspace by ID
  export const getWorkspaceById = async (workspaceId: string): Promise<Workspace | null> => {
    const workspaceDoc = doc(db, UPDATED_COLLECTIONS.WORKSPACES, workspaceId);
    const snapshot = await getDoc(workspaceDoc);
    
    if (!snapshot.exists()) {
      return null;
    }
    
    return workspaceConverter.fromFirestore(snapshot);
  };
  
  // Get all workspaces for a user
  export const getUserWorkspaces = async (userId: string): Promise<Workspace[]> => {
    const workspacesCollection = collection(db, UPDATED_COLLECTIONS.WORKSPACES);
    const q = query(
      workspacesCollection,
      where('members', 'array-contains', { userId, status: 'active' }),
      orderBy('createdAt', 'desc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => workspaceConverter.fromFirestore(doc));
  };
  
  // Subscribe to user's workspaces
  export const subscribeToUserWorkspaces = (userId: string, callback: (workspaces: Workspace[]) => void) => {
    const workspacesCollection = collection(db, UPDATED_COLLECTIONS.WORKSPACES);
    
    // Query for workspaces where the user is a member
    const q = query(
      workspacesCollection,
      where('members', 'array-contains', { userId, status: 'active' }),
      orderBy('createdAt', 'desc')
    );
    
    return onSnapshot(q, (snapshot) => {
      const workspaces = snapshot.docs.map(doc => workspaceConverter.fromFirestore(doc));
      callback(workspaces);
    });
  };
  
  // Update workspace
  export const updateWorkspace = async (workspace: Workspace): Promise<void> => {
    const workspaceDoc = doc(db, UPDATED_COLLECTIONS.WORKSPACES, workspace.id);
    await updateDoc(workspaceDoc, workspaceConverter.toFirestore(workspace));
  };
  
  // Delete workspace
  export const deleteWorkspace = async (workspaceId: string): Promise<void> => {
    const workspaceDoc = doc(db, UPDATED_COLLECTIONS.WORKSPACES, workspaceId);
    await deleteDoc(workspaceDoc);
  };
  
  // Add member to workspace
  export const addWorkspaceMember = async (
    workspaceId: string, 
    member: Omit<WorkspaceMember, 'addedAt'>
  ): Promise<void> => {
    const workspaceDoc = doc(db, UPDATED_COLLECTIONS.WORKSPACES, workspaceId);
    
    const newMember: WorkspaceMember = {
      ...member,
      addedAt: new Date().toISOString(),
    };
    
    await updateDoc(workspaceDoc, {
      members: arrayUnion(newMember)
    });
  };
  
  // Remove member from workspace
  export const removeWorkspaceMember = async (
    workspaceId: string,
    userId: string
  ): Promise<void> => {
    const workspaceDoc = doc(db, UPDATED_COLLECTIONS.WORKSPACES, workspaceId);
    const workspace = await getWorkspaceById(workspaceId);
    
    if (!workspace) {
      throw new Error('Workspace not found');
    }
    
    const updatedMembers = workspace.members.filter(member => member.userId !== userId);
    
    await updateDoc(workspaceDoc, {
      members: updatedMembers
    });
  };
  
  // Update member role
  export const updateMemberRole = async (
    workspaceId: string,
    userId: string,
    newRole: WorkspaceRole
  ): Promise<void> => {
    const workspaceDoc = doc(db, UPDATED_COLLECTIONS.WORKSPACES, workspaceId);
    const workspace = await getWorkspaceById(workspaceId);
    
    if (!workspace) {
      throw new Error('Workspace not found');
    }
    
    const updatedMembers = workspace.members.map(member => {
      if (member.userId === userId) {
        return { ...member, role: newRole };
      }
      return member;
    });
    
    await updateDoc(workspaceDoc, {
      members: updatedMembers
    });
  };
  
  // Create workspace invitation
  export const createInvitation = async (invitation: Omit<WorkspaceInvitation, 'id' | 'invitedAt'>): Promise<WorkspaceInvitation> => {
    try {
      console.log("Creating invitation with data:", invitation);
      
      // Create a clean version of the invitation object
      const cleanInvitation = {
        workspaceId: invitation.workspaceId,
        workspaceName: invitation.workspaceName,
        email: invitation.email,
        role: invitation.role,
        status: invitation.status,
        invitedBy: {
          userId: invitation.invitedBy.userId,
          // Only include displayName if it exists
          ...(invitation.invitedBy.displayName ? { displayName: invitation.invitedBy.displayName } : {})
        },
        invitedAt: serverTimestamp()
      };
      
      // Create document reference
      const invitationsCollection = collection(db, 'workspace-invitations');
      const docRef = doc(invitationsCollection);
      
      // Set document with clean data
      await setDoc(docRef, cleanInvitation);
      
      // Return the invitation with generated ID
      return {
        ...invitation,
        id: docRef.id,
        invitedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error("Error creating invitation:", error);
      throw error;
    }
  };
  
  
  // Get user's pending invitations
  export const getUserInvitations = async (email: string): Promise<WorkspaceInvitation[]> => {
    const invitationsCollection = collection(db, UPDATED_COLLECTIONS.WORKSPACE_INVITATIONS);
    const q = query(
      invitationsCollection,
      where('email', '==', email),
      where('status', '==', 'pending')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => invitationConverter.fromFirestore(doc));
  };
  
  // Subscribe to user's invitations
  export const subscribeToUserInvitations = (email: string, callback: (invitations: WorkspaceInvitation[]) => void) => {
    const invitationsCollection = collection(db, UPDATED_COLLECTIONS.WORKSPACE_INVITATIONS);
    const q = query(
      invitationsCollection,
      where('email', '==', email),
      where('status', '==', 'pending')
    );
    
    return onSnapshot(q, (snapshot) => {
      const invitations = snapshot.docs.map(doc => invitationConverter.fromFirestore(doc));
      callback(invitations);
    });
  };
  
  // Update invitation status
  export const updateInvitationStatus = async (
    invitationId: string,
    status: 'accepted' | 'declined'
  ): Promise<void> => {
    try {
      const invitationDoc = doc(db, 'workspace-invitations', invitationId);
      await updateDoc(invitationDoc, { status });
    } catch (error) {
      console.error("Error updating invitation status:", error);
      throw error;
    }
  };
  
  // Join workspace (when accepting invitation)
  export const joinWorkspace = async (invitation: WorkspaceInvitation, user: User): Promise<void> => {
    try {
      console.log("Joining workspace with invitation:", invitation);
      console.log("User data:", user);
      
      // 1. Update invitation status
      await updateInvitationStatus(invitation.id, 'accepted');
      
      // 2. Prepare member data without undefined values
      const newMember: Record<string, any> = {
        userId: user.uid,
        role: invitation.role,
        email: user.email || invitation.email,
        addedAt: invitation.invitedAt,
        invitedBy: invitation.invitedBy.userId,
        joinedAt: new Date().toISOString(),
        status: 'active'
      };
      
      // Only add optional fields if they exist and aren't null
      if (user.displayName) newMember.displayName = user.displayName;
      if (user.photoURL) newMember.photoURL = user.photoURL;
      
      console.log("New member data:", newMember);
      
      // 3. Get reference to the workspace document
      const workspaceRef = doc(db, 'workspaces', invitation.workspaceId);
      
      // 4. Update the document with arrayUnion
      await updateDoc(workspaceRef, {
        members: arrayUnion(newMember)
      });
      
      console.log("Successfully joined workspace");
    } catch (error) {
      console.error("Error joining workspace:", error);
      throw error;
    }
  };