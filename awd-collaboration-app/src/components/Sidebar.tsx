import { NavLink } from 'react-router-dom';
import { 
  HomeIcon, 
  ClipboardDocumentListIcon, 
  ChatBubbleLeftRightIcon, 
  CalendarIcon, 
  UsersIcon 
} from '@heroicons/react/24/outline';

const navigation = [
  { name: 'Dashboard', path: '/', icon: HomeIcon },
  { name: 'Tasks', path: '/tasks', icon: ClipboardDocumentListIcon },
  { name: 'Chat', path: '/chat', icon: ChatBubbleLeftRightIcon },
  { name: 'Calendar', path: '/calendar', icon: CalendarIcon },
  { name: 'Workspaces', path: '/workspaces/manage', icon: UsersIcon }, // Added Workspaces link
];

const Sidebar = () => {
  return (
    <div className="flex flex-shrink-0">
      <div className="flex flex-col w-64">
        <div className="flex flex-col flex-grow pt-5 pb-4 overflow-y-auto bg-white border-r border-gray-200">
          <div className="flex items-center flex-shrink-0 px-4">
            <h1 className="text-xl font-semibold text-gray-800">Collaboration App</h1>
          </div>
          <div className="mt-5 flex-grow flex flex-col">
            <nav className="flex-1 px-2 space-y-1">
              {navigation.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.path}
                  className={({ isActive }) =>
                    `group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                      isActive
                        ? 'bg-gray-100 text-gray-900'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`
                  }
                >
                  {item.icon && (
                    <item.icon
                      className="mr-3 flex-shrink-0 h-6 w-6"
                      aria-hidden="true"
                    />
                  )}
                  {item.name}
                </NavLink>
              ))}
            </nav>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;