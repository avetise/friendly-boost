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
  cancelAt?: number;
  subscriptionId?: string;
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

      const getSubscriptionDetails = httpsCallable(functions, 'getSubscriptionDetails');
      const result = await getSubscriptionDetails();
      const subscriptionData = result.data as SubscriptionDetails;

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

  useEffect(() => {
    if (subscription) {
      localStorage.setItem('subscriptionStatus', subscription.status);
      localStorage.setItem('subscriptionPlanName', subscription.planId || '');
      localStorage.setItem(
        'subscriptionCurrentPeriodEnd',
        subscription.currentPeriodEnd ? subscription.currentPeriodEnd.toString() : ''
      );
      localStorage.setItem(
        'subscriptionCancelAt',
        subscription.cancelAt ? subscription.cancelAt.toString() : ''
      );
      localStorage.setItem(
        'subscriptionCancelAtPeriodEnd',
        subscription.cancelAtPeriodEnd ? subscription.cancelAtPeriodEnd.toString() : 'false'
      );
    }
  }, [subscription]);

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
          Your subscription will end on {format(subscription.cancelAt! * 1000, 'MMMM dd, yyyy')}
        </p>
      )}
    </div>
  );
};
