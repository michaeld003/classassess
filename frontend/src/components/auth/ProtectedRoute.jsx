import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useEffect } from 'react';

const ProtectedRoute = ({ children, allowedRoles }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        // Check token expiration on route access
        if (user) {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    // Parse the token payload to check expiration
                    const payload = JSON.parse(atob(token.split('.')[1]));
                    if (payload.exp * 1000 < Date.now()) {
                        // Token is expired
                        console.log('Token expired, logging out');
                        logout();
                        navigate('/');
                    }
                } catch (error) {
                    console.error('Token validation error:', error);
                    logout();
                    navigate('/');
                }
            }
        }
    }, [user, logout, navigate]);

    if (!user) {
        // Not logged in, redirect to login page
        return <Navigate to="/" />;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        // User's role is not authorized, redirect to their dashboard
        return <Navigate to={`/${user.role.toLowerCase()}/dashboard`} />;
    }

    // Check if children is a function and pass user if it is
    if (typeof children === 'function') {
        return children({ user });
    }

    // Authorized, render component
    return children;
};

export default ProtectedRoute;