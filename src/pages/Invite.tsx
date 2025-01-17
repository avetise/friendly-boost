import { useState, useEffect } from 'react';
import { MainNav } from '@/components/navigation/MainNav';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, addDoc, Timestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Users, Share2, Copy } from 'lucide-react';

interface InviteStats {
  totalInvites: number;
  acceptedInvites: number;
}

const Invite = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [emails, setEmails] = useState<string[]>([]); // For bulk invites
  const [stats, setStats] = useState<InviteStats>({ totalInvites: 0, acceptedInvites: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const referralLink = `https://jobfly.co/signin?ref=${user?.uid}`; // Unique referral link

  useEffect(() => {
    const fetchInviteStats = async () => {
      if (!user?.email) return;

      try {
        const invitesQuery = query(collection(db, 'invites'), where('senderEmail', '==', user.email));
        const invitesSnapshot = await getDocs(invitesQuery);

        const usersQuery = query(collection(db, 'users'), where('referral', '==', user.email));
        const usersSnapshot = await getDocs(usersQuery);

        setStats({
          totalInvites: invitesSnapshot.size,
          acceptedInvites: usersSnapshot.size,
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
      // Add invites to Firestore
      const invitePromises = emails.map((email) =>
        addDoc(collection(db, 'invites'), {
          senderEmail: user.email,
          recipientEmail: email,
          status: 'pending',
          createdAt: Timestamp.now(),
        })
      );
  
      await Promise.all(invitePromises);
  
      // Generate the referral link
      const referralLink = `https://jobfly.co/signin?ref=${user.uid}`;
  
      // Create the mailto link
      const subject = "Brace yourselves, interviews are coming!";
      const body = `Hi\n\nI’ve been using JobFly to supercharge my job search, and I thought you’d could use it too! Use my referral link to get started:\n\n${referralLink}\n\nBest,\n${user?.displayName}`;
      const mailtoLink = `mailto:${emails.join(',')}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  
      // Open the user's email client
      window.location.href = mailtoLink;
  
      toast({
        title: 'Invitations Ready!',
        description: 'Email ready. Just hit send!',
      });
  
      setEmails([]);
    } catch (error) {
      console.error('Error sending invites:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to prepare invitations. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleShare = async () => {
    try {
      await navigator.share({
        title: 'Join JobFly!',
        text: 'Check out JobFly—your ultimate job search tool. Use my referral link to get started:',
        url: referralLink,
      });
    } catch (error) {
      console.error('Error sharing:', error);
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
                    <div className="text-sm text-muted-foreground">Total Joined</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Button variant="outline" onClick={handleShare}>
                    <Share2 className="w-4 h-4 mr-2" />
                    Share Referral Link
                  </Button>
                  <Button variant="outline" onClick={() => navigator.clipboard.writeText(referralLink)}>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Link
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                <h2 className="text-lg font-semibold">Send New Invite</h2>
                <form onSubmit={handleInvite} className="space-y-4">
                  <Input
                    type="email"
                    placeholder="Enter email (or multiple emails separated by commas)"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setEmails(e.target.value.split(',').map((e) => e.trim()));
                    }}
                    required
                  />
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? 'Sending...' : 'Send Invite'}
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