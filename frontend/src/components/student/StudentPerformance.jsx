import React, { useState, useEffect } from 'react';
import {
    Container,
    Grid,
    Paper,
    Typography,
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
    BarChart as BarChartIcon,
    ArrowForward as ArrowForwardIcon,
    CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import { submissionAPI } from '../../services/api';
import { useNavigate } from 'react-router-dom';


// performance section
const StudentPerformance = () => {
    const navigate = useNavigate();
    const theme = useTheme();
    const isDarkMode = theme.palette.mode === 'dark';

    // States
    const [performanceData, setPerformanceData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedModule, setSelectedModule] = useState(null);
    const [testHistory, setTestHistory] = useState([]);


    // Card style - copied from your dashboard for consistency
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

    // Load data on component mount
    useEffect(() => {
        fetchPerformanceData();
    }, []);

    const fetchPerformanceData = async () => {
        try {
            setLoading(true);
            setError(null);
            // Get overall performance data
            const response = await submissionAPI.getPerformanceSummary();
            console.log("Performance data received:", response);

            // Process the module data to ensure it includes the correct structure
            const processedData = {
                ...response,
                modules: response.modules?.map(module => ({
                    ...module,
                    // Ensure each module has tests array with the right format
                    tests: module.tests?.map(test => ({
                        id: test.id,
                        testId: test.testId || test.id,
                        title: test.title,
                        score: test.score || 0,
                        submittedAt: test.submittedAt || new Date().toISOString()
                    })) || []
                })) || []
            };

            setPerformanceData(processedData);
        } catch (err) {
            console.error('Error fetching performance data:', err);
            setError('Failed to load performance data');
        } finally {
            setLoading(false);
        }
    };

    // Handlers
    const handleModuleClick = (module) => {
        setSelectedModule(module);
    };

    const handleBackClick = () => {
        setSelectedModule(null);
    };

    const handleViewResult = (resultId) => {
        navigate(`/student/results/${resultId}`);
    };

    // Utility functions
    const formatScore = (score) => {
        if (score === null || score === undefined) return '0.00%';

        // Try to convert from string if needed
        const numericScore = typeof score === 'string' ? parseFloat(score) : score;

        // If score is already a percentage (> 1), don't multiply
        if (numericScore > 1) {
            return numericScore.toFixed(2) + '%';
        }

        // Otherwise, convert from decimal to percentage
        return (numericScore * 100).toFixed(2) + '%';
    };

    const getScoreColor = (score) => {
        if (score >= 0.7) return theme.palette.success.main;
        if (score >= 0.5) return theme.palette.warning.main;
        return theme.palette.error.main;
    };


    // ScoreCircle component
    const ScoreCircle = ({ score }) => {
        // Calculate percentage properly
        const percentage = score > 1 ? Math.round(score) : Math.round(score * 100);

        // Get appropriate color based on score
        const scoreColor = getScoreColor(score);

        // Background circle color - lighter in light mode, darker in dark mode
        const bgColor = isDarkMode
            ? theme.palette.grey[800]
            : theme.palette.grey[200];

        // Shadow effect for 3D appearance
        const shadowColor = isDarkMode
            ? 'rgba(0, 0, 0, 0.5)'
            : 'rgba(0, 0, 0, 0.1)';

        // Text color to match the circle but with better contrast
        const textColor = isDarkMode ? 'white' : theme.palette.text.primary;

        //
        const circleSize = 140;
        const padding = 2;

        return (
            <Box sx={{
                position: 'relative',
                display: 'inline-flex',
                padding: padding,
                borderRadius: '50%',
                boxShadow: `0 4px 10px ${shadowColor}`,
                background: `radial-gradient(circle, ${isDarkMode ? 'rgba(40,40,40,1)' : 'rgba(255,255,255,1)'} 0%, ${bgColor} 100%)`,
                transition: 'transform 0.3s ease',
                '&:hover': {
                    transform: 'scale(1.05)'
                }
            }}>
                {/* Background circle */}
                <CircularProgress
                    variant="determinate"
                    value={100}
                    size={circleSize}
                    thickness={5}
                    sx={{
                        color: bgColor,
                        position: 'absolute',
                        left: 16,
                        top: 16,
                    }}
                />

                {/* Main progress indicator */}
                <CircularProgress
                    variant="determinate"
                    value={percentage}
                    size={circleSize}
                    thickness={8}
                    sx={{
                        color: scoreColor,
                        transition: 'all 0.5s ease',
                        zIndex: 2
                    }}
                />

                {/* Central text */}
                <Box
                    sx={{
                        top: 0,
                        left: 0,
                        bottom: 0,
                        right: 0,
                        position: 'absolute',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 3
                    }}
                >
                    <Typography
                        variant="h4"
                        component="div"
                        sx={{
                            fontWeight: 'bold',
                            color: textColor,
                            textShadow: isDarkMode ? '0 2px 4px rgba(0,0,0,0.5)' : 'none'
                        }}
                    >
                        {percentage}
                    </Typography>
                    <Typography
                        variant="body2"
                        component="div"
                        sx={{
                            marginTop: -0.5,
                            fontWeight: 'bold',
                            color: textColor,
                            opacity: 0.8
                        }}
                    >
                        %
                    </Typography>
                </Box>
            </Box>
        );
    };

    if (loading) {
        return (
            <Container maxWidth="xl" sx={{ mt: 4 }}>
                <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                    <CircularProgress />
                </Box>
            </Container>
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

    return (
        <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
            <Paper
                elevation={3}
                sx={{
                    p: 3,
                    backgroundColor: isDarkMode ? 'rgba(30, 30, 30, 0.95)' : '#ffffff'
                }}
            >
                {/* Module Details View */}
                {selectedModule ? (
                    <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                            <Button
                                variant="outlined"
                                startIcon={<ArrowForwardIcon sx={{ transform: 'rotate(180deg)' }} />}
                                onClick={handleBackClick}
                                sx={{ mr: 2 }}
                            >
                                Back
                            </Button>
                            <Typography variant="h6">
                                {selectedModule.code}: {selectedModule.title}
                            </Typography>
                        </Box>

                        <Card sx={{ mb: 4 }}>
                            <CardContent sx={{ textAlign: 'center' }}>
                                <Typography variant="subtitle1" gutterBottom>
                                    Module Average Score
                                </Typography>
                                <ScoreCircle score={selectedModule.averageScore} />
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                    Based on {selectedModule.testsCount} completed {selectedModule.testsCount === 1 ? 'test' : 'tests'}
                                </Typography>
                            </CardContent>
                        </Card>

                        <Typography variant="subtitle1" gutterBottom>
                            Test Results
                        </Typography>

                        {selectedModule.tests.length > 0 ? (
                            <Box>
                                {selectedModule.tests.map((test) => (
                                    <Card key={test.id} sx={{ ...cardStyle, mb: 2 }}>
                                        <CardContent>
                                            <Box display="flex" justifyContent="space-between" alignItems="center">
                                                <Typography variant="subtitle1">{test.title}</Typography>

                                                <Typography
                                                    variant="h6"
                                                    sx={{ color: getScoreColor(test.score) }}
                                                >
                                                    {formatScore(test.score || 0)}
                                                </Typography>
                                            </Box>
                                            <Typography variant="body2" color="text.secondary">
                                                Completed: {new Date(test.submittedAt).toLocaleDateString()}
                                            </Typography>
                                        </CardContent>
                                        <CardActions>
                                            <Button
                                                size="small"
                                                variant="outlined"
                                                onClick={() => handleViewResult(test.id)}
                                                sx={{ ml: 'auto' }}
                                            >
                                                View Details
                                            </Button>
                                        </CardActions>
                                    </Card>
                                ))}
                            </Box>
                        ) : (
                            <Typography variant="body1" sx={{ mt: 2, textAlign: 'center' }}>
                                No test results found for this module.
                            </Typography>
                        )}
                    </Box>
                ) : (
                    /* Overview display */
                    <Box>
                        <Box display="flex" alignItems="center" mb={3}>
                            <BarChartIcon sx={{ mr: 1 }} color="primary" />
                            <Typography variant="h6">Performance Overview</Typography>
                        </Box>

                        <Card sx={{ mb: 4 }}>
                            <CardContent sx={{ textAlign: 'center' }}>
                                <Typography variant="subtitle1" gutterBottom>
                                    Overall Performance
                                </Typography>
                                <ScoreCircle score={performanceData?.overallAverage || 0} />
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                    Average score across {performanceData?.completedModulesCount || 0} {(performanceData?.completedModulesCount || 0) === 1 ? 'module' : 'modules'} with completed tests
                                </Typography>
                            </CardContent>
                        </Card>

                        <Typography variant="subtitle1" gutterBottom>
                            Module Performance
                        </Typography>

                        {!performanceData || !performanceData.modules || performanceData.modules.length === 0 ? (
                            <Box p={3} textAlign="center">
                                <Typography color="textSecondary">
                                    No performance data available yet. Complete some tests to see your statistics.
                                </Typography>
                            </Box>
                        ) : (
                            <Grid container spacing={3}>
                                {performanceData.modules.map((module) => (
                                    <Grid item xs={12} sm={6} md={4} key={module.id}>
                                        <Card
                                            sx={{
                                                ...cardStyle,
                                                cursor: 'pointer',
                                            }}
                                            onClick={() => handleModuleClick(module)}
                                        >
                                            <CardContent>
                                                <Typography variant="subtitle1" noWrap>
                                                    {module.code}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary" noWrap sx={{ mb: 2 }}>
                                                    {module.title}
                                                </Typography>

                                                <Box sx={{ textAlign: 'center', my: 2 }}>
                                                    <ScoreCircle score={module.averageScore} />
                                                </Box>

                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                                                    <Chip
                                                        size="small"
                                                        icon={<CheckCircleIcon />}
                                                        label={`${module.testsCount} ${module.testsCount === 1 ? 'Test' : 'Tests'}`}
                                                        color={module.testsCount > 0 ? 'primary' : 'default'}
                                                        variant="outlined"
                                                    />
                                                    <BarChartIcon color="primary" fontSize="small" />
                                                </Box>
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                ))}
                            </Grid>
                        )}
                    </Box>
                )}
            </Paper>
        </Container>
    );
};

export default StudentPerformance;