import { BellIcon } from '@heroicons/react/24/outline';

const Header = () => {
  return (
    <div className="relative z-10 flex-shrink-0 flex h-16 bg-white border-b border-gray-200">
      <div className="flex-1 px-4 flex justify-between">
        <div className="flex-1 flex">
          {/* Add search functionality here if needed */}
        </div>
        <div className="ml-4 flex items-center">
          <button
            type="button"
            className="bg-white p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <span className="sr-only">View notifications</span>
            <BellIcon className="h-6 w-6" aria-hidden="true" />
          </button>

          <div className="ml-3">
            <div className="flex items-center">
              <div className="h-8 w-8 rounded-full bg-gray-200" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header;