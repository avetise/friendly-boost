
import { useAuth } from '@/contexts/AuthContext';
// utils/subscriptionCheck.ts
export const SubCheck = (): boolean => {
    const { userDetails } = useAuth();
    const isAdmin = userDetails?.role === 'Admin';
    const isPremium = userDetails?.role === 'Premium';
    const storedPlanId = localStorage.getItem('subscriptionPlanName');
    const storedPeriodEnd = localStorage.getItem('subscriptionCurrentPeriodEnd');
    const subscriptionExpiry = storedPeriodEnd ? parseInt(storedPeriodEnd, 10) : 0;
  
    const isExpired = subscriptionExpiry < Date.now() / 1000;
  
    // Define the required plan ID within the function
    const requiredPlanId = 'price_1QbOq6BsWcSPhj7F2R2003OT';
  
    if (!isAdmin&&!isPremium&&(!storedPlanId || storedPlanId !== requiredPlanId || isExpired)) {
      return false;
    }
  
    return true;
  };
  