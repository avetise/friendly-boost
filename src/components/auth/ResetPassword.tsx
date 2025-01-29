import { useState } from 'react';
import { auth } from '@/lib/firebase';
import { sendPasswordResetEmail } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/components/ui/use-toast';
import { Link } from 'react-router-dom';

export const ResetPassword = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { toast } = useToast();

  const handleResetPassword = async () => {
    setIsLoading(true);
    setSuccess(false);
    
    try {
      await sendPasswordResetEmail(auth, email);
      setSuccess(true);
      toast({
        title: "Success",
        description: "Password reset email has been sent.",
      });
    } catch (error: any) {
      let errorMessage = 'Failed to send reset email.';
      
      switch(error.code) {
        case "auth/invalid-email":
          errorMessage = 'The email address is badly formatted.';
          break;
        case "auth/missing-email":
          errorMessage = 'The email address is missing.';
          break;
        case "auth/user-not-found":
          errorMessage = 'No user found with this email address.';
          break;
        case "auth/too-many-requests":
          errorMessage = 'Too many requests. Please try again later.';
          break;
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md animate-fadeIn">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Reset Password</CardTitle>
          <CardDescription>Enter your email to reset your password</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {success && (
              <Alert>
                <AlertDescription>
                  A password reset email has been sent to your email address.
                </AlertDescription>
              </Alert>
            )}
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
            />
            <Button 
              type="button" 
              className="w-full" 
              disabled={isLoading}
              onClick={handleResetPassword}
            >
              {isLoading ? 'Sending...' : 'Reset Password'}
            </Button>
            <div className="mt-4 text-center">
              <Link
                to="/"
                className="text-sm text-primary hover:underline"
              >
                Back to Sign In
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPassword;
