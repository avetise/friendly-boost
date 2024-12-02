import { FirebaseError } from 'firebase/app';

export const handleFirebaseError = (error: unknown): string => {
  if (error instanceof FirebaseError) {
    console.error('Firebase Error:', {
      code: error.code,
      message: error.message,
      details: error
    });

    switch (error.code) {
      case 'permission-denied':
        return 'Access denied. Please check if you are logged in and have the necessary permissions.';
      case 'not-found':
        return 'The requested resource was not found.';
      case 'unauthenticated':
        return 'Please sign in to access this feature.';
      default:
        return `An error occurred: ${error.message}`;
    }
  }
  
  console.error('Non-Firebase Error:', error);
  return 'An unexpected error occurred. Please try again.';
};