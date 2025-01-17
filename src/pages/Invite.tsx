import { useState, useEffect } from 'react';
import { MainNav } from '@/components/navigation/MainNav';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, addDoc, Timestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Users } from 'lucide-react';

interface InviteStats {
  totalInvites: number;
  acceptedInvites: number;
}

const Invite = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [stats, setStats] = useState<InviteStats>({ totalInvites: 0, acceptedInvites: 0 });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchInviteStats = async () => {
      if (!user?.email) return;

      try {
        // Count total invites sent by user
        const invitesQuery = query(
          collection(db, 'invites'),
          where('senderEmail', '==', user.email)
        );
        const invitesSnapshot = await getDocs(invitesQuery);
        
        // Count users who joined through invites
        const usersQuery = query(
          collection(db, 'users'),
          where('invitedBy', '==', user.email)
        );
        const usersSnapshot = await getDocs(usersQuery);

        setStats({
          totalInvites: invitesSnapshot.size,
          acceptedInvites: usersSnapshot.size
        });
      } catch (error) {
        console.error('Error fetching invite stats:', error);
      }
    };

    fetchInviteStats();
  }, [user?.email]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.email) return;

    setIsLoading(true);
    try {
      // Add invite to Firestore
      await addDoc(collection(db, 'invites'), {
        senderEmail: user.email,
        recipientEmail: email,
        status: 'pending',
        createdAt: Timestamp.now()
      });

      toast({
        title: "Invitation Sent!",
        description: `An invitation has been sent to ${email}`,
      });

      setEmail('');
    } catch (error) {
      console.error('Error sending invite:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to send invitation. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <MainNav />
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <div className="space-y-6">
          <div className="flex items-center space-x-2">
            <Users className="h-6 w-6" />
            <h1 className="text-2xl font-bold">Invite Friends</h1>
          </div>

          <Card className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h2 className="text-lg font-semibold">Your Invites</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold">{stats.totalInvites}</div>
                    <div className="text-sm text-muted-foreground">Total Invites</div>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold">{stats.acceptedInvites}</div>
                    <div className="text-sm text-muted-foreground">Friends Joined</div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h2 className="text-lg font-semibold">Send New Invite</h2>
                <form onSubmit={handleInvite} className="space-y-4">
                  <Input
                    type="email"
                    placeholder="Enter friend's email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? "Sending..." : "Send Invite"}
                  </Button>
                </form>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Invite;