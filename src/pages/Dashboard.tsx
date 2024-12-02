import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { fetchActiveUsers } from '@/lib/firestore';
import { MainNav } from '@/components/navigation/MainNav';

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
    <div>
      <MainNav />
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          <div className="rounded-lg bg-card p-6">
            <h2 className="text-2xl font-bold mb-4">
              Total Unique Users: {activeUsersData.totalUniqueUsers}
            </h2>
          </div>

          <div className="rounded-lg bg-card p-6">
            <h2 className="text-2xl font-bold mb-4 text-center">
              20 Most Active Users
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="px-4 py-2 text-left">Rank</th>
                    <th className="px-4 py-2 text-left">Email</th>
                    <th className="px-4 py-2 text-left">Cover Letters</th>
                    <th className="px-4 py-2 text-left">Last Used</th>
                  </tr>
                </thead>
                <tbody>
                  {activeUsersData.activeUsers.map((user, index) => (
                    <tr key={user.email} className="border-b">
                      <td className="px-4 py-2">{index + 1}</td>
                      <td className="px-4 py-2">{user.email}</td>
                      <td className="px-4 py-2">{user.documentCount}</td>
                      <td className="px-4 py-2">{user.lastActive.slice(0, 10)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}