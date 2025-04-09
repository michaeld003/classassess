import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Container, Paper, Typography, Box, TextField, Button,
    CircularProgress, Alert, Divider, Card, CardContent,
    RadioGroup, Radio, FormControlLabel, Accordion, AccordionSummary,
    AccordionDetails
} from '@mui/material';
import { ExpandMore } from '@mui/icons-material';
import { testAPI } from '../../services/api';

const LecturerAppealDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [appeal, setAppeal] = useState(null);
    const [decision, setDecision] = useState('REJECTED');
    const [feedback, setFeedback] = useState('');
    const [newScore, setNewScore] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [questionScores, setQuestionScores] = useState({});
    const [fullTest, setFullTest] = useState(null);
    const [studentAnswers, setStudentAnswers] = useState([]);

    useEffect(() => {
        const fetchAppealAndTestData = async () => {
            try {
                setLoading(true);

                // First get the appeal data
                const response = await testAPI.getAppealById(id);
                setAppeal(response);
                if (response.originalScore) {
                    setNewScore(response.originalScore.toString());
                }

                // Initialize question scores if there are questions in the appeal
                if (response.questions && response.questions.length > 0) {
                    const scores = {};
                    response.questions.forEach(q => {
                        scores[q.questionId] = q.questionScore;
                    });
                    setQuestionScores(scores);
                }

                // Also fetch the complete test with all questions, not just appealed ones
                if (response.testId) {
                    try {
                        const testData = await testAPI.getTestWithAllQuestions(response.testId);
                        console.log("Full test data:", testData);
                        setFullTest(testData);

                        // ADDED: Also fetch the student's detailed submission results
                        if (response.submissionId) {
                            try {
                                const detailedResults = await testAPI.getDetailedTestResults(response.submissionId);
                                console.log("Student's detailed results:", detailedResults);
                                setStudentAnswers(detailedResults.answers || []);
                            } catch (detailsErr) {
                                console.error("Error fetching student's detailed results:", detailsErr);
                            }
                        }
                    } catch (testErr) {
                        console.error("Error fetching full test data:", testErr);
                        // Continue even if we can't get the full test
                    }
                }
            } catch (err) {
                setError(err.message || 'Failed to load appeal details');
            } finally {
                setLoading(false);
            }
        };

        fetchAppealAndTestData();
    }, [id]);

    const handleQuestionScoreChange = (questionId, score) => {
        // Find the question to get its maximum points
        const question = appeal.questions.find(q => q.questionId.toString() === questionId.toString());
        const maxPoints = question?.points || 1; // Default to 1 if points not specified

        console.log(`Changing question ${questionId} to score ${score}, max points: ${maxPoints}`);

        // Parse the score and ensure it doesn't exceed maximum
        let parsedScore = parseFloat(score);
        if (parsedScore > maxPoints) {
            parsedScore = maxPoints;
        }

        // Create updated scores object with the new score
        const updatedScores = {
            ...questionScores,
            [questionId]: parsedScore
        };

        console.log("Updated scores:", updatedScores);

        // Use the updated scores directly instead of waiting for state update
        setQuestionScores(updatedScores);

        // If we have the full test data, use it for a more accurate calculation
        if (fullTest && fullTest.questions && fullTest.questions.length > 0) {
            console.log("Using full test data for calculation");

            let totalPoints = 0;
            let earnedPoints = 0;

            // Create a map of appealed question IDs for quick lookup
            const appealedQuestionsMap = {};
            appeal.questions.forEach(q => {
                appealedQuestionsMap[q.questionId] = q;
            });

            // Calculate using ALL questions from the test
            fullTest.questions.forEach(q => {
                const qId = q.id || q.questionId;
                const qMaxPoints = q.points || 1;
                totalPoints += qMaxPoints;

                if (appealedQuestionsMap[qId]) {
                    // This is a question being appealed
                    if (qId === questionId) {
                        // This is the question we're currently changing
                        earnedPoints += parsedScore;
                        console.log(`Appealed Q${qId} (being changed): ${parsedScore}/${qMaxPoints}`);
                    } else {
                        // This is another appealed question
                        const currentScore = updatedScores[qId] || appealedQuestionsMap[qId].questionScore;
                        earnedPoints += currentScore;
                        console.log(`Appealed Q${qId} (not changed): ${currentScore}/${qMaxPoints}`);
                    }
                } else {
                    // This is a question not being appealed - use original score from student answers
                    const studentAnswer = studentAnswers.find(a => a.questionId === qId);
                    const originalScore = studentAnswer ? studentAnswer.score : 0;
                    earnedPoints += originalScore;
                    console.log(`Non-appealed Q${qId}: ${originalScore}/${qMaxPoints}`);
                }
            });

            // Calculate final percentage
            const finalPercentage = (earnedPoints / totalPoints) * 100;
            console.log(`FULL TEST CALCULATION - Total earned: ${earnedPoints}/${totalPoints} = ${finalPercentage.toFixed(2)}%`);

            // Update the display
            setNewScore(finalPercentage.toFixed(2));
        } else {
            // Fall back to just using the appealed questions if we don't have full test data
            console.log("Falling back to appeal questions only for calculation");

            // Original calculation logic for just appealed questions
            if (appeal && appeal.questions && appeal.questions.length > 0) {
                console.log("All appealed questions:", appeal.questions);

                let totalPoints = 0;
                let earnedPoints = 0;

                appeal.questions.forEach(q => {
                    const qId = q.questionId;
                    const qMaxPoints = q.points || 1;
                    totalPoints += qMaxPoints;

                    const qScore = qId === questionId ?
                        parsedScore : // For the question being changed now
                        (updatedScores[qId] || q.questionScore); // For other questions

                    earnedPoints += qScore;

                    console.log(`Question ${qId}: score ${qScore}/${qMaxPoints}`);
                });

                console.log(`FALLBACK CALCULATION - Total earned: ${earnedPoints}/${totalPoints}`);

                const finalPercentage = (earnedPoints / totalPoints) * 100;
                console.log(`Final percentage: ${finalPercentage.toFixed(2)}%`);

                setNewScore(finalPercentage.toFixed(2));
            }
        }
    };


    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!feedback.trim()) {
            setError('Please provide feedback for the student');
            return;
        }

        setSubmitting(true);
        setError(null);

        try {
            const requestData = {
                approved: decision === 'APPROVED',
                status: decision,
                feedback: feedback
            };

            if (decision === 'APPROVED') {
                if (appeal.questions && appeal.questions.length > 0) {
                    // If we have multiple questions, send all the scores
                    requestData.questionScores = questionScores;
                } else if (appeal.questionId) {
                    // If we're adjusting a specific question
                    requestData.questionId = appeal.questionId;
                    requestData.questionScore = questionScores[appeal.questionId] || parseFloat(newScore);
                } else {
                    // Just adjusting the total score
                    requestData.newScore = parseFloat(newScore);
                }
            }

            await testAPI.resolveAppeal(id, requestData);
            setSuccess(true);
        } catch (err) {
            setError(err.message || 'Failed to resolve appeal');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <Container sx={{ mt: 4, textAlign: 'center' }}>
                <CircularProgress />
                <Typography sx={{ mt: 2 }}>Loading appeal details...</Typography>
            </Container>
        );
    }

    if (error && !appeal) {
        return (
            <Container sx={{ mt: 4 }}>
                <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
                <Button variant="contained" onClick={() => navigate('/lecturer/dashboard')}>
                    Back to Dashboard
                </Button>
            </Container>
        );
    }

    return (
        <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
            <Paper elevation={3} sx={{ p: 3 }}>
                <Typography variant="h5" gutterBottom>Review Appeal</Typography>

                {success ? (
                    <Box>
                        <Alert severity="success" sx={{ mb: 3 }}>
                            Appeal has been {decision === 'APPROVED' ? 'approved' : 'rejected'} successfully.
                        </Alert>
                        <Button
                            variant="contained"
                            onClick={() => navigate('/lecturer/dashboard')}
                            fullWidth
                        >
                            Return to Dashboard
                        </Button>
                    </Box>
                ) : (
                    <Box component="form" onSubmit={handleSubmit}>
                        {error && (
                            <Alert severity="error" sx={{ mb: 3 }}>
                                {error}
                            </Alert>
                        )}

                        {appeal && (
                            <>
                                <Card sx={{ mb: 3 }}>
                                    <CardContent>
                                        <Typography variant="subtitle1" gutterBottom>Appeal Details</Typography>
                                        <Typography><strong>Student:</strong> {appeal.student}</Typography>
                                        <Typography><strong>Test:</strong> {appeal.testTitle}</Typography>
                                        <Typography><strong>Original Score:</strong> {appeal.originalScore}</Typography>
                                        <Typography><strong>Submitted:</strong> {appeal.createdAt ? new Date(appeal.createdAt).toLocaleString() : 'N/A'}</Typography>

                                        <Typography variant="subtitle1" sx={{ mt: 2 }}>Appeal Reason:</Typography>
                                        <Paper elevation={0} sx={{ p: 2, bgcolor: '#f5f5f5', mt: 1 }}>
                                            <Typography>{appeal.reason || appeal.appealReason}</Typography>
                                        </Paper>

                                        {/* Display appealed questions */}
                                        {appeal.questions && appeal.questions.length > 0 && (
                                            <>
                                                <Divider sx={{ my: 2 }} />
                                                <Typography variant="subtitle1" gutterBottom>
                                                    Appealed Questions ({appeal.questions.length}):
                                                </Typography>

                                                {appeal.questions.map((question, idx) => (
                                                    <Accordion key={idx} sx={{ mb: 1 }}>
                                                        <AccordionSummary expandIcon={<ExpandMore />}>
                                                            <Typography>
                                                                Question {idx + 1}: {question.questionText.substring(0, 40)}...
                                                            </Typography>
                                                        </AccordionSummary>
                                                        <AccordionDetails>
                                                            <Typography variant="body2">
                                                                <strong>Full Question:</strong> {question.questionText}
                                                            </Typography>
                                                            <Typography variant="body2">
                                                                <strong>Student Answer:</strong> {question.questionAnswer || 'No answer provided'}
                                                            </Typography>
                                                            <Typography variant="body2">
                                                                <strong>Correct Answer:</strong> {question.correctAnswer || 'Not available'}
                                                            </Typography>
                                                            <Typography variant="body2">
                                                                <strong>Current Score:</strong> {question.questionScore}
                                                            </Typography>
                                                        </AccordionDetails>
                                                    </Accordion>
                                                ))}
                                            </>
                                        )}

                                        {/* Single question case (backwards compatibility) */}
                                        {appeal.questionId && !appeal.questions && (
                                            <>
                                                <Divider sx={{ my: 2 }} />
                                                <Typography variant="subtitle1">Question Details</Typography>
                                                <Typography><strong>Question:</strong> {appeal.questionText}</Typography>
                                                <Typography><strong>Student's Answer:</strong> {appeal.questionAnswer}</Typography>
                                                <Typography><strong>Correct Answer:</strong> {appeal.correctAnswer}</Typography>
                                                <Typography><strong>Question Score:</strong> {appeal.questionScore} points</Typography>
                                                <Typography><strong>Question Type:</strong> {appeal.questionType}</Typography>
                                            </>
                                        )}
                                    </CardContent>
                                </Card>

                                <Typography variant="subtitle1" gutterBottom>Your Decision</Typography>
                                <RadioGroup
                                    value={decision}
                                    onChange={(e) => setDecision(e.target.value)}
                                    sx={{ mb: 2 }}
                                >
                                    <FormControlLabel value="REJECTED" control={<Radio />} label="Reject Appeal" />
                                    <FormControlLabel value="APPROVED" control={<Radio />} label="Approve Appeal" />
                                </RadioGroup>

                                {decision === 'APPROVED' && (
                                    <>
                                        {/* Multiple questions case */}
                                        {appeal.questions && appeal.questions.length > 0 && (
                                            <Box sx={{ mb: 3 }}>
                                                <Typography variant="subtitle2" gutterBottom>
                                                    Adjust scores for individual questions:
                                                </Typography>
                                                {appeal.questions.map((question, idx) => (
                                                    <Box key={idx} sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                                                        <Typography variant="body2" sx={{ flexGrow: 1 }}>
                                                            Q{idx + 1}: {question.questionText.substring(0, 30)}...
                                                        </Typography>
                                                        <TextField
                                                            label="Score"
                                                            type="number"
                                                            size="small"
                                                            value={questionScores[question.questionId] || ''}
                                                            onChange={(e) => handleQuestionScoreChange(question.questionId, e.target.value)}
                                                            sx={{ width: '120px' }}
                                                            inputProps={{
                                                                min: 0,
                                                                step: 0.1,
                                                                max: question.points || 1 // Use the points field instead of hardcoded value
                                                            }}
                                                            helperText={`Max: ${question.points || 1}`}
                                                        />
                                                    </Box>
                                                ))}
                                            </Box>
                                        )}

                                        {/* Single question case */}
                                        {appeal.questionId && !appeal.questions && (
                                            <TextField
                                                label="Adjusted Question Score"
                                                type="number"
                                                value={questionScores[appeal.questionId] || ''}
                                                onChange={(e) => handleQuestionScoreChange(appeal.questionId, e.target.value)}
                                                fullWidth
                                                margin="normal"
                                                required={decision === 'APPROVED'}
                                                inputProps={{
                                                    min: 0,
                                                    max: appeal.points || 1, // Use the points field instead of questionType check
                                                    step: 0.1
                                                }}
                                                sx={{ mb: 2 }}
                                                helperText={`Adjust the score for this specific question (Max: ${appeal.points || 1})`}
                                            />
                                        )}

                                        <TextField
                                            label="New Total Score"
                                            type="number"
                                            value={newScore}
                                            onChange={(e) => setNewScore(e.target.value)}
                                            fullWidth
                                            margin="normal"
                                            required={decision === 'APPROVED'}
                                            inputProps={{ min: 0, max: 100, step: 0.01 }}
                                            sx={{ mb: 2 }}
                                            helperText="This is automatically calculated based on the question score adjustments"
                                            disabled={appeal.questions && appeal.questions.length > 0 || appeal.questionId !== undefined}
                                        />
                                    </>
                                )}

                                <TextField
                                    label="Feedback to Student"
                                    multiline
                                    rows={4}
                                    value={feedback}
                                    onChange={(e) => setFeedback(e.target.value)}
                                    fullWidth
                                    required
                                    disabled={submitting}
                                    sx={{ mb: 3 }}
                                    placeholder="Provide your feedback on this appeal..."
                                />

                                <Box sx={{ display: 'flex', gap: 2 }}>
                                    <Button
                                        variant="outlined"
                                        onClick={() => navigate('/lecturer/dashboard')}
                                        disabled={submitting}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        variant="contained"
                                        disabled={!feedback.trim() || submitting || (decision === 'APPROVED' && !newScore)}
                                        sx={{ ml: 'auto' }}
                                    >
                                        {submitting ? <CircularProgress size={24} /> : 'Submit Decision'}
                                    </Button>
                                </Box>
                            </>
                        )}
                    </Box>
                )}
            </Paper>
        </Container>
    );
};

export default LecturerAppealDetail;