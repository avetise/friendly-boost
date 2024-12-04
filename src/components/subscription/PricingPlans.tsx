import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { MainNav } from '@/components/navigation/MainNav';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';
import { stripePromise } from '@/lib/stripe';
import { functions } from '@/lib/firebase';

const plans = [
  {
    name: 'Basic',
    price: '$5',
    description: 'Perfect for small projects',
    features: ['Basic Features', '5 Projects', 'Community Support'],
    priceId: 'price_1OubcUBsWcSPhj7FIozkfeGh',
  },
  {
    name: 'Pro',
    price: '$20',
    description: 'For growing businesses',
    features: ['All Starter Features', 'Unlimited Projects', 'Priority Support'],
    priceId: 'price_1OubchBsWcSPhj7FZGoenAWG',
  },
];

interface SubscriptionDetails {
  status: string;
  planId?: string;
  planName?: string;
  currentPeriodEnd?: number;
  cancelAtPeriodEnd?: boolean;
}

export const PricingPlans = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [subscriptionLoading, setSubscriptionLoading] = useState(true);
  const [subscription, setSubscription] = useState<SubscriptionDetails | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchSubscriptionDetails = async () => {
      try {
        const getSubscriptionDetails = httpsCallable(functions, 'getSubscriptionDetails');
        const result = await getSubscriptionDetails();
        setSubscription(result.data as SubscriptionDetails);
      } catch (error) {
        console.error('Error fetching subscription:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch subscription details',
          variant: 'destructive',
        });
      } finally {
        setSubscriptionLoading(false);
      }
    };

    if (user) {
      fetchSubscriptionDetails();
    }
  }, [user, toast]);

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

      // Redirect to Stripe Checkout
      const stripe = await stripePromise;
      if (stripe) {
        await stripe.redirectToCheckout({ sessionId });
      }
    } catch (error) {
      console.error('Error during subscription process:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: 'destructive',
      });
      setLoading(false);
    }
  };

  return (
    <>
      <MainNav />
      <div className="container mx-auto py-12">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Membership Status</h2>
          {subscriptionLoading ? (
            <div className="flex justify-center">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : subscription?.status === 'active' ? (
            <div className="text-center mb-8">
              <p className="text-lg mb-2">
                Current Plan: <span className="font-semibold">{subscription.planName}</span>
              </p>
              <p className="text-sm text-muted-foreground">
                Renews on {format(subscription.currentPeriodEnd! * 1000, 'MMMM dd, yyyy')}
              </p>
              {subscription.cancelAtPeriodEnd && (
                <p className="text-sm text-yellow-600 mt-2">
                  Your subscription will end at the current period
                </p>
              )}
            </div>
          ) : (
            <p className="text-muted-foreground">No active subscription</p>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {plans.map((plan) => {
            const isCurrentPlan = subscription?.planId === plan.priceId;
            const canUpgrade = subscription?.status === 'active' && 
              plan.priceId === 'price_1OubchBsWcSPhj7FZGoenAWG' && 
              subscription.planId === 'price_1OubcUBsWcSPhj7FIozkfeGh';
            const canDowngrade = subscription?.status === 'active' && 
              plan.priceId === 'price_1OubcUBsWcSPhj7FIozkfeGh' && 
              subscription.planId === 'price_1OubchBsWcSPhj7FZGoenAWG';

            return (
              <Card key={plan.name} className="animate-fadeIn">
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
                  <Button
                    className="w-full"
                    onClick={() => handleSubscribe(plan.priceId)}
                    disabled={loading || isCurrentPlan || (!canUpgrade && !canDowngrade && subscription?.status === 'active')}
                  >
                    {loading ? 'Processing...' : 
                      isCurrentPlan ? 'Current Plan' :
                      canUpgrade ? 'Upgrade' :
                      canDowngrade ? 'Downgrade' :
                      'Subscribe'}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </>
  );
};