import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { MainNav } from '@/components/navigation/MainNav';
import { httpsCallable } from 'firebase/functions';
import { Loader2, X } from 'lucide-react';
import { stripePromise } from '@/lib/stripe';
import { functions } from '@/lib/firebase';
import { SubscriptionStatus, useSubscription } from './SubscriptionStatus';

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
      await cancelSubscription({ subscriptionId: subscription.subscriptionId });
      
      await refetch(); // Refresh subscription status after cancellation
      
      toast({
        title: 'Subscription Cancelled',
        description: 'Your subscription will remain active until the end of the current billing period.',
      });
    } catch (error) {
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
        label: 'Active Plan',
        disabled: true,
        show: true,
        showCancel: true
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
          {plans.map((plan) => {
            const buttonConfig = getButtonConfig(plan);
            
            return (
              <Card key={plan.name} className="animate-fadeIn relative">
                <CardHeader>
                  <CardTitle>{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center">
                        <svg
                          className="h-5 w-5 text-primary flex-shrink-0"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span className="ml-2">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  {buttonConfig?.show && (
                    <div className="space-y-2">
                      <Button
                        className="w-full"
                        onClick={buttonConfig.action}
                        disabled={buttonConfig.disabled || loading}
                      >
                        {loading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          buttonConfig.label
                        )}
                      </Button>
                      {buttonConfig.showCancel && (
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={handleCancel}
                          disabled={loading}
                        >
                          <X className="mr-2 h-4 w-4" />
                          Cancel Subscription
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </>
  );
};