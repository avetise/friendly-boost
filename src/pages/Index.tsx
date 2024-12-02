import { useAuth } from '@/contexts/AuthContext';
import { SignIn } from '@/components/auth/SignIn';
import { MainNav } from '@/components/navigation/MainNav';

const Index = () => {
  const { user } = useAuth();

  if (!user) {
    return <SignIn />;
  }

  return (
    <div className="min-h-screen bg-background">
      <MainNav />
      <main className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-4">Welcome to SaaS Boilerplate</h2>
          <p className="text-muted-foreground mb-8">
            Get started by navigating to Generate or check your Dashboard
          </p>
        </div>
      </main>
    </div>
  );
};

export default Index;