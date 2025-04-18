import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { MainNav } from '@/components/navigation/MainNav';
import { Card } from "@/components/ui/card";
import { Link } from 'react-router-dom';
import { Clock, ChevronRight } from 'lucide-react';
import { handleFirebaseError } from '@/utils/firebaseErrorHandler';
import { useToast } from "@/components/ui/use-toast";

interface HistoryItem {
  id: string;
  createdAt: {
    toDate: () => Date;
  };
  email: string;
}

const History = () => {
  const [coverLetters, setCoverLetters] = useState<HistoryItem[]>([]);
  const [resumes, setResumes] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  // Reusable function to fetch data from Firestore
  const fetchData = async (collectionName: string) => {
    if (!user?.email) {
      console.log("No user email available yet");
      return [];
    }

    try {
      console.log(`Fetching ${collectionName} for user:`, user.email);
      
      const q = query(
        collection(db, collectionName),
        where("email", "==", user.email),
        orderBy("createdAt", "desc")
      );

      const snapshot = await getDocs(q);
      console.log(`Found ${snapshot.docs.length} documents in ${collectionName}`);
      
      const data = snapshot.docs.map((doc) => {
        const docData = doc.data();
        console.log(`Document ${doc.id} data:`, docData);
        return {
          id: doc.id,
          ...docData,
          createdAt: docData.createdAt,
        };
      }) as HistoryItem[];

      return data;
    } catch (error) {
      console.error(`Error fetching ${collectionName}:`, error);
      const errorMessage = handleFirebaseError(error);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to fetch ${collectionName}: ${errorMessage}`,
      });
      return [];
    }
  };

  useEffect(() => {
    const fetchHistory = async () => {
      if (!user) {
        console.log("No user available yet");
        return;
      }

      setIsLoading(true);
      try {
        const [coverLettersData, resumesData] = await Promise.all([
          fetchData("coverletters"),
          fetchData("resumes")
        ]);
        
        console.log("Fetched cover letters:", coverLettersData);
        //console.log("Fetched resumes:", resumesData);
        
        setCoverLetters(coverLettersData);
        setResumes(resumesData);
      } catch (error) {
        console.error("Error fetching history:", error);
        const errorMessage = handleFirebaseError(error);
        toast({
          variant: "destructive",
          title: "Error",
          description: `Failed to fetch history: ${errorMessage}`,
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, [user?.email, toast]);

  // Reusable component to render a list of items
  const renderHistoryList = (items: HistoryItem[], type: 'coverletter' | 'resume') => {
    if (isLoading) {
      return (
        <Card className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </Card>
      );
    }

    if (!items || items.length === 0) {
      return (
        <Card className="p-6 text-center">
          <p className="text-muted-foreground">No {type === 'coverletter' ? 'cover letters' : 'resumes'} found</p>
        </Card>
      );
    }

    return (
      <div className="space-y-4">
        {items.map((item) => (
          <Link to={`/view/${type}/${item.id}`} key={item.id}>
            <Card className="p-4 hover:bg-muted/50 transition-colors cursor-pointer group">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Clock className="w-5 h-5 text-primary" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">
                      {formatDate(item.createdAt.toDate())}
                    </p>
                    <p className="text-sm font-medium text-foreground">
                      Document ID: {item.id.substring(0, 8)}...
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
              </div>
            </Card>
          </Link>
        ))}
      </div>
    );
  };

  // Helper function to format dates
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <div className="min-h-screen bg-background">
      <MainNav />
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Cover Letters Column */}
          <div>
            <h2 className="text-2xl font-bold mb-6 text-foreground">Previous Cover Letters</h2>
            {renderHistoryList(coverLetters, 'coverletter')}
          </div>

          {/* Resumes Column */}
          <div>
            <h2 className="text-2xl font-bold mb-6 text-foreground">Previous Resumes</h2>
            {renderHistoryList(resumes, 'resume')}
          </div>
        </div>
      </div>
    </div>
  );
};

export default History;