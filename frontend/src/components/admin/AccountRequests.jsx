import React, { useState, useEffect } from 'react';
import { Card, CardContent, Box, Typography, Button, IconButton, Alert, CircularProgress, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Chip } from '@mui/material';
import { CheckCircle, Cancel, Email } from '@mui/icons-material';
import { adminAPI, handleApiError } from '../../services/api';

const AccountRequests = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [actionType, setActionType] = useState('');

    const fetchRequests = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await adminAPI.getAccountRequests();
            console.log('Account requests response:', response);
            setRequests(response.data || []);
        } catch (err) {
            console.error('Error fetching account requests:', err);
            setError(handleApiError(err) || 'Failed to fetch account requests');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const handleApproveAccount = async (userId) => {
        try {
            await adminAPI.approveAccount(userId);
            // Remove from the current list
            setRequests(requests.filter(req => req.id !== userId));
            setDialogOpen(false);
            setSelectedRequest(null);
        } catch (err) {
            console.error('Error approving account:', err);
            setError(handleApiError(err) || 'Failed to approve account');
        }
    };

    const handleRejectAccount = async (userId) => {
        try {
            await adminAPI.rejectAccount(userId);
            // Remove from the current list
            setRequests(requests.filter(req => req.id !== userId));
            setDialogOpen(false);
            setSelectedRequest(null);
        } catch (err) {
            console.error('Error rejecting account:', err);
            setError(handleApiError(err) || 'Failed to reject account');
        }
    };

    const openDialog = (request, action) => {
        setSelectedRequest(request);
        setActionType(action);
        setDialogOpen(true);
    };

    const handleDialogClose = () => {
        setDialogOpen(false);
        setSelectedRequest(null);
    };

    const handleDialogConfirm = () => {
        if (!selectedRequest) return;

        if (actionType === 'approve') {
            handleApproveAccount(selectedRequest.id);
        } else if (actionType === 'reject') {
            handleRejectAccount(selectedRequest.id);
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5">Account Requests</Typography>
                <Button variant="outlined" onClick={fetchRequests}>
                    Refresh
                </Button>
            </Box>

            {requests.length === 0 ? (
                <Card>
                    <CardContent>
                        <Typography variant="body1" align="center">
                            No pending account requests
                        </Typography>
                    </CardContent>
                </Card>
            ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {requests.map((request) => (
                        <Card key={request.id}>
                            <CardContent>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Box>
                                        <Typography variant="h6">{request.fullName}</Typography>
                                        <Typography color="text.secondary">{request.email}</Typography>
                                        <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                                            <Chip
                                                label={request.role}
                                                color={request.role === 'LECTURER' ? 'primary' : 'secondary'}
                                                size="small"
                                            />
                                            {request.department && (
                                                <Chip
                                                    label={request.department}
                                                    variant="outlined"
                                                    size="small"
                                                />
                                            )}
                                        </Box>
                                        <Typography variant="body2" sx={{ mt: 1 }}>
                                            Requested: {new Date(request.requestDate).toLocaleString()}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <IconButton
                                            color="success"
                                            onClick={() => openDialog(request, 'approve')}
                                            title="Approve"
                                        >
                                            <CheckCircle />
                                        </IconButton>
                                        <IconButton
                                            color="error"
                                            onClick={() => openDialog(request, 'reject')}
                                            title="Reject"
                                        >
                                            <Cancel />
                                        </IconButton>
                                        <IconButton
                                            color="primary"
                                            href={`mailto:${request.email}`}
                                            title="Contact via Email"
                                        >
                                            <Email />
                                        </IconButton>
                                    </Box>
                                </Box>
                            </CardContent>
                        </Card>
                    ))}
                </Box>
            )}

            {/* Confirmation Dialog */}
            <Dialog
                open={dialogOpen}
                onClose={handleDialogClose}
            >
                <DialogTitle>
                    {actionType === 'approve' ? 'Approve Account' : 'Reject Account'}
                </DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        {actionType === 'approve'
                            ? 'Are you sure you want to approve this account?'
                            : 'Are you sure you want to reject this account?'}
                        {selectedRequest && (
                            <Box sx={{ mt: 2 }}>
                                <Typography><strong>Name:</strong> {selectedRequest.fullName}</Typography>
                                <Typography><strong>Email:</strong> {selectedRequest.email}</Typography>
                                <Typography><strong>Role:</strong> {selectedRequest.role}</Typography>
                            </Box>
                        )}
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleDialogClose} color="inherit">Cancel</Button>
                    <Button
                        onClick={handleDialogConfirm}
                        color={actionType === 'approve' ? 'success' : 'error'}
                        variant="contained"
                    >
                        {actionType === 'approve' ? 'Approve' : 'Reject'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default AccountRequests;