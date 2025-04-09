import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Box, Typography, Button, Card, CardContent, Grid, Divider, Tabs, Tab,
    List, ListItem, ListItemText, ListItemAvatar, Avatar, Chip,
    CircularProgress, Alert, Paper, IconButton, Tooltip, Dialog, DialogTitle,
    DialogContent, DialogActions, TextField, FormControl, InputLabel, Select,
    MenuItem, Snackbar
} from '@mui/material';
import {
    ArrowBack, School, Person, DateRange, BookmarkBorder,
    Edit, Block, Check, BarChart, Description, Group, Upload,
    InsertDriveFile, CloudUpload, Delete, Warning
} from '@mui/icons-material';
import * as moduleService from '@/services/module';
import { adminAPI } from '@/services/api';


// TabPanel component for tab content
function TabPanel(props) {
    const { children, value, index, ...other } = props;
    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`module-tabpanel-${index}`}
            aria-labelledby={`module-tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box sx={{ p: 3 }}>
                    {children}
                </Box>
            )}
        </div>
    );
}

const AdminModuleDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [module, setModule] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [tabValue, setTabValue] = useState(0);
    const [students, setStudents] = useState([]);
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'success'
    });

    // Edit dialog state
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [lecturers, setLecturers] = useState([]);
    const [formData, setFormData] = useState({
        code: '',
        title: '',
        description: '',
        lecturerId: ''
    });

    // Fetch module details
    useEffect(() => {
        const fetchModuleDetails = async () => {
            try {
                setLoading(true);
                console.log("Fetching details for module ID:", id);
                const moduleData = await moduleService.getModuleById(id);
                console.log("Module data received:", moduleData);
                setModule(moduleData);

                // Initialize form data for editing
                setFormData({
                    code: moduleData.code || '',
                    title: moduleData.title || '',
                    description: moduleData.description || '',
                    lecturerId: moduleData.lecturerId || ''
                });

                // Fetch enrolled students
                try {
                    const studentsData = await moduleService.getModuleStudents(id);
                    setStudents(studentsData || []);
                } catch (err) {
                    console.error("Error fetching module students:", err);
                    setStudents([]);
                }


            } catch (err) {
                console.error('Error fetching module details:', err);
                setError('Failed to load module details. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        fetchModuleDetails();
    }, [id]);

    // Fetch lecturers for edit dialog
    useEffect(() => {
        const fetchLecturers = async () => {
            try {
                const response = await adminAPI.getUsersByRole('LECTURER');
                setLecturers(response?.data || []);
            } catch (err) {
                console.error('Error fetching lecturers:', err);
                setLecturers([]);
            }
        };

        fetchLecturers();
    }, []);

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };

    const handleEdit = () => {
        setEditDialogOpen(true);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };

    const handleSaveEdit = async () => {
        try {
            const updatedModule = await moduleService.updateModule(id, formData);

            // Update local state
            setModule({
                ...module,
                ...updatedModule
            });

            setEditDialogOpen(false);
            setSnackbar({
                open: true,
                message: 'Module updated successfully',
                severity: 'success'
            });
        } catch (err) {
            console.error('Error updating module:', err);
            setSnackbar({
                open: true,
                message: 'Failed to update module. Please try again.',
                severity: 'error'
            });
        }
    };

    const handleToggleStatus = async () => {
        if (!module) return;

        try {
            console.log(`Toggling module status from ${module.isActive} to ${!module.isActive}`);
            await moduleService.toggleModuleStatus(id, !module.isActive);

            // Update local state to reflect the change
            setModule({
                ...module,
                isActive: !module.isActive
            });

            setSnackbar({
                open: true,
                message: `Module ${module.isActive ? 'deactivated' : 'activated'} successfully`,
                severity: 'success'
            });
        } catch (err) {
            console.error('Error toggling module status:', err);
            setSnackbar({
                open: true,
                message: 'Failed to update module status. Please try again.',
                severity: 'error'
            });
        }
    };

    const handleBackToDashboard = () => {
        navigate('/admin/dashboard');
    };


    const handleCloseSnackbar = () => {
        setSnackbar({
            ...snackbar,
            open: false
        });
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '70vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert severity="error">{error}</Alert>
                <Button
                    variant="outlined"
                    startIcon={<ArrowBack />}
                    onClick={handleBackToDashboard}
                    sx={{ mt: 2 }}
                >
                    Back to Dashboard
                </Button>
            </Box>
        );
    }

    if (!module) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert severity="info">Module not found.</Alert>
                <Button
                    variant="outlined"
                    startIcon={<ArrowBack />}
                    onClick={handleBackToDashboard}
                    sx={{ mt: 2 }}
                >
                    Back to Dashboard
                </Button>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            {/* Header Section */}
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <IconButton onClick={handleBackToDashboard} sx={{ mr: 1 }}>
                        <ArrowBack />
                    </IconButton>
                    <Typography variant="h5" component="h1">
                        Module Details
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                        variant="outlined"
                        startIcon={<Edit />}
                        onClick={handleEdit}
                    >
                        Edit
                    </Button>
                    <Button
                        variant="contained"
                        color={module.isActive ? 'warning' : 'success'}
                        startIcon={module.isActive ? <Block /> : <Check />}
                        onClick={handleToggleStatus}
                    >
                        {module.isActive ? 'Deactivate' : 'Activate'}
                    </Button>
                </Box>
            </Box>

            {/* Module Summary Card */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Grid container spacing={2}>
                        <Grid item xs={12} md={8}>
                            <Typography variant="h4">
                                {module.code}: {module.title}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                                <Chip
                                    label={module.isActive ? 'Active' : 'Inactive'}
                                    color={module.isActive ? 'success' : 'default'}
                                    sx={{ mr: 2 }}
                                />
                                <Typography color="text.secondary">
                                    {students.length || 0} students enrolled
                                </Typography>
                            </Box>
                            <Typography sx={{ mt: 2 }}>
                                {module.description || 'No description available.'}
                            </Typography>
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
                                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                    Module Details
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                    <Person fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                                    <Typography>
                                        Lecturer: {module.lecturerName || 'Not assigned'}
                                    </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                    <DateRange fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                                    <Typography>
                                        Created: {module.createdAt ? new Date(module.createdAt).toLocaleDateString() : 'Unknown'}
                                    </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <BookmarkBorder fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                                    <Typography>
                                        ID: {module.id}
                                    </Typography>
                                </Box>
                            </Box>
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>

            {/* Tabs for different sections */}
            <Box sx={{ width: '100%', bgcolor: 'background.paper', mb: 3 }}>
                <Tabs
                    value={tabValue}
                    onChange={handleTabChange}
                    centered
                    indicatorColor="primary"
                    textColor="primary"
                >
                    <Tab icon={<Group />} label="Enrolled Students" />


                </Tabs>
                <Divider />

                {/* Students Tab */}
                <TabPanel value={tabValue} index={0}>
                    <Box>
                        <Typography variant="h6" gutterBottom>
                            Enrolled Students ({students.length})
                        </Typography>
                        <Paper elevation={1}>
                            <List>
                                {students.length > 0 ? (
                                    students.map((student) => (
                                        <React.Fragment key={student.id}>
                                            <ListItem>
                                                <ListItemAvatar>
                                                    <Avatar>
                                                        <School />
                                                    </Avatar>
                                                </ListItemAvatar>
                                                <ListItemText
                                                    primary={student.name || student.fullName}
                                                    secondary={`Email: ${student.email} • Enrolled: ${
                                                        student.enrollmentDate ?
                                                            new Date(student.enrollmentDate).toLocaleDateString() :
                                                            'Unknown'
                                                    }`}
                                                />
                                            </ListItem>
                                            <Divider variant="inset" component="li" />
                                        </React.Fragment>
                                    ))
                                ) : (
                                    <ListItem>
                                        <ListItemText
                                            primary="No students enrolled"
                                            secondary="Students will appear here once they enroll in this module"
                                        />
                                    </ListItem>
                                )}
                            </List>
                        </Paper>
                    </Box>
                </TabPanel>



                {/* Resources Tab */}

            </Box>

            {/* Edit Module Dialog */}
            <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle>Edit Module</DialogTitle>
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
                    <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
                    <Button
                        onClick={handleSaveEdit}
                        variant="contained"
                        color="primary"
                    >
                        Save Changes
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Snackbar for notifications */}
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

export default AdminModuleDetails;