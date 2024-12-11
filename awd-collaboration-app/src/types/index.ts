export interface User {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  }
  
  export interface NavigationItem {
    name: string;
    path: string;
    icon?: React.ComponentType;
  }