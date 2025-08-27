import { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { Wine, Home, Users, Star, User, LogOut, Settings } from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { user, signOut } = useAuth();
  const { isAdminOrOwner, loading: rolesLoading } = useUserRole();
  const location = useLocation();
  const navigate = useNavigate();

  const navigation = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'My Cellar', href: '/cellar', icon: Wine },
    { name: 'Friends', href: '/friends', icon: Users },
    { name: 'Ratings', href: '/ratings', icon: Star },
    ...(!rolesLoading && isAdminOrOwner ? [{ name: 'Admin', href: '/admin', icon: Settings }] : []),
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link to="/" className="flex items-center space-x-2">
              <Wine className="h-8 w-8 text-primary" />
              <span className="font-bold text-xl">Cellar Critiques</span>
            </Link>
          </div>

          <nav className="hidden md:flex items-center space-x-6">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center space-x-2 text-sm font-medium transition-colors hover:text-primary ${
                    isActive(item.href)
                      ? 'text-primary'
                      : 'text-muted-foreground'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center space-x-4">
            {user && (
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="sm" onClick={() => navigate('/profile')}>
                  <User className="h-4 w-4 mr-2" />
                  Profile
                </Button>
                <Button variant="ghost" size="sm" onClick={signOut}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">
        {children}
      </main>

      {/* Mobile navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background border-t">
        <div className={`grid gap-1 p-2 ${navigation.length === 5 ? 'grid-cols-5' : 'grid-cols-4'}`}>
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex flex-col items-center justify-center p-2 text-xs font-medium transition-colors hover:text-primary ${
                  isActive(item.href)
                    ? 'text-primary'
                    : 'text-muted-foreground'
                }`}
              >
                <Icon className="h-5 w-5 mb-1" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}