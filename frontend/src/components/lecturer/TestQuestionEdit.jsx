import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Container,
    Typography,
    Box,
    Button,
    Paper,
    TextField,
    MenuItem,
    Grid,
    IconButton,
    FormControl,
    InputLabel,
    Select,
    FormControlLabel,
    Radio,
    RadioGroup,
    Alert,
    Snackbar,
    Divider,
    List,
    ListItem,
    CircularProgress
} from '@mui/material';
import {
    Add as AddIcon,
    Delete as DeleteIcon,
    Save as SaveIcon,
    ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { testAPI, handleApiError } from '../../services/api';

const TestQuestionEdit = () => {
    const { testId } = useParams();
    const navigate = useNavigate();

    const [test, setTest] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [saving, setSaving] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    // Load test data and questions
    useEffect(() => {
        const fetchTestData = async () => {
            try {
                setLoading(true);

                // Get test details
                const testData = await testAPI.getById(testId);
                setTest(testData);

                // Get questions (either from the test or from a dedicated endpoint)
                if (testData.questions) {
                    setQuestions(testData.questions);
                } else {
                    const questionsData = await testAPI.getTestQuestions(testId);
                    setQuestions(questionsData);
                }

                setLoading(false);
            } catch (err) {
                console.error('Error fetching test data:', err);
                setError(handleApiError(err));
                setLoading(false);
            }
        };

        fetchTestData();
    }, [testId]);

    // Add a new question
    const addQuestion = () => {
        const newQuestion = {
            questionText: '',
            questionType: 'MCQ',
            points: 1,
            options: [
                { optionText: '', isCorrect: true },
                { optionText: '', isCorrect: false },
                { optionText: '', isCorrect: false },
                { optionText: '', isCorrect: false }
            ]
        };

        setQuestions([...questions, newQuestion]);
    };

    // Add option to MCQ question
    const addOption = (questionIndex) => {
        const updatedQuestions = [...questions];
        updatedQuestions[questionIndex].options.push({
            optionText: '',
            isCorrect: false
        });
        setQuestions(updatedQuestions);
    };

    // Update question field
    const updateQuestion = (index, field, value) => {
        const updatedQuestions = [...questions];
        updatedQuestions[index][field] = value;

        // If changing question type, handle option changes
        if (field === 'questionType') {
            if (value === 'MCQ') {
                // Ensure MCQ has options
                if (!updatedQuestions[index].options || updatedQuestions[index].options.length === 0) {
                    updatedQuestions[index].options = [
                        { optionText: '', isCorrect: true },
                        { optionText: '', isCorrect: false },
                        { optionText: '', isCorrect: false },
                        { optionText: '', isCorrect: false }
                    ];
                }
            } else {
                // Clear options for non-MCQ questions
                updatedQuestions[index].options = [];
                // Add correctAnswer field for SHORT_ANSWER and WRITTEN
                if (!updatedQuestions[index].correctAnswer) {
                    updatedQuestions[index].correctAnswer = '';
                }
            }
        }

        setQuestions(updatedQuestions);
    };

    // Update option field
    const updateOption = (questionIndex, optionIndex, field, value) => {
        const updatedQuestions = [...questions];
        updatedQuestions[questionIndex].options[optionIndex][field] = value;

        // If setting this option as correct, set others as incorrect
        if (field === 'isCorrect' && value === true) {
            updatedQuestions[questionIndex].options.forEach((option, i) => {
                if (i !== optionIndex) {
                    option.isCorrect = false;
                }
            });
        }

        setQuestions(updatedQuestions);
    };

    // Delete question
    const deleteQuestion = (index) => {
        const updatedQuestions = [...questions];
        updatedQuestions.splice(index, 1);
        setQuestions(updatedQuestions);
    };

    // Delete option
    const deleteOption = (questionIndex, optionIndex) => {
        const updatedQuestions = [...questions];
        updatedQuestions[questionIndex].options.splice(optionIndex, 1);

        // Ensure at least one option is marked as correct
        if (updatedQuestions[questionIndex].options.length > 0 &&
            !updatedQuestions[questionIndex].options.some(opt => opt.isCorrect)) {
            updatedQuestions[questionIndex].options[0].isCorrect = true;
        }

        setQuestions(updatedQuestions);
    };

    // Save changes
    const saveChanges = async () => {
        try {
            setSaving(true);

            // Validate questions before saving
            const isValid = validateQuestions();
            if (!isValid) {
                setSaving(false);
                return;
            }

            // Update questions via API
            await testAPI.updateTestQuestions(testId, questions);

            setSuccessMessage('Questions updated successfully');
            setSaving(false);

            // Navigate back after short delay
            setTimeout(() => {
                navigate(`/lecturer/modules/${test.moduleId}/tests/${testId}`);
            }, 1500);
        } catch (err) {
            console.error('Error saving questions:', err);
            setError(handleApiError(err));
            setSaving(false);
        }
    };

    // Validate questions before saving
    const validateQuestions = () => {
        // Check if there are any questions
        if (questions.length === 0) {
            setError('Test must have at least one question');
            return false;
        }

        // Check each question
        for (let i = 0; i < questions.length; i++) {
            const question = questions[i];

            // Question text is required
            if (!question.questionText || question.questionText.trim() === '') {
                setError(`Question #${i + 1} must have text`);
                return false;
            }

            // MCQ questions must have options
            if (question.questionType === 'MCQ') {
                if (!question.options || question.options.length < 2) {
                    setError(`MCQ Question #${i + 1} must have at least 2 options`);
                    return false;
                }

                // Each option must have text
                for (let j = 0; j < question.options.length; j++) {
                    if (!question.options[j].optionText || question.options[j].optionText.trim() === '') {
                        setError(`Option #${j + 1} for Question #${i + 1} must have text`);
                        return false;
                    }
                }

                // MCQ must have one correct answer
                if (!question.options.some(opt => opt.isCorrect)) {
                    setError(`Question #${i + 1} must have at least one correct answer`);
                    return false;
                }
            }

            // Written and Short Answer questions must have a correct answer
            if ((question.questionType === 'WRITTEN' || question.questionType === 'SHORT_ANSWER') &&
                (!question.correctAnswer || question.correctAnswer.trim() === '')) {
                setError(`Question #${i + 1} must have a model answer`);
                return false;
            }
        }

        return true;
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Paper elevation={3} sx={{ p: 3 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                    <Typography variant="h5" sx={{ fontWeight: 600 }}>
                        Edit Test Questions
                    </Typography>
                    <Button
                        variant="outlined"
                        startIcon={<ArrowBackIcon />}
                        onClick={() => navigate(`/lecturer/modules/${test.moduleId}/tests/${testId}`)}
                    >
                        Back to Test
                    </Button>
                </Box>

                {error && (
                    <Alert severity="error" sx={{ mb: 3 }}>
                        {error}
                    </Alert>
                )}

                <Box mb={3}>
                    <Typography variant="h6" gutterBottom>
                        {test?.title}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                        Module: {test?.moduleCode}
                    </Typography>
                </Box>

                <Divider sx={{ mb: 3 }} />

                <List>
                    {questions.map((question, qIndex) => (
                        <ListItem
                            key={qIndex}
                            alignItems="flex-start"
                            sx={{
                                flexDirection: 'column',
                                border: '1px solid #e0e0e0',
                                borderRadius: 1,
                                mb: 3,
                                p: 2
                            }}
                        >
                            <Box width="100%" mb={2}>
                                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                                    <Typography variant="subtitle1" fontWeight="medium">
                                        Question {qIndex + 1}
                                    </Typography>
                                    <IconButton
                                        color="error"
                                        onClick={() => deleteQuestion(qIndex)}
                                    >
                                        <DeleteIcon />
                                    </IconButton>
                                </Box>

                                <Grid container spacing={2}>
                                    <Grid item xs={12}>
                                        <TextField
                                            fullWidth
                                            label="Question Text"
                                            value={question.questionText}
                                            onChange={(e) => updateQuestion(qIndex, 'questionText', e.target.value)}
                                            multiline
                                            rows={2}
                                            required
                                        />
                                    </Grid>

                                    <Grid item xs={12} sm={6}>
                                        <FormControl fullWidth>
                                            <InputLabel>Question Type</InputLabel>
                                            <Select
                                                value={question.questionType}
                                                onChange={(e) => updateQuestion(qIndex, 'questionType', e.target.value)}
                                                label="Question Type"
                                            >
                                                <MenuItem value="MCQ">Multiple Choice</MenuItem>
                                                <MenuItem value="SHORT_ANSWER">Short Answer</MenuItem>
                                                <MenuItem value="WRITTEN">Written</MenuItem>
                                            </Select>
                                        </FormControl>
                                    </Grid>

                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            fullWidth
                                            label="Points"
                                            type="number"
                                            value={question.points}
                                            onChange={(e) => updateQuestion(qIndex, 'points', parseInt(e.target.value))}
                                            InputProps={{ inputProps: { min: 1 } }}
                                        />
                                    </Grid>
                                </Grid>
                            </Box>

                            {/* MCQ Options */}
                            {question.questionType === 'MCQ' && (
                                <Box width="100%" ml={2}>
                                    <Typography variant="subtitle2" gutterBottom>
                                        Options
                                    </Typography>

                                    {question.options && question.options.map((option, oIndex) => (
                                        <Box
                                            key={oIndex}
                                            display="flex"
                                            alignItems="center"
                                            mb={1}
                                        >
                                            <RadioGroup
                                                value={option.isCorrect ? 'true' : 'false'}
                                                onChange={(e) => updateOption(
                                                    qIndex,
                                                    oIndex,
                                                    'isCorrect',
                                                    e.target.value === 'true'
                                                )}
                                            >
                                                <FormControlLabel
                                                    value="true"
                                                    control={<Radio />}
                                                    label=""
                                                />
                                            </RadioGroup>

                                            <TextField
                                                fullWidth
                                                label={`Option ${oIndex + 1}`}
                                                value={option.optionText}
                                                onChange={(e) => updateOption(
                                                    qIndex,
                                                    oIndex,
                                                    'optionText',
                                                    e.target.value
                                                )}
                                                variant="outlined"
                                                size="small"
                                                sx={{ mr: 1 }}
                                            />

                                            <IconButton
                                                size="small"
                                                color="error"
                                                onClick={() => deleteOption(qIndex, oIndex)}
                                                disabled={question.options.length <= 2}
                                            >
                                                <DeleteIcon />
                                            </IconButton>
                                        </Box>
                                    ))}

                                    <Button
                                        startIcon={<AddIcon />}
                                        onClick={() => addOption(qIndex)}
                                        sx={{ mt: 1 }}
                                    >
                                        Add Option
                                    </Button>
                                </Box>
                            )}

                            {/* Correct answer for non-MCQ questions */}
                            {(question.questionType === 'SHORT_ANSWER' || question.questionType === 'WRITTEN') && (
                                <Box width="100%" mt={2}>
                                    <TextField
                                        fullWidth
                                        label="Model Answer"
                                        value={question.correctAnswer || ''}
                                        onChange={(e) => updateQuestion(qIndex, 'correctAnswer', e.target.value)}
                                        multiline
                                        rows={3}
                                    />
                                </Box>
                            )}
                        </ListItem>
                    ))}
                </List>

                <Box display="flex" justifyContent="space-between" mt={3}>
                    <Button
                        variant="outlined"
                        startIcon={<AddIcon />}
                        onClick={addQuestion}
                    >
                        Add Question
                    </Button>

                    <Button
                        variant="contained"
                        startIcon={<SaveIcon />}
                        onClick={saveChanges}
                        disabled={saving}
                    >
                        {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                </Box>
            </Paper>

            <Snackbar
                open={!!successMessage}
                autoHideDuration={3000}
                onClose={() => setSuccessMessage('')}
                message={successMessage}
            />
        </Container>
    );
};

export default TestQuestionEdit;