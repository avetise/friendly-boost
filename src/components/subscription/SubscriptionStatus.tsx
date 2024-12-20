import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface SubscriptionDetails {
  status: string;
  planId?: string;
  planName?: string;
  currentPeriodEnd?: number;
  cancelAtPeriodEnd?: boolean;
  debug?: {
    email?: string;
    customersFound?: number;
  };
}

export const SubscriptionStatus = () => {
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<SubscriptionDetails | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    const fetchSubscriptionDetails = async () => {
      try {
        console.log('Initiating subscription details fetch for email:', user?.email);
        const getSubscriptionDetails = httpsCallable(functions, 'getSubscriptionDetails');
        const result = await getSubscriptionDetails();
        console.log('Subscription details result:', result.data);
        
        const subscriptionData = result.data as SubscriptionDetails;
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

    if (user?.email) {
      fetchSubscriptionDetails();
    }
  }, [toast, user]);

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
        {subscription?.debug && (
          <div className="text-xs mt-2 text-gray-500">
            <p>Debug Info:</p>
            <p>Email used: {subscription.debug.email}</p>
            <p>Customers found: {subscription.debug.customersFound}</p>
          </div>
        )}
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