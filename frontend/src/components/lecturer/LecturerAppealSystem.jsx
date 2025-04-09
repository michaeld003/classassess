import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Card, CardContent, Chip, Button,
    Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, CircularProgress, Alert, Accordion, AccordionSummary,
    AccordionDetails, Divider
} from '@mui/material';
import { CheckCircle, Cancel, ExpandMore } from '@mui/icons-material';
import { testAPI, handleApiError } from '../../services/api';

const LecturerAppealSystem = () => {
    const [appeals, setAppeals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedAppeal, setSelectedAppeal] = useState(null);
    const [selectedQuestionId, setSelectedQuestionId] = useState(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [newScore, setNewScore] = useState('');
    const [feedback, setFeedback] = useState('');
    const [actionLoading, setActionLoading] = useState(false);
    const [questionScores, setQuestionScores] = useState({});

    useEffect(() => {
        fetchAppeals();
    }, []);

    const fetchAppeals = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await testAPI.getLecturerAppeals();
            setAppeals(response.data);
        } catch (err) {
            console.error('Error fetching appeals:', err);
            setError(handleApiError(err));
        } finally {
            setLoading(false);
        }
    };

    const handleOpenDialog = (appeal, isApprove, questionId = null) => {
        setSelectedAppeal({ ...appeal, action: isApprove ? 'APPROVE' : 'REJECT' });
        setSelectedQuestionId(questionId);
        setQuestionScores({});

        if (questionId) {
            // For specific question
            const question = appeal.questions.find(q => q.questionId.toString() === questionId.toString());
            setNewScore(isApprove ? '' : question.questionScore.toString());
        } else {
            // For entire appeal
            setNewScore(isApprove ? appeal.requestedScore || '' : appeal.originalScore.toString());

            // Pre-populate question scores with current values
            if (appeal.questions && appeal.questions.length > 0) {
                const scores = {};
                appeal.questions.forEach(q => {
                    scores[q.questionId] = q.questionScore;
                });
                setQuestionScores(scores);
            }
        }

        setFeedback('');
        setDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setDialogOpen(false);
        setSelectedAppeal(null);
        setSelectedQuestionId(null);
        setQuestionScores({});
    };

    const handleQuestionScoreChange = (questionId, score) => {
        setQuestionScores(prev => ({
            ...prev,
            [questionId]: parseFloat(score)
        }));
    };

    const handleSubmitDecision = async () => {
        if (!selectedAppeal) return;

        try {
            setActionLoading(true);

            const resolutionData = {
                status: selectedAppeal.action,
                feedback: feedback
            };

            if (selectedQuestionId) {
                // If resolving a specific question
                resolutionData.questionId = selectedQuestionId;
                resolutionData.questionScore = selectedAppeal.action === 'APPROVE'
                    ? parseFloat(newScore)
                    : null; // Use original score
            } else if (selectedAppeal.action === 'APPROVE' && Object.keys(questionScores).length > 0) {
                // If approving multiple questions with specific scores
                resolutionData.questionScores = questionScores;
            } else {
                // If resolving the entire appeal with a single score
                resolutionData.newScore = selectedAppeal.action === 'APPROVE'
                    ? parseFloat(newScore)
                    : selectedAppeal.originalScore;
            }

            await testAPI.resolveAppeal(selectedAppeal.id, resolutionData);

            // Update local state
            setAppeals(prevAppeals =>
                prevAppeals.map(appeal =>
                    appeal.id === selectedAppeal.id
                        ? {
                            ...appeal,
                            status: selectedAppeal.action === 'APPROVE' ? 'APPROVED' : 'REJECTED',
                            currentScore: selectedAppeal.action === 'APPROVE' ? parseFloat(newScore) : appeal.originalScore,
                            feedback: feedback
                        }
                        : appeal
                )
            );

            handleCloseDialog();
        } catch (err) {
            console.error('Error resolving appeal:', err);
            setError(handleApiError(err));
        } finally {
            setActionLoading(false);
        }
    };

    const getStatusColor = (status) => {
        const colors = {
            PENDING: 'warning',
            REVIEWING: 'info',
            APPROVED: 'success',
            REJECTED: 'error'
        };
        return colors[status] || 'default';
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Box p={2}>
                <Alert severity="error">{error}</Alert>
                <Button variant="contained" onClick={fetchAppeals} sx={{ mt: 2 }}>
                    Retry
                </Button>
            </Box>
        );
    }

    return (
        <Box>
            <Typography variant="h6" gutterBottom>Grade Appeals</Typography>

            {appeals.length === 0 ? (
                <Alert severity="info">No appeals to review at this time.</Alert>
            ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {appeals.map((appeal) => (
                        <Card key={appeal.id}>
                            <CardContent>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                    <Typography variant="subtitle1">Appeal #{appeal.id}</Typography>
                                    <Chip
                                        label={appeal.status}
                                        color={getStatusColor(appeal.status)}
                                        size="small"
                                    />
                                </Box>

                                <Typography variant="body1">Student: {appeal.student}</Typography>
                                <Typography color="text.secondary" sx={{ mb: 1 }}>
                                    Test: {appeal.testTitle}
                                </Typography>

                                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                                    <Typography variant="body2">
                                        Original Score: {appeal.originalScore}
                                    </Typography>
                                    {appeal.requestedScore && (
                                        <Typography variant="body2">
                                            Requested Score: {appeal.requestedScore}
                                        </Typography>
                                    )}
                                </Box>

                                <Typography variant="body2" sx={{ mb: 2 }}>
                                    Overall Reason: {appeal.reason}
                                </Typography>

                                {/* Display appealed questions */}
                                {appeal.questions && appeal.questions.length > 0 && (
                                    <Box sx={{ mb: 2 }}>
                                        <Typography variant="subtitle2" gutterBottom>
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

                                                    {appeal.status === 'PENDING' && (
                                                        <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                                                            <Button
                                                                variant="outlined"
                                                                color="success"
                                                                size="small"
                                                                onClick={() => handleOpenDialog(appeal, true, question.questionId)}
                                                            >
                                                                Approve This Question
                                                            </Button>
                                                            <Button
                                                                variant="outlined"
                                                                color="error"
                                                                size="small"
                                                                onClick={() => handleOpenDialog(appeal, false, question.questionId)}
                                                            >
                                                                Reject This Question
                                                            </Button>
                                                        </Box>
                                                    )}
                                                </AccordionDetails>
                                            </Accordion>
                                        ))}
                                    </Box>
                                )}

                                {appeal.status === 'PENDING' && (
                                    <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                                        <Button
                                            variant="contained"
                                            color="success"
                                            startIcon={<CheckCircle />}
                                            onClick={() => handleOpenDialog(appeal, true)}
                                        >
                                            Approve All
                                        </Button>
                                        <Button
                                            variant="contained"
                                            color="error"
                                            startIcon={<Cancel />}
                                            onClick={() => handleOpenDialog(appeal, false)}
                                        >
                                            Reject All
                                        </Button>
                                    </Box>
                                )}

                                {appeal.status !== 'PENDING' && appeal.feedback && (
                                    <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic' }}>
                                        Feedback: {appeal.feedback}
                                    </Typography>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </Box>
            )}

            {/* Decision Dialog */}
            <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
                <DialogTitle>
                    {selectedQuestionId
                        ? `${selectedAppeal?.action === 'APPROVE' ? 'Approve' : 'Reject'} Question Appeal`
                        : `${selectedAppeal?.action === 'APPROVE' ? 'Approve' : 'Reject'} Entire Appeal`}
                </DialogTitle>
                <DialogContent>
                    {selectedAppeal?.action === 'APPROVE' && selectedQuestionId && (
                        <TextField
                            label="New Question Score"
                            type="number"
                            value={newScore}
                            onChange={(e) => setNewScore(e.target.value)}
                            fullWidth
                            margin="normal"
                            inputProps={{ min: 0, max: 100, step: 0.1 }}
                        />
                    )}

                    {selectedAppeal?.action === 'APPROVE' && !selectedQuestionId && (
                        <>
                            <TextField
                                label="New Overall Score"
                                type="number"
                                value={newScore}
                                onChange={(e) => setNewScore(e.target.value)}
                                fullWidth
                                margin="normal"
                                inputProps={{ min: 0, max: 100, step: 0.1 }}
                            />

                            {selectedAppeal?.questions && selectedAppeal.questions.length > 0 && (
                                <Box sx={{ mt: 2 }}>
                                    <Typography variant="subtitle2" gutterBottom>
                                        Adjust scores for individual questions:
                                    </Typography>
                                    {selectedAppeal.questions.map((question, idx) => (
                                        <Box key={idx} sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
                                            <Typography variant="body2" sx={{ flexGrow: 1 }}>
                                                Q{idx + 1}: {question.questionText.substring(0, 30)}...
                                            </Typography>
                                            <TextField
                                                label="Score"
                                                type="number"
                                                size="small"
                                                defaultValue={question.questionScore}
                                                onChange={(e) => handleQuestionScoreChange(question.questionId, e.target.value)}
                                                sx={{ width: '100px' }}
                                                inputProps={{ min: 0, step: 0.1 }}
                                            />
                                        </Box>
                                    ))}
                                </Box>
                            )}
                        </>
                    )}

                    <TextField
                        label="Feedback for Student"
                        multiline
                        rows={4}
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        fullWidth
                        margin="normal"
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Cancel</Button>
                    <Button
                        onClick={handleSubmitDecision}
                        variant="contained"
                        color={selectedAppeal?.action === 'APPROVE' ? 'success' : 'error'}
                        disabled={actionLoading || (selectedAppeal?.action === 'APPROVE' && selectedQuestionId && !newScore)}
                    >
                        {actionLoading ? <CircularProgress size={24} /> : 'Confirm'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default LecturerAppealSystem;