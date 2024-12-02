import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getFirestore, collection, addDoc, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { MainNav } from '@/components/navigation/MainNav';
import { handleFirebaseError } from '@/utils/firebaseErrorHandler';
import { useToast } from '@/components/ui/use-toast';
import { GenerateForm } from '@/components/generate/GenerateForm';

const Generate = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const updateReferralCode = async () => {
      if (!user) return;
      
      const referralCode = localStorage.getItem('referralCode');
      if (referralCode) {
        const userDocRef = doc(db, 'users', user.uid);
        try {
          await updateDoc(userDocRef, {
            referral: referralCode,
          });
          localStorage.removeItem('referralCode');
        } catch (error) {
          console.error("Error updating referral:", error);
          toast({
            title: "Error",
            description: handleFirebaseError(error),
            variant: "destructive",
          });
        }
      }
    };

    updateReferralCode();
  }, [user, toast]);

  const handleSubmit = async (cv: string, jd: string) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be signed in to generate a cover letter.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const serverURL = "https://jobfly.onrender.com/generate";
      const response = await fetch(serverURL, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `ApiKey ${import.meta.env.VITE_API_KEY}`
        },
        body: JSON.stringify({ cv, jd })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      let message = result.result;

      // Replace placeholders with user data
      message = message.replace(/\[Your Name\]/g, user.displayName || '');
      message = message.replace(/\[Email Address\]/g, user.email || '');
      message = message.replace(/\[Your Email\]/g, user.email || '');

      // Save to Firebase
      await addDoc(collection(db, "coverletters"), {
        email: user.email,
        message: message,
        createdAt: new Date()
      });

      toast({
        title: "Success",
        description: "Cover letter generated successfully!",
      });

      return message;
    } catch (error) {
      console.error("Error:", error);
      throw error;
    }
  };

  return (
    <>
      <MainNav />
      <div className="container max-w-3xl mx-auto py-8">
        <GenerateForm
          userEmail={user?.email || null}
          userName={user?.displayName || null}
          onSubmit={handleSubmit}
        />
      </div>
    </>
  );
};

export default Generate;