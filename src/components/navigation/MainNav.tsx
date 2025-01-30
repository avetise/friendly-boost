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
  ChartColumn,
  Menu,
  Users,
  MessageSquare
} from 'lucide-react';
import { SubCheck } from '@/components/subscription/SubCheck';
import { useState } from 'react';

export const MainNav = () => {
  const { user, userDetails } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  if (!user) return null;

  const isAdmin = userDetails?.role === 'Admin';

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 py-3">
        <div className="flex h-14 items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <span className="text-2xl font-bold text-primary">
              JobFly
            </span>
          </Link>

          {/* Mobile Menu Toggle */}
          <button 
            className="lg:hidden p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <Menu className="h-6 w-6" />
          </button>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-6">
            <NavItem to="/" icon={Home} label="Home" />
            {(SubCheck()||isAdmin) && (
              <>
                <NavItem to="/resume" icon={Sparkles} label="Resume" />
                <NavItem to="/interview" icon={MessageSquare} label="Interview" />
              </>
            )}
            <NavItem to="/generate" icon={FileText} label="Cover Letter" />
            <NavItem to="/history" icon={History} label="History" />
            <NavItem to="/invite" icon={Users} label="Invite" />
            <NavItem to="/account" icon={User2} label="Account" />

            {isAdmin && (
              <>
                <NavItem to="/admin" icon={Shield} label="Admin" />
                <NavItem to="/dashboard" icon={ChartColumn} label="Stats" />
              </>
            )}

            <UserSection user={user} />
          </nav>

          {/* Mobile Navigation */}
          {menuOpen && (
            <nav className="absolute top-full left-0 right-0 bg-background border-t p-4 lg:hidden">
              <div className="flex flex-col space-y-4">
                <NavItem to="/" icon={Home} label="Home" />
                {(SubCheck()||isAdmin) && (
                  <>
                    <NavItem to="/resume" icon={Sparkles} label="Resume" />
                    <NavItem to="/interview" icon={MessageSquare} label="Interview" />
                  </>
                )}
                <NavItem to="/generate" icon={FileText} label="Cover Letter" />
                <NavItem to="/history" icon={History} label="History" />
                <NavItem to="/invite" icon={Users} label="Invite" />
                <NavItem to="/account" icon={User2} label="Account" />

                {isAdmin && (
                  <>
                    <NavItem to="/admin" icon={Shield} label="Admin" />
                    <NavItem to="/dashboard" icon={ChartColumn} label="Stats" />
                  </>
                )}

                <UserSection user={user} />
              </div>
            </nav>
          )}
        </div>
      </div>
    </header>
  );
};

const NavItem = ({ to, icon: Icon, label }) => (
  <Link 
    to={to} 
    className="flex items-center space-x-2 text-sm font-medium transition-colors hover:text-primary"
  >
    <Icon className="h-4 w-4" />
    <span>{label}</span>
  </Link>
);

const UserSection = ({ user }) => (
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
);