import React, { useState, useEffect } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, Button, FormControl, InputLabel, Select,
    MenuItem, Box, CircularProgress, Alert
} from '@mui/material';

const UserDialog = ({ open, onClose, user, onSave }) => {
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        role: '',
        department: '',
        phoneNumber: '',
        password: '' // Only for new users
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (user) {
            setFormData({
                ...user,
                password: '' // Don't include password for editing
            });
        } else {
            setFormData({
                fullName: '',
                email: '',
                role: '',
                department: '',
                phoneNumber: '',
                password: ''
            });
        }
    }, [user]);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await onSave(formData);
            onClose();
        } catch (err) {
            setError(err.message || 'Failed to save user');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>
                {user ? 'Edit User' : 'Add New User'}
            </DialogTitle>
            <form onSubmit={handleSubmit}>
                <DialogContent>
                    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <TextField
                            required
                            label="Full Name"
                            name="fullName"
                            value={formData.fullName}
                            onChange={handleChange}
                        />
                        <TextField
                            required
                            label="Email"
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleChange}
                        />
                        {!user && (
                            <TextField
                                required
                                label="Password"
                                name="password"
                                type="password"
                                value={formData.password}
                                onChange={handleChange}
                            />
                        )}
                        <FormControl required>
                            <InputLabel>Role</InputLabel>
                            <Select
                                name="role"
                                value={formData.role}
                                onChange={handleChange}
                                label="Role"
                            >
                                <MenuItem value="STUDENT">Student</MenuItem>
                                <MenuItem value="LECTURER">Lecturer</MenuItem>
                                <MenuItem value="ADMIN">Admin</MenuItem>
                            </Select>
                        </FormControl>
                        <TextField
                            label="Department"
                            name="department"
                            value={formData.department}
                            onChange={handleChange}
                        />
                        <TextField
                            label="Phone Number"
                            name="phoneNumber"
                            value={formData.phoneNumber}
                            onChange={handleChange}
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={onClose}>Cancel</Button>
                    <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        disabled={loading}
                    >
                        {loading ? <CircularProgress size={24} /> : (user ? 'Save Changes' : 'Add User')}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
};

export default UserDialog;