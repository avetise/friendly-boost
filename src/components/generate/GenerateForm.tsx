import { useState } from 'react';
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ResumeCheckbox } from "./ResumeCheckbox";
import { Loader } from "@/components/ui/loader";
import { Copy as CopyIcon } from 'lucide-react';
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";

interface GenerateFormProps {
  userEmail: string | null;
  userName: string | null;
  onSubmit: (cv: string, jd: string) => Promise<void>;
  initialResume?: string;
}

export const GenerateForm = ({ userEmail, userName, onSubmit, initialResume = '' }: GenerateFormProps) => {
  const [formData, setFormData] = useState({ cv: initialResume, jd: '' });
  const [resultMessage, setResultMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [useSameResume, setUseSameResume] = useState(false);
  const { toast } = useToast();

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleCheckboxChange = (checked: boolean) => {
    setUseSameResume(checked);
    if (checked) {
      setFormData(prev => ({ ...prev, cv: initialResume }));
    } else {
      setFormData(prev => ({ ...prev, cv: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await onSubmit(formData.cv, formData.jd);
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
    <form onSubmit={handleSubmit}>
      <div className="space-y-4">
        <Card className="p-6">
          <div className="space-y-4">
            <h1 className="text-3xl font-bold text-center">Cover Letter</h1>
            <div className="text-left space-y-2">
              <p><strong>Name: </strong>{userName}</p>
              <p><strong>Email: </strong>{userEmail}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="space-y-4">
            <ResumeCheckbox 
              checked={useSameResume}
              onCheckedChange={handleCheckboxChange}
            />

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
  );
};