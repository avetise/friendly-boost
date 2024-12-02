import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { auth } from '@/lib/firebase';

export const MainNav = () => {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <header className="border-b">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold">SaaS Boilerplate</h1>
        <nav className="flex items-center space-x-4">
          <Link to="/generate" className="hover:text-foreground transition-colors">Generate</Link>
          <Link to="/dashboard" className="hover:text-foreground transition-colors">Dashboard</Link>
          <Link to="/pricing" className="hover:text-foreground transition-colors">Pricing</Link>
          <span>{user.email}</span>
          <button
            onClick={() => auth.signOut()}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Sign Out
          </button>
        </nav>
      </div>
    </header>
  );
};