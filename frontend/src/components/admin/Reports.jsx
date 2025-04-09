import React, { useState, useEffect } from 'react';
import {
    Box, Typography, CircularProgress, Alert, Tabs, Tab, Paper,
    Grid, Card, CardContent, LinearProgress, Tooltip, IconButton, Container, Button
} from '@mui/material';
import {
    BarChart as BarChartIcon,
    History as HistoryIcon,
    Psychology as PsychologyIcon,
    Info as InfoIcon,
    Refresh
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import api from '../../services/api';

const Reports = () => {
    const [analyticsTabValue, setAnalyticsTabValue] = useState(0);
    const [performanceData, setPerformanceData] = useState([]);
    const [testsActivityData, setTestsActivityData] = useState([]);
    const [aiConfidenceData, setAiConfidenceData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchAnalyticsData();
    }, []);

    const fetchAnalyticsData = async () => {
        try {
            setLoading(true);
            setError(null);

            console.log('Making API call to get analytics data...');

            // Try admin endpoint first
            try {
                const adminResponse = await api.get('/api/admin/analytics');
                console.log('Admin Analytics API response:', adminResponse);

                if (adminResponse.data && Object.keys(adminResponse.data).length > 0) {
                    // Transform the data to ensure values are numbers
                    const transformedActivityData = adminResponse.data.testActivity.map(item => ({
                        ...item,
                        completedTests: Number(item.completedTests),
                        upcomingTests: Number(item.upcomingTests)
                    }));

                    setPerformanceData(adminResponse.data.modulePerformance || []);
                    setTestsActivityData(transformedActivityData || []);
                    setAiConfidenceData(adminResponse.data.aiConfidence || []);
                } else {
                    throw new Error('Admin endpoint returned empty data');
                }
            } catch (adminError) {
                console.error('Admin endpoint failed:', adminError);

                // If admin endpoint fails or returns empty data, try lecturer endpoint as fallback
                try {
                    const lecturerResponse = await api.get('/api/tests/lecturer/analytics');
                    console.log('Lecturer Analytics API response:', lecturerResponse);

                    if (lecturerResponse.data) {
                        // Transform the data to ensure values are numbers
                        const transformedActivityData = lecturerResponse.data.testActivity.map(item => ({
                            ...item,
                            completedTests: Number(item.completedTests),
                            upcomingTests: Number(item.upcomingTests)
                        }));

                        setPerformanceData(lecturerResponse.data.modulePerformance || []);
                        setTestsActivityData(transformedActivityData || []);
                        setAiConfidenceData(lecturerResponse.data.aiConfidence || []);
                    }
                } catch (lecturerError) {
                    console.error('Lecturer endpoint failed:', lecturerError);
                    throw adminError; // Use the original error
                }
            }
        } catch (err) {
            console.error('Error in fetchAnalyticsData:', err);
            setError('Failed to load data: ' + (err.message || 'Unknown error'));
        } finally {
            setLoading(false);
        }
    };

    const handleTabChange = (event, newValue) => {
        setAnalyticsTabValue(newValue);
    };

    const handleRetry = () => {
        fetchAnalyticsData();
    };

    // Check if we have any data
    const hasData = performanceData.length > 0 || testsActivityData.length > 0 || aiConfidenceData.length > 0;

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
                <Button
                    variant="outlined"
                    startIcon={<Refresh />}
                    onClick={handleRetry}
                >
                    Retry
                </Button>
            </Container>
        );
    }

    // Show the no data available message
    if (!hasData) {
        return (
            <Container maxWidth="xl" sx={{ mt: 4 }}>
                <Alert severity="info" icon={<InfoIcon />} sx={{ mb: 2 }}>
                    <Typography variant="subtitle1" fontWeight="medium" mb={1}>
                        No analytics data available. This could be because:
                    </Typography>
                    <ul>
                        <li>There are no tests or modules in the system yet</li>
                        <li>Your account might not have permission to access analytics data</li>
                    </ul>
                </Alert>
                <Button
                    variant="outlined"
                    startIcon={<Refresh />}
                    onClick={handleRetry}
                >
                    Retry
                </Button>
            </Container>
        );
    }

    // If we have data, use the same structure as LecturerPerformance.jsx
    return (
        <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
            <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
                Performance Overview
            </Typography>

            {/* Analytics tabs */}
            <Paper elevation={3} sx={{ p: 3 }}>
                <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                    <Tabs value={analyticsTabValue} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
                        <Tab label="Performance Overview" />
                        <Tab label="Test Activity" />
                        <Tab label="AI Grading Confidence" />
                    </Tabs>
                </Box>

                {/* Performance Overview Chart */}
                {analyticsTabValue === 0 && (
                    <Box>
                        <Typography variant="h6" gutterBottom display="flex" alignItems="center">
                            <BarChartIcon sx={{ mr: 1 }} /> Performance Overview by Module
                        </Typography>
                        <Box height={400}>
                            {performanceData.length === 0 ? (
                                <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                                    <Typography color="text.secondary">No performance data available</Typography>
                                </Box>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={performanceData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="moduleCode" />
                                        <YAxis />
                                        <RechartsTooltip />
                                        <Legend />
                                        <Bar dataKey="avgScore" name="Average Score (%)" fill="#2196f3" />
                                        <Bar dataKey="passingRate" name="Passing Rate (%)" fill="#4caf50" />
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </Box>
                    </Box>
                )}

                {/* Test Activity Timeline */}
                {analyticsTabValue === 1 && (
                    <Box>
                        <Typography variant="h6" gutterBottom display="flex" alignItems="center">
                            <HistoryIcon sx={{ mr: 1 }} /> Tests Activity Timeline
                        </Typography>
                        <Box height={400}>
                            {testsActivityData.length === 0 ? (
                                <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                                    <Typography color="text.secondary">No activity data available</Typography>
                                </Box>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={testsActivityData} key={testsActivityData.length}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="period" />
                                        <YAxis domain={[0, dataMax => Math.max(25, dataMax)]} />
                                        <RechartsTooltip />
                                        <Legend />
                                        <Line
                                            type="monotone"
                                            dataKey="completedTests"
                                            name="Completed Tests"
                                            stroke="#ff9800"
                                            activeDot={{ r: 8 }}
                                            isAnimationActive={false}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="upcomingTests"
                                            name="Upcoming Tests"
                                            stroke="#2196f3"
                                            activeDot={{ r: 8 }}
                                            isAnimationActive={false}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            )}
                        </Box>
                    </Box>
                )}

                {/* AI Grading Confidence */}
                {analyticsTabValue === 2 && (
                    <Box>
                        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                            <Typography variant="h6" display="flex" alignItems="center">
                                <PsychologyIcon sx={{ mr: 1 }} /> AI Grading Confidence by Module
                            </Typography>
                            <Tooltip title="AI confidence is calculated based on grading accuracy and appeal rates. Higher confidence indicates more reliable AI grading.">
                                <IconButton size="small">
                                    <InfoIcon />
                                </IconButton>
                            </Tooltip>
                        </Box>
                        <Typography variant="body2" color="text.secondary" paragraph>
                            This chart shows the confidence level of AI in grading different types of questions across modules.
                        </Typography>

                        {aiConfidenceData.length === 0 ? (
                            <Alert severity="info">No AI confidence data available yet.</Alert>
                        ) : (
                            <Grid container spacing={3}>
                                {aiConfidenceData.map(item => (
                                    <Grid item xs={12} sm={6} md={3} key={item.moduleCode}>
                                        <Card sx={{ p: 2 }}>
                                            <Typography variant="subtitle1" gutterBottom>
                                                {item.moduleCode}
                                            </Typography>
                                            <Box display="flex" justifyContent="space-between" mb={1}>
                                                <Typography variant="body2" color="text.secondary">
                                                    Confidence Score
                                                </Typography>
                                                <Typography variant="body2" fontWeight="medium">
                                                    {item.confidenceScore.toFixed(1)}%
                                                </Typography>
                                            </Box>
                                            <LinearProgress
                                                variant="determinate"
                                                value={item.confidenceScore}
                                                color={item.confidenceScore > 90 ? "success" : item.confidenceScore > 80 ? "primary" : "warning"}
                                                sx={{ height: 8, borderRadius: 4 }}
                                            />
                                            <Box mt={2}>
                                                <Typography variant="caption" display="block" color="text.secondary">
                                                    Total Graded: {item.totalGradedQuestions || 0}
                                                </Typography>
                                                <Typography variant="caption" display="block" color="text.secondary">
                                                    Appeals: {item.totalAppeals || 0}
                                                </Typography>
                                            </Box>
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

export default Reports;