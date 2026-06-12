import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const StaffRedirect = () => {
    const { user, loading } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!loading) {
            if (user?.is_superuser) {
                navigate('/staff/admin', { replace: true });
            } else if (user?.is_staff) {
                navigate('/staff/moderator', { replace: true });
            } else {
                navigate('/', { replace: true });
            }
        }
    }, [user, loading, navigate]);

    return <div className="flex justify-center items-center h-screen">Redirecting...</div>;
};

export default StaffRedirect;
