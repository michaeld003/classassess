import { useState, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    AppBar,
    Toolbar,
    Typography,
    IconButton,
    Drawer,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Box,
    Divider,
    useTheme,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
} from '@mui/material';
import {
    Menu as MenuIcon,
    Home as HomeIcon,
    School as SchoolIcon,
    Assessment as AssessmentIcon,
    DarkMode as DarkModeIcon,
    LightMode as LightModeIcon,
    Logout as LogoutIcon,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { ColorModeContext } from '../../main';
import { authAPI } from '../../services/api';

const Navbar = ({ children }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
    const { user, logout } = useAuth();
    const isLoggedIn = user !== null;
    const isLecturer = user?.role === 'LECTURER';

    const theme = useTheme();
    const colorMode = useContext(ColorModeContext);

    const handleLogout = () => {
        authAPI.clearAuth();
        logout();
        setLogoutDialogOpen(false);
        navigate('/login');
    };

    const toggleDrawer = (open) => (event) => {
        if (event.type === 'keydown' && (event.key === 'Tab' || event.key === 'Shift')) {
            return;
        }
        setDrawerOpen(open);
    };

    const menuItems = [
        {
            text: 'Home',
            icon: <HomeIcon />,
            path: isLecturer ? '/lecturer/dashboard' : '/student/dashboard'
        },
        {
            text: 'Modules',
            icon: <SchoolIcon />,
            path: '/modules'
        },
        // Conditionally show Performance based on role
        ...(isLecturer ? [
            {
                text: 'Performance',
                icon: <AssessmentIcon />,
                path: '/lecturer/performance'  // This goes to the new LecturerPerformance component
            }
        ] : [
            {
                text: 'Performance',
                icon: <AssessmentIcon />,
                path: '/student/performance'  // This is the existing student performance path
            }
        ])
    ];

    const drawerContent = (
        <Box
            sx={{ width: 250 }}
            role="presentation"
            onClick={toggleDrawer(false)}
            onKeyDown={toggleDrawer(false)}
        >
            <List>
                {menuItems.map((item) => (
                    <ListItem
                        button
                        key={item.text}
                        onClick={() => navigate(item.path)}
                        selected={location.pathname === item.path}
                    >
                        <ListItemIcon>{item.icon}</ListItemIcon>
                        <ListItemText primary={item.text} />
                    </ListItem>
                ))}
                <Divider />
                {isLoggedIn && (
                    <ListItem button onClick={() => setLogoutDialogOpen(true)}>
                        <ListItemIcon><LogoutIcon /></ListItemIcon>
                        <ListItemText primary="Logout" />
                    </ListItem>
                )}
            </List>
        </Box>
    );

    return (
        <>
            <AppBar position="static">
                <Toolbar>
                    {isLoggedIn && (
                        <IconButton
                            edge="start"
                            color="inherit"
                            aria-label="menu"
                            onClick={toggleDrawer(true)}
                            sx={{ mr: 2 }}
                        >
                            <MenuIcon />
                        </IconButton>
                    )}
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                        ClassAssess
                    </Typography>

                    {/* Notification Center - Added here */}
                    {isLoggedIn && children}

                    <IconButton
                        color="inherit"
                        onClick={colorMode.toggleColorMode}
                        size="small"
                        sx={{
                            mr: 1,
                            bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                            '&:hover': {
                                bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
                            }
                        }}
                    >
                        {theme.palette.mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
                    </IconButton>
                    {isLoggedIn && (
                        <Typography variant="body1" color="inherit">
                            {user.name}
                        </Typography>
                    )}
                </Toolbar>
            </AppBar>
            <Drawer
                anchor="left"
                open={drawerOpen}
                onClose={toggleDrawer(false)}
            >
                {drawerContent}
            </Drawer>

            {/* Logout Confirmation Dialog */}
            <Dialog
                open={logoutDialogOpen}
                onClose={() => setLogoutDialogOpen(false)}
            >
                <DialogTitle>Confirm Logout</DialogTitle>
                <DialogContent>
                    <Typography>Are you sure you want to logout?</Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setLogoutDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleLogout} color="primary" variant="contained">
                        Logout
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default Navbar;