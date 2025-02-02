export interface UserRole {
    superAdmin?: boolean;
    workspaceAdmin?: boolean;
    teamLead?: boolean;
    member?: boolean;
    guest?: boolean;
  }
  
  export interface User {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL?: string | null;
    roles: UserRole;
    createdAt: string;
    lastLogin: string;
  }
  
  export interface AuthState {
    user: User | null;
    loading: boolean;
    error: string | null;
  }