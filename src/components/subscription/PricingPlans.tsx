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
import { SubscriptionStatus } from './SubscriptionStatus';

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

export const PricingPlans = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

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
      console.log('Creating checkout session for price:', priceId);
      const createCheckoutSession = httpsCallable(functions, 'createCheckoutSession');
      const { data } = await createCheckoutSession({ priceId });
      console.log('Checkout session created:', data);
      
      const { sessionId } = data as { sessionId: string };
      
      const stripe = await stripePromise;
      if (!stripe) {
        throw new Error('Stripe failed to initialize');
      }

      const { error } = await stripe.redirectToCheckout({ sessionId });
      if (error) {
        console.error('Stripe redirect error:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error during subscription process:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to start checkout process',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
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

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {plans.map((plan) => (
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
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Subscribe'
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </>
  );
};