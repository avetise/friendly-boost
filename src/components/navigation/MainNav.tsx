import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { auth } from '@/lib/firebase';
import { Button } from "@/components/ui/button";
import { 
  LayoutDashboard, 
  FileText, 
  History, 
  User2,
  Users,
  Shield,
  LogOut
} from 'lucide-react';

export const MainNav = () => {
  const { user, userDetails } = useAuth();

  if (!user) return null;

  const isAdmin = userDetails?.role === 'Admin';

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 py-3">
        <div className="flex h-14 items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <span className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              JobFly
            </span>
          </Link>

          <nav className="flex items-center space-x-6">
            <Link 
              to="/generate" 
              className="flex items-center space-x-2 text-sm font-medium transition-colors hover:text-primary"
            >
              <FileText className="h-4 w-4" />
              <span>Generate</span>
            </Link>

            <Link 
              to="/history" 
              className="flex items-center space-x-2 text-sm font-medium transition-colors hover:text-primary"
            >
              <History className="h-4 w-4" />
              <span>History</span>
            </Link>

            <Link 
              to="/account" 
              className="flex items-center space-x-2 text-sm font-medium transition-colors hover:text-primary"
            >
              <User2 className="h-4 w-4" />
              <span>Account</span>
            </Link>

            {isAdmin && (
              <>
                <Link 
                  to="/dashboard" 
                  className="flex items-center space-x-2 text-sm font-medium transition-colors hover:text-primary"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  <span>Dashboard</span>
                </Link>

                <Link 
                  to="/admin" 
                  className="flex items-center space-x-2 text-sm font-medium transition-colors hover:text-primary"
                >
                  <Shield className="h-4 w-4" />
                  <span>Admin</span>
                </Link>
              </>
            )}

            <div className="flex items-center space-x-4 border-l pl-6 ml-2">
              <span className="text-sm font-medium">
                {user.displayName}
              </span>
              
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => auth.signOut()}
                className="flex items-center space-x-2 text-sm hover:text-primary"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign Out</span>
              </Button>
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
};