// utils/subscriptionCheck.ts
export const SubCheck = (): boolean => {
    const storedPlanId = localStorage.getItem('subscriptionPlanName');
    const storedPeriodEnd = localStorage.getItem('subscriptionCurrentPeriodEnd');
    const subscriptionExpiry = storedPeriodEnd ? parseInt(storedPeriodEnd, 10) : 0;
  
    const isExpired = subscriptionExpiry < Date.now() / 1000;
  
    // Define the required plan ID within the function
    const requiredPlanId = 'price_1Qa559BsWcSPhj7F6nKmQRR4';
  
    if (!storedPlanId || storedPlanId !== requiredPlanId || isExpired) {
      return false;
    }
  
    return true;
  };
  