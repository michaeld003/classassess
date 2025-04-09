import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Container, Paper, Typography, Box, Card, CardContent,
    CircularProgress, Alert, Button, Divider, Chip, List, ListItem
} from '@mui/material';
import { testAPI } from '../../services/api';

const TestResults = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [results, setResults] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isDarkMode, setIsDarkMode] = useState(false);

    useEffect(() => {
        const darkModeCheck = () => {
            const isDark = document.body.classList.contains('dark-mode') ||
                document.documentElement.classList.contains('dark-mode') ||
                window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
            setIsDarkMode(isDark);
        };

        darkModeCheck();
    }, []);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchResults = async () => {
            try {
                setLoading(true);
                const data = await testAPI.getDetailedTestResults(id);

                // Check if the response contains an error
                if (data && data.error === true) {
                    setError(data.message || "Failed to load test results");
                    return;
                }

                // Check if data is empty
                if (!data || Object.keys(data).length === 0) {
                    setError("No test results data available");
                    return;
                }

                setResults(data);
            } catch (err) {
                console.error('Error fetching results:', err);
                setError(`Failed to load test results: ${err.message || 'Unknown error'}`);
            } finally {
                setLoading(false);
            }
        };

        fetchResults();
    }, [id]);

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleString();
    };

    if (loading) {
        return (
            <Container sx={{ mt: 4 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <CircularProgress />
                    <Typography sx={{ mt: 2 }}>Loading test results...</Typography>
                </Box>
            </Container>
        );
    }

    if (error) {
        return (
            <Container sx={{ mt: 4 }}>
                <Alert
                    severity="error"
                    sx={{ mb: 2 }}
                >
                    {error}
                </Alert>
                <Typography variant="body2" sx={{ mb: 2 }}>
                    This might happen if:
                    <ul>
                        <li>You're trying to access a test that belongs to another student</li>
                        <li>The test has not been graded yet</li>
                        <li>The test ID in the URL is incorrect</li>
                    </ul>
                </Typography>
                <Button
                    variant="contained"
                    onClick={() => navigate('/student/dashboard')}
                >
                    Return to Dashboard
                </Button>
            </Container>
        );
    }

    if (!results) {
        return (
            <Container sx={{ mt: 4 }}>
                <Alert severity="warning">Test results not found or not available yet.</Alert>
                <Button
                    variant="contained"
                    sx={{ mt: 2 }}
                    onClick={() => navigate('/student/dashboard')}
                >
                    Return to Dashboard
                </Button>
            </Container>
        );
    }

    // Calculate test status color
    const getScoreColor = (score) => {
        if (score >= 80) return '#4caf50';
        if (score >= 60) return '#ff9800';
        return '#f44336';
    };



    return (
        <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
            <Paper
                elevation={3}
                sx={{
                    p: 3,
                    bgcolor: theme => theme.palette.mode === 'dark'
                        ? 'rgba(30, 30, 30, 0.9)'
                        : 'rgba(255, 255, 255, 0.95)',
                    border: theme => `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)'}`,
                    borderRadius: 2,
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)'
                }}
            >
                {/* Test header */}
                <Typography variant="h4" gutterBottom>{results.testTitle}</Typography>
                <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle1">
                        Submitted: {formatDate(results.submissionDate)}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                        <Typography variant="h6" sx={{ mr: 2 }}>Score:</Typography>
                        <Typography
                            variant="h4"
                            sx={{
                                fontWeight: 'bold',
                                color: getScoreColor(
                                    (results.appeal && results.appeal.status === 'APPROVED' && results.appeal.updatedScore != null
                                        ? results.appeal.updatedScore * 100
                                        : results.totalScore * 100)
                                )
                            }}
                        >
                            {/* Display updated score if available from appeal, otherwise show original */}
                            {((results.appeal && results.appeal.status === 'APPROVED' && results.appeal.updatedScore != null
                                ? (results.appeal.updatedScore).toFixed(2)
                                : (results.totalScore).toFixed(2)))}%
                        </Typography>

                        {/* Show indicator if score was changed due to appeal */}
                        {results.appeal && results.appeal.status === 'APPROVED' &&
                            results.appeal.updatedScore != null &&
                            results.appeal.updatedScore !== results.appeal.originalScore && (
                                <Typography variant="body2" sx={{ ml: 2, fontStyle: 'italic', color: 'green' }}>
                                    (Adjusted after appeal)
                                </Typography>
                            )}
                    </Box>
                </Box>

                <Divider sx={{ my: 3 }} />

                {/* Answers section */}
                <Typography variant="h5" gutterBottom>Your Answers</Typography>

                {results.answers && results.answers.map((answer, index) => (
                    <Card key={answer.questionId} sx={{
                        mb: 3,
                        border: theme => `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.15)' : '#e0e0e0'}`,
                        bgcolor: theme => theme.palette.mode === 'dark' ? 'rgba(50, 50, 50, 0.8)' : 'white',
                        borderRadius: 2,
                        boxShadow: theme => theme.palette.mode === 'dark'
                            ? '0 4px 8px rgba(0, 0, 0, 0.5)'
                            : '0 2px 4px rgba(0, 0, 0, 0.1)'
                    }}>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Question {index + 1}
                            </Typography>

                            <Typography variant="body1" gutterBottom>
                                {answer.questionText}
                            </Typography>

                            <Box sx={{ mt: 2, mb: 2 }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                                    Your Answer:
                                </Typography>
                                <Typography
                                    variant="body1"
                                    sx={{
                                        p: 1.5,
                                        bgcolor: theme => theme.palette.mode === 'dark'
                                            ? 'rgba(66, 66, 66, 0.7)'
                                            : 'rgba(245, 245, 245, 0.7)',
                                        color: 'inherit',
                                        borderRadius: 1,
                                        border: theme => `1px solid ${theme.palette.mode === 'dark' ? '#555555' : '#e0e0e0'}`
                                    }}
                                >
                                    {answer.studentAnswer || "(No answer provided)"}
                                </Typography>
                            </Box>

                            <Box sx={{ mt: 2, mb: 2 }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                                    Correct Answer:
                                </Typography>
                                <Typography
                                    variant="body1"
                                    sx={{
                                        p: 1.5,
                                        bgcolor: theme => theme.palette.mode === 'dark'
                                            ? 'rgba(27, 94, 32, 0.3)'
                                            : 'rgba(232, 245, 233, 0.7)',
                                        color: 'inherit',
                                        borderRadius: 1,
                                        border: theme => `1px solid ${theme.palette.mode === 'dark' ? '#2e7d32' : '#c8e6c9'}`
                                    }}
                                >
                                    {answer.correctAnswer || "N/A"}
                                </Typography>
                            </Box>

                            {/* MCQ Options */}
                            {answer.questionType === 'MCQ' && answer.options && (
                                <Box sx={{ mt: 2 }}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                                        All Options:
                                    </Typography>
                                    <List>
                                        {answer.options.map((option, i) => (
                                            <ListItem key={i} sx={{
                                                pl: 2,
                                                pr: 2,
                                                mb: 0.5,
                                                bgcolor: theme => theme.palette.mode === 'dark'
                                                    ? (option.isCorrect
                                                        ? 'rgba(27, 94, 32, 0.3)'
                                                        : (option.text === answer.studentAnswer
                                                            ? 'rgba(127, 0, 0, 0.3)'
                                                            : 'rgba(66, 66, 66, 0.5)'))
                                                    : (option.isCorrect
                                                        ? 'rgba(232, 245, 233, 0.7)'
                                                        : (option.text === answer.studentAnswer
                                                            ? 'rgba(255, 235, 238, 0.7)'
                                                            : 'rgba(245, 245, 245, 0.5)')),
                                                color: 'inherit',
                                                borderRadius: 1,
                                                border: theme => theme.palette.mode === 'dark'
                                                    ? (option.isCorrect
                                                        ? '1px solid #2e7d32'
                                                        : (option.text === answer.studentAnswer && !option.isCorrect
                                                            ? '1px solid #c62828'
                                                            : '1px solid #555555'))
                                                    : (option.isCorrect
                                                        ? '1px solid #c8e6c9'
                                                        : (option.text === answer.studentAnswer && !option.isCorrect
                                                            ? '1px solid #ffcdd2'
                                                            : '1px solid #e0e0e0'))
                                            }}>
                                                <Typography>
                                                    {option.text}
                                                    {option.isCorrect && (
                                                        <Chip
                                                            size="small"
                                                            label="Correct"
                                                            color="success"
                                                            sx={{ ml: 1 }}
                                                        />
                                                    )}
                                                    {option.text === answer.studentAnswer && !option.isCorrect && (
                                                        <Chip
                                                            size="small"
                                                            label="Your choice"
                                                            color="error"
                                                            sx={{ ml: 1 }}
                                                        />
                                                    )}
                                                </Typography>
                                            </ListItem>
                                        ))}
                                    </List>
                                </Box>
                            )}

                            {/* Feedback for written answers */}
                            {(answer.questionType === 'WRITTEN' || answer.questionType === 'SHORT_ANSWER') && (
                                <Box sx={{ mt: 2 }}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                                        Feedback:
                                    </Typography>
                                    <Paper variant="outlined" sx={{
                                        p: 2,
                                        bgcolor: theme => theme.palette.mode === 'dark'
                                            ? 'rgba(13, 71, 161, 0.3)'
                                            : 'rgba(243, 248, 255, 0.7)',
                                        color: 'inherit',
                                        borderColor: theme => theme.palette.mode === 'dark'
                                            ? '#1976d2'
                                            : '#bbdefb'
                                    }}>
                                        <Typography variant="body2">
                                            {answer.feedback || "No feedback provided."}
                                        </Typography>
                                    </Paper>
                                </Box>
                            )}

                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2, pt: 1, borderTop: '1px solid #eee' }}>
                                <Typography variant="subtitle1">
                                    Points: {(answer.score)}/{answer.points || 1}
                                </Typography>
                                <Chip
                                    label={answer.score > 0.6 ? "Correct" : "Incorrect"}
                                    color={answer.score > 0.6 ? "success" : "error"}
                                    variant="outlined"
                                />
                            </Box>
                        </CardContent>
                    </Card>
                ))}

                {/* Appeal section */}
                <Box sx={{
                    mt: 4,
                    mb: 2,
                    p: 2,
                    bgcolor: theme => theme.palette.mode === 'dark'
                        ? 'rgba(50, 50, 50, 0.7)'
                        : '#f5f5f5',
                    borderRadius: 2,
                    border: theme => `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)'}`
                }}>
                    <Typography variant="h6" gutterBottom>
                        Not satisfied with your result?
                    </Typography>
                    <Typography variant="body2" paragraph>
                        If you believe your answers were incorrectly graded, you can submit an appeal to the instructor.
                    </Typography>
                    <Button
                        variant="outlined"
                        color="primary"
                        onClick={() => navigate(`/student/appeal/${id}`)}
                    >
                        Submit Appeal
                    </Button>
                </Box>

                <Button
                    variant="contained"
                    fullWidth
                    sx={{ mt: 3 }}
                    onClick={() => navigate('/student/dashboard')}
                >
                    Return to Dashboard
                </Button>
            </Paper>
        </Container>
    );
};

export default TestResults;