import { useState } from 'react';
import { auth } from '@/lib/firebase';
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { useSearchParams, Link } from 'react-router-dom';
import { SignUp } from './SignUp';

export const SignIn = () => {
  const [isSignIn, setIsSignIn] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const referralCode = searchParams.get('ref');

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);

      // If referral code exists, update user and create invite record
      if (referralCode) {
        await handleReferral(userCredential.user.uid, referralCode, userCredential.user.email || '');
      }

      toast({
        title: "Success",
        description: "Successfully signed in!",
      });
    } catch (error: any) {
      console.error('Email sign-in error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to sign in. Please check your credentials.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({
      prompt: 'select_account'
    });

    try {
      const result = await signInWithPopup(auth, provider);

      // If referral code exists, update user and create invite record
      if (referralCode) {
        await handleReferral(result.user.uid, referralCode, result.user.email || '');
      }

      toast({
        title: "Success",
        description: "Successfully signed in with Google!",
      });
    } catch (error: any) {
      console.error('Google sign-in error:', error);
      let errorMessage = "Failed to sign in with Google.";
      
      if (error.code === 'auth/popup-blocked') {
        errorMessage = "Pop-up was blocked by your browser. Please allow pop-ups for this site.";
      } else if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = "Sign-in pop-up was closed before completing the process.";
      } else if (error.code === 'auth/unauthorized-domain') {
        errorMessage = "This domain is not authorized for Google Sign-In. Please add it to your Firebase Console.";
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = "Network error occurred. Please check your internet connection.";
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

  const handleReferral = async (userId: string, referralCode: string, userEmail: string) => {
    try {
      // First, check if user already exists and has a referral
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        // New user - create user document with referral
        await setDoc(userRef, {
          email: userEmail,
          referral: referralCode,
          joinDate: new Date(),
          role: 'Standard'
        });
      } else if (!userDoc.data()?.referral) {
        // Existing user without referral - update with referral
        await setDoc(userRef, { referral: referralCode }, { merge: true });
      } else {
        // User already has a referral - do nothing
        console.log('User already has a referral code');
        return;
      }

      // Create invite record
      const inviteRef = collection(db, 'invites');
      await addDoc(inviteRef, {
        senderEmail: referralCode,
        recipientEmail: userEmail,
        status: 'joined',
        joinedAt: new Date()
      });

    } catch (error) {
      console.error('Error handling referral:', error);
      throw error;
    }
  };

  if (!isSignIn) {
    return <SignUp onToggleMode={() => setIsSignIn(true)} />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md animate-fadeIn">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
          <CardDescription>Sign in to your account to continue</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleEmailSignIn} className="space-y-4">
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
            />
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
            />
            <div className="flex justify-between items-center">
              <Link 
                to="/reset-password"
                className="text-sm text-primary hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
          >
            {isLoading ? 'Signing in...' : 'Sign in with Google'}
          </Button>
          <div className="mt-4 text-center">
            <Button
              variant="link"
              onClick={() => setIsSignIn(false)}
              className="text-primary"
            >
              Don't have an account? Sign up
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};