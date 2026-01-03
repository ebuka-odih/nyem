import type { ReactNode } from 'react';
import { Link, usePage, router } from '@inertiajs/react';
import { LayoutDashboard, Users, Heart, Package, FolderTree, LogOut } from 'lucide-react';
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
    { path: '/admin/categories', label: 'Categories', icon: FolderTree },
  ];

  const handleLogout = () => {
    // Use Inertia's router.post for logout with proper redirect handling
    router.post('/logout', {}, {
      onSuccess: () => {
        // Force a full page reload to clear any cached state
        window.location.href = '/login';
      },
      onError: () => {
        // Even on error, redirect to login
        window.location.href = '/login';
      },
    });
  };

  return (
    <div className="dark min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-card border-r border-border">
        <div className="p-6 border-b border-border">
          <h1 className="text-2xl font-bold text-foreground">Nyem Admin</h1>
        </div>
        <nav className="px-4 py-4 space-y-1">
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
                    ? 'bg-primary text-primary-foreground font-medium'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full text-muted-foreground hover:bg-accent hover:text-accent-foreground rounded-lg transition-colors"
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

