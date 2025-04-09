import React, { useState, useEffect } from 'react';
import { Card, CardContent, Box, Typography, Tabs, Tab } from '@mui/material';
import { Person, Book, Warning, Computer } from '@mui/icons-material';
import { adminAPI } from '../../services/api';
import UserManagement from './UserManagement';
import Reports from './Reports';
import ModuleList from './ModuleList';
import AccountRequests from './AccountRequests';

const AdminDashboard = () => {
    const [value, setValue] = useState(0);
    const [stats, setStats] = useState({
        totalUsers: 0,
        pendingApprovals: 0,
        activeModules: 0,
        activeSessions: 0
    });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                // Get full dashboard stats from the API
                const dashboardResponse = await adminAPI.getDashboardStats();

                if (dashboardResponse.data) {
                    setStats({
                        totalUsers: dashboardResponse.data.totalUsers,
                        pendingApprovals: dashboardResponse.data.pendingApprovals,
                        activeModules: dashboardResponse.data.activeModules,
                        activeSessions: dashboardResponse.data.activeSessions,
                    });
                } else {
                    // As a fallback, try to get at least the active sessions
                    const sessionsResponse = await adminAPI.getActiveSessions();

                    setStats({
                        totalUsers: 156, // Mock data for now
                        pendingApprovals: 5,
                        activeModules: 8,
                        activeSessions: sessionsResponse.data.activeSessions || 0
                    });
                }
            } catch (err) {
                console.error('Error fetching stats:', err);

                // Fallback to mock data if API fails
                setStats({
                    totalUsers: 156,
                    pendingApprovals: 5,
                    activeModules: 8,
                    activeSessions: 2
                });
            }
        };

        fetchStats();

        // Refresh every minute
        const interval = setInterval(fetchStats, 60000);
        return () => clearInterval(interval);
    }, []);

    const handleChange = (event, newValue) => {
        setValue(newValue);
    };

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>Admin Dashboard</Typography>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 2, mb: 4 }}>
                <Card>
                    <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="subtitle2">Total Users</Typography>
                            <Person color="action" />
                        </Box>
                        <Typography variant="h4">{stats.totalUsers}</Typography>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="subtitle2">Account Requests</Typography>
                            <Warning color="warning" />
                        </Box>
                        <Typography variant="h4">{stats.pendingApprovals}</Typography>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="subtitle2">Active Modules</Typography>
                            <Book color="primary" />
                        </Box>
                        <Typography variant="h4">{stats.activeModules}</Typography>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="subtitle2">Active Sessions</Typography>
                            <Computer color="info" />
                        </Box>
                        <Typography variant="h4">{stats.activeSessions}</Typography>
                    </CardContent>
                </Card>
            </Box>

            <Box sx={{ width: '100%' }}>
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <Tabs value={value} onChange={handleChange}>
                        <Tab label="User Management" />
                        <Tab label="Account Requests" />
                        <Tab label="Modules" />
                        <Tab label="Reports" />
                    </Tabs>
                </Box>
                <Box sx={{ p: 2 }}>
                    {value === 0 && <UserManagement />}
                    {value === 1 && <AccountRequests />}
                    {value === 2 && <ModuleList />}
                    {value === 3 && <Reports />}
                </Box>
            </Box>
        </Box>
    );
};

export default AdminDashboard;