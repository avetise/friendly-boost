import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { MainNav } from "@/components/navigation/MainNav";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import ReactMarkdown from 'react-markdown';

interface DocumentData {
  message: string;
  email: string;
}

interface ViewProps {
  collection: "coverletters" | "resumes";
}

const View = ({ collection }: ViewProps) => {
  const [record, setRecord] = useState<string>("");
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const fetchRecord = async () => {
      if (!id || !user) return;
      console.log(id)
      const docRef = doc(db, collection, id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists() && docSnap.data().email === user.email) {
        const data = docSnap.data() as DocumentData;
        console.log(data.message)
        setRecord(data.message);
      } else {
        console.log(docSnap.exists() )
        console.log(docSnap.data().email === user.email)
        setRecord("No record found for this ID.");
      }
    };

    fetchRecord();
  }, [id, user, collection]);

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
      <div className="container max-w-3xl mx-auto px-4 py-8">
        <Card className="p-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <h2 className="text-2xl font-bold">
              {collection === "coverletters" ? "Cover Letter" : "Resume"}
            </h2>
            <Button
              variant="outline"
              size="icon"
              onClick={copyToClipboard}
              className="h-8 w-8"
            >
              <Copy className="h-4 w-4" />
            </Button>
          </CardHeader>
          
            <div className="p-4 bg-card">
                      <div className="prose prose-sm max-w-none dark:prose-invert">
                        <ReactMarkdown
                          components={{
                            h1: ({ children }) => (
                              <h1 className="text-2xl font-bold mt-6 mb-4">{children}</h1>
                            ),
                            h2: ({ children }) => (
                              <h2 className="text-xl font-bold mt-5 mb-3">{children}</h2>
                            ),
                            h3: ({ children }) => (
                              <h3 className="text-lg font-bold mt-4 mb-2">{children}</h3>
                            ),
                            p: ({ children }) => (
                              <p className="mb-4 leading-relaxed">{children}</p>
                            ),
                            ul: ({ children }) => (
                              <ul className="list-disc pl-6 mb-4 space-y-2">{children}</ul>
                            ),
                            ol: ({ children }) => (
                              <ol className="list-decimal pl-6 mb-4 space-y-2">{children}</ol>
                            ),
                            li: ({ children }) => (
                              <li className="mb-1">{children}</li>
                            ),
                            blockquote: ({ children }) => (
                              <blockquote className="border-l-4 border-primary pl-4 italic my-4">
                                {children}
                              </blockquote>
                            ),
                            code: ({ inline, children }) => (
                              inline ? 
                                <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">
                                  {children}
                                </code> :
                                <pre className="bg-muted p-4 rounded-lg overflow-x-auto">
                                  <code className="text-sm font-mono">{children}</code>
                                </pre>
                            ),
                            a: ({ href, children }) => (
                              <a 
                                href={href} 
                                className="text-primary hover:underline"
                                target="_blank" 
                                rel="noopener noreferrer"
                              >
                                {children}
                              </a>
                            ),
                            table: ({ children }) => (
                              <div className="overflow-x-auto my-4">
                                <table className="min-w-full divide-y divide-border">
                                  {children}
                                </table>
                              </div>
                            ),
                            th: ({ children }) => (
                              <th className="px-4 py-2 bg-muted font-medium">{children}</th>
                            ),
                            td: ({ children }) => (
                              <td className="px-4 py-2 border-t border-border">{children}</td>
                            ),
                          }}
                        >
                          {record}
                        </ReactMarkdown>
                      </div>
                    </div>
          
        </Card>
      </div>
    </div>
  );
};

export default View;
