import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { auth } from '@/lib/firebase';
import { Button } from "@/components/ui/button";
import { 
  Home,
  FileText, 
  History, 
  User2,
  Sparkles,
  Shield,
  LogOut,
  ChartColumn
} from 'lucide-react';
import { SubCheck } from '@/components/subscription/SubCheck';

export const MainNav = () => {
  const { user, userDetails } = useAuth();

  if (!user) return null;

  const isAdmin = userDetails?.role === 'Admin';
  
  //console.log(SubCheck())

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 py-3">
        <div className="flex h-14 items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <span className="text-2xl font-bold text-primary">
              JobFly
            </span>
          </Link>

          <nav className="flex items-center space-x-6">
            <Link 
              to="/" 
              className="flex items-center space-x-2 text-sm font-medium transition-colors hover:text-primary"
            >
              <Home className="h-4 w-4" />
              <span>Home</span>
            </Link>
            {SubCheck() && (
              <Link 
                to="/resume" 
                className="flex items-center space-x-2 text-sm font-medium transition-colors hover:text-primary"
              >
                <Sparkles className="h-4 w-4" />
                <span>Resume</span>
              </Link>
            )}
            <Link 
              to="/generate" 
              className="flex items-center space-x-2 text-sm font-medium transition-colors hover:text-primary"
            >
              <FileText className="h-4 w-4" />
              <span>Cover Letter</span>
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
                  to="/admin" 
                  className="flex items-center space-x-2 text-sm font-medium transition-colors hover:text-primary"
                >
                  <Shield className="h-4 w-4" />
                  <span>Admin</span>
                </Link>

                <Link 
                  to="/dashboard" 
                  className="flex items-center space-x-2 text-sm font-medium transition-colors hover:text-primary"
                >
                  <ChartColumn className="h-4 w-4" />
                  <span>Stats</span>
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