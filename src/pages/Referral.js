import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const Referral = () => {
    const location = useLocation();

    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        const referralCode = queryParams.get('r');
    
        if (referralCode) {
            //console.log(referralCode);
            localStorage.setItem('referralCode', referralCode);
        } else {
            //console.log("no ref code");
        }
    }, [location]);

    return null; // This component does not render anything
}; export default Referral;
