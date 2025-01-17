import { Card } from "@/components/ui/card";

import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";


interface GenerateResultProps {
  resultMessage: string;
}

export const GenerateResult = ({ resultMessage }: GenerateResultProps) => {
  const { toast } = useToast();

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(resultMessage);
      toast({
        title: "Copied!",
        description: "Content copied to clipboard",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to copy content",
        variant: "destructive",
      });
    }
  };
  
  if (!resultMessage) return null;
  

  return (
    <Card className="p-4 mt-6 bg-muted/50">
      <h3 className="font-medium mb-2">Generated Cover Letter</h3>
      <Button
              variant="outline"
              size="icon"
              onClick={copyToClipboard}
              className="h-8 w-8"
            >
              <Copy className="h-4 w-4" />
            </Button>
      <div className="bg-card p-4 rounded-md">
        <pre className="whitespace-pre-wrap font-sans text-sm">
          {resultMessage}
        </pre>
      </div>
    </Card>
  );
};