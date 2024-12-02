import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { MainNav } from '@/components/navigation/MainNav';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Link } from 'react-router-dom';

interface HistoryItem {
  id: string;
  createdAt: {
    toDate: () => Date;
  };
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

      const querySnapshot = await getDocs(q);
      const historyData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setHistory(historyData);
    };

    fetchHistory();
  }, [user?.email]);

  return (
    <div className="min-h-screen bg-background">
      <MainNav />
      <div className="container mx-auto px-4 py-8">
        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-6 text-center">Previous Cover Letters</h2>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Document ID</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      {item.createdAt.toDate().toLocaleString()}
                    </TableCell>
                    <TableCell>{item.id}</TableCell>
                    <TableCell>
                      <Link
                        to={`/view/${item.id}`}
                        className="text-primary hover:text-primary/80 transition-colors"
                      >
                        View
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default History;