import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { NotificationContext } from '../../context/NotificationContext';
import './NotificationCenter.css';

// Import MUI icons as needed
import Badge from '@mui/material/Badge';
import Popover from '@mui/material/Popover';
import NotificationsIcon from '@mui/icons-material/Notifications';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemIcon from '@mui/material/ListItemIcon';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';

// Icons for different notification types
import AnnouncementIcon from '@mui/icons-material/Announcement';
import DescriptionIcon from '@mui/icons-material/Description';
import ClassIcon from '@mui/icons-material/Class';
import AssignmentIcon from '@mui/icons-material/Assignment';
import GavelIcon from '@mui/icons-material/Gavel';
import PersonIcon from '@mui/icons-material/Person';
import InfoIcon from '@mui/icons-material/Info';

const NotificationCenter = () => {
    const { notifications, unreadCount, markAsRead, clearAll, requestNotificationPermission } = useContext(NotificationContext);
    const [anchorEl, setAnchorEl] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        // Request notification permission when component mounts
        requestNotificationPermission();
    }, []);

    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleNotificationClick = (notification) => {
        if (!notification.read) {
            markAsRead(notification.id);
        }

        if (notification.actionUrl) {
            navigate(notification.actionUrl);
            handleClose();
        }
    };

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'ANNOUNCEMENT':
                return <AnnouncementIcon />;
            case 'RESOURCE':
                return <DescriptionIcon />;
            case 'MODULE':
                return <ClassIcon />;
            case 'TEST':
                return <AssignmentIcon />;
            case 'APPEAL':
                return <GavelIcon />;
            case 'ACCOUNT':
                return <PersonIcon />;
            default:
                return <InfoIcon />;
        }
    };

    const formatTime = (timestamp) => {
        if (!timestamp) return '';

        const date = new Date(timestamp);
        return date.toLocaleString();
    };

    const open = Boolean(anchorEl);
    const id = open ? 'notification-popover' : undefined;

    return (
        <div className="notification-center">
            <IconButton
                aria-describedby={id}
                color="inherit"
                onClick={handleClick}
            >
                <Badge badgeContent={unreadCount} color="error">
                    <NotificationsIcon />
                </Badge>
            </IconButton>

            <Popover
                id={id}
                open={open}
                anchorEl={anchorEl}
                onClose={handleClose}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                }}
            >
                <Box sx={{ width: 350, maxHeight: 500 }}>
                    <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: 'primary.main', color: 'white' }}>
                        <Typography variant="h6">Notifications</Typography>
                        {notifications.length > 0 && (
                            <Button size="small" variant="outlined" color="inherit" onClick={clearAll}>
                                Clear All
                            </Button>
                        )}
                    </Box>

                    <List sx={{ maxHeight: 400, overflow: 'auto' }}>
                        {notifications.length === 0 ? (
                            <ListItem>
                                <ListItemText primary="No notifications" />
                            </ListItem>
                        ) : (
                            notifications.map((notification, index) => (
                                <React.Fragment key={notification.id || index}>
                                    <ListItem
                                        button
                                        onClick={() => handleNotificationClick(notification)}
                                        sx={{
                                            bgcolor: notification.read ? 'transparent' : 'action.hover',
                                            '&:hover': {
                                                bgcolor: 'action.selected',
                                            }
                                        }}
                                    >
                                        <ListItemIcon>{getNotificationIcon(notification.type)}</ListItemIcon>
                                        <ListItemText
                                            primary={notification.title}
                                            secondary={
                                                <React.Fragment>
                                                    <Typography variant="body2" component="span" display="block">
                                                        {notification.message}
                                                    </Typography>
                                                    <Typography variant="caption" color="textSecondary">
                                                        {formatTime(notification.timestamp)}
                                                    </Typography>
                                                </React.Fragment>
                                            }
                                        />
                                    </ListItem>
                                    {index < notifications.length - 1 && <Divider />}
                                </React.Fragment>
                            ))
                        )}
                    </List>
                </Box>
            </Popover>
        </div>
    );
};

export default NotificationCenter;