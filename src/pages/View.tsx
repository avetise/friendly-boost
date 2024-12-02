import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { MainNav } from '@/components/navigation/MainNav';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface DocumentData {
  message: string;
  email: string;
}

const View = () => {
  const [record, setRecord] = useState<string>('');
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const fetchRecord = async () => {
      if (!id || !user) return;

      const docRef = doc(db, "coverletters", id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists() && docSnap.data().email === user.email) {
        const data = docSnap.data() as DocumentData;
        setRecord(data.message);
      } else {
        setRecord('No record found for this ID.');
      }
    };

    fetchRecord();
  }, [id, user]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(record);
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

  return (
    <div className="min-h-screen bg-background">
      <MainNav />
      <div className="container mx-auto px-4 py-8">
        <Card className="p-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <h2 className="text-2xl font-bold">Cover Letter</h2>
            <Button
              variant="outline"
              size="icon"
              onClick={copyToClipboard}
              className="h-8 w-8"
            >
              <Copy className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="whitespace-pre-wrap rounded-lg border bg-muted p-4">
              {record}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default View;