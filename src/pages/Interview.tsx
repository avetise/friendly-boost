import { useState, useEffect } from 'react';
import { MainNav } from '@/components/navigation/MainNav';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, Send, FileText, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { SubCheck } from '@/components/subscription/SubCheck';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { collection, addDoc, doc, getDoc, updateDoc } from 'firebase/firestore';
import { GenerateResult } from '@/components/generate/GenerateResult';

interface ValidationResult {
  valid: boolean;
  message?: string;
}

const Interview = () => {
  const { user } = useAuth();

  const [jd, setJd] = useState('');
  const [cv, setCv] = useState('');
  const [questions, setQuestions] = useState<string[]>([]);
  const [selectedQuestion, setSelectedQuestion] = useState<string | null>(null);
  const [answer, setAnswer] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAnswerLoading, setIsAnswerLoading] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [useSameResume, setUseSameResume] = useState(false);
  const { toast } = useToast();
  const subbie = SubCheck();
  
  useEffect(() => {
    // Reset answer when changing questions
    setAnswer('');
    setSelectedQuestion(null);
  }, [currentQuestionIndex]);
  
  const handleCheckboxChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      setUseSameResume(e.target.checked);
      if (e.target.checked) {
        try {
          const userDocRef = doc(db, 'users', user?.uid || '');
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            //console.log(userDoc.data().resume)
            setCv(userDoc.data().resume);
            
          }
        } catch (error) {
          console.error("Error fetching resume: ", error);
          setUseSameResume(false);
        }
      } else {
        setCv('');
      }
    };

  const validateInputs = (input: string): ValidationResult => {
    const disallowed = ["ignore", "disregard", "dismiss", "skip", "omit", "defy", "disobey", "leave out", "bypass", "overlook", "neglect"];
    
    if (input.trim().length > 50) {
      return { valid: false, message: "The job title exceeds the length limit." };
    }
    
    if (disallowed.some(word => input.toLowerCase().includes(word))) {
      return { valid: false, message: "Prompt Injection Denied due to disallowed words." };
    }
    
    return { valid: true };
  };

  const handlePrevQuestion = () => {
    setAnswer(''); // Clear previous answer
    setSelectedQuestion(null);
    setCurrentQuestionIndex((prevIndex) => Math.max(prevIndex - 1, 0));
  };
  
  const handleNextQuestion = () => {
    setAnswer(''); // Clear previous answer
    setSelectedQuestion(null);
    setCurrentQuestionIndex((prevIndex) => Math.min(prevIndex + 1, questions.length - 1));
  };

  const handleGenerateQuestions = async () => {
    setIsLoading(true);
    // Clear previous state
    setQuestions([]);
    setCurrentQuestionIndex(0);
    setSelectedQuestion(null);
    setAnswer('');
  
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
      const serverURL = "https://jobfly.onrender.com/interview";
      const response = await fetch(serverURL, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `ApiKey ${import.meta.env.VITE_API_KEY}`
        },
        body: JSON.stringify({ 
          jd,
          sub: subbie
        })
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Failed to fetch questions");
      }
  
      const data = await response.json();
      // Clean and validate questions
      const questionArray = data.result
        .split('\n')
        .map(q => q.trim())
        .filter(q => q && q.length > 0)
        .map(q => q.replace(/^\d+\.\s*/, '')); // Remove any numbering
  
      //console.log('Cleaned questions:', questionArray);
      setQuestions(questionArray);
  
      if (cv) {
        localStorage.setItem('previousResume', cv);
      }
    } catch (error) {
      //console.error('Generate questions error:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuestionClick = async (question: string) => {
    // Debug log
    //console.log('Selected question:', question);
    
    if (selectedQuestion === question) return;
    
    setSelectedQuestion(question);
    setIsAnswerLoading(true);
    setAnswer('');
  
    try {
      const serverURL = "https://jobfly.onrender.com/answer";
      
      // Debug log request payload
      const payload = { 
        q: question,
        cv: cv || '',
        jd,
        sub: subbie
      };
      //console.log('Request payload:', payload);
  
      const response = await fetch(serverURL, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `ApiKey ${import.meta.env.VITE_API_KEY}`
        },
        body: JSON.stringify(payload)
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Failed to generate answer");
      }
  
      const data = await response.json();
      // Debug log response
      //console.log('Response:', data);
      setAnswer(data.result);


      if (data.result.length > 5) {
        await addDoc(collection(db, "interviews"), {
          email: user.email,
          question: question,
          response: data.result,
          createdAt: new Date(),
        })
      };

    } catch (error) {
      console.error('Error details:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsAnswerLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <MainNav />
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-6 space-y-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-2 mb-4">
              <input
                      type="checkbox"
                      id="useSameResume"
                      checked={useSameResume}
                      onChange={handleCheckboxChange}
                      className="rounded border-gray-300 text-primary focus:ring-primary"
                    />
                <label htmlFor="usePreviousResume" className="text-sm font-medium flex items-center">
                  <FileText className="w-4 h-4 mr-2" />
                  Use Previous Resume
                </label>
              </div>

              <div className="space-y-4">
                <Input
                  placeholder="Enter Job Title"
                  value={jd}
                  onChange={(e) => setJd(e.target.value)}
                  className="w-full"
                />
                {!useSameResume && (
                  <Textarea
                    placeholder="Enter your resume or CV text"
                    value={cv}
                    onChange={(e) => setCv(e.target.value)}
                    className="w-full min-h-[200px]"
                  />
                )}
              </div>

              <div className="flex justify-center">
                {isLoading ? (
                  <Button disabled>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </Button>
                ) : (
                  <Button onClick={handleGenerateQuestions}>
                    <Send className="w-4 h-4 mr-2" />
                    Generate Questions
                  </Button>
                )}
              </div>
            </div>

            {questions.length > 0 && (
              <div className="space-y-6">
                <div className="flex items-center space-x-4">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handlePrevQuestion}
                    disabled={currentQuestionIndex === 0}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <div 
                    className={`flex-1 p-4 bg-muted rounded-md min-h-[100px] flex items-center justify-center text-center cursor-pointer hover:bg-muted/80 transition-colors ${
                      selectedQuestion === questions[currentQuestionIndex] ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => {
                      const currentQuestion = questions[currentQuestionIndex];
                      console.log('Clicked question:', currentQuestion);
                      if (currentQuestion) {
                        handleQuestionClick(currentQuestion);
                      }
                    }}
                  >
                    {questions[currentQuestionIndex] || 'No question available'}
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

                {selectedQuestion && (
                  <div className="mt-6 space-y-4">
                    <h3 className="text-lg font-semibold">Suggested Answer:</h3>
                    {isAnswerLoading ? (
                      <div className="flex items-center justify-center p-4">
                        <Loader2 className="h-6 w-6 animate-spin" />
                      </div>
                    ) : (
                      <GenerateResult resultMessage={answer} />
                    )}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Interview;