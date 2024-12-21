import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export interface SubscriptionDetails {
  status: string;
  planId?: string;
  planName?: string;
  currentPeriodEnd?: number;
  cancelAtPeriodEnd?: boolean;
  debug?: {
    email?: string;
    customersFound?: number;
    stripeCustomerId?: string;
    error?: string;
    step?: string;
  };
}

export const useSubscription = () => {
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<SubscriptionDetails | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchSubscriptionDetails = async () => {
    try {
      if (!user?.email) {
        console.log('No user email available');
        return;
      }

      console.log('Starting subscription check for email:', user.email);
      const getSubscriptionDetails = httpsCallable(functions, 'getSubscriptionDetails');
      console.log('Calling getSubscriptionDetails function...');
      
      const result = await getSubscriptionDetails();
      console.log('Raw subscription result:', result.data);
      
      const subscriptionData = result.data as SubscriptionDetails;
      console.log('Parsed subscription data:', subscriptionData);
      
      if (subscriptionData.status === 'no_subscription') {
        console.log('No subscription found. Debug info:', subscriptionData.debug);
      }
      
      setSubscription(subscriptionData);
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

  useEffect(() => {
    if (user?.email) {
      fetchSubscriptionDetails();
    }
  }, [toast, user]);

  return { subscription, loading, refetch: fetchSubscriptionDetails };
};

export const SubscriptionStatus = () => {
  const { subscription, loading } = useSubscription();

  if (loading) {
    return (
      <div className="flex justify-center">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (!subscription || subscription.status === 'no_subscription') {
    return (
      <div className="text-muted-foreground">
        <p>No active subscription</p>
      </div>
    );
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