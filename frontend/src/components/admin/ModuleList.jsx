import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Button, Card, CardContent, IconButton,
    Chip, Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, FormControl, InputLabel, Select, MenuItem,
    CircularProgress, Snackbar, Alert, Tooltip
} from '@mui/material';
import { Add, Edit, Delete, Refresh, Info as InfoIcon, ErrorOutline } from '@mui/icons-material';
import * as moduleService from '@/services/module';
import { adminAPI, handleApiError } from '../../services/api';
import ModuleDetailsModal from './ModuleDetailsModal';

const ModuleList = () => {
    const [modules, setModules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [openDialog, setOpenDialog] = useState(false);
    const [currentModule, setCurrentModule] = useState(null);
    const [lecturers, setLecturers] = useState([]);
    const [formData, setFormData] = useState({
        code: '',
        title: '',
        description: '',
        lecturerId: '',
    });
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'success'
    });
    const [error, setError] = useState(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [selectedModuleForDetails, setSelectedModuleForDetails] = useState(null);
    // New state for delete confirmation dialog
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [moduleToDelete, setModuleToDelete] = useState(null);

    const fetchModules = async () => {
        try {
            setLoading(true);
            setError(null);

            console.log('Fetching modules for admin...');
            const token = localStorage.getItem('token');
            console.log('Token exists:', !!token);

            // Using the admin-specific endpoint for more detailed data
            const data = await moduleService.getModulesForAdmin();
            console.log('Modules data:', data);

            // Ensure it always has an array even if API returns null/undefined
            setModules(data || []);
        } catch (error) {
            console.error('Error fetching modules:', error);
            setError(`Failed to load modules: ${error.message || 'Unknown error'}`);
            setSnackbar({
                open: true,
                message: `Failed to load modules: ${error.message || 'Unknown error. Check console for details.'}`,
                severity: 'error'
            });
            // Set empty array to prevent UI errors
            setModules([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchLecturers = async () => {
        try {
            console.log('Fetching lecturers...');
            // Use adminAPI.getUsersByRole
            const response = await adminAPI.getUsersByRole('LECTURER');
            console.log('Lecturers response:', response);

            if (response && response.data) {
                setLecturers(response.data);
            } else {
                console.warn('No lecturers data received');
                setLecturers([]);
            }
        } catch (error) {
            console.error('Error fetching lecturers:', error);
            setSnackbar({
                open: true,
                message: 'Failed to load lecturers: ' + (error.message || 'Unknown error'),
                severity: 'error'
            });
            // Set empty array to prevent further errors
            setLecturers([]);
        }
    };

    useEffect(() => {
        console.log('ModuleList component mounted');
        fetchModules();
        fetchLecturers();

        // Return cleanup function
        return () => {
            console.log('ModuleList component unmounted');
        };
    }, []);

    const handleOpenDialog = (module = null) => {
        if (module) {
            setCurrentModule(module);
            setFormData({
                code: module.code,
                title: module.title,
                description: module.description || '',
                lecturerId: module.lecturerId || '',
            });
        } else {
            setCurrentModule(null);
            setFormData({
                code: '',
                title: '',
                description: '',
                lecturerId: lecturers.length > 0 ? lecturers[0].id : '',
            });
        }
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };

    const handleSubmit = async () => {
        // Validate required fields
        if (!formData.code || !formData.title) {
            setSnackbar({
                open: true,
                message: 'Module code and title are required!',
                severity: 'error'
            });
            return;
        }

        // Prepare the data
        const moduleData = {
            ...formData,
            lecturerId: formData.lecturerId || null  // Ensure it's null if empty string
        };

        console.log('Submitting module data:', moduleData);

        try {
            setLoading(true);
            if (currentModule) {
                await moduleService.updateModule(currentModule.id, moduleData);
                setSnackbar({
                    open: true,
                    message: 'Module updated successfully!',
                    severity: 'success'
                });
            } else {
                await moduleService.createModule(moduleData);
                setSnackbar({
                    open: true,
                    message: 'Module created successfully!',
                    severity: 'success'
                });
            }
            handleCloseDialog();
            fetchModules();
        } catch (error) {
            console.error('Error saving module:', error);
            setSnackbar({
                open: true,
                message: `Failed to ${currentModule ? 'update' : 'create'} module: ${error.message || 'Unknown error'}`,
                severity: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    // Modified delete functions
    const handleDeleteModule = (module) => {
        setModuleToDelete(module);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (!moduleToDelete) return;

        try {
            setLoading(true);
            await moduleService.deleteModule(moduleToDelete.id);
            setSnackbar({
                open: true,
                message: 'Module deleted successfully!',
                severity: 'success'
            });
            fetchModules();
        } catch (error) {
            console.error('Error deleting module:', error);
            let errorMessage = 'Unknown error';

            if (error.message) {
                errorMessage = error.message;
            } else if (error.response && error.response.data) {
                errorMessage = error.response.data.message || JSON.stringify(error.response.data);
            }

            setSnackbar({
                open: true,
                message: 'Failed to delete module: ' + errorMessage,
                severity: 'error'
            });
        } finally {
            setLoading(false);
            setDeleteDialogOpen(false);
            setModuleToDelete(null);
        }
    };

    const handleToggleStatus = async (id, currentStatus) => {
        try {
            console.log(`ModuleList: Toggling module ${id} from ${currentStatus} to ${!currentStatus}`);

            // Call the service with the NEW desired status
            const updatedModule = await moduleService.toggleModuleStatus(id, !currentStatus);
            console.log('Response from toggle status:', updatedModule);

            setSnackbar({
                open: true,
                message: `Module ${currentStatus ? 'deactivated' : 'activated'} successfully!`,
                severity: 'success'
            });

            fetchModules(); // Refresh the list to show updated status
        } catch (error) {
            console.error('Error toggling module status:', error);
            setSnackbar({
                open: true,
                message: `Failed to update module status: ${error.message || 'Unknown error'}`,
                severity: 'error'
            });
        }
    };

    const handleViewDetails = (module) => {
        setSelectedModuleForDetails(module);
        setShowDetailsModal(true);
    };

    const handleCloseSnackbar = () => {
        setSnackbar({ ...snackbar, open: false });
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h5">Module Management</Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                        startIcon={<Refresh />}
                        variant="outlined"
                        onClick={fetchModules}
                    >
                        Refresh
                    </Button>
                    <Button
                        startIcon={<Add />}
                        variant="contained"
                        color="primary"
                        onClick={() => handleOpenDialog()}
                    >
                        Add Module
                    </Button>
                </Box>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                    <CircularProgress />
                </Box>
            ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {modules.length > 0 ? (
                        modules.map((module) => (
                            <Card key={module.id}>
                                <CardContent>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <Box>
                                            <Typography variant="h6">
                                                {module.code}: {module.title}
                                            </Typography>
                                            <Typography color="text.secondary" gutterBottom>
                                                Lecturer: {module.lecturerName || 'Unknown'}
                                            </Typography>
                                            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                                                <Typography variant="body2">
                                                    Students: {module.studentCount || 0}
                                                </Typography>
                                                <Chip
                                                    label={module.isActive ? 'Active' : 'Inactive'}
                                                    color={module.isActive ? 'success' : 'default'}
                                                    size="small"
                                                />
                                            </Box>
                                        </Box>
                                        <Box sx={{ display: 'flex', gap: 1 }}>
                                            <Tooltip title="View Details">
                                                <IconButton
                                                    color="info"
                                                    onClick={() => handleViewDetails(module)}
                                                >
                                                    <InfoIcon />
                                                </IconButton>
                                            </Tooltip>
                                            <Button
                                                variant="outlined"
                                                color={module.isActive ? 'warning' : 'success'}
                                                size="small"
                                                onClick={() => {
                                                    console.log(`Button clicked: Module ${module.id}, current status = ${module.isActive}`);
                                                    handleToggleStatus(module.id, module.isActive);
                                                }}
                                            >
                                                {module.isActive ? 'Deactivate' : 'Activate'}
                                            </Button>
                                            <IconButton
                                                color="primary"
                                                onClick={() => handleOpenDialog(module)}
                                            >
                                                <Edit />
                                            </IconButton>
                                            <IconButton
                                                color="error"
                                                onClick={() => handleDeleteModule(module)}
                                            >
                                                <Delete />
                                            </IconButton>
                                        </Box>
                                    </Box>
                                </CardContent>
                            </Card>
                        ))
                    ) : (
                        <Card>
                            <CardContent>
                                <Typography align="center" color="text.secondary">
                                    No modules found. Create your first module!
                                </Typography>
                            </CardContent>
                        </Card>
                    )}
                </Box>
            )}

            {/* Module Add/Edit Dialog */}
            <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
                <DialogTitle>{currentModule ? 'Edit Module' : 'Add New Module'}</DialogTitle>
                <DialogContent>
                    <Box component="form" sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <TextField
                            label="Module Code"
                            name="code"
                            value={formData.code}
                            onChange={handleInputChange}
                            fullWidth
                            required
                        />

                        <TextField
                            label="Module Title"
                            name="title"
                            value={formData.title}
                            onChange={handleInputChange}
                            fullWidth
                            required
                        />

                        <TextField
                            label="Description"
                            name="description"
                            value={formData.description}
                            onChange={handleInputChange}
                            fullWidth
                            multiline
                            rows={3}
                        />

                        <FormControl fullWidth>
                            <InputLabel>Lecturer</InputLabel>
                            <Select
                                name="lecturerId"
                                value={formData.lecturerId}
                                onChange={handleInputChange}
                                label="Lecturer"
                            >
                                {lecturers.map(lecturer => (
                                    <MenuItem key={lecturer.id} value={lecturer.id}>
                                        {lecturer.fullName}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Cancel</Button>
                    <Button
                        onClick={handleSubmit}
                        variant="contained"
                        color="primary"
                    >
                        {currentModule ? 'Update' : 'Create'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog
                open={deleteDialogOpen}
                onClose={() => setDeleteDialogOpen(false)}
                aria-labelledby="delete-dialog-title"
                aria-describedby="delete-dialog-description"
            >
                <DialogTitle id="delete-dialog-title" sx={{ pb: 1 }}>
                    Confirm Module Deletion
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, mt: 1 }}>
                        <ErrorOutline sx={{ color: 'error.main', mr: 2, fontSize: 28 }} />
                        <Typography variant="body1" id="delete-dialog-description">
                            Are you sure you want to delete {moduleToDelete?.code}: {moduleToDelete?.title}?
                        </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                        This action cannot be undone. All associated data will be permanently removed.
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button
                        onClick={() => setDeleteDialogOpen(false)}
                        variant="outlined"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={confirmDelete}
                        variant="contained"
                        color="error"
                        startIcon={<Delete />}
                    >
                        Delete Module
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Module Details Modal */}
            <ModuleDetailsModal
                open={showDetailsModal}
                onClose={() => setShowDetailsModal(false)}
                module={selectedModuleForDetails}
            />

            {/* Snackbar for feedback */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert
                    onClose={handleCloseSnackbar}
                    severity={snackbar.severity}
                    sx={{ width: '100%' }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default ModuleList;