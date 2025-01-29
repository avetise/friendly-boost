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
               <h2 className="text-3xl font-bold mb-4">Why Upgrade?</h2>
          <p className="text-lg text-muted-foreground mb-8">
            Our Premium plan is designed for job seekers who want to go the extra mile. With advanced features like AI-optimized resumes and humanized writing, you’ll not only save time but also make a lasting impression on hiring managers. Plus, our premium support team is here to ensure you’re always on track.
          </p>
          <h2 className="text-3xl font-bold mb-4">Join the Freemium Revolution</h2>
          <p className="text-lg text-muted-foreground mb-8">
            This is more than just an upgrade—it’s a commitment to helping you succeed. Whether you stick with our free plan or unlock the full power of Premium, JobFly is here to support your journey every step of the way.
          </p>
          
        

              <div className="flex justify-center">
              <Link to="/account">
                  <Button className="w-full sm:w-auto">
                    <Gift className="w-4 h-4 mr-2" />
                    Get Started Now
                  </Button>
                </Link>
              </div>
            </>
          )}

          {/* Closing Message */}
          <p className="text-sm text-muted-foreground text-center">
            Here’s to a year of growth, opportunities, and landing the job you deserve. Together, let’s make 2025 your best year yet.
          </p>
        </Card>
      </div>
    </div>
  );
};

export default Index;