import React, { useState, useContext, useEffect } from 'react';
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

  useEffect(() => {
    const updateReferralCode = async () => {
      const referralCode = localStorage.getItem('referralCode');
      if (referralCode) {
          const userDocRef = doc(db, 'users', user.uid);
          try {
              await updateDoc(userDocRef, {
                  referral: referralCode,
              });

              localStorage.removeItem('referralCode');
          } catch (error) {
              console.error("Error updating document:", error);
          }
      }
    };

    updateReferralCode();
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleCheckboxChange = (e) => {
    setUseSameResume(e.target.checked);
    if (e.target.checked) {
      fetchAndSetResume();
    } else {
      setFormData({ ...formData, cv: '' });
    }
  };

  const fetchAndSetResume = async () => {
    try {
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        setFormData({ ...formData, cv: userDoc.data().resume || '' });
      } else {
        setUseSameResume(false);
      }
    } catch (error) {
      console.error("Error fetching resume: ", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const serverURL = "https://jobfly.onrender.com/generate"; // Replace with your Render.com app URL
      const response = await fetch(serverURL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `ApiKey ${process.env.REACT_APP_SECUREKEY}` },
        body: JSON.stringify({
          cv: formData.cv, 
          jd: formData.jd  
        })
      });

      if (response.ok) {
        const result = await response.json();
        let message = result.result;

        message = message.replace(/\[Your Name\]/g, user.displayName);
        message = message.replace(/\[Email Address\]/g, user.email);
        message = message.replace(/\[Your Email\]/g, user.email);

        setResultMessage(message);
        await addDoc(collection(db, "coverletters"), {
          email: user.email,
          message: message,
          createdAt: new Date()
        });

      } else {
        console.error("Error calling API");
        alert("Error generating cover letter.");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error generating cover letter.");
    } finally {
      setIsLoading(false);
    }

    if (!useSameResume && formData.cv.length > 100) {
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, { resume: formData.cv });
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(resultMessage);
    } catch (err) {
      console.error('Failed to copy: ', err);
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
