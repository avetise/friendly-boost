import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { fetchActiveUsers } from '@/lib/firestore';
import { MainNav } from '@/components/navigation/MainNav';
import { Card } from "@/components/ui/card";
import { Users, FileText, Calendar } from 'lucide-react';

interface ActiveUser {
  email: string;
  documentCount: number;
  lastActive: string;
}

interface ActiveUsersData {
  activeUsers: ActiveUser[];
  totalUniqueUsers: number;
}

export default function Dashboard() {
  const [activeUsersData, setActiveUsersData] = useState<ActiveUsersData>({ 
    activeUsers: [], 
    totalUniqueUsers: 0 
  });
  const { user } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await fetchActiveUsers();
        setActiveUsersData(data);
      } catch (err) {
        console.error("Error fetching data: ", err);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <MainNav />
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <Card className="p-6 hover:bg-muted/50 transition-colors">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Users</p>
                  <p className="text-2xl font-bold">{activeUsersData.totalUniqueUsers}</p>
                </div>
              </div>
            </Card>

            <Card className="p-6 hover:bg-muted/50 transition-colors">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Documents</p>
                  <p className="text-2xl font-bold">
                    {activeUsersData.activeUsers.reduce((acc, user) => acc + user.documentCount, 0)}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6 hover:bg-muted/50 transition-colors">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Active This Month</p>
                  <p className="text-2xl font-bold">
                  {activeUsersData.activeUsers.filter(user => {
                    const oneMonthAgo = new Date();
                    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1); // Go back one month
                    return new Date(user.lastActive) >= oneMonthAgo; // Check if lastActive is within the last month
                  }).length}

                  </p>
                </div>
              </div>
            </Card>
          </div>

          <Card className="overflow-hidden">
            <div className="p-6 border-b">
              <h2 className="text-lg font-semibold">Active Users</h2>
            </div>
            <div className="divide-y">
              {activeUsersData.activeUsers.map((user, index) => (
                <div key={user.email} className="p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-medium text-primary">#{index + 1}</span>
                      </div>
                      <div>
                        <p className="font-medium">{user.email}</p>
                        <p className="text-sm text-muted-foreground">
                          {user.documentCount} documents • Last active {new Date(user.lastActive).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}