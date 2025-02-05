import { useSelector } from 'react-redux';
import { Navigate, Outlet } from 'react-router-dom';
import { RootState } from '../../store';
import { UserRole } from '../../types/auth';

interface RoleRouteProps {
  allowedRoles: (keyof UserRole)[];
}

const RoleRoute = ({ allowedRoles }: RoleRouteProps) => {
  const user = useSelector((state: RootState) => state.auth.user);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const hasRequiredRole = allowedRoles.some(role => user.roles[role]);

  if (!hasRequiredRole) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default RoleRoute;