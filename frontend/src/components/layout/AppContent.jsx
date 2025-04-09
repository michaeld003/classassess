import { useLocation } from 'react-router-dom';
import { Box } from '@mui/material';
import Navbar from './Navbar';
import { NotificationProvider } from '../../context/NotificationContext';
import NotificationCenter from '../notifications/NotificationCenter';
import { useContext } from 'react';
import AuthContext from '../../context/AuthContext';

const AppContent = ({ children }) => {
    const location = useLocation();
    const { user } = useContext(AuthContext);
    const isLoggedIn = user !== null;

    // Don't show navbar on the landing page
    const hideNavbar = location.pathname === '/';

    return (
        <NotificationProvider>
            <Box sx={{
                display: 'flex',
                flexDirection: 'column',
                minHeight: '100vh',
                width: '100vw',
                overflow: 'hidden'
            }}>
                {!hideNavbar && (
                    <Navbar>
                        {isLoggedIn && <NotificationCenter />}
                    </Navbar>
                )}
                <Box component="main" sx={{
                    flexGrow: 1,
                    width: '100%',
                    overflowX: 'hidden',
                    backgroundColor: 'background.default',
                    pt: hideNavbar ? 0 : 2
                }}>
                    {children}
                </Box>
            </Box>
        </NotificationProvider>
    );
};

export default AppContent;