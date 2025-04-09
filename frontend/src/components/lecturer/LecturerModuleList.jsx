import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Container,
    Grid,
    Card,
    CardContent,
    Typography,
    Button,
    Box,
    Alert,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions
} from '@mui/material';
import {
    School as SchoolIcon,
    Warning as WarningIcon
} from '@mui/icons-material';
import { moduleAPI } from '../../services/api';

const LecturerModuleList = () => {
    const [modules, setModules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const [selectedModule, setSelectedModule] = useState(null);
    const [inactiveModuleDetailsOpen, setInactiveModuleDetailsOpen] = useState(false);

    useEffect(() => {
        const fetchModules = async () => {
            try {
                const response = await moduleAPI.getTeaching();
                setModules(response.data);
                setError(null);
            } catch (err) {
                setError('Failed to load modules. Please try again later.');
                console.error('Error fetching modules:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchModules();
    }, []);

    const handleViewDetails = (module) => {
        if (module.isActive) {
            navigate(`/module/${module.id}`);
        } else {
            // For inactive modules, show the dialog first
            setSelectedModule(module);
            setInactiveModuleDetailsOpen(true);
        }
    };

    const handleInactiveModuleClick = (module) => {
        setSelectedModule(module);
        setInactiveModuleDetailsOpen(true);
    };

    const handleToggleStatus = async (id, currentStatus) => {
        try {
            await moduleAPI.toggleModuleStatus(id, !currentStatus);

            // Update the local state to reflect the change
            setModules(modules.map(module =>
                module.id === id
                    ? { ...module, isActive: !currentStatus }
                    : module
            ));

        } catch (error) {
            console.error("Error toggling module status:", error);
            setError("Failed to update module status. Please try again.");
        }
    };

    if (loading) {
        return (
            <Container maxWidth="lg" sx={{ mt: 4 }}>
                <Typography>Loading modules...</Typography>
            </Container>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Typography variant="h4" gutterBottom>
                My Modules
            </Typography>

            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                </Alert>
            )}

            <Grid container spacing={3}>
                {modules.map((module) => (
                    <Grid item xs={12} md={6} key={module.id}>
                        <Card
                            sx={{
                                height: '100%',
                                borderLeft: module.isActive ? '4px solid #4caf50' : '4px solid #9e9e9e',
                                opacity: module.isActive ? 1 : 0.8
                            }}
                        >
                            <CardContent>
                                <Box display="flex" alignItems="center" mb={2}>
                                    <SchoolIcon sx={{ mr: 1, color: 'primary.main' }} />
                                    <Box>
                                        <Typography variant="h6">
                                            {module.code}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {module.title}
                                        </Typography>
                                    </Box>
                                </Box>

                                <Typography variant="body2" mb={2}>
                                    {module.description}
                                </Typography>

                                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                                    <Typography variant="body2" color="text.secondary">
                                        Students Enrolled: {module.studentCount || 0}
                                    </Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <Chip
                                            label={module.isActive ? 'Active' : 'Inactive'}
                                            color={module.isActive ? 'success' : 'default'}
                                            size="small"
                                            sx={{ mr: 1 }}
                                        />
                                        {!module.isActive && (
                                            <Button
                                                size="small"
                                                variant="text"
                                                color="primary"
                                                onClick={() => handleInactiveModuleClick(module)}
                                            >
                                                Info
                                            </Button>
                                        )}
                                    </Box>
                                </Box>

                                <Box display="flex" justifyContent="space-between">
                                    <Button
                                        variant="contained"
                                        color={module.isActive ? 'warning' : 'success'}
                                        size="small"
                                        onClick={() => handleToggleStatus(module.id, module.isActive)}
                                    >
                                        {module.isActive ? 'Deactivate' : 'Activate'}
                                    </Button>

                                    <Button
                                        variant="contained"
                                        onClick={() => module.isActive ? navigate(`/module/${module.id}`) : handleViewDetails(module)}
                                    >
                                        View Details
                                    </Button>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            {/* Dialog for inactive module details */}
            <Dialog
                open={inactiveModuleDetailsOpen}
                onClose={() => setInactiveModuleDetailsOpen(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle sx={{ display: 'flex', alignItems: 'center' }}>
                    <WarningIcon color="warning" sx={{ mr: 1 }} />
                    Inactive Module Details
                </DialogTitle>
                <DialogContent>
                    {selectedModule && (
                        <>
                            <Typography variant="h6" gutterBottom>
                                {selectedModule.code}: {selectedModule.title}
                            </Typography>
                            <Typography variant="body2" paragraph>
                                This module is currently inactive and not visible to students.
                            </Typography>
                            <Typography variant="subtitle2" gutterBottom>
                                Student Impact:
                            </Typography>
                            <Typography variant="body2">
                                • {selectedModule.studentCount || 0} enrolled students can't access this module
                            </Typography>
                            <Typography variant="body2">
                                • Scheduled tests have been suspended
                            </Typography>
                            <Typography variant="body2">
                                • Students will see a notification about this inactive module
                            </Typography>
                        </>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setInactiveModuleDetailsOpen(false)}>Close</Button>
                    {selectedModule && !selectedModule.isActive && (
                        <Button
                            variant="contained"
                            color="success"
                            onClick={() => {
                                handleToggleStatus(selectedModule.id, false);
                                setInactiveModuleDetailsOpen(false);
                            }}
                        >
                            Activate Module
                        </Button>
                    )}
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default LecturerModuleList;