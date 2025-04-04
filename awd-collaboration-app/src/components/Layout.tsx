import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import WorkspaceSelector from './workspace/WorkspaceSelector'; // Import WorkspaceSelector

const Layout = () => {
  return (
    <div className="h-screen flex overflow-hidden bg-gray-100">
      <Sidebar />
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        <Header />
        
        {/* Workspace Selector Bar */}
        <div className="bg-white border-b border-gray-200 px-4 py-2">
          <div className="max-w-7xl mx-auto flex items-center">
            <WorkspaceSelector />
          </div>
        </div>
        
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;