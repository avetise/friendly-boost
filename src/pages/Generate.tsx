import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getFirestore, collection, addDoc, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { MainNav } from '@/components/navigation/MainNav';
import { useToast } from '@/components/ui/use-toast';
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader } from "@/components/ui/loader";
import { Card } from "@/components/ui/card";

const Generate = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [formData, setFormData] = useState({ cv: '', jd: '' });
  const [resultMessage, setResultMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [useSameResume, setUseSameResume] = useState(false);

  useEffect(() => {
    const updateReferralCode = async () => {
      if (!user) return;

      const referralCode = localStorage.getItem('referralCode');
      if (referralCode) {
        const userDocRef = doc(db, 'users', user.uid);
        try {
          await updateDoc(userDocRef, { referral: referralCode });
          localStorage.removeItem('referralCode');
        } catch (error) {
          toast({
            title: "Error",
            description: "Failed to update referral code.",
            variant: "destructive",
          });
        }
      }
    };

    updateReferralCode();
  }, [user, toast]);

  const handleCheckboxChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setUseSameResume(e.target.checked);
    if (e.target.checked) {
      try {
        const userDocRef = doc(db, 'users', user?.uid || '');
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          setFormData((prev) => ({ ...prev, cv: userDoc.data().resume || '' }));
        }
      } catch (error) {
        console.error("Error fetching resume: ", error);
        setUseSameResume(false);
      }
    } else {
      setFormData((prev) => ({ ...prev, cv: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({
        title: "Error",
        description: "You must be signed in to generate a cover letter.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const serverURL = "https://jobfly.onrender.com/generate";
      const response = await fetch(serverURL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `ApiKey ${import.meta.env.VITE_API_KEY}`,
        },
        body: JSON.stringify({ cv: formData.cv, jd: formData.jd }),
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const result = await response.json();
      let message = result.result;

      // Replace placeholders with user data
      message = message.replace(/\[Your Name\]/g, user.displayName || '');
      message = message.replace(/\[Email Address\]/g, user.email || '');
      setResultMessage(message);

      // Save cover letter to Firebase
      await addDoc(collection(db, "coverletters"), {
        email: user.email,
        message: message,
        createdAt: new Date(),
      });

      // Save the resume if not using the previous one
      if (!useSameResume && formData.cv.length > 100) {
        const userDocRef = doc(db, 'users', user.uid);
        await updateDoc(userDocRef, { resume: formData.cv });
      }

      toast({
        title: "Success",
        description: "Cover letter generated successfully!",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate cover letter.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <MainNav />
      <Card className="p-6">
      <div className="container max-w-3xl mx-auto py-8">
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <h1 className="text-3xl font-bold text-center">Cover Letter</h1>
              <p><strong>Name: </strong>{user?.displayName}</p>
              <p><strong>Email: </strong>{user?.email}</p>
            </div>

            <div>
              <input
                type="checkbox"
                id="useSameResume"
                checked={useSameResume}
                onChange={handleCheckboxChange}
              />
              <label htmlFor="useSameResume">Use Same Resume</label>
            </div>

            <Textarea
              name="cv"
              placeholder="Paste resume here"
              value={formData.cv}
              onChange={(e) => setFormData({ ...formData, cv: e.target.value })}
              className="min-h-[150px]"
            />

            <Textarea
              name="jd"
              placeholder="Paste job description here"
              value={formData.jd}
              onChange={(e) => setFormData({ ...formData, jd: e.target.value })}
              className="min-h-[150px]"
            />

            <div className="flex justify-center">
              {isLoading ? (
                <Loader />
              ) : (
                <Button type="submit" disabled={isLoading}>
                  Write Cover Letter
                </Button>
              )}
            </div>
          </div>

          {resultMessage && (
            <div>
              <textarea
                readOnly
                value={resultMessage}
                className="min-h-[200px] w-full"
              />
            </div>
          )}
        </form>
      </div>
      </Card>
      </div>
  );
};

export default Generate;
