import { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check if user is logged in
        const storedUser = localStorage.getItem('user');
        const token = localStorage.getItem('token');

        // Validate token - it should be a string with exactly 2 periods (3 parts)
        const isValidToken = token &&
            typeof token === 'string' &&
            token !== 'null' &&
            token !== 'undefined' &&
            token.split('.').length === 3;

        if (storedUser && isValidToken) {
            setUser(JSON.parse(storedUser));
        } else {
            // Clear everything if either token is invalid or user is missing
            localStorage.removeItem('user');
            localStorage.removeItem('token');
            setUser(null);
        }
        setLoading(false);
    }, []);

    const login = (userData) => {
        // Only set user if there's a valid token
        const token = localStorage.getItem('token');
        const isValidToken = token &&
            typeof token === 'string' &&
            token !== 'null' &&
            token !== 'undefined' &&
            token.split('.').length === 3;

        if (!isValidToken) {
            console.warn('Login attempted with invalid token');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            return;
        }

        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        // Clear any other auth-related data here
    };

    return (
        <AuthContext.Provider value={{
            user,
            login,
            logout,
            loading,
            isAuthenticated: !!user //converts user to boolean
        }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export default AuthContext;