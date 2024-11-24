import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const plans = [
  {
    name: 'Starter',
    price: '$9',
    description: 'Perfect for small projects',
    features: ['Basic Features', '5 Projects', 'Community Support'],
    priceId: 'price_1QOJpkBl43NGfiYUMA6G2YU', // Replace with your actual Stripe Price ID for Starter plan
  },
  {
    name: 'Pro',
    price: '$29',
    description: 'For growing businesses',
    features: ['All Starter Features', 'Unlimited Projects', 'Priority Support'],
    priceId: 'price_1QOJpkBl43NGfiYUMA6G2YU', // Replace with your actual Stripe Price ID for Pro plan
  },
];

export const PricingPlans = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubscribe = async (priceId: string) => {
    if (!user) {
      toast({
        title: "Error",
        description: "Please sign in to subscribe",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Create a new checkout session document
      const checkoutSessionRef = doc(db, 'users', user.uid, 'checkout_sessions', Date.now().toString());
      
      // The extension will detect this document and create a checkout session
      await setDoc(checkoutSessionRef, {
        price: priceId,
        success_url: window.location.origin + '/success',
        cancel_url: window.location.origin,
      });

      // Listen to the document for the session URL
      const unsubscribe = onSnapshot(checkoutSessionRef, (snap) => {
        const { error, url } = snap.data() || {};
        if (error) {
          toast({
            title: "Error",
            description: error.message,
            variant: "destructive",
          });
          setLoading(false);
        }
        if (url) {
          window.location.assign(url);
        }
      });

      // Cleanup subscription when component unmounts
      return () => unsubscribe();
      
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-12">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold mb-4">Simple, Transparent Pricing</h2>
        <p className="text-muted-foreground">Choose the plan that's right for you</p>
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
                {loading ? 'Processing...' : 'Subscribe'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};