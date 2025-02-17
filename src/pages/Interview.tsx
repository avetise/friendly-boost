import { useState } from 'react';
import { MainNav } from '@/components/navigation/MainNav';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { SubCheck } from '@/components/subscription/SubCheck';

interface ValidationResult {
  valid: boolean;
  message?: string;
}

const Interview = () => {
  const [jd, setJd] = useState('');
  const [questions, setQuestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const { toast } = useToast();



    
    const subbie = SubCheck()
    console.log(subbie)

  const validateInputs = (arg: string): ValidationResult => {
    const disallowed = ["ignore", "disregard", "dismiss", "skip", "omit", "defy", "disobey", "leave out", "bypass", "overlook", "neglect"];
    
    if (arg.trim().length > 50) {
      return { valid: false, message: "The job title exceeds the length limit." };
    }
    
    if (disallowed.some(word => arg.toLowerCase().includes(word))) {
      return { valid: false, message: "Prompt Injection Denied due to disallowed words." };
    }
    
    return { valid: true };
  };

  const handlePrevQuestion = () => {
    setCurrentQuestionIndex((prevIndex) => Math.max(prevIndex - 1, 0));
  };

  const handleNextQuestion = () => {
    setCurrentQuestionIndex((prevIndex) => Math.min(prevIndex + 1, questions.length - 1));
  };

  const handleGenerateQuestion = async () => {
    setIsLoading(true);
    setQuestions([]);
    setCurrentQuestionIndex(0);

    const validation = validateInputs(jd);
    if (!validation.valid) {
      toast({
        title: "Error",
        description: validation.message,
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    try {
      const q = query(collection(db, 'interviews'), where('role', '==', jd));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          setQuestions(data.question);
        });
      } else {
        const serverURL = "https://jobfly.onrender.com/interview";
        const response = await fetch(serverURL, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Authorization": `ApiKey ${import.meta.env.VITE_API_KEY}`
          },
          body: JSON.stringify({ jd, sub:subbie  })
        });

        if (!response.ok) {
          throw new Error("Failed to fetch questions");
        }

        const data = await response.json();
        const questionArray = data.result.split('\n');

        if (questionArray.length >= 20) {
          await addDoc(collection(db, "interviews"), {
            role: jd,
            question: questionArray,
            createdDate: new Date()
          });
          setQuestions(questionArray);
        } else {
          throw new Error("Insufficient number of questions generated");
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate questions",
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
        <Card>
          <CardContent className="p-6 space-y-6">
            <div className="space-y-4">
              <Input
                placeholder="Enter Job Title"
                value={jd}
                onChange={(e) => setJd(e.target.value)}
                className="w-full"
              />
              <div className="flex justify-center">
                {isLoading ? (
                  <Button disabled>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </Button>
                ) : (
                  <Button onClick={handleGenerateQuestion}>
                    Generate Questions
                  </Button>
                )}
              </div>
            </div>

            {questions.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handlePrevQuestion}
                    disabled={currentQuestionIndex === 0}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <div className="flex-1 p-4 bg-muted rounded-md min-h-[100px] flex items-center justify-center text-center">
                    {questions[currentQuestionIndex]}
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleNextQuestion}
                    disabled={currentQuestionIndex === questions.length - 1}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
                <div className="text-center text-sm text-muted-foreground">
                  Question {currentQuestionIndex + 1} of {questions.length}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Interview;