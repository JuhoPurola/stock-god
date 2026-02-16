import { Bell, User } from 'lucide-react';

export function Header() {
  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      <div className="flex-1" />

      <div className="flex items-center space-x-4">
        <button className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors">
          <Bell className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
            <User className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">Demo User</p>
            <p className="text-xs text-gray-500">demo@example.com</p>
          </div>
        </div>
      </div>
    </header>
  );
}
