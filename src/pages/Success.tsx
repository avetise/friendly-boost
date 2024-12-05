import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { MainNav } from '@/components/navigation/MainNav';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Success = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    if (!sessionId) {
      toast({
        title: "Error",
        description: "Invalid session",
        variant: "destructive",
      });
      navigate('/pricing');
      return;
    }

    // Show success message and redirect after delay
    toast({
      title: "Success!",
      description: "Your subscription has been activated.",
    });
    
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, [searchParams, navigate, toast]);

  return (
    <>
      <MainNav />
      <div className="container mx-auto py-12">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-center">Thank You!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <div className="flex justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : (
              <div className="text-center space-y-4">
                <p>Your subscription has been successfully activated.</p>
                <p className="text-sm text-muted-foreground">
                  You now have access to all premium features.
                </p>
                <Button onClick={() => navigate('/pricing')}>
                  Go to Dashboard
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default Success;