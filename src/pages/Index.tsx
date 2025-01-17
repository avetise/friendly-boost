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

          
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-foreground">Welcome to the Future of JobFly: Introducing Premium!</h1>
            <p className="text-muted-foreground">
              As we step into the new year, we’re thrilled to share an exciting update that’s all about empowering your job search like never before. After a year of helping thousands of users craft standout cover letters with our free AI-powered tool, JobFly is evolving to bring you even more value.
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-foreground">What’s New?</h2>
              <Card className="p-4 bg-muted/50">
                <h3 className="text-lg font-semibold text-foreground">✨ Free Plan</h3>
                <p className="text-muted-foreground">Perfect for getting started:</p>
                <ul className="list-disc list-inside text-muted-foreground">
                  <li>Basic AI-generated cover letters</li>
                  <li>Always free, always helpful</li>
                </ul>
              </Card>
              <Card className="p-4 bg-muted/50">
                <h3 className="text-lg font-semibold text-foreground">🚀 Premium Plan</h3>
                <p className="text-muted-foreground">For those who want to stand out:</p>
                <p className="text-primary font-bold">$9.99/month</p>
                <ul className="list-disc list-inside text-muted-foreground">
                  <li>Advanced AI cover letters</li>
                  <li>Advanced AI resumes</li>
                  <li>Humanized writing with no "AI-words"</li>
                  <li>Priority technical support</li>
                </ul>
              </Card>
            </div>
          </div>

          {/* Invite Friends Section */}
          {!subbie && (
            <>
              <div className="space-y-2">
                <h2 className="text-xl font-bold text-foreground">Unlock Premium for Free This February</h2>
                <p className="text-muted-foreground">
                  We’re celebrating the start of a new year by giving you the chance to unlock <strong>free Premium access for the entire month of February</strong>. Here’s how:
                </p>
                <ul className="list-disc list-inside text-muted-foreground">
                  <li>Invite <strong>5 friends</strong> to join JobFly.</li>
                  <li>Help them kickstart their job search with our free tools.</li>
                  <li>Enjoy <strong>unlimited Premium features</strong> for the entire month of February.</li>
                </ul>
                <p className="text-muted-foreground">
                  It’s our way of saying thank you for being part of the JobFly community and helping others succeed.
                </p>
              </div>

              <div className="flex justify-center">
                <Link to="/invite">
                  <Button className="w-full sm:w-auto">
                    <Gift className="w-4 h-4 mr-2" />
                    Invite Friends & Unlock Premium
                  </Button>
                </Link>
              </div>
            </>
          )}

          {/* Closing Message */}
          <p className="text-sm text-muted-foreground text-center">
            Here’s to a year of growth, opportunities, and landing the job you deserve. Together, let’s make 2024 your best year yet.
          </p>
        </Card>
      </div>
    </div>
  );
};

export default Index;