import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    Container, Paper, Typography, Radio, RadioGroup, FormControlLabel,
    FormControl, Button, Box, Card, CardContent,
    CircularProgress, Alert, TextField, LinearProgress
} from '@mui/material';
import { testAPI } from '../../services/api';

const TestTaking = () => {
    const { id } = useParams();
    const testId = id;
    const navigate = useNavigate();
    const [test, setTest] = useState(null);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [answers, setAnswers] = useState({});
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [timeRemaining, setTimeRemaining] = useState(null);
    const [progress, setProgress] = useState(0);
    const [saving, setSaving] = useState(false);

    const saveProgress = async () => {
        try {
            if (!test || !test.questions || Object.keys(answers).length === 0) return;

            setSaving(true);

            // Convert array format to map format
            const answersMap = {};
            Object.entries(answers).forEach(([questionId, answer]) => {
                answersMap[questionId] = answer;
            });

            // Prepare submission data with IN_PROGRESS status
            const submission = {
                testId: parseInt(testId),
                answers: answersMap // Changed to map format
            };

            console.log("Saving progress:", submission);

            // Submit to API
            await testAPI.saveProgress(testId, submission);
            console.log("Progress saved successfully");

            // Brief visual indicator
            setTimeout(() => {
                setSaving(false);
            }, 1500);
        } catch (err) {
            console.error('Error saving progress:', err);
            setSaving(false);
        }
    };

    // Handle test submission
    const handleSubmit = async () => {
        // Add confirmation dialog
        const confirmed = window.confirm("Are you sure you want to submit this test? Once submitted, you cannot make any changes.");
        if (!confirmed) {
            return;
        }

        try {
            setSubmitting(true);

            // Convert array format to map format
            const answersMap = {};
            Object.entries(answers).forEach(([questionId, answer]) => {
                answersMap[questionId] = answer || ''; // Ensure empty string for unanswered questions
            });

            // Prepare submission data
            const submission = {
                testId: parseInt(testId),
                answers: answersMap // Changed to map format
            };

            console.log("Submitting test:", submission);

            // Submit to API
            const response = await testAPI.submit(testId, submission);
            console.log("Submit response:", response);

            alert('Test submitted successfully!');
            // Redirect to dashboard or results page
            navigate('/student/dashboard');
        } catch (err) {
            console.error('Error submitting test:', err);
            setError(`Failed to submit test: ${err.message || 'Unknown error'}`);
        } finally {
            setSubmitting(false);
        }
    };

    useEffect(() => {
        const fetchTest = async () => {
            try {
                setLoading(true);
                console.log("Fetching test with ID:", id);

                // Make sure id is a number
                const numericId = parseInt(id, 10);
                if (isNaN(numericId)) {
                    throw new Error("Invalid test ID");
                }

                try {
                    // Use the student-specific endpoint
                    const data = await testAPI.getStudentTest(numericId);

                    // Check if the test has already been submitted
                    if (data.error && data.redirectTo) {
                        alert(data.message || "This test has already been submitted");
                        navigate(data.redirectTo);
                        return;
                    }

                    console.log("Test data received:", JSON.stringify(data, null, 2));
                    setTest(data);

                    console.log("Raw duration from API:", data.durationMinutes);
                    if (data.durationMinutes) {
                        // Explicitly parse to number and handle different formats
                        let timeInSeconds;
                        if (typeof data.durationMinutes === 'string') {
                            timeInSeconds = parseInt(data.durationMinutes, 10) * 60;
                        } else if (typeof data.durationMinutes === 'number') {
                            timeInSeconds = data.durationMinutes * 60;
                        } else {
                            // Use the configured time if available, otherwise log a warning
                            console.warn("Duration minutes in unexpected format");
                            timeInSeconds = data.durationMinutes * 60;
                        }
                        console.log("Setting time remaining to:", timeInSeconds, "seconds");
                        setTimeRemaining(timeInSeconds);
                    } else {
                        // Look for the duration directly from the test object as fallback
                        console.log("Using test duration as fallback");
                        const timeInSeconds = (test && test.durationMinutes) ? test.durationMinutes * 60 : 10 * 60;
                        setTimeRemaining(timeInSeconds);
                    }

                    // Initialize answers object and progress
                    if (data.questions && data.questions.length > 0) {
                        // Rest of your existing code
                    }

                } catch (err) {
                    if (err.response?.data?.error && err.response?.data?.redirectTo) {
                        // Handle already submitted test
                        alert(err.response.data.message || "This test has already been submitted");
                        navigate(err.response.data.redirectTo);
                        return;
                    }
                    throw err;
                }

            } catch (err) {
                console.error('Error fetching test:', err);
                setError(`Failed to load test: ${err.message || 'Unknown error'}`);
            } finally {
                setLoading(false);
            }
        };

        fetchTest();
    }, [testId, navigate]);

    // Debug test data when it's loaded
    useEffect(() => {
        if (test) {
            console.log("Full test data:", test);
            console.log("Questions:", test.questions);
            if (test.questions && test.questions.length > 0) {
                test.questions.forEach((q, index) => {
                    console.log(`Question ${index + 1}:`, q);
                    console.log(`Question ${index + 1} options:`, q.options);
                });
            }
        }
    }, [test]);

    // Add this function to your TestTaking component
    const generateDefaultOptions = (questionText) => {

        // Default generic options for any other question
        return [
            { id: 1, optionText: "Option A" },
            { id: 2, optionText: "Option B" },
            { id: 3, optionText: "Option C" },
            { id: 4, optionText: "Option D" }
        ];
    };

    // Timer effect
    useEffect(() => {
        console.log("Timer effect triggered, timeRemaining:", timeRemaining);
        if (!timeRemaining || timeRemaining <= 0) {
            console.log("No time remaining or time is 0");
            return;
        }

        const timer = setInterval(() => {
            setTimeRemaining(prev => {
                console.log("Current time remaining:", prev);
                if (prev <= 1) {
                    clearInterval(timer);
                    handleSubmit(); // Auto-submit when time expires
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [timeRemaining]);


    useEffect(() => {
        // Block navigation through browser history
        const blockNavigation = (e) => {
            // Create a custom event to handle navigation
            if (!submitting && test) {
                // This will show the browser's default confirmation dialog
                e.preventDefault();
                e.returnValue = '';

                // Custom handling
                if (window.confirm("Are you sure you want to leave? Your test progress will be saved, but you may not be able to return.")) {
                    // Handle submission before leaving
                    saveProgress();
                    // Navigate after confirmation
                    window.location.href = '/student/dashboard';
                }
            }
        };

        // Listen for popstate (back/forward buttons)
        window.addEventListener('popstate', blockNavigation);

        // Cleanup
        return () => {
            window.removeEventListener('popstate', blockNavigation);
        };
    }, [test, submitting, saveProgress]);
    useEffect(() => {
        const handleBeforeUnload = (e) => {
            if (test && !submitting) {
                const message = "Warning: Leaving this page will save your current answers and may submit your test. All unanswered questions will be marked as empty.";
                e.preventDefault();
                e.returnValue = message;
                return message;
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [test, submitting]);

        // Auto-save answers periodically and on page unload
        useEffect(() => {
            if (!test || !test.questions || Object.keys(answers).length === 0) return;

            // Regular auto-save every 30 seconds
            const autoSave = setTimeout(() => {
                saveProgress();
            }, 30000);

            // Save on page unload too
            const handlePageHide = () => {
                saveProgress();
                // If the test is in progress and user is leaving, consider auto-submitting
                if (test && !submitting) {
                    // Prepare submission data
                    const answersMap = {};
                    Object.entries(answers).forEach(([questionId, answer]) => {
                        answersMap[questionId] = answer || '';
                    });

                    const submission = {
                        testId: parseInt(testId),
                        answers: answersMap
                    };

                    try {
                        // Use fetch with keepalive flag which is better for unload events
                        fetch(`/api/tests/${testId}/submit`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify(submission),
                            keepalive: true // This allows the request to complete even after page unload
                        });
                        console.log("Auto-submit request sent");
                    } catch (err) {
                        console.error('Error auto-submitting on page exit:', err);
                    }
                }
            };

            window.addEventListener('pagehide', handlePageHide);

            return () => {
                clearTimeout(autoSave);
                window.removeEventListener('pagehide', handlePageHide);
            };
        }, [answers, test, testId, submitting, saveProgress]);



        useEffect(() => {
            const handleNavigation = (e) => {
                if (test && !submitting) {
                    // Save current state
                    saveProgress();

                    // Show warning
                    const message = "Warning: Leaving the test page may result in lost answers. Are you sure you want to exit?";
                    const confirmed = window.confirm(message);

                    if (!confirmed) {
                        // If the user cancels, prevent the navigation
                        e.preventDefault();
                        // For some browsers, we need to push a dummy state to prevent the navigation
                        window.history.pushState(null, '', window.location.href);
                        return false;
                    } else {
                        // If confirmed, auto-submit test
                        handleSubmit();
                    }
                }
            };

            // Listen for popstate (back/forward button)
            window.addEventListener('popstate', handleNavigation);

            // Push state to ensure popstate works
            if (test) {
                window.history.pushState(null, '', window.location.href);
            }

            return () => {
                window.removeEventListener('popstate', handleNavigation);
            };
        }, [test, submitting, saveProgress, handleSubmit]);


        // Handle clicks on the green SUBMIT TEST button in the UI
        useEffect(() => {
            const handleSubmitButtonClick = (e) => {
                // Check if this is the SUBMIT TEST button at the bottom of the test interface
                if (e.target.textContent === 'SUBMIT TEST') {
                    e.preventDefault();
                    handleSubmit();
                }
            };

            // Add event listener to the document to catch all button clicks
            document.addEventListener('click', handleSubmitButtonClick);

            return () => {
                document.removeEventListener('click', handleSubmitButtonClick);
            };
        }, [handleSubmit]);

    // Format time remaining
    const formatTime = (seconds) => {
        if (!seconds) return '--:--';
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // Handle answer change
    const handleAnswerChange = (value) => {
        if (!test || !test.questions) return;

        const questionId = test.questions[currentQuestion].id;
        setAnswers(prev => ({
            ...prev,
            [questionId]: value
        }));

        // Update progress percentage
        const answeredCount = Object.values(answers).filter(a => a !== '').length + 1;
        const progressPercent = (answeredCount / test.questions.length) * 100;
        setProgress(progressPercent);
    };

    // Navigate to next/previous question
    const handleNext = () => {
        if (!test || !test.questions) return;
        if (currentQuestion < test.questions.length - 1) {
            setCurrentQuestion(prev => prev + 1);
        }
    };

    const handlePrevious = () => {
        if (currentQuestion > 0) {
            setCurrentQuestion(prev => prev - 1);
        }
    };





    if (loading) {
        return (
            <Container sx={{ mt: 4 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <CircularProgress />
                    <Typography sx={{ mt: 2 }}>Loading test...</Typography>
                </Box>
            </Container>
        );
    }

    if (error) {
        return (
            <Container sx={{ mt: 4 }}>
                <Alert severity="error">{error}</Alert>
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

    if (!test) {
        return (
            <Container sx={{ mt: 4 }}>
                <Alert severity="warning">Test not found or not available.</Alert>
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

    if (!test.questions || test.questions.length === 0) {
        return (
            <Container sx={{ mt: 4 }}>
                <Alert severity="info">This test has no questions.</Alert>
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

    // Get current question
    const question = test.questions[currentQuestion];

    // Debug information about the question
    console.log("Current question:", question);
    console.log("Question type:", question.questionType);
    console.log("Has options property:", question.hasOwnProperty('options'));
    console.log("Options:", question.options);

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
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h5">{test.title}</Typography>
                    {timeRemaining !== null && (
                        <Box sx={{
                            display: 'flex',
                            alignItems: 'center',
                            bgcolor: timeRemaining < 300 ? 'rgba(255, 87, 87, 0.2)' : 'rgba(76, 175, 80, 0.2)',
                            p: 1.5,
                            px: 2.5,
                            borderRadius: 2,
                            border: '1px solid',
                            borderColor: timeRemaining < 300 ? 'rgba(255, 87, 87, 0.5)' : 'rgba(76, 175, 80, 0.5)'
                        }}>
                            <Typography variant="h6" color={timeRemaining < 300 ? 'error' : 'primary'} sx={{ fontWeight: 'bold' }}>
                                Time: {formatTime(timeRemaining)}
                            </Typography>
                        </Box>
                    )}
                </Box>

                <Box sx={{ mb: 2 }}>
                    <LinearProgress
                        variant="determinate"
                        value={progress}
                        sx={{
                            height: 10,
                            borderRadius: 5,
                            backgroundColor: theme => theme.palette.mode === 'dark'
                                ? 'rgba(255, 255, 255, 0.1)'
                                : 'rgba(0, 0, 0, 0.08)',
                            '& .MuiLinearProgress-bar': {
                                backgroundColor: theme => theme.palette.mode === 'dark'
                                    ? 'rgba(76, 175, 80, 0.8)'
                                    : 'rgba(25, 118, 210, 0.8)'
                            }
                        }}
                    />                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                        <Typography variant="caption">Progress</Typography>
                        <Typography variant="caption">{Math.round(progress)}%</Typography>
                    </Box>
                    {/* saving indicator */}
                    {saving && (
                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 1, justifyContent: 'flex-end' }}>
                            <CircularProgress size={16} sx={{ mr: 1 }} />
                            <Typography variant="caption" color="text.secondary">
                                Saving progress...
                            </Typography>
                        </Box>
                    )}
                </Box>

                <Typography variant="subtitle1" gutterBottom>
                    Question {currentQuestion + 1} of {test.questions.length}
                </Typography>

                {/* Question content */}
                <Card
                    variant="outlined"
                    sx={{
                        mb: 3,
                        mt: 3,
                        bgcolor: theme => theme.palette.mode === 'dark' ? 'rgba(50, 50, 50, 0.8)' : 'rgba(255, 255, 255, 0.9)',
                        border: theme => `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.12)'}`,
                        borderRadius: 2,
                        boxShadow: theme => theme.palette.mode === 'dark'
                            ? '0 4px 8px rgba(0, 0, 0, 0.5)'
                            : '0 2px 4px rgba(0, 0, 0, 0.1)'
                    }}
                >                    <CardContent>
                        <Typography variant="h6" gutterBottom>
                            Question {currentQuestion + 1}
                        </Typography>
                        <Typography
                            variant="body1"
                            gutterBottom
                            sx={{
                                userSelect: 'none', // Prevents text selection
                            }}
                            onCopy={(e) => e.preventDefault()}
                        >
                            {question.questionText}
                        </Typography>

                        {(question.questionType === 'MCQ' || question.questionType === 'mcq') && (
                            <FormControl component="fieldset" sx={{ mt: 2, width: '100%' }}>
                                <RadioGroup
                                    value={answers[question.id] || ''}
                                    onChange={(e) => handleAnswerChange(e.target.value)}
                                >
                                    {console.log("Current question:", question)}
                                    {console.log("Question options:", question.options)}

                                    {/* Check if options exist and render them, otherwise use defaults */}
                                    {(question.options && Array.isArray(question.options) && question.options.length > 0) ? (
                                        // Use the options from the API
                                        question.options.map((option, index) => (
                                            <FormControlLabel
                                                key={option.id || index}
                                                value={option.optionText}
                                                control={<Radio />}
                                                label={option.optionText}
                                                sx={{ userSelect: 'none' }}
                                                onCopy={(e) => e.preventDefault()}
                                            />
                                        ))
                                    ) : (
                                        // Generate default options when none are provided
                                        generateDefaultOptions(question.questionText).map((option, index) => (
                                            <FormControlLabel
                                                key={option.id || index}
                                                value={option.optionText}
                                                control={<Radio />}
                                                label={option.optionText}
                                            />
                                        ))
                                    )}
                                </RadioGroup>
                            </FormControl>
                        )}

                        {(question.questionType === 'SHORT_ANSWER' || question.questionType === 'WRITTEN') && (
                            <>
                                <TextField
                                    fullWidth
                                    multiline
                                    rows={4}
                                    placeholder="Type your answer here..."
                                    value={answers[question.id] || ''}
                                    onChange={(e) => handleAnswerChange(e.target.value)}
                                    sx={{ mt: 2 }}
                                    variant="outlined"
                                    onCopy={(e) => e.preventDefault()}
                                    onPaste={(e) => e.preventDefault()}
                                    onCut={(e) => e.preventDefault()}
                                    inputProps={{
                                        onContextMenu: (e) => e.preventDefault()
                                    }}
                                />
                                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                                    Note: Copy and paste functions are disabled for academic integrity reasons.
                                </Typography>
                            </>
                        )}
                    </CardContent>
                </Card>

                {/* Navigation buttons */}
                <Box display="flex" justifyContent="space-between">
                    <Button
                        variant="outlined"
                        onClick={handlePrevious}
                        disabled={currentQuestion === 0}
                    >
                        Previous
                    </Button>

                    <Button
                        variant="contained"
                        color="primary"
                        onClick={handleNext}
                        disabled={currentQuestion === test.questions.length - 1}
                    >
                        Next
                    </Button>
                </Box>

                {/* Submit button */}
                <Button
                    variant="contained"
                    color="success"
                    fullWidth
                    sx={{
                        mt: 3,
                        py: 1.5,
                        fontSize: '1.1rem',
                        fontWeight: 'bold',
                        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
                        transition: 'all 0.2s',
                        '&:hover': {
                            boxShadow: '0 6px 12px rgba(0, 0, 0, 0.3)',
                            transform: 'translateY(-2px)'
                        }
                    }}
                    onClick={handleSubmit}
                    disabled={submitting}
                >
                    {submitting ? 'Submitting...' : 'Submit Test'}
                </Button>
            </Paper>
        </Container>
    );
};

export default TestTaking;