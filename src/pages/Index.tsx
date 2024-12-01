import { useAuth } from '@/contexts/AuthContext';
import { SignIn } from '@/components/auth/SignIn';
import { PricingPlans } from '@/components/subscription/PricingPlans';
import { auth } from '@/lib/firebase';
import Dashboard from '@/pages/Dashboard';
import Generate from '@/pages/Generate';
import { Routes, Route, Link } from 'react-router-dom';

const Index = () => {
  const { user } = useAuth();

  if (!user) {
    return <SignIn />;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-ce
        nter">
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
      <main className="container mx-auto px-4 py-8">
        <Routes>
          <Route path="/generate" element={<Generate />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/pricing" element={<PricingPlans />} />
          <Route path="/" element={<Generate />} />
        </Routes>
      </main>
    </div>
  );
};

export default Index;