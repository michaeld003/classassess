import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Container,
    Grid,
    Paper,
    Typography,
    List,
    ListItem,
    Box,
    Card,
    CardContent,
    Button,
    CardActions,
    Chip,
    useTheme,
    CircularProgress,
    Alert
} from '@mui/material';
import {
    Timer as TimerIcon,
    Assignment as AssignmentIcon,
    School as SchoolIcon,
    ArrowForward as ArrowForwardIcon,
    Add as AddIcon,
    Error as ErrorIcon
} from '@mui/icons-material';
import { moduleAPI, testAPI, submissionAPI, authAPI } from '../../services/api';
import ModuleEnrollmentDialog from './ModuleEnrollmentDialog';

const StudentDashboard = () => {
    const navigate = useNavigate();
    const theme = useTheme();
    const isDarkMode = theme.palette.mode === 'dark';

    const [upcomingTests, setUpcomingTests] = useState([]);
    const [pastResults, setPastResults] = useState([]);
    const [enrolledModules, setEnrolledModules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [enrollmentDialogOpen, setEnrollmentDialogOpen] = useState(false);
    const [showInactiveModulesList, setShowInactiveModulesList] = useState(false);


    const fetchData = async () => {
        try {
            setLoading(true);
            setError(null);

            if (!authAPI.isAuthenticated()) {
                navigate('/login');
                return;
            }

            // Fetch enrolled modules
            console.log('Fetching enrolled modules...');
            const modulesResponse = await moduleAPI.getEnrolled();
            setEnrolledModules(modulesResponse.data || []);

            // Fetch upcoming tests
            console.log('Fetching upcoming tests...');
            const testsResponse = await testAPI.getUpcoming();

            // Filter tests to only include those from enrolled modules
            const filteredTests = testsResponse.data.filter(test =>
                modulesResponse.data.some(module => module.code === test.moduleCode)
            );

            setUpcomingTests(filteredTests || []);

            // Fetch completed submissions
            console.log('Fetching past results...');
            const resultsResponse = await submissionAPI.getCompleted();
            setPastResults(resultsResponse.data || []);

        } catch (err) {
            console.error('Error details:', err);
            const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch dashboard data';
            console.error('Error fetching dashboard data:', errorMessage);
            setError(errorMessage);
            setEnrolledModules([]);
            setUpcomingTests([]);
            setPastResults([]);

            if (err.response?.status === 401) {
                navigate('/login');
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [navigate]);

    const handleStartTest = (testId) => {
        navigate(`/student/test/${testId}`);
    };

    const handleViewResult = (resultId) => {
        navigate(`/student/results/${resultId}`);
    };

    const handleViewModule = (moduleId) => {
        navigate(`/module/${moduleId}`);
    };

    const handleOpenEnrollmentDialog = () => {
        setEnrollmentDialogOpen(true);
    };

    const handleCloseEnrollmentDialog = () => {
        setEnrollmentDialogOpen(false);
    };

    const handleEnrollmentComplete = async () => {
        await fetchData(); // Refresh all dashboard data
        setEnrollmentDialogOpen(false);
    };

    const cardStyle = {
        backgroundColor: isDarkMode ? 'rgba(45, 45, 45, 0.9)' : '#ffffff',
        backdropFilter: 'blur(10px)',
        transition: 'all 0.3s ease',
        '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: isDarkMode
                ? '0 8px 16px rgba(0, 0, 0, 0.4)'
                : '0 8px 16px rgba(0, 0, 0, 0.1)'
        }
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Container maxWidth="xl" sx={{ mt: 4 }}>
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
                <Button variant="contained" onClick={() => window.location.reload()}>
                    Retry
                </Button>
            </Container>
        );
    }

    // Filter active modules for display
    const activeEnrolledModules = enrolledModules.filter(module => module.isActive !== false);
    const inactiveModules = enrolledModules.filter(module => module.isActive === false);

    return (
        <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
            <Grid container spacing={3}>
                {/* Upcoming Tests */}
                <Grid item xs={12} md={6}>
                    <Paper
                        elevation={3}
                        sx={{
                            p: 3,
                            height: '100%',
                            backgroundColor: isDarkMode ? 'rgba(30, 30, 30, 0.95)' : '#ffffff'
                        }}
                    >
                        <Box display="flex" alignItems="center" mb={2}>
                            <TimerIcon sx={{ mr: 1 }} color="primary" />
                            <Typography variant="h6">Upcoming Tests</Typography>
                        </Box>
                        <List>
                            {upcomingTests.length === 0 ? (
                                <Typography color="textSecondary">No upcoming tests</Typography>
                            ) : (
                                upcomingTests.map((test) => (
                                    <Card
                                        key={test.id}
                                        sx={{
                                            ...cardStyle,
                                            mb: 2,
                                            '&:last-child': { mb: 0 }
                                        }}
                                    >
                                        <CardContent>
                                            <Box display="flex" alignItems="center" mb={1}>
                                                <Typography variant="h6" component="div">
                                                    {test.title}
                                                </Typography>
                                                <Chip
                                                    label={test.moduleCode}
                                                    size="small"
                                                    sx={{ ml: 1 }}
                                                    color="primary"
                                                />
                                            </Box>
                                            <Typography color="text.secondary" gutterBottom>
                                                Date: {new Date(test.startTime).toLocaleDateString()} •
                                                Time: {new Date(test.startTime).toLocaleTimeString()}
                                            </Typography>
                                            <Typography color="text.secondary">
                                                Duration: {test.durationMinutes} minutes
                                            </Typography>
                                        </CardContent>
                                        <CardActions>
                                            <Button
                                                variant="contained"
                                                size="small"
                                                onClick={() => handleStartTest(test.id)}
                                                sx={{ ml: 'auto' }}
                                            >
                                                Start Test
                                            </Button>
                                        </CardActions>
                                    </Card>
                                ))
                            )}
                        </List>
                    </Paper>
                </Grid>

                {/* Past Results */}
                <Grid item xs={12} md={6}>
                    <Paper
                        elevation={3}
                        sx={{
                            p: 3,
                            height: '100%',
                            backgroundColor: isDarkMode ? 'rgba(30, 30, 30, 0.95)' : '#ffffff'
                        }}
                    >
                        <Box display="flex" alignItems="center" mb={2}>
                            <AssignmentIcon sx={{ mr: 1 }} color="primary" />
                            <Typography variant="h6">Past Results</Typography>
                        </Box>
                        <List>
                            {pastResults.length === 0 ? (
                                <Typography color="textSecondary">No past results</Typography>
                            ) : (
                                pastResults.map((result) => (
                                    <Card
                                        key={result.id}
                                        sx={{
                                            ...cardStyle,
                                            mb: 2,
                                            '&:last-child': { mb: 0 }
                                        }}
                                    >
                                        <CardContent>
                                            <Box display="flex" alignItems="center" mb={1}>
                                                <Typography variant="h6" component="div">
                                                    {result.testTitle}
                                                </Typography>
                                                <Chip
                                                    label={result.moduleCode}
                                                    size="small"
                                                    sx={{ ml: 1 }}
                                                    color="primary"
                                                />
                                            </Box>
                                            <Typography color="text.secondary">
                                                Completed: {new Date(result.submittedAt).toLocaleDateString()}
                                            </Typography>
                                            <Typography variant="h5" color="primary">
                                                Score: {Number(result.totalScore).toFixed(2)}%
                                            </Typography>
                                        </CardContent>
                                        <CardActions>
                                            <Button
                                                variant="outlined"
                                                size="small"
                                                onClick={() => handleViewResult(result.id)}
                                                sx={{ ml: 'auto' }}
                                            >
                                                View Details
                                            </Button>
                                        </CardActions>
                                    </Card>
                                ))
                            )}
                        </List>
                    </Paper>
                </Grid>

                {/* Enrolled Modules */}
                <Grid item xs={12}>
                    <Paper
                        elevation={3}
                        sx={{
                            p: 3,
                            backgroundColor: isDarkMode ? 'rgba(30, 30, 30, 0.95)' : '#ffffff'
                        }}
                    >
                        <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
                            <Box display="flex" alignItems="center">
                                <SchoolIcon sx={{ mr: 1 }} color="primary" />
                                <Typography variant="h6">Enrolled Modules</Typography>
                            </Box>
                            {enrolledModules.length === 0 && (
                                <Button
                                    variant="contained"
                                    color="primary"
                                    onClick={handleOpenEnrollmentDialog}
                                    startIcon={<AddIcon />}
                                >
                                    Enroll in Modules
                                </Button>
                            )}
                        </Box>

                        {/* Display message for inactive modules if any */}
                        {inactiveModules.length > 0 && (
                            <Alert
                                severity="warning"
                                sx={{
                                    mb: 3,
                                    borderLeft: '4px solid #ff9800',
                                    backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 152, 0, 0.1)' : 'rgba(255, 152, 0, 0.05)',
                                    '& .MuiAlert-icon': {
                                        color: 'warning.main',
                                        fontSize: '1.25rem'
                                    }
                                }}
                                icon={<ErrorIcon fontSize="inherit" />}
                                action={
                                    <Button
                                        color="warning"
                                        size="small"
                                        variant="outlined"
                                        onClick={() => setShowInactiveModulesList(!showInactiveModulesList)}
                                    >
                                        {showInactiveModulesList ? 'Hide Details' : 'Show Details'}
                                    </Button>
                                }
                            >
                                <Typography fontWeight="medium">
                                    {inactiveModules.length === 1
                                        ? `One of your modules (${inactiveModules[0].code}) is currently inactive.`
                                        : `${inactiveModules.length} of your modules are currently inactive.`}
                                </Typography>
                                <Typography variant="body2" sx={{ mt: 0.5 }}>
                                    Please contact your instructor for more information.
                                </Typography>

                                {/* Collapsible list of inactive modules */}
                                {showInactiveModulesList && (
                                    <Box sx={{ mt: 2, pl: 2, borderLeft: '1px dashed', borderColor: 'warning.main' }}>
                                        {inactiveModules.map(module => (
                                            <Typography key={module.id} variant="body2" sx={{ mb: 0.5 }}>
                                                • {module.code}: {module.title}
                                            </Typography>
                                        ))}
                                    </Box>
                                )}
                            </Alert>
                        )}

                        <Grid container spacing={3}>
                            {activeEnrolledModules.length === 0 ? (
                                <Grid item xs={12}>
                                    <Typography color="textSecondary">
                                        {enrolledModules.length > 0
                                            ? "You have modules, but none are currently active."
                                            : "No enrolled modules"}
                                    </Typography>
                                </Grid>
                            ) : (
                                activeEnrolledModules.map((module) => (
                                    <Grid item xs={12} sm={6} md={4} key={module.id}>
                                        <Card sx={cardStyle}>
                                            <CardContent>
                                                <Typography variant="h6" gutterBottom>
                                                    {module.code}
                                                </Typography>
                                                <Typography variant="body1" color="text.secondary" gutterBottom>
                                                    {module.title}
                                                </Typography>
                                                {module.nextTest && (
                                                    <Typography variant="body2" color="text.secondary">
                                                        Next Test: {new Date(module.nextTest).toLocaleDateString()}
                                                    </Typography>
                                                )}
                                            </CardContent>
                                            <CardActions>
                                                <Button
                                                    size="small"
                                                    endIcon={<ArrowForwardIcon />}
                                                    onClick={() => handleViewModule(module.id)}
                                                    sx={{ ml: 'auto' }}
                                                >
                                                    View Module
                                                </Button>
                                            </CardActions>
                                        </Card>
                                    </Grid>
                                ))
                            )}
                        </Grid>
                    </Paper>
                </Grid>
            </Grid>

            {/* Module Enrollment Dialog */}
            <ModuleEnrollmentDialog
                open={enrollmentDialogOpen}
                onClose={handleCloseEnrollmentDialog}
                onEnrollmentComplete={handleEnrollmentComplete}
            />
        </Container>
    );
};

export default StudentDashboard;