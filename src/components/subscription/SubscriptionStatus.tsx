import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase';
import { useToast } from '@/components/ui/use-toast';

interface SubscriptionDetails {
  status: string;
  planId?: string;
  planName?: string;
  currentPeriodEnd?: number;
  cancelAtPeriodEnd?: boolean;
}

export const SubscriptionStatus = () => {
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<SubscriptionDetails | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchSubscriptionDetails = async () => {
      try {
        console.log('Initiating subscription details fetch');
        const getSubscriptionDetails = httpsCallable(functions, 'getSubscriptionDetails');
        const result = await getSubscriptionDetails();
        console.log('Subscription details result:', result.data);
        setSubscription(result.data as SubscriptionDetails);
      } catch (error) {
        console.error('Error fetching subscription:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch subscription details. Please try again later.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSubscriptionDetails();
  }, [toast]);

  if (loading) {
    return (
      <div className="flex justify-center">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (!subscription || subscription.status === 'no_subscription') {
    return <p className="text-muted-foreground">No active subscription</p>;
  }

  return (
    <div className="text-center mb-8">
      <p className="text-lg mb-2">
        Current Plan: <span className="font-semibold">{subscription.planName}</span>
      </p>
      {subscription.currentPeriodEnd && (
        <p className="text-sm text-muted-foreground">
          Renews on {format(subscription.currentPeriodEnd * 1000, 'MMMM dd, yyyy')}
        </p>
      )}
      {subscription.cancelAtPeriodEnd && (
        <p className="text-sm text-yellow-600 mt-2">
          Your subscription will end at the current period
        </p>
      )}
    </div>
  );
};