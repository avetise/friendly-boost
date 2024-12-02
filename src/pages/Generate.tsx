import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getFirestore, collection, addDoc, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Copy as CopyIcon } from 'lucide-react';
import { Loader } from '@/components/ui/loader';
import { MainNav } from '@/components/navigation/MainNav';
import { handleFirebaseError } from '@/utils/firebaseErrorHandler';
import { useToast } from '@/components/ui/use-toast';

interface FormData {
  cv: string;
  jd: string;
}

const Generate = () => {
  const [formData, setFormData] = useState<FormData>({ cv: '', jd: '' });
  const [resultMessage, setResultMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [useSameResume, setUseSameResume] = useState<boolean>(false);
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

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleCheckboxChange = async (checked: boolean) => {
    setUseSameResume(checked);
    if (checked && user) {
      try {
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          setFormData(prev => ({ ...prev, cv: userDoc.data().resume || '' }));
        }
      } catch (error) {
        console.error("Error fetching resume:", error);
        toast({
          title: "Error",
          description: handleFirebaseError(error),
          variant: "destructive",
        });
        setUseSameResume(false);
      }
    } else {
      setFormData(prev => ({ ...prev, cv: '' }));
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
          "Authorization": `ApiKey ${import.meta.env.VITE_API_KEY}`
        },
        body: JSON.stringify({
          cv: formData.cv,
          jd: formData.jd
        })
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

      setResultMessage(message);

      // Save to Firebase
      await addDoc(collection(db, "coverletters"), {
        email: user.email,
        message: message,
        createdAt: new Date()
      });

      // Update resume in user profile if needed
      if (!useSameResume && formData.cv.length > 100) {
        const userDocRef = doc(db, 'users', user.uid);
        await updateDoc(userDocRef, { resume: formData.cv });
      }

      toast({
        title: "Success",
        description: "Cover letter generated successfully!",
      });
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate cover letter",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(resultMessage);
      toast({
        title: "Success",
        description: "Copied to clipboard!",
      });
    } catch (err) {
      console.error('Failed to copy:', err);
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <MainNav />
      <div className="container max-w-3xl mx-auto py-8">
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <Card className="p-6">
              <div className="space-y-4">
                <h1 className="text-3xl font-bold text-center">Cover Letter</h1>
                <div className="text-left space-y-2">
                  <p><strong>Name: </strong>{user.displayName}</p>
                  <p><strong>Email: </strong>{user.email}</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="useSameResume"
                    checked={useSameResume}
                    onCheckedChange={(checked) => handleCheckboxChange({ target: { checked } })}
                  />
                  <label htmlFor="useSameResume">Use Same Resume</label>
                </div>

                <Textarea
                  name="cv"
                  placeholder="Paste resume here"
                  value={formData.cv}
                  onChange={handleChange}
                  className="min-h-[150px]"
                />

                <Textarea
                  name="jd"
                  placeholder="Paste job description here"
                  value={formData.jd}
                  onChange={handleChange}
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
            </Card>

            {resultMessage && (
              <Card className="p-6">
                <div className="flex justify-end mb-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={copyToClipboard}
                    title="Copy to clipboard"
                  >
                    <CopyIcon className="h-4 w-4" />
                  </Button>
                </div>
                <Textarea
                  value={resultMessage}
                  readOnly
                  className="min-h-[200px]"
                />
              </Card>
            )}
          </div>
        </form>
      </div>
    </>
  );
};

export default Generate;