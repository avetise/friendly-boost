import { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  userDetails: UserDetails | null;
}

interface UserDetails {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role: string;
  joinDate: Timestamp;
  stripeCustomerId?: string;
  subscriptionStatus?: string;
  subscriptionId?: string;
}

const AuthContext = createContext<AuthContextType>({ 
  user: null, 
  loading: true,
  userDetails: null
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        try {
          const userDocSnap = await getDoc(userDocRef);
          
          if (userDocSnap.exists()) {
            const userData = userDocSnap.data() as UserDetails;
            setUserDetails(userData);
          } else {
            // Initialize new user document
            const newUserData: UserDetails = {
              uid: user.uid,
              email: user.email,
              displayName: user.displayName,
              photoURL: user.photoURL,
              role: "Standard",
              joinDate: Timestamp.now(),
            };
            
            await setDoc(userDocRef, newUserData);
            setUserDetails(newUserData);
          }
        } catch (error) {
          console.error("Error handling user document:", error);
        }
      } else {
        setUserDetails(null);
      }
      
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, userDetails }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);