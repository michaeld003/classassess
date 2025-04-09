import React, { useState, useEffect } from 'react';
import {
    Card,
    CardContent,
    Box,
    Typography,
    Button,
    IconButton,
    Switch,
    Alert,
    CircularProgress,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    FormControlLabel
} from '@mui/material';
import { PersonAdd, Delete, Settings, Restore } from '@mui/icons-material';
import UserDialog from './UserDialog';
import { adminAPI } from '../../services/api';

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [showDeletedUsers, setShowDeletedUsers] = useState(false);
    const [restoreLoading, setRestoreLoading] = useState(false);

    const fetchUsers = async () => {
        try {
            console.log('Fetching users...');
            const token = localStorage.getItem('token');
            console.log('Using token:', token);

            // Modified to include the showDeletedUsers parameter
            const response = await adminAPI.getAllUsers(showDeletedUsers);
            console.log('API Response:', response);

            if (response?.data) {
                const userData = response.data;
                const usersArray = Array.isArray(userData) ? userData : [userData];

                const validUsers = usersArray.filter(user => {
                    if (!user || !user.id) {
                        console.warn('Invalid user object found:', user);
                        return false;
                    }
                    return true;
                });

                const processedUsers = validUsers.map(user => ({
                    id: user.id,
                    email: user.email || '',
                    fullName: user.fullName || 'Unknown User',
                    role: user.role || 'UNKNOWN',
                    department: user.department || 'Not Specified',
                    enabled: user.enabled !== undefined ? user.enabled : true,
                    phoneNumber: user.phoneNumber || '',
                    accountStatus: user.accountStatus || 'APPROVED', // Default to APPROVED for legacy users
                    isDeleted: user.isDeleted || false
                }));

                setUsers(processedUsers);
                setError('');
            }
        } catch (err) {
            console.error('Fetch users error:', err);
            setError(err.response?.data?.message || 'Failed to fetch users');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, [showDeletedUsers]); // Refetch when showDeletedUsers changes

    const handleAddUser = () => {
        setSelectedUser(null);
        setDialogOpen(true);
    };

    const handleEditUser = (user) => {
        setSelectedUser(user);
        setDialogOpen(true);
    };

    const handleSaveUser = async (userData) => {
        try {
            if (selectedUser) {
                const updatedUser = {
                    ...userData,
                    id: selectedUser.id,
                    enabled: true,
                    accountNonLocked: true
                };
                await adminAPI.updateUser(selectedUser.id, updatedUser);
            } else {
                const newUser = {
                    ...userData,
                    enabled: true,
                    accountNonLocked: true,
                    accountStatus: 'APPROVED' // Set new users as approved
                };
                console.log(newUser);
                await adminAPI.createUser(newUser);
            }
            await fetchUsers();
            setDialogOpen(false);
        } catch (err) {
            console.error('Save user error:', err);
            setError(err.response?.data?.message || 'Failed to save user');
        }
    };

    const handleToggleStatus = async (userId, currentStatus, currentAccountStatus) => {
        try {
            // Input validation
            if (!userId) {
                console.error('Invalid userId:', userId);
                setError('Cannot update user: Invalid ID');
                return;
            }

            // Find the user object
            const user = users.find(u => u.id === userId);
            if (!user) {
                console.error('User not found for ID:', userId);
                setError('User not found');
                return;
            }

            console.log('Updating status for user:', {
                id: userId,
                currentStatus,
                currentAccountStatus,
                user
            });

            // When toggling, you want to enable/disable the account without changing the status
            // unless the user is explicitly being enabled from a rejected state
            const newEnabled = !currentStatus;
            let newAccountStatus = currentAccountStatus;

            if (newEnabled && (currentAccountStatus === 'REJECTED' || currentAccountStatus === 'SUSPENDED')) {
                // If admin is enabling a rejected/suspended account, change status to APPROVED
                newAccountStatus = 'APPROVED';
            } else if (!newEnabled && currentAccountStatus === 'APPROVED') {
                // If admin is disabling an approved account, change status to SUSPENDED
                newAccountStatus = 'SUSPENDED';
            }

            // Create status update object
            const statusUpdate = {
                enabled: newEnabled,
                accountStatus: newAccountStatus
            };

            // Send the update request
            await adminAPI.updateUserStatus(userId, statusUpdate);
            await fetchUsers();  // Refresh the list
        } catch (err) {
            console.error('Status update failed:', err);
            setError('Failed to update user status');
        }
    };

    // Modified to use soft delete
    const handleDeleteUser = (user) => {
        setUserToDelete(user);
        setDeleteDialogOpen(true);
    };

    // Modified to implement soft delete
    const confirmDeleteUser = async () => {
        if (!userToDelete) return;

        setDeleteLoading(true);
        try {
            // Call soft delete instead of hard delete
            await adminAPI.softDeleteUser(userToDelete.id);
            setDeleteDialogOpen(false);
            setUserToDelete(null);
            setError('');
            await fetchUsers(); // Refresh the list
        } catch (err) {
            console.error('Delete user error:', err);
            setError(err.response?.data?.message || 'Failed to delete user');
        } finally {
            setDeleteLoading(false);
        }
    };

    // New function to restore a deleted user
    const handleRestoreUser = async (userId) => {
        setRestoreLoading(true);
        try {
            await adminAPI.restoreUser(userId);
            await fetchUsers();
        } catch (err) {
            console.error('Restore user error:', err);
            setError(err.response?.data?.message || 'Failed to restore user');
        } finally {
            setRestoreLoading(false);
        }
    };

    // Get status chip color based on account status
    const getStatusChipColor = (status) => {
        switch (status) {
            case 'APPROVED': return 'success';
            case 'PENDING': return 'warning';
            case 'REJECTED': return 'error';
            case 'SUSPENDED': return 'default';
            default: return 'default';
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5">User Management</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <FormControlLabel
                        control={
                            <Switch
                                checked={showDeletedUsers}
                                onChange={(e) => setShowDeletedUsers(e.target.checked)}
                                color="primary"
                            />
                        }
                        label="Show Deleted Users"
                    />
                    <Button
                        startIcon={<PersonAdd />}
                        variant="contained"
                        onClick={handleAddUser}
                    >
                        Add User
                    </Button>
                </Box>
            </Box>

            {users && users.length > 0 ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {users.map((user, index) => (
                        <Card
                            key={`user-${user.id || index}`}
                            sx={user.isDeleted ? { opacity: 0.7, borderLeft: '4px solid #f44336' } : {}}
                        >
                            <CardContent>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Box>
                                        <Typography variant="h6">
                                            {user.fullName}
                                            {user.isDeleted && (
                                                <Chip
                                                    label="DELETED"
                                                    color="error"
                                                    size="small"
                                                    sx={{ ml: 1 }}
                                                />
                                            )}
                                        </Typography>
                                        <Typography color="text.secondary">{user.email}</Typography>
                                        <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                                            <Chip
                                                label={user.role}
                                                color="primary"
                                                size="small"
                                                sx={{ mr: 1 }}
                                            />
                                            {user.accountStatus && !user.isDeleted && (
                                                <Chip
                                                    label={user.accountStatus}
                                                    color={getStatusChipColor(user.accountStatus)}
                                                    size="small"
                                                />
                                            )}
                                        </Box>
                                        <Typography variant="body2" sx={{ mt: 1 }}>
                                            Department: {user.department || 'Not specified'}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                        {!user.isDeleted && (
                                            <Switch
                                                checked={Boolean(user.enabled)}
                                                onChange={() => {
                                                    if (!user?.id) {
                                                        console.error('Invalid user object:', user);
                                                        setError('Invalid user data');
                                                        return;
                                                    }
                                                    console.log('Toggle initiated for user:', {
                                                        id: user.id,
                                                        currentStatus: user.enabled,
                                                        accountStatus: user.accountStatus,
                                                        fullUser: user
                                                    });
                                                    handleToggleStatus(user.id, user.enabled, user.accountStatus);
                                                }}
                                                color="success"
                                            />
                                        )}
                                        <IconButton
                                            color="primary"
                                            onClick={() => handleEditUser(user)}
                                            disabled={user.isDeleted}
                                        >
                                            <Settings />
                                        </IconButton>

                                        {user.isDeleted ? (
                                            <IconButton
                                                color="success"
                                                onClick={() => handleRestoreUser(user.id)}
                                                disabled={restoreLoading}
                                            >
                                                <Restore />
                                            </IconButton>
                                        ) : (
                                            <IconButton
                                                color="error"
                                                onClick={() => handleDeleteUser(user)}
                                            >
                                                <Delete />
                                            </IconButton>
                                        )}
                                    </Box>
                                </Box>
                            </CardContent>
                        </Card>
                    ))}
                </Box>
            ) : (
                <Typography variant="body1" sx={{ textAlign: 'center', mt: 4 }}>
                    {showDeletedUsers ? 'No deleted users found' : 'No users found'}
                </Typography>
            )}

            {/* User Edit/Create Dialog */}
            <UserDialog
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                user={selectedUser}
                onSave={handleSaveUser}
            />

            {/* Delete Confirmation Dialog */}
            <Dialog
                open={deleteDialogOpen}
                onClose={() => !deleteLoading && setDeleteDialogOpen(false)}
            >
                <DialogTitle>Confirm User Deletion</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to delete {userToDelete?.fullName}?
                        The user will be marked as deleted but their data will be preserved.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={() => setDeleteDialogOpen(false)}
                        disabled={deleteLoading}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={confirmDeleteUser}
                        color="error"
                        disabled={deleteLoading}
                        startIcon={deleteLoading ? <CircularProgress size={20} /> : <Delete />}
                    >
                        {deleteLoading ? 'Deleting...' : 'Delete User'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default UserManagement;