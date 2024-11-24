import { useAuth } from '@/contexts/AuthContext';
import { SignIn } from '@/components/auth/SignIn';
import { PricingPlans } from '@/components/subscription/PricingPlans';
import { auth } from '@/lib/firebase';

const Index = () => {
  const { user } = useAuth();

  if (!user) {
    return <SignIn />;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">SaaS Boilerplate</h1>
          <div className="flex items-center space-x-4">
            <span>{user.email}</span>
            <button
              onClick={() => auth.signOut()}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>
      <main>
        <PricingPlans />
      </main>
    </div>
  );
};

export default Index;