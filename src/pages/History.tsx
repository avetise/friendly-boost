import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { MainNav } from '@/components/navigation/MainNav';
import { Card } from "@/components/ui/card";
import { Link } from 'react-router-dom';
import { Clock, ChevronRight } from 'lucide-react';

interface HistoryItem {
  id: string;
  createdAt: {
    toDate: () => Date;
  };
  email: string;
}

const History = () => {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    const fetchHistory = async () => {
      if (!user?.email) return;

      const q = query(
        collection(db, "coverletters"),
        where("email", "==", user.email),
        orderBy("createdAt", "desc")
      );

      try {
        const querySnapshot = await getDocs(q);
        const historyData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt
        })) as HistoryItem[];
        setHistory(historyData);
      } catch (error) {
        console.error("Error fetching history:", error);
      }
    };

    fetchHistory();
  }, [user?.email]);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="min-h-screen bg-background">
      <MainNav />
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <h2 className="text-2xl font-bold mb-6 text-foreground">Previous Cover Letters</h2>
        <div className="space-y-4">
          {history.map((item) => (
            <Link to={`/view/${item.id}`} key={item.id}>
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
          
          {history.length === 0 && (
            <Card className="p-6 text-center">
              <p className="text-muted-foreground">No cover letters found</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default History;