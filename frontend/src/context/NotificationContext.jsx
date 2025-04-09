import React, { createContext, useState, useEffect, useContext } from 'react';
import SockJS from 'sockjs-client';
import { Stomp } from '@stomp/stompjs';
import AuthContext from './AuthContext';

export const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);
    const [stompClient, setStompClient] = useState(null);
    const [connected, setConnected] = useState(false);
    const { user, isAuthenticated } = useContext(AuthContext);

    // Connect to WebSocket when user is authenticated
    useEffect(() => {
        if (isAuthenticated && user) {
            connectWebSocket();
        }

        return () => {
            // Disconnect when component unmounts or user logs out
            if (stompClient) {
                stompClient.disconnect();
                setConnected(false);
            }
        };
    }, [isAuthenticated, user]);

    const connectWebSocket = () => {
        const socket = new SockJS('/ws');
        const client = Stomp.over(socket);

        // Disable debug logging
        client.debug = () => {};

        client.connect(
            {},
            frame => {
                console.log('Connected to WebSocket');
                setStompClient(client);
                setConnected(true);

                // Subscribe to user-specific notifications
                client.subscribe(`/user/${user.id}/queue/notifications`, message => {
                    try {
                        const notification = JSON.parse(message.body);
                        handleNewNotification(notification);
                    } catch (e) {
                        console.error('Error processing notification:', e);
                    }
                });

                // Subscribe to module notifications if user is a student
                if (user.role === 'STUDENT' && user.enrolledModules) {
                    user.enrolledModules.forEach(moduleId => {
                        client.subscribe(`/topic/module/${moduleId}`, message => {
                            try {
                                const notification = JSON.parse(message.body);
                                handleNewNotification(notification);
                            } catch (e) {
                                console.error('Error processing module notification:', e);
                            }
                        });
                    });
                }
            },
            error => {
                console.error('WebSocket connection error:', error);
                setConnected(false);
            }
        );

        setStompClient(client);
    };

    const handleNewNotification = (notification) => {
        // Add notification to state
        setNotifications(prev => [notification, ...prev]);

        // Show browser notification if supported
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(notification.title, {
                body: notification.message,
                icon: '/logo.png'
            });
        }
    };

    const markAsRead = (notificationId) => {
        setNotifications(prev =>
            prev.map(notification =>
                notification.id === notificationId
                    ? { ...notification, read: true }
                    : notification
            )
        );
    };

    const clearAll = () => {
        setNotifications([]);
    };

    // Request browser notification permission if not already granted
    const requestNotificationPermission = async () => {
        if ('Notification' in window && Notification.permission !== 'granted') {
            const permission = await Notification.requestPermission();
            return permission === 'granted';
        }
        return Notification.permission === 'granted';
    };

    return (
        <NotificationContext.Provider
            value={{
                notifications,
                unreadCount: notifications.filter(n => !n.read).length,
                markAsRead,
                clearAll,
                connected,
                requestNotificationPermission
            }}
        >
            {children}
        </NotificationContext.Provider>
    );
};