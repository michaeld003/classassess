import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Container, Paper, Typography, Box, TextField, Button,
    CircularProgress, Alert, Divider, FormControl, InputLabel,
    Select, MenuItem, Card, CardContent, Checkbox, FormControlLabel
} from '@mui/material';
import { testAPI } from '../../services/api';

const StudentAppeal = () => {
    const { id } = useParams(); // This is the submission ID
    const navigate = useNavigate();
    const [reason, setReason] = useState('');
    const [selectedQuestions, setSelectedQuestions] = useState([]);
    const [testResults, setTestResults] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    // Fetch the test results to get questions and answers
    useEffect(() => {
        const fetchTestResults = async () => {
            try {
                const response = await testAPI.getDetailedTestResults(id);
                console.log("Detailed test results structure:", JSON.stringify(response));
                if (response.error) {
                    setError(response.message || 'Failed to load test details');
                } else {
                    setTestResults(response);
                }
            } catch (err) {
                setError('Failed to load test details: ' + (err.message || ''));
            } finally {
                setLoading(false);
            }
        };

        fetchTestResults();
    }, [id]);

    const handleQuestionSelect = (questionId) => {
        if (selectedQuestions.includes(questionId)) {
            setSelectedQuestions(prev => prev.filter(id => id !== questionId));
        } else {
            setSelectedQuestions(prev => [...prev, questionId]);
        }
    };

    const handleSelectAll = () => {
        if (selectedQuestions.length === testResults.answers.length) {
            setSelectedQuestions([]);
        } else {
            setSelectedQuestions(testResults.answers.map(a => a.questionId.toString()));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!reason.trim()) {
            setError('Please provide a reason for your appeal');
            return;
        }

        if (selectedQuestions.length === 0) {
            setError('Please select at least one question to appeal');
            return;
        }

        setSubmitting(true);
        setError(null);

        try {
            const appealData = {
                reason: reason,
                questions: selectedQuestions.map(questionId => {
                    const answer = testResults?.answers?.find(a => a.questionId.toString() === questionId);
                    return {
                        questionId: questionId,
                        questionAnswer: answer?.studentAnswer || '',
                        reason: reason // Using the same reason for all questions
                    };
                })
            };

            await testAPI.submitAppeal(id, appealData);
            setSuccess(true);
            // Reset form
            setReason('');
            setSelectedQuestions([]);
        } catch (err) {
            setError(err.message || 'Failed to submit appeal');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <Container sx={{ mt: 4, textAlign: 'center' }}>
                <CircularProgress />
                <Typography sx={{ mt: 2 }}>Loading test details...</Typography>
            </Container>
        );
    }

    return (
        <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
            <Paper elevation={3} sx={{ p: 3 }}>
                <Typography variant="h5" gutterBottom>Submit Test Appeal</Typography>

                {success ? (
                    <Box>
                        <Alert severity="success" sx={{ mb: 3 }}>
                            Your appeal has been submitted successfully. Your instructor will review it and provide feedback.
                        </Alert>
                        <Button
                            variant="contained"
                            onClick={() => navigate(`/student/results/${id}`)}
                            fullWidth
                        >
                            Return to Test Results
                        </Button>
                    </Box>
                ) : (
                    <Box component="form" onSubmit={handleSubmit}>
                        {error && (
                            <Alert severity="error" sx={{ mb: 3 }}>
                                {error}
                            </Alert>
                        )}

                        <Typography variant="body1" paragraph>
                            If you believe your test was incorrectly graded, you can submit an appeal to your instructor.
                            Please select the specific questions you want to appeal and provide a detailed explanation.
                        </Typography>

                        <Divider sx={{ mb: 3 }} />

                        {testResults && testResults.answers && testResults.answers.length > 0 && (
                            <Box sx={{ mb: 3 }}>
                                <Typography variant="subtitle1" gutterBottom>
                                    Select Questions to Appeal
                                </Typography>

                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            checked={selectedQuestions.length === testResults.answers.length}
                                            onChange={handleSelectAll}
                                        />
                                    }
                                    label="Select All Questions"
                                />

                                <Box sx={{ ml: 3, mt: 1 }}>
                                    {testResults.answers.map((answer, index) => (
                                        <FormControlLabel
                                            key={answer.questionId}
                                            control={
                                                <Checkbox
                                                    checked={selectedQuestions.includes(answer.questionId.toString())}
                                                    onChange={() => handleQuestionSelect(answer.questionId.toString())}
                                                />
                                            }
                                            label={`Question ${index + 1}: ${answer.questionText.substring(0, 30)}...`}
                                        />
                                    ))}
                                </Box>
                            </Box>
                        )}

                        {selectedQuestions.length > 0 && testResults && (
                            <Card sx={{ mb: 3 }}>
                                <CardContent>
                                    <Typography variant="subtitle1" gutterBottom>Selected Questions Details</Typography>
                                    {testResults.answers
                                        .filter(a => selectedQuestions.includes(a.questionId.toString()))
                                        .map((answer, index) => (
                                            <Box key={index} sx={{ mb: 2, pb: 2, borderBottom: index < selectedQuestions.length - 1 ? '1px solid #eee' : 'none' }}>
                                                <Typography><strong>Question {index + 1}:</strong> {answer.questionText}</Typography>
                                                <Typography><strong>Your Answer:</strong> {answer.studentAnswer || 'No answer provided'}</Typography>
                                                <Typography><strong>Correct Answer:</strong> {answer.correctAnswer}</Typography>
                                                <Typography><strong>Score Received:</strong> {answer.score} / {answer.points}</Typography>
                                                {answer.feedback && (
                                                    <Typography><strong>Feedback:</strong> {answer.feedback}</Typography>
                                                )}
                                            </Box>
                                        ))
                                    }
                                </CardContent>
                            </Card>
                        )}

                        <TextField
                            label="Reason for Appeal"
                            multiline
                            rows={6}
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            fullWidth
                            required
                            disabled={submitting}
                            sx={{ mb: 3 }}
                            placeholder="Explain why you believe these questions were incorrectly graded..."
                        />

                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <Button
                                variant="outlined"
                                onClick={() => navigate(`/student/results/${id}`)}
                                disabled={submitting}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                variant="contained"
                                disabled={!reason.trim() || selectedQuestions.length === 0 || submitting}
                                sx={{ ml: 'auto' }}
                            >
                                {submitting ? <CircularProgress size={24} /> : 'Submit Appeal'}
                            </Button>
                        </Box>
                    </Box>
                )}
            </Paper>
        </Container>
    );
};

export default StudentAppeal;