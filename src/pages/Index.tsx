import { useAuth } from '@/contexts/AuthContext';
import { SignIn } from '@/components/auth/SignIn';
import { MainNav } from '@/components/navigation/MainNav';
import { Card } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Gift  } from 'lucide-react';
import { SubCheck } from '@/components/subscription/SubCheck';


const Index = () => {
  const { user } = useAuth();
  const subbie = SubCheck();
console.log("Loaded...")
  if (!user) {
    return <SignIn />;
  }
  return (
    <div className="min-h-screen bg-background">
      <MainNav />
      <div className="container max-w-3xl mx-auto px-4 py-8">
        <Card className="p-6 space-y-6">
          {/* Important AI Update Section */}
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-foreground">Important AI Service Update</h2>
            <Card className="p-4 bg-muted/50">
              <p className="text-muted-foreground">
              Due to disruptions to some AI backend services we use, you may experience occasional service interruptions. Our team is implementing improvements to ensure a more stable experience. If you encounter any issues, please reach out to support@jobfly.co.
              </p>
            </Card>
          </div>
  
          {/* Premium Section - Only shown to non-subscribers */}
          {!subbie && (
            <div className="space-y-2">
              <h2 className="text-lg font-bold text-foreground">Premium Features Available</h2>
              <Card className="p-4 bg-muted/50">
                <p className="text-muted-foreground mb-4">
                  Upgrade to Premium for advanced AI cover letters, resumes, and humanized writing at $9.99/month.
                </p>
                <div className="flex justify-start">
                  <Link to="/account">
                    <Button className="w-auto">
                      <Gift className="w-4 h-4 mr-2" />
                      Upgrade Now
                    </Button>
                  </Link>
                </div>
              </Card>
            </div>
          )}
  
          {/* Closing Message */}
          <p className="text-muted-foreground text-center">
            Here's to empowering your job search journey. Let's make your next career move count.
          </p>
        </Card>
      </div>
    </div>
  );
};

export default Index;