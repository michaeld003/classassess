import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button,
    Typography, Divider, Box, List, ListItem, ListItemText, Chip,
    Grid, Paper
} from '@mui/material';
import { School, DateRange, Person, Group } from '@mui/icons-material';

const ModuleDetailsModal = ({ open, onClose, module }) => {
    const navigate = useNavigate();

    if (!module) return null;

    const handleViewCompleteDashboard = () => {
        onClose(); // Close the modal
        navigate(`/admin/modules/${module.id}`); // Navigate programmatically instead of using window.location
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>
                <Typography variant="h5">
                    {module.code}: {module.title}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                    <Chip
                        label={module.isActive ? 'Active' : 'Inactive'}
                        color={module.isActive ? 'success' : 'default'}
                        size="small"
                    />
                    <Chip
                        label={`${module.studentCount || 0} Students`}
                        color="primary"
                        size="small"
                    />
                </Box>
            </DialogTitle>
            <DialogContent>
                <Typography variant="subtitle1" gutterBottom>Description</Typography>
                <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
                    <Typography variant="body2">
                        {module.description || 'No description available.'}
                    </Typography>
                </Paper>

                <Divider sx={{ my: 2 }} />

                <Typography variant="subtitle1" gutterBottom>Module Details</Typography>
                <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                        <Paper variant="outlined" sx={{ p: 2 }}>
                            <List dense>
                                <ListItem>
                                    <Person sx={{ mr: 2, color: 'primary.main' }} />
                                    <ListItemText
                                        primary="Lecturer"
                                        secondary={module.lecturerName || 'Not assigned'}
                                    />
                                </ListItem>
                                <ListItem>
                                    <DateRange sx={{ mr: 2, color: 'primary.main' }} />
                                    <ListItemText
                                        primary="Start Date"
                                        secondary={module.startDate ? new Date(module.startDate).toLocaleDateString() : 'Not set'}
                                    />
                                </ListItem>
                                <ListItem>
                                    <DateRange sx={{ mr: 2, color: 'primary.main' }} />
                                    <ListItemText
                                        primary="End Date"
                                        secondary={module.endDate ? new Date(module.endDate).toLocaleDateString() : 'Not set'}
                                    />
                                </ListItem>
                            </List>
                        </Paper>
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <Paper variant="outlined" sx={{ p: 2 }}>
                            <List dense>
                                <ListItem>
                                    <Group sx={{ mr: 2, color: 'primary.main' }} />
                                    <ListItemText
                                        primary="Student Enrollment"
                                        secondary={`${module.studentCount || 0} students enrolled`}
                                    />
                                </ListItem>
                                <ListItem>
                                    <School sx={{ mr: 2, color: 'primary.main' }} />
                                    <ListItemText
                                        primary="Module Status"
                                        secondary={module.isActive ? 'Active' : 'Inactive'}
                                    />
                                </ListItem>
                                <ListItem>
                                    <School sx={{ mr: 2, color: 'primary.main' }} />
                                    <ListItemText
                                        primary="Module Code"
                                        secondary={module.code}
                                    />
                                </ListItem>
                            </List>
                        </Paper>
                    </Grid>
                </Grid>

                {/* Later for test data, to add a section for recent tests */}
                {/*
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle1" gutterBottom>Recent Tests</Typography>
                {module.tests && module.tests.length > 0 ? (
                    <List>
                        {module.tests.map(test => (
                            <ListItem key={test.id}>
                                <ListItemText
                                    primary={test.title}
                                    secondary={`Date: ${new Date(test.startTime).toLocaleDateString()}`}
                                />
                            </ListItem>
                        ))}
                    </List>
                ) : (
                    <Typography variant="body2" color="text.secondary">
                        No tests available for this module.
                    </Typography>
                )}
                */}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Close</Button>
                <Button
                    variant="contained"
                    color="primary"
                    onClick={handleViewCompleteDashboard}
                >
                    View Complete Dashboard
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ModuleDetailsModal;