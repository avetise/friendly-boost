import { useEffect, useState } from 'react';
import { auth } from '@/lib/firebase';
import { applyActionCode, verifyPasswordResetCode, confirmPasswordReset } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Link } from 'react-router-dom';

// Component to handle password reset form
const ResetPasswordForm = ({ actionCode }: { actionCode: string }) => {
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stage, setStage] = useState('verifying');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    verifyPasswordResetCode(auth, actionCode).then(() => {
      setStage('form');
    }).catch(error => {
      setStage('');
      setError(error.message);
    });
  }, [actionCode]);

  const handlePasswordReset = async () => {
    setProcessing(true);
    setError(null);

    const passwordNumericRegex = /\d+/;
    const passwordUppercaseRegex = /[A-Z]+/;
    const passwordLowercaseRegex = /[a-z]+/;
    const passwordSpecialRegex = /[ !"#$%&'()*+,-./:;<=>?@[\\\]^_`{|}~]+/;

    if (!passwordNumericRegex.test(newPassword) ||
        !passwordUppercaseRegex.test(newPassword) ||
        !passwordLowercaseRegex.test(newPassword) ||
        !passwordSpecialRegex.test(newPassword) || 
        newPassword.length < 8) {
      setError('The password must contain at least 8 characters with letters (both uppercase and lowercase), numbers, and symbols.');
      setProcessing(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Confirm password does not match with new password.');
      setProcessing(false);
      return;
    }

    try {
      await confirmPasswordReset(auth, actionCode, newPassword);
      setStage('success');
    } catch (error: any) {
      setError(error.message);
    } finally {
      setProcessing(false);
    }
  };

  if (stage === 'verifying') {
    return <p className="text-center">Please wait while verifying your request...</p>;
  }

  if (stage === 'success') {
    return (
      <Alert>
        <AlertDescription>
          Your password has been reset. Please <Link to="/" className="font-medium underline">sign in</Link> with your new password.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <Input
        type="password"
        placeholder="New Password"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        required
        disabled={processing}
      />
      <Input
        type="password"
        placeholder="Confirm Password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        required
        disabled={processing}
      />
      <Button 
        type="button"
        className="w-full"
        disabled={processing}
        onClick={handlePasswordReset}
      >
        {processing ? 'Processing...' : 'Reset Password'}
      </Button>
    </div>
  );
};

// Component to handle email verification
const HandleEmailVerification = ({ actionCode }: { actionCode: string }) => {
  const [processing, setProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    applyActionCode(auth, actionCode).then(() => {
      setSuccess(true);
      setProcessing(false);
    }).catch(error => {
      setError(error.message);
      setProcessing(false);
    });
  }, [actionCode]);

  if (processing) {
    return <p className="text-center">Please wait while verifying your email...</p>;
  }

  if (success) {
    return (
      <Alert>
        <AlertDescription>
          Your email has been verified. Please <Link to="/" className="font-medium underline">sign in</Link> to continue.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert variant="destructive">
      <AlertDescription>{error || 'Something went wrong'}</AlertDescription>
    </Alert>
  );
};

// Main Actions component
export const Actions = () => {
  const params = new URLSearchParams(window.location.search);
  const mode = params.get('mode');
  const actionCode = params.get('oobCode');

  let title = "Unknown Action";
  let description = "";

  switch (mode) {
    case 'resetPassword':
      title = "Reset Password";
      description = "Enter your new password";
      break;
    case 'verifyEmail':
      title = "Verify Email";
      description = "Verifying your email address";
      break;
    default:
      break;
  }

  if (!actionCode) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Invalid Request</CardTitle>
            <CardDescription>This link is invalid or has expired.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/" className="text-primary hover:underline">
              Return to Sign In
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          {mode === 'resetPassword' && <ResetPasswordForm actionCode={actionCode} />}
          {mode === 'verifyEmail' && <HandleEmailVerification actionCode={actionCode} />}
        </CardContent>
      </Card>
    </div>
  );
};

export default Actions;