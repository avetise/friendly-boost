import { Card } from "@/components/ui/card";

interface GenerateResultProps {
  resultMessage: string;
}

export const GenerateResult = ({ resultMessage }: GenerateResultProps) => {
  if (!resultMessage) return null;
  
  return (
    <Card className="p-4 mt-6 bg-muted/50">
      <h3 className="font-medium mb-2">Generated Cover Letter</h3>
      <div className="bg-card p-4 rounded-md">
        <pre className="whitespace-pre-wrap font-sans text-sm">
          {resultMessage}
        </pre>
      </div>
    </Card>
  );
};