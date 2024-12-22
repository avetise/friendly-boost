import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, X } from 'lucide-react';
import { format } from 'date-fns';

interface PlanFeature {
  name: string;
  price: string;
  description: string;
  features: string[];
  priceId: string;
}

interface PlanCardProps {
  plan: PlanFeature;
  buttonConfig: {
    label: string;
    action?: () => Promise<void>;
    disabled?: boolean;
    show: boolean;
    showCancel?: boolean;
  } | null;
  loading: boolean;
  onCancel: () => Promise<void>;
  subscription?: {
    cancelAt?: number;
    cancelAtPeriodEnd?: boolean;
  } | null;
}

export const PlanCard = ({ 
  plan, 
  buttonConfig, 
  loading, 
  onCancel,
  subscription 
}: PlanCardProps) => {
  const showCancellationInfo = subscription?.cancelAtPeriodEnd && subscription?.cancelAt;

  return (
    <Card className="animate-fadeIn relative">
      <CardHeader>
        <CardTitle>{plan.name}</CardTitle>
        <CardDescription>{plan.description}</CardDescription>
        <div className="mt-4">
          <span className="text-4xl font-bold">{plan.price}</span>
          <span className="text-muted-foreground">/month</span>
        </div>
        {showCancellationInfo && (
          <div className="mt-2 text-sm text-yellow-600">
            Plan will be cancelled on {format(subscription.cancelAt! * 1000, 'MMMM dd, yyyy')}
          </div>
        )}
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
                onClick={onCancel}
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
};