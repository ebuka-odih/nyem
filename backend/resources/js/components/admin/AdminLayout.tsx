import type { ReactNode } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { LayoutDashboard, Users, Heart, Package, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AdminLayoutProps {
  children: ReactNode;
  currentPath?: string;
}

export function AdminLayout({ children, currentPath = '' }: AdminLayoutProps) {
  const { url } = usePage();
  
  // Use the actual URL path if currentPath is not provided
  const activePath = currentPath || url;
  const navItems = [
    { path: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/admin/users', label: 'Users', icon: Users },
    { path: '/admin/matches', label: 'Matches', icon: Heart },
    { path: '/admin/items', label: 'Items', icon: Package },
  ];

  const handleLogout = () => {
    // Use Inertia's router for logout
    window.location.href = '/logout';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-gray-900">Nyem Admin</h1>
        </div>
        <nav className="px-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePath === item.path;
            return (
              <Link
                key={item.path}
                href={item.path}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                  isActive
                    ? 'bg-blue-50 text-blue-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                )}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="ml-64 p-8">
        {children}
      </main>
    </div>
  );
}

