import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { collection, addDoc, doc, getDoc, updateDoc } from 'firebase/firestore';
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

  const subbie = SubCheck()
  //console.log(subbie)

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

    //console.log(import.meta.env.VITE_API_KEY)
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
      const serverURL = subbie? "https://jobfly.onrender.com/coverletter": "https://jobfly.onrender.com/generate"; //
      const response = await fetch(serverURL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `ApiKey ${import.meta.env.VITE_API_KEY}`,
        },
        body: JSON.stringify({ cv: formData.cv, jd: formData.jd, sub: subbie }),
      });

      //console.log(response)

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const result = await response.json();
      let message = result.result;

      message = message.replace(/\[Your Name\]/g, user.displayName || '');
      message = message.replace(/\[Email Address\]/g, user.email || '');

      
      // Define the replacement array with expanded wildcards
      const replacementArray: { [key: string]: string } = {
        // Expanded variations for "honed"
        "honed": "developed",
        "honing": "improving",

        // Expanded variations for "navigat*"
        "navigate": "manage",
        "navigating": "managing",
        "navigated": "managed",
        "navigation": "management",


        //
        "enthralled": "excited",
        //"respected ": "", 
        "your ": "the ",
        "resonates ": "matches",

        // Expanded variations for "realm"
        "realm": "field",

        // Expanded variations for "esteemed"
        "esteemed ": "",
        "respected ": "",
        "multifaceted ": "",
        // Expanded variations for "journey"
        "journey": "experience",

        // Expanded variations for "aligns seamlessly"
        "aligns seamlessly": "fits well",

        // Expanded variations for "harmoniz*"
        "harmonize": "integrate",
        "harmonizing": "integrating",
        "harmonized": "integrated",
        "harmonization": "integration",

        // Expanded variations for "cultivat*"
        "cultivate": "build",
        "cultivating": "building",
        "cultivated": "built",
        "cultivation": "development",

        // Expanded variations for "spearhead"
        "spearhead": "lead",
        "spearheading": "leading",
        "spearheaded": "led",

        // Expanded variations for "drawn to"
        "drawn to": "interested in",

        // Expanded variations for "underscores"
        "underscores": "highlights",

        // Expanded variations for "complemented by"
        "complemented by": "supported by",

        // Expanded variations for "spirit"
        "spirit": "approach",

        // Expanded variations for "exciting journey"
        "exciting journey": "rewarding experience",

        // Expanded variations for "tenure"
        "tenure": "time",

        // Expanded variations for "enthusiasms"
        "enthusiasms": "interests",
      };

      // Function to perform literal replacements
      function replaceText(message: string, user: { displayName?: string; email?: string }): string {
        console.log("replaced")
        // Replace cringe words/phrases using the replacement array
        Object.keys(replacementArray).forEach((key) => {
          const regex = new RegExp(`\\b${key}\\b`, 'gi'); // Match whole words only
          message = message.replace(regex, replacementArray[key]);
        });

        return message;
      }

      const rMessage = replaceText(message, user);
      subbie? setResultMessage(rMessage):setResultMessage(message);

      //console.log(resultMessage)
      if (resultMessage.length > 5) {
        await addDoc(collection(db, "coverletters"), {
          email: user.email,
          message: resultMessage,
          createdAt: new Date(),
        })
      };

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