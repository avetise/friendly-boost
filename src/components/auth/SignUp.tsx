import { useState } from 'react';
import { auth } from '@/lib/firebase';
import { createUserWithEmailAndPassword, updateProfile, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { useSearchParams } from 'react-router-dom';

export const SignUp = ({ onToggleMode }: { onToggleMode: () => void }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const referralCode = searchParams.get('ref');

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Password validation
    const passwordNumericRegex = /\d+/;
    const passwordUppercaseRegex = /[A-Z]+/;
    const passwordLowercaseRegex = /[a-z]+/;
    const passwordSpecialRegex = /[ !"#$%&'()*+,-./:;<=>?@[\\\]^_`{|}~]+/;

    if (fullName.trim() === '') {
      toast({
        title: "Error",
        description: "Your full name is required.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    if (!passwordNumericRegex.test(String(password)) ||
        !passwordUppercaseRegex.test(String(password)) ||
        !passwordLowercaseRegex.test(String(password)) ||
        !passwordSpecialRegex.test(String(password)) ||
        password.length < 8) {
      toast({
        title: "Error",
        description: "The password must contain at least 8 characters with letters (both uppercase and lowercase), numbers, and symbols.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName: fullName });

      // Create user document
      const userRef = doc(db, 'users', userCredential.user.uid);
      await setDoc(userRef, {
        email: email,
        displayName: fullName,
        role: 'Standard',
        joinDate: new Date(),
        ...(referralCode && { referral: referralCode })
      });

      toast({
        title: "Success",
        description: "Account created successfully!",
      });
    } catch (error: any) {
      let errorMessage = "Failed to create account.";
      
      switch(error.code) {
        case "auth/invalid-email":
          errorMessage = "The email address is badly formatted.";
          break;
        case "auth/missing-email":
          errorMessage = "The email address is missing.";
          break;
        case "auth/email-already-in-use":
          errorMessage = "The email address is already in use by another account.";
          break;
        default:
          errorMessage = error.message;
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
          <CardTitle className="text-2xl font-bold">Create Account</CardTitle>
          <CardDescription>Sign up for a new account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleEmailSignUp} className="space-y-4">
            <Input
              type="text"
              placeholder="Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              disabled={isLoading}
            />
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
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Creating Account...' : 'Sign Up'}
            </Button>
          </form>
          <div className="mt-4 text-center">
            <Button
              variant="link"
              onClick={onToggleMode}
              className="text-primary"
            >
              Already have an account? Sign in
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};