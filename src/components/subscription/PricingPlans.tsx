import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { MainNav } from '@/components/navigation/MainNav';
import { httpsCallable } from 'firebase/functions';
import { Loader2 } from 'lucide-react';
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
  const { subscription, loading: subscriptionLoading } = useSubscription();

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

  const getButtonConfig = (plan: typeof plans[0]) => {
    if (subscriptionLoading) {
      return {
        label: 'Loading...',
        disabled: true,
        action: () => {},
      };
    }

    if (!subscription || subscription.status === 'no_subscription') {
      return {
        label: plan.priceId ? 'Subscribe' : 'Current Plan',
        disabled: !plan.priceId,
        action: () => handleSubscribe(plan.priceId),
      };
    }

    // Current active plan
    if (subscription.planId === plan.priceId) {
      return {
        label: 'Active Plan',
        disabled: true,
        action: () => {},
      };
    }

    // Free plan when on paid plan
    if (!plan.priceId && subscription.planId) {
      return {
        label: 'Downgrade',
        disabled: false,
        action: () => handleSubscribe('cancel'),
      };
    }

    // Determine if this is an upgrade or downgrade
    const currentPlanIndex = plans.findIndex(p => p.priceId === subscription.planId);
    const thisPlanIndex = plans.findIndex(p => p.priceId === plan.priceId);
    
    if (thisPlanIndex > currentPlanIndex) {
      return {
        label: 'Upgrade',
        disabled: false,
        action: () => handleSubscribe(plan.priceId),
      };
    } else {
      return {
        label: 'Downgrade',
        disabled: false,
        action: () => handleSubscribe(plan.priceId),
      };
    }
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
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </>
  );
};