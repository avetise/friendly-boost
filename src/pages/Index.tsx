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
    

   {/* Easter Cheer for Job Seekers 🐣 */}  
<div className="space-y-2">  
  <h2 className="text-xl font-bold text-foreground">Happy Easter, Job Hunters! 🐰✨</h2>  
  <Card className="p-4 bg-muted/50">  
    <p className="text-muted-foreground">  
      This Easter, we hope your job search is filled with fresh opportunities and bright beginnings.  
      Just like eggs hidden in the grass, the perfect role might be closer than you think—keep going!  
      <span className="block mt-2 font-medium text-foreground">  
        Wishing you confidence, luck, and a little extra magic this season. 🎉  
      </span>  
    </p>  
  </Card>  
</div>  

    {/* Premium Section - Only shown to non-subscribers */}
    {!subbie && (
      <div className="space-y-2">
        <h2 className="text-lg font-bold text-foreground">Unlock Premium Features</h2>
        <Card className="p-4 bg-muted/50">
          <p className="text-muted-foreground mb-4">
            Upgrade to Premium for advanced AI cover letters, resumes, interview prep and humanized writing at just $9.99/month.
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
          We're constantly building new features to make your job hunt a breeze. Stay tuned for more exciting updates!
        
    </p>
  </Card>
</div>
    </div>
  );
};

export default Index;