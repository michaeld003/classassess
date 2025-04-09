import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Container,
    Grid,
    Card,
    CardContent,
    Typography,
    Button,
    LinearProgress,
    Box,
    Alert,
    Chip
} from '@mui/material';
import { School as SchoolIcon } from '@mui/icons-material';
import { moduleAPI } from '../../services/api';

const ModuleList = () => {
    const [modules, setModules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchModules = async () => {
            try {
                const response = await moduleAPI.getEnrolled();
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

    if (loading) {
        return (
            <Container maxWidth="lg" sx={{ mt: 4 }}>
                <LinearProgress />
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
                        <Card sx={{ height: '100%' }}>
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

                                <Box display="flex" justifyContent="space-between" alignItems="center">
                                    <Typography variant="body2" color="text.secondary">
                                        Instructor: {module.lecturerName}
                                    </Typography>
                                    <Button
                                        variant="contained"
                                        onClick={() => navigate(`/module/${module.id}`)}
                                    >
                                        View Details
                                    </Button>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        </Container>
    );
};

export default ModuleList;