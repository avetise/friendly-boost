import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getFirestore, collection, addDoc, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { MainNav } from '@/components/navigation/MainNav';
import { useToast } from '@/components/ui/use-toast';
import { Button } from "@/components/ui/button";
import { Loader } from "@/components/ui/loader";
import { Card } from "@/components/ui/card";
import { FileText, Send } from 'lucide-react';
import { GenerateForm } from '@/components/generate/GenerateForm';
import { GenerateResult } from '@/components/generate/GenerateResult';
import { SubCheck } from '@/components/subscription/SubCheck';


const Generate = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [formData, setFormData] = useState({ cv: '', jd: '' });
  const [resultMessage, setResultMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [useSameResume, setUseSameResume] = useState(false);

  /* useEffect(() => {
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
  }, [user, toast]); */

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
      const serverURL = SubCheck()? "https://jobfly.onrender.com/coverletter": "https://jobfly.onrender.com/generate";
      const response = await fetch(serverURL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `ApiKey ${import.meta.env.VITE_API_KEY}`,
        },
        body: JSON.stringify({ cv: formData.cv, jd: formData.jd, sub: SubCheck() }),
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const result = await response.json();
      let message = result.result;

      message = message.replace(/\[Your Name\]/g, user.displayName || '');
      message = message.replace(/\[Email Address\]/g, user.email || '');
      setResultMessage(message);

      await addDoc(collection(db, "coverletters"), {
        email: user.email,
        message: message,
        createdAt: new Date(),
      });

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
      <div className="container max-w-3xl mx-auto px-4 py-8">
        <Card className="p-6 space-y-6">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-foreground">Create Cover Letter</h1>
            <p className="text-muted-foreground">Generate a personalized cover letter based on your resume and job description</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <FileText className="w-5 h-5 text-primary" />
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="useSameResume"
                      checked={useSameResume}
                      onChange={handleCheckboxChange}
                      className="rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <label htmlFor="useSameResume" className="text-sm font-medium">
                      Use Previous Resume
                    </label>
                  </div>
                </div>
              </div>

              <GenerateForm 
                formData={formData}
                setFormData={setFormData}
                useSameResume={useSameResume}
              />
            </div>

            <div className="flex justify-end">
              {isLoading ? (
                <Button disabled className="w-full sm:w-auto">
                  <Loader className="mr-2" />
                  Generating...
                </Button>
              ) : (
                <Button type="submit" className="w-full sm:w-auto">
                  <Send className="w-4 h-4 mr-2" />
                  Generate Cover Letter
                </Button>
              )}
            </div>
          </form>

          <GenerateResult resultMessage={resultMessage} />
        </Card>
      </div>
    </div>
  );
};

export default Generate;