import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { MainNav } from '@/components/navigation/MainNav';
import { httpsCallable } from 'firebase/functions';
import { stripePromise } from '@/lib/stripe';
import { functions } from '@/lib/firebase';
import { SubscriptionStatus, useSubscription } from './SubscriptionStatus';
import { PlanCard } from './PlanCard';

const plans = [
  {
    name: 'Free',
    price: '-',
    description: 'Access basic AI-generated cover letters for up to 3 applications per month.',
    features: ['Basic AI Writing', '3 Applications/Month', 'Community Support'],
    priceId: '',
  },
  {
    name: 'Premium',
    price: '$5',
    description: 'Advanced AI tools for 10 cover letters per month.',
    features: ['Advanced AI Writing', '10 Applications/Month', 'Priority Support'],
    priceId: 'price_1OubcUBsWcSPhj7FIozkfeGh',
  },
  {
    name: 'Pro',
    price: '$20',
    description: 'Unlimited access to AI writing tools with premium features.',
    features: ['All Features', 'Unlimited Applications', 'Premium Support'],
    priceId: 'price_1OubchBsWcSPhj7FZGoenAWG',
  },
];

export const PricingPlans = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { subscription, loading: subscriptionLoading, refetch } = useSubscription();

  const handleSubscribe = async (priceId: string) => {
    if (!user) {
      toast({
        title: 'Error',
        description: 'Please sign in to subscribe',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const createCheckoutSession = httpsCallable(functions, 'createCheckoutSession');
      const { data } = await createCheckoutSession({ priceId });
      const { sessionId } = data as { sessionId: string };

      const stripe = await stripePromise;
      if (!stripe) {
        throw new Error('Stripe failed to initialize');
      }

      const { error } = await stripe.redirectToCheckout({ sessionId });
      if (error) {
        throw error;
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to start checkout process',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!user || !subscription?.subscriptionId) {
      toast({
        title: 'Error',
        description: 'No active subscription found',
        variant: 'destructive',
      });
      return;
    }
    
    setLoading(true);
    try {
      const cancelSubscription = httpsCallable(functions, 'cancelSubscription');
      const result = await cancelSubscription({ subscriptionId: subscription.subscriptionId });
      const response = result.data as { status: string; subscription: any };
      
      if (response.status === 'success') {
        await refetch(); // Refresh subscription status after cancellation
        
        toast({
          title: 'Subscription Cancelled',
          description: 'Your subscription will remain active until the end of the current billing period.',
        });
      } else {
        console.error('Cancellation failed:', response);
        throw new Error(response.debug?.error || 'Failed to cancel subscription');
      }
    } catch (error) {
      console.error('Cancellation error:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to cancel subscription',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getButtonConfig = (plan: typeof plans[0]) => {
    if (subscriptionLoading) {
      return null;
    }

    // Free plan - show no buttons
    if (!plan.priceId) {
      if (!subscription || subscription.status === 'no_subscription') {
        return {
          label: 'Current Plan',
          disabled: true,
          show: true
        };
      }
      return null;
    }

    // If no subscription or cancelled, show subscribe buttons for paid plans
    if (!subscription || subscription.status === 'no_subscription') {
      return {
        label: 'Subscribe',
        action: () => handleSubscribe(plan.priceId),
        show: true
      };
    }

    // Current active plan - show active and cancel buttons
    if (subscription.planId === plan.priceId) {
      return {
        label: subscription.cancelAtPeriodEnd ? 'Cancelling Soon' : 'Active Plan',
        disabled: true,
        show: true,
        showCancel: !subscription.cancelAtPeriodEnd
      };
    }

    // Show upgrade buttons for higher tier plans
    const currentPlanIndex = plans.findIndex(p => p.priceId === subscription.planId);
    const thisPlanIndex = plans.findIndex(p => p.priceId === plan.priceId);
    
    if (thisPlanIndex > currentPlanIndex) {
      return {
        label: 'Upgrade',
        action: () => handleSubscribe(plan.priceId),
        show: true
      };
    }

    return null;
  };

  return (
    <>
      <MainNav />
      <div className="container mx-auto py-12">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Membership Status</h2>
          <SubscriptionStatus />
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => (
            <PlanCard
              key={plan.name}
              plan={plan}
              buttonConfig={getButtonConfig(plan)}
              loading={loading}
              onCancel={handleCancel}
              subscription={subscription}
            />
          ))}
        </div>
      </div>
    </>
  );
};
