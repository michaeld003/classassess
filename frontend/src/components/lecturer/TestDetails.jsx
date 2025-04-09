import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Box, Typography, Card, CardContent, Button,
    Divider, Grid, CircularProgress, Alert,
    Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Paper, Chip
} from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { moduleAPI, testAPI } from '../../services/api';

const TestDetails = () => {
    const { moduleId, testId } = useParams();
    const navigate = useNavigate();
    const [test, setTest] = useState(null);
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [apiError, setApiError] = useState(null);

    useEffect(() => {
        const fetchTestDetails = async () => {
            try {
                setLoading(true);
                setError(null);
                setApiError(null);

                // If I only have testId but no moduleId
                if (!moduleId && testId) {
                    console.log(`No moduleId provided, fetching test ${testId} directly`);
                    try {
                        // First try to get the test directly using testAPI.getById which doesn't require moduleId
                        const testInfo = await testAPI.getById(testId);
                        console.log('Retrieved test info:', testInfo);

                        if (testInfo) {
                            // Store basic test info first
                            setTest(testInfo);

                            // Check if test is in the future
                            const startTime = new Date(testInfo.startTime);
                            const now = new Date();

                            if (startTime > now) {
                                // Test hasn't started yet, don't show any results
                                console.log("Test is scheduled for the future. No results available yet.");
                                setResults([]);
                            } else {
                                // If we have moduleId in the response, we can fetch additional details
                                if (testInfo.moduleId) {
                                    console.log(`Retrieved moduleId: ${testInfo.moduleId} for test ${testId}`);

                                    const fetchWithTimeout = (promise, timeout = 10000) => {
                                        return Promise.race([
                                            promise,
                                            new Promise((_, reject) =>
                                                setTimeout(() => reject(new Error('Request timed out')), timeout)
                                            )
                                        ]);
                                    };

                                    try {
                                        // Try to get more detailed info if possible
                                        const detailedTest = await fetchWithTimeout(moduleAPI.getTestDetails(testInfo.moduleId, testId));
                                        if (detailedTest && !detailedTest.error) {
                                            setTest(detailedTest);
                                        }
                                    } catch (detailsErr) {
                                        console.warn('Could not fetch detailed test info:', detailsErr);
                                        // It's OK, we already have basic test info
                                    }
                                }

                                // Fetch test results using just testId and moduleId if available
                                try {
                                    // Pass testInfo.moduleId as the second parameter if available
                                    const resultsData = await testAPI.getTestResults(
                                        testId,
                                        testInfo.moduleId
                                    );
                                    console.log('Test results received:', resultsData);
                                    setResults(Array.isArray(resultsData?.data) ? resultsData.data : []);
                                } catch (resultsErr) {
                                    console.warn('Error fetching results:', resultsErr);
                                }
                            }
                        } else {
                            throw new Error('No test data returned');
                        }
                    } catch (err) {
                        console.error('Error fetching test without moduleId:', err);

                        // Error handling for the initial getById request
                        if (err.response) {
                            const errorDetails = {
                                status: err.response.status,
                                data: err.response.data,
                                headers: err.response.headers
                            };
                            console.error('Error response details:', errorDetails);
                            setApiError(errorDetails);
                        }

                        setError(`Could not retrieve test details: ${err.message || 'Unknown error'}`);
                    }
                    setLoading(false);
                    return;
                }

                // Original flow when both moduleId and testId are available
                console.log(`Fetching test details for moduleId=${moduleId}, testId=${testId}`);

                // Check if token exists and is valid
                const token = localStorage.getItem('token');
                const isValidToken = token &&
                    typeof token === 'string' &&
                    token !== 'null' &&
                    token !== 'undefined' &&
                    token.split('.').length === 3;

                if (!isValidToken) {
                    console.error('Invalid or missing token');
                    setError('Authentication error. Please log in again.');
                    setLoading(false);
                    return;
                }

                // Debug token
                console.log('Using token:', token ? `${token.substring(0, 15)}...` : 'No token');

                // Test the server connection directly
                try {
                    console.log('Testing API server connection...');
                    const response = await fetch('http://localhost:8080/api/health', {
                        method: 'HEAD',
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });
                    console.log('API server health check:', response.status);
                } catch (healthErr) {
                    console.warn('API server health check failed:', healthErr);
                    // Continue with the main request even if the health check fails
                }

                // Fetch test details with timeout and error handling
                const fetchWithTimeout = (promise, timeout = 10000) => {
                    return Promise.race([
                        promise,
                        new Promise((_, reject) =>
                            setTimeout(() => reject(new Error('Request timed out')), timeout)
                        )
                    ]);
                };

                // Main request to get test details
                const testData = await fetchWithTimeout(moduleAPI.getTestDetails(moduleId, testId));

                console.log('Test details received:', testData);

                if (!testData) {
                    throw new Error('No test data returned from API');
                }

                setTest(testData);

                // Check if test is in the future
                const startTime = new Date(testData.startTime);
                const now = new Date();

                if (startTime > now) {
                    // Test hasn't started yet, don't show any results
                    console.log("Test is scheduled for the future. No results available yet.");
                    setResults([]);
                } else {
                    // Fetch test results if we have a valid test and it's not in the future
                    if (testData && testData.id) {
                        console.log(`Fetching results for test ID: ${testData.id}`);
                        // Pass moduleId as the second parameter
                        const resultsData = await testAPI.getTestResults(testData.id, moduleId);
                        console.log('Test results received:', resultsData);
                        setResults(Array.isArray(resultsData?.data) ? resultsData.data : []);
                    } else {
                        console.warn('Cannot fetch results: Test data is incomplete', testData);
                    }
                }
            } catch (err) {
                console.error('Error fetching test details:', err);

                // Detailed error logging
                if (err.response) {
                    const errorDetails = {
                        status: err.response.status,
                        data: err.response.data,
                        headers: err.response.headers
                    };
                    console.error('Error response details:', errorDetails);
                    setApiError(errorDetails);
                } else if (err.request) {
                    console.error('No response received:', err.request);
                    setApiError({ message: 'No response received from server' });
                } else {
                    console.error('Request setup error:', err.message);
                    setApiError({ message: err.message });
                }

                // User-friendly error messages
                if (err.response?.status === 404) {
                    setError('Test not found. It may have been deleted or you may not have permission to view it.');
                } else if (err.response?.status === 403) {
                    setError('You do not have permission to view this test.');
                } else if (err.message.includes('timeout')) {
                    setError('Request timed out. The server is taking too long to respond.');
                } else if (!navigator.onLine) {
                    setError('You appear to be offline. Please check your internet connection.');
                } else {
                    setError(`Failed to load test details: ${err.message}`);
                }
            } finally {
                setLoading(false);
            }
        };

        if (testId) {
            fetchTestDetails();
        } else {
            setError('Missing test ID');
            setLoading(false);
        }
    }, [moduleId, testId]);

    const handleBackToModule = () => {
        navigate('/lecturer/dashboard');
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
                <Typography variant="body2" sx={{ ml: 2 }}>
                    Loading test details...
                </Typography>
            </Box>
        );
    }

    if (error) {
        return (
            <Box p={3}>
                <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>

                {apiError && (
                    <Box mt={2} p={2} bgcolor="background.paper" borderRadius={1}>
                        <Typography variant="subtitle2">Technical Details:</Typography>
                        <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap', fontSize: '0.8rem' }}>
                            {JSON.stringify(apiError, null, 2)}
                        </Typography>
                    </Box>
                )}

                <Button
                    startIcon={<ArrowBackIcon />}
                    onClick={handleBackToModule}
                    sx={{ mt: 2 }}
                >
                    Back to Module
                </Button>

                <Button
                    variant="outlined"
                    color="primary"
                    onClick={() => window.location.reload()}
                    sx={{ mt: 2, ml: 2 }}
                >
                    Retry
                </Button>
            </Box>
        );
    }

    if (!test) {
        return (
            <Box p={3}>
                <Alert severity="info">Test not found or has been deleted.</Alert>
                <Button
                    startIcon={<ArrowBackIcon />}
                    onClick={handleBackToModule}
                    sx={{ mt: 2 }}
                >
                    Back to Module
                </Button>
            </Box>
        );
    }

    return (
        <Box p={3}>
            <Box mb={3} display="flex" alignItems="center">
                <Button
                    startIcon={<ArrowBackIcon />}
                    onClick={handleBackToModule}
                    sx={{ mr: 2 }}
                >
                    Back
                </Button>
                <Typography variant="h5">{test.title || 'Test Details'}</Typography>
            </Box>

            <Grid container spacing={3}>
                {/* Test Info */}
                <Grid item xs={12} md={4}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>Test Information</Typography>
                            <Divider sx={{ mb: 2 }} />

                            <Box display="flex" justifyContent="space-between" mb={1}>
                                <Typography variant="body2" color="text.secondary">Status:</Typography>
                                <Chip
                                    label={test.status || 'UNKNOWN'}
                                    color={
                                        test.status === 'COMPLETED' ? 'success' :
                                            test.status === 'ACTIVE' ? 'warning' :
                                                test.status === 'SCHEDULED' ? 'primary' : 'default'
                                    }
                                    size="small"
                                />
                            </Box>

                            <Box display="flex" justifyContent="space-between" mb={1}>
                                <Typography variant="body2" color="text.secondary">Date:</Typography>
                                <Typography variant="body2">
                                    {test.startTime || test.createdAt ?
                                        new Date(test.startTime || test.createdAt).toLocaleDateString() :
                                        'Not set'}
                                </Typography>
                            </Box>

                            <Box display="flex" justifyContent="space-between" mb={1}>
                                <Typography variant="body2" color="text.secondary">Duration:</Typography>
                                <Typography variant="body2">{test.durationMinutes || 0} min</Typography>
                            </Box>

                            <Box display="flex" justifyContent="space-between" mb={1}>
                                <Typography variant="body2" color="text.secondary">Questions:</Typography>
                                <Typography variant="body2">{test.questionCount || 0}</Typography>
                            </Box>

                            <Box display="flex" justifyContent="space-between" mb={1}>
                                <Typography variant="body2" color="text.secondary">Average Score:</Typography>
                                <Typography variant="body2" fontWeight="medium">{test.averageScore || 0}%</Typography>
                            </Box>

                            <Box display="flex" justifyContent="space-between" mb={1}>
                                <Typography variant="body2" color="text.secondary">Completion Rate:</Typography>
                                <Typography variant="body2">{test.completionRate || 0}%</Typography>
                            </Box>

                            {test.description && (
                                <Box mt={2}>
                                    <Typography variant="body2" color="text.secondary" gutterBottom>Description:</Typography>
                                    <Typography variant="body2">{test.description}</Typography>
                                </Box>
                            )}
                        </CardContent>
                    </Card>
                </Grid>

                {/* Results Table */}
                <Grid item xs={12} md={8}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>Student Results</Typography>
                            <Divider sx={{ mb: 2 }} />

                            {results.length > 0 ? (
                                <TableContainer component={Paper} variant="outlined">
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>Student</TableCell>
                                                <TableCell>Score</TableCell>
                                                <TableCell>Time Spent</TableCell>
                                                <TableCell>Submitted</TableCell>
                                                <TableCell>Status</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {results.map((result) => (
                                                <TableRow key={result.id || `result-${Math.random()}`}>
                                                    <TableCell>{result.studentName || result.studentId || 'Unknown'}</TableCell>
                                                    <TableCell>
                                                        <Chip
                                                            label={`${result.score || 0}%`}
                                                            size="small"
                                                            color={
                                                                result.score >= 70 ? 'success' :
                                                                    result.score >= 50 ? 'primary' :
                                                                        result.score >= 40 ? 'warning' : 'error'
                                                            }
                                                            variant="outlined"
                                                        />
                                                    </TableCell>
                                                    <TableCell>{result.timeSpent || '-'}</TableCell>
                                                    <TableCell>
                                                        {result.submittedAt ? new Date(result.submittedAt).toLocaleString() : '-'}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Chip
                                                            label={result.status || 'UNKNOWN'}
                                                            size="small"
                                                            color={
                                                                result.status === 'COMPLETED' ? 'success' :
                                                                    result.status === 'IN_PROGRESS' ? 'warning' : 'default'
                                                            }
                                                        />
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            ) : (
                                <Alert severity="info">No students have completed this test yet.</Alert>
                            )}
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
};

export default TestDetails;