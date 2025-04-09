import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Container, Paper, Typography, Box, Tab, Tabs, CircularProgress, Alert,
    Grid, Card, CardContent, LinearProgress, Tooltip, IconButton
} from '@mui/material';
import {
    BarChart as BarChartIcon,
    History as HistoryIcon,
    Psychology as PsychologyIcon,
    Info as InfoIcon
} from '@mui/icons-material';
import { testAPI, handleApiError } from '../../services/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import TestResults from '../student/TestResults'; // Import existing TestResults component

const LecturerPerformance = () => {
    const { id } = useParams(); // For accessing specific test ID if needed
    const navigate = useNavigate();
    const [analyticsTabValue, setAnalyticsTabValue] = useState(0);
    const [performanceData, setPerformanceData] = useState([]);
    const [testsActivityData, setTestsActivityData] = useState([]);
    const [aiConfidenceData, setAiConfidenceData] = useState([]);
    const [analyticsLoading, setAnalyticsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchAnalyticsData = async () => {
            try {
                setAnalyticsLoading(true);
                setError(null);

                // Fetch analytics data
                const response = await testAPI.getDashboardAnalytics();
                const analyticsData = response.data;

                console.log("Analytics Data:", analyticsData);
                console.log("Test Activity Data:", analyticsData.testActivity);

                // Transform the data to ensure values are numbers
                const transformedActivityData = analyticsData.testActivity.map(item => ({
                    ...item,
                    completedTests: Number(item.completedTests),
                    upcomingTests: Number(item.upcomingTests)
                }));

                setPerformanceData(analyticsData.modulePerformance || []);
                setTestsActivityData(transformedActivityData || []);
                setAiConfidenceData(analyticsData.aiConfidence || []);

            } catch (err) {
                console.error('Error fetching analytics data:', err);
                setError(handleApiError(err));
            } finally {
                setAnalyticsLoading(false);
            }
        };

        fetchAnalyticsData();
    }, []);

    const handleAnalyticsTabChange = (event, newValue) => {
        setAnalyticsTabValue(newValue);
    };

    if (analyticsLoading) {
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
            </Container>
        );
    }

    return (
        <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
            <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
                Performance Overview
            </Typography>

            {/* If a specific test ID is passed, show test results first */}
            {id && (
                <Box mb={4}>
                    <Paper elevation={3} sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            Test Results
                        </Typography>
                        {/* Re-use the existing TestResults component */}
                        <TestResults />
                    </Paper>
                </Box>
            )}

            {/* Analytics tabs */}
            <Paper elevation={3} sx={{ p: 3 }}>
                <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                    <Tabs value={analyticsTabValue} onChange={handleAnalyticsTabChange} variant="scrollable" scrollButtons="auto">
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

export default LecturerPerformance;