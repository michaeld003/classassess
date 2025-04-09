import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useParams } from 'react-router-dom';
import { testAPI } from '../../services/api';
import {
    Container,
    Paper,
    Typography,
    TextField,
    Button,
    Box,
    Stepper,
    Step,
    StepLabel,
    Card,
    CardContent,
    Radio,
    RadioGroup,
    FormControlLabel,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Divider,
    IconButton,
    Chip,
    Alert,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Grid,
    CircularProgress
} from '@mui/material';
import { LoadingButton } from '@mui/lab';

import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import SaveIcon from '@mui/icons-material/Save';
import QuizIcon from '@mui/icons-material/Quiz';
import { generateQuestions } from '../../services/ai';
import { getAllModules, createTest } from '../../services/module';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';

const TestCreation = ({ editMode = false }) => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [deletedQuestionIds, setDeletedQuestionIds] = useState([]);
    const [isLoading, setIsLoading] = useState(editMode);
    const [activeStep, setActiveStep] = useState(0);
    const [testDetails, setTestDetails] = useState({
        title: '',
        duration: 45,
        moduleId: '',
        description: '',
        startTime: new Date(new Date().getTime() + 24 * 60 * 60 * 1000), // Default to tomorrow
        endTime: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000), // Default to 1 week from now
    });
    const [questions, setQuestions] = useState([]);
    const [currentQuestion, setCurrentQuestion] = useState({
        type: 'mcq',
        question: '',
        options: ['', '', '', ''],
        correctAnswer: '',
        points: 1
    });
    const [showAIDialog, setShowAIDialog] = useState(false);
    const [aiConfig, setAiConfig] = useState({
        prompt: '',
        type: 'mcq',
        count: 1,
        difficulty: 'intermediate'
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [modules, setModules] = useState([]);
    const [loadingModules, setLoadingModules] = useState(false);

    const steps = ['Test Details', 'Add Questions', 'Review & Settings'];
    // Helper function to format dates for datetime-local input
    const formatDateTimeForInput = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');

        return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    // Fetch modules on component mount
    useEffect(() => {
        const fetchModules = async () => {
            setLoadingModules(true);
            try {
                const data = await getAllModules();
                setModules(data);
            } catch (error) {
                console.error('Error fetching modules:', error);
                setError('Failed to load modules. Please try again.');
            } finally {
                setLoadingModules(false);
            }
        };

        fetchModules();
    }, []);


    useEffect(() => {
        if (editMode && id) {
            const loadTest = async () => {
                try {
                    setIsLoading(true);
                    setError(null);

                    // Fetch the test details
                    const testData = await testAPI.getById(id);

                    // Update the test details state
                    setTestDetails({
                        title: testData.title || '',
                        duration: testData.durationMinutes || 45,
                        moduleId: testData.moduleId || '',
                        description: testData.description || '',
                        startTime: testData.startTime ? new Date(testData.startTime) : new Date(),
                        endTime: testData.endTime ? new Date(testData.endTime) : new Date(),
                    });

                    // Format and set questions
                    if (testData.questions && testData.questions.length > 0) {
                        const formattedQuestions = testData.questions.map(q => ({
                            id: q.id,
                            type: q.questionType === 'MCQ' ? 'mcq' : q.questionType === 'WRITTEN' ? 'written' : 'mcq',
                            question: q.questionText,
                            correctAnswer: q.correctAnswer || (q.options ?
                                q.options.find(opt => opt.isCorrect)?.optionText || '' : ''),
                            points: q.points || 1,
                            options: q.questionType === 'MCQ' && q.options ?
                                q.options.map(opt => opt.optionText) : ['', '', '', '']
                        }));

                        setQuestions(formattedQuestions);
                    }

                    setIsLoading(false);
                } catch (error) {
                    console.error('Error loading test:', error);
                    setError('Failed to load test data. Please try again.');
                    setIsLoading(false);
                }
            };

            loadTest();
        }
    }, [editMode, id]);

    const handleNext = () => {
        // Check if on the first step (test details)
        if (activeStep === 0) {
            let hasError = false;
            let errorMessage = "";

            // Check required fields
            if (!testDetails.title) {
                hasError = true;
                errorMessage = "Test title is required";
            } else if (!testDetails.moduleId) {
                hasError = true;
                errorMessage = "Module selection is required";
            } else if (!testDetails.duration || testDetails.duration <= 0) {
                hasError = true;
                errorMessage = "Valid duration is required";
            }

            // Validate dates
            const now = new Date();
            if (testDetails.startTime < now) {
                hasError = true;
                errorMessage = "Start time must be in the future";
            } else if (testDetails.endTime <= testDetails.startTime) {
                hasError = true;
                errorMessage = "End time must be after start time";
            }

            if (hasError) {
                setError(errorMessage);
                return;
            }
        }

        // Clear any errors and proceed
        setError(null);
        setActiveStep((prev) => prev + 1);
    };
    const updateEndTimeBasedOnDuration = () => {
        const startDateTime = new Date(testDetails.startTime);
        const endDateTime = new Date(startDateTime.getTime() + testDetails.duration * 60000);
        setTestDetails({
            ...testDetails,
            endTime: endDateTime
        });
    };

    const handleBack = () => {
        setActiveStep((prev) => prev - 1);
    };


    const moveQuestionUp = (index) => {
        if (index === 0) return; // Can't move up if it's the first question
        const updatedQuestions = [...questions];
        // Swap with the question above
        [updatedQuestions[index], updatedQuestions[index - 1]] =
            [updatedQuestions[index - 1], updatedQuestions[index]];
        setQuestions(updatedQuestions);
    };

    const moveQuestionDown = (index) => {
        if (index === questions.length - 1) return; // Can't move down if it's the last question
        const updatedQuestions = [...questions];
        // Swap with the question below
        [updatedQuestions[index], updatedQuestions[index + 1]] =
            [updatedQuestions[index + 1], updatedQuestions[index]];
        setQuestions(updatedQuestions);
    };


    const handleTestDetailsChange = (field) => (event) => {
        const value = event.target.value;

        if (field === 'duration') {
            // When duration changes, update end time
            const newDuration = parseInt(value) || 0;
            const newEndTime = calculateEndTime(testDetails.startTime, newDuration);

            setTestDetails({
                ...testDetails,
                duration: newDuration,
                endTime: newEndTime
            });
        } else {
            setTestDetails({
                ...testDetails,
                [field]: value
            });
        }
    };

    const handleStartTimeChange = (e) => {
        // Create date object without timezone conversion
        const localDateString = e.target.value;
        const newStartTime = new Date(localDateString);
        const newEndTime = calculateEndTime(newStartTime, testDetails.duration);

        setTestDetails({
            ...testDetails,
            startTime: newStartTime,
            endTime: newEndTime
        });
    };

    const handleEndTimeChange = (e) => {
        // Create date object without timezone conversion
        const localDateString = e.target.value;
        const newEndTime = new Date(localDateString);
        const newDuration = calculateDuration(testDetails.startTime, newEndTime);

        setTestDetails({
            ...testDetails,
            endTime: newEndTime,
            duration: newDuration
        });
    };
    const calculateEndTime = (startTime, durationMinutes) => {
        if (!startTime) return new Date();
        const start = new Date(startTime);
        return new Date(start.getTime() + durationMinutes * 60000);
    };


    const calculateDuration = (startTime, endTime) => {
        if (!startTime || !endTime) return 45; // Default
        const start = new Date(startTime);
        const end = new Date(endTime);
        return Math.round((end - start) / 60000); // Convert ms to minutes
    };

    const handleDateChange = (field) => (newDate) => {
        setTestDetails({
            ...testDetails,
            [field]: newDate
        });
    };

    const handleQuestionChange = (field) => (event) => {
        setCurrentQuestion({
            ...currentQuestion,
            [field]: event.target.value
        });
    };

    const handleOptionChange = (index) => (event) => {
        const newOptions = [...currentQuestion.options];
        newOptions[index] = event.target.value;
        setCurrentQuestion({
            ...currentQuestion,
            options: newOptions
        });
    };

    const addQuestion = () => {
        setQuestions([...questions, { ...currentQuestion, id: questions.length + 1 }]);
        setCurrentQuestion({
            type: 'mcq',
            question: '',
            options: ['', '', '', ''],
            correctAnswer: '',
            points: 1
        });
    };

    const removeQuestion = (index) => {
        const questionToRemove = questions[index];
        const newQuestions = questions.filter((_, i) => i !== index);

        // If in edit mode and the question has a database ID, track it for deletion
        if (editMode && questionToRemove.id && !isNaN(questionToRemove.id)) {
            setDeletedQuestionIds(prev => [...prev, questionToRemove.id]);
        }

        setQuestions(newQuestions);
    };


    const handleSubmitTest = async () => {
        if (!testDetails.moduleId) {
            setError("Please select a module");
            return;
        }

        if (questions.length === 0) {
            setError("Please add at least one question");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // Prepare test data
            const testData = {
                title: testDetails.title,
                description: testDetails.description,
                durationMinutes: testDetails.duration,
                startTime: new Date(testDetails.startTime.getTime() - (testDetails.startTime.getTimezoneOffset() * 60000)).toISOString(),
                endTime: new Date(testDetails.endTime.getTime() - (testDetails.endTime.getTimezoneOffset() * 60000)).toISOString(),
                questions: questions.map(q => ({
                    id: q.id, // Include ID for existing questions
                    questionText: q.question,
                    questionType: q.type.toUpperCase(),
                    correctAnswer: q.correctAnswer,
                    points: parseInt(q.points, 10) || 0,
                    options: q.type === 'mcq' ? q.options.map(option => ({
                        optionText: option,
                        isCorrect: option === q.correctAnswer
                    })) : []
                })),
                totalPoints: questions.reduce((sum, question) => sum + (parseInt(question.points, 10) || 0), 0)
            };

            if (editMode && id) {
                // Update existing test
                await testAPI.updateTest(id, testData);

                // If there are deleted questions, handle them
                if (deletedQuestionIds.length > 0) {
                    await testAPI.deleteQuestions(id, deletedQuestionIds);
                }

                // Update remaining questions
                await testAPI.updateTestQuestions(id, testData.questions);

                navigate(`/lecturer/modules/${testDetails.moduleId}/tests/${id}`);
            } else {
                // Create new test
                await createTest(testDetails.moduleId, testData);

                // Navigate to the module's test list page
                navigate(`/lecturer/modules/${testDetails.moduleId}/tests`);
            }
        } catch (err) {
            console.error('Error saving test:', err);
            setError(typeof err === 'string' ? err : `Failed to ${editMode ? 'update' : 'create'} test. Please try again.`);
        } finally {
            setLoading(false);
        }
    };

    const handleAIGenerate = async () => {
        setLoading(true);
        setError(null);
        try {
            const generatedQuestions = await generateQuestions(
                aiConfig.prompt,
                aiConfig.type,
                aiConfig.count
            );

            // Transform the generated questions to match your format
            const formattedQuestions = generatedQuestions.map((q, index) => ({
                ...q,
                id: questions.length + index + 1
            }));

            setQuestions(prev => [...prev, ...formattedQuestions]);
            setShowAIDialog(false);
        } catch (err) {
            console.error('Generation error:', err);
            setError(err.message || 'Failed to generate questions. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const renderTestDetails = () => (
        <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Test Details</Typography>
            <Box component="form" sx={{ mt: 2 }}>
                <TextField
                    fullWidth
                    label="Test Title"
                    value={testDetails.title}
                    onChange={handleTestDetailsChange('title')}
                    margin="normal"
                    required
                />

                {/* Module Selection Dropdown */}
                <FormControl fullWidth margin="normal" required>
                    <InputLabel>Module</InputLabel>
                    <Select
                        value={testDetails.moduleId}
                        onChange={handleTestDetailsChange('moduleId')}
                        label="Module"
                        disabled={loadingModules}
                    >
                        {loadingModules ? (
                            <MenuItem disabled>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <CircularProgress size={20} sx={{ mr: 1 }} />
                                    Loading modules...
                                </Box>
                            </MenuItem>
                        ) : (
                            modules.map((module) => (
                                <MenuItem key={module.id} value={module.id}>
                                    {module.code} - {module.title}
                                </MenuItem>
                            ))
                        )}
                    </Select>
                </FormControl>

                <TextField
                    fullWidth
                    type="number"
                    label="Duration (minutes)"
                    value={testDetails.duration}
                    onChange={handleTestDetailsChange('duration')}
                    margin="normal"
                    required
                />

                {/* Simple Date-Time inputs */}
                <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            label="Start Date & Time"
                            type="datetime-local"
                            value={testDetails.startTime instanceof Date ?
                                formatDateTimeForInput(testDetails.startTime) :
                                formatDateTimeForInput(new Date())}
                            onChange={handleStartTimeChange}
                            margin="normal"
                            required
                            InputLabelProps={{ shrink: true }}
                            helperText="Must be a future date"
                            error={testDetails.startTime < new Date()}
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            label="End Date & Time"
                            type="datetime-local"
                            value={testDetails.endTime instanceof Date ?
                                formatDateTimeForInput(testDetails.endTime) :
                                formatDateTimeForInput(new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000))}
                            onChange={handleEndTimeChange}
                            margin="normal"
                            required
                            InputLabelProps={{ shrink: true }}
                            error={testDetails.endTime <= testDetails.startTime}
                            helperText="Must be after start time"
                        />
                    </Grid>
                </Grid>

                <TextField
                    fullWidth
                    label="Description"
                    value={testDetails.description}
                    onChange={handleTestDetailsChange('description')}
                    margin="normal"
                    multiline
                    rows={4}
                />
            </Box>
        </Paper>
    );

    const renderQuestion = (q, index) => (
        <Card key={index} sx={{ mb: 2, border: '1px solid #e0e0e0' }}>
            <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                        Question {index + 1}
                    </Typography>
                    <Box display="flex" alignItems="center">
                        <Chip
                            label={q.type.toUpperCase()}
                            color="primary"
                            size="small"
                            sx={{ mr: 1 }}
                        />
                        {/* Up arrow button */}
                        <IconButton
                            size="small"
                            onClick={() => moveQuestionUp(index)}
                            disabled={index === 0}
                            sx={{ mr: 0.5 }}
                        >
                            <ArrowUpwardIcon fontSize="small" />
                        </IconButton>
                        {/* Down arrow button */}
                        <IconButton
                            size="small"
                            onClick={() => moveQuestionDown(index)}
                            disabled={index === questions.length - 1}
                            sx={{ mr: 0.5 }}
                        >
                            <ArrowDownwardIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                            size="small"
                            onClick={() => removeQuestion(index)}
                            color="error"
                        >
                            <DeleteIcon />
                        </IconButton>
                    </Box>
                </Box>

                <Divider sx={{ my: 1 }} />

                <Typography variant="body1" sx={{ mt: 2, mb: 2 }}>
                    {q.question}
                </Typography>

                {q.type === 'mcq' && (
                    <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                            Options:
                        </Typography>
                        <Grid container spacing={1}>
                            {q.options.map((option, i) => (
                                <Grid item xs={12} key={i}>
                                    <Paper
                                        elevation={0}
                                        sx={{
                                            p: 1,
                                            bgcolor: option === q.correctAnswer ? 'success.light' : 'grey.50',
                                            border: '1px solid',
                                            borderColor: option === q.correctAnswer ? 'success.main' : 'grey.300',
                                            borderRadius: 1
                                        }}
                                    >
                                        <Typography variant="body2">
                                            {String.fromCharCode(65 + i)}. {option}
                                            {option === q.correctAnswer && (
                                                <Chip
                                                    label="Correct Answer"
                                                    size="small"
                                                    color="success"
                                                    sx={{ ml: 1 }}
                                                />
                                            )}
                                        </Typography>
                                    </Paper>
                                </Grid>
                            ))}
                        </Grid>
                    </Box>
                )}

                {q.type === 'written' && (
                    <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                            Model Answer:
                        </Typography>
                        <Paper
                            elevation={0}
                            sx={{
                                p: 2,
                                bgcolor: 'success.light',
                                border: '1px solid',
                                borderColor: 'success.main',
                                borderRadius: 1
                            }}
                        >
                            <Typography variant="body2">
                                {q.correctAnswer || "No model answer provided"}
                            </Typography>
                        </Paper>
                    </Box>
                )}

                {/* points editor field */}
                <Box sx={{ mt: 2, display: 'flex', alignItems: 'center' }}>
                    <Typography variant="body2" color="textSecondary" sx={{ mr: 2 }}>
                        Points:
                    </Typography>
                    <TextField
                        type="number"
                        size="small"
                        value={q.points}
                        onChange={(e) => {
                            const newPoints = parseInt(e.target.value) || 1;
                            const updatedQuestions = [...questions];
                            updatedQuestions[index].points = newPoints;
                            setQuestions(updatedQuestions);
                        }}
                        InputProps={{ inputProps: { min: 1 } }}
                        sx={{ width: '80px' }}
                    />
                </Box>
            </CardContent>
        </Card>
    );

    const renderQuestionCreation = () => (
        <>
            <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h6">Add Questions</Typography>
                    <Button
                        startIcon={<AutorenewIcon />}
                        variant="outlined"
                        onClick={() => setShowAIDialog(true)}
                    >
                        Generate with AI
                    </Button>
                </Box>

                <FormControl fullWidth margin="normal">
                    <InputLabel>Question Type</InputLabel>
                    <Select
                        value={currentQuestion.type}
                        onChange={handleQuestionChange('type')}
                    >
                        <MenuItem value="mcq">Multiple Choice</MenuItem>
                        <MenuItem value="written">Written Answer</MenuItem>
                    </Select>
                </FormControl>

                <TextField
                    fullWidth
                    label="Question"
                    value={currentQuestion.question}
                    onChange={handleQuestionChange('question')}
                    margin="normal"
                    multiline
                    rows={2}
                />

                {currentQuestion.type === 'written' && (
                    <TextField
                        fullWidth
                        label="Model Answer"
                        value={currentQuestion.correctAnswer}
                        onChange={handleQuestionChange('correctAnswer')}
                        margin="normal"
                        multiline
                        rows={3}
                        placeholder="Enter a model answer that will be used for grading"
                    />
                )}

                {currentQuestion.type === 'mcq' && (
                    <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle1" gutterBottom>Options:</Typography>
                        {currentQuestion.options.map((option, index) => (
                            <TextField
                                key={index}
                                fullWidth
                                label={`Option ${index + 1}`}
                                value={option}
                                onChange={handleOptionChange(index)}
                                margin="normal"
                            />
                        ))}
                        <FormControl component="fieldset" sx={{ mt: 2 }}>
                            <Typography variant="subtitle1" gutterBottom>Correct Answer:</Typography>
                            <RadioGroup
                                value={currentQuestion.correctAnswer}
                                onChange={handleQuestionChange('correctAnswer')}
                            >
                                {currentQuestion.options.map((option, index) => (
                                    <FormControlLabel
                                        key={index}
                                        value={option}
                                        control={<Radio />}
                                        label={`Option ${index + 1}`}
                                        disabled={!option}
                                    />
                                ))}
                            </RadioGroup>
                        </FormControl>
                    </Box>
                )}

                <TextField
                    type="number"
                    label="Points"
                    value={currentQuestion.points}
                    onChange={handleQuestionChange('points')}
                    margin="normal"
                />

                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={addQuestion}
                    sx={{ mt: 2 }}
                    fullWidth
                >
                    Add Question
                </Button>
            </Paper>

            {questions.length > 0 && (
                <Paper elevation={3} sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom>
                        Added Questions ({questions.length})
                    </Typography>
                    <Box sx={{ mt: 2 }}>
                        {questions.map((q, index) => renderQuestion(q, index))}
                    </Box>
                </Paper>
            )}
        </>
    );

    const renderReview = () => {
        // Find selected module details
        const selectedModule = modules.find(m => m.id === testDetails.moduleId) || {};

        return (
            <Paper elevation={3} sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>Review Test</Typography>
                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle1">Test Details:</Typography>
                    <Typography>Title: {testDetails.title}</Typography>
                    <Typography>Module: {selectedModule?.code} - {selectedModule?.title}</Typography>
                    <Typography>Duration: {testDetails.duration} minutes</Typography>
                    <Typography>Start Date: {testDetails.startTime.toLocaleString()}</Typography>
                    <Typography>End Date: {testDetails.endTime.toLocaleString()}</Typography>
                    <Typography>Total Questions: {questions.length}</Typography>
                    <Typography>Total Points: {questions.reduce((sum, q) => sum + (parseInt(q.points, 10) || 0), 0)}</Typography>

                </Box>
                <LoadingButton
                    variant="contained"
                    startIcon={<SaveIcon />}
                    sx={{ mt: 3 }}
                    fullWidth
                    loading={loading}
                    onClick={handleSubmitTest}
                >
                    {editMode ? 'Save Changes' : 'Create Test'}
                </LoadingButton>
            </Paper>
        );
    };

    if (isLoading) {
        return (
            <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
                <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
                    <CircularProgress />
                </Box>
            </Container>
        );
    }

    return (
        <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
            <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
                <Typography variant="h5" gutterBottom>{editMode ? 'Edit Test' : 'Create New Test'}</Typography>
                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
                    {steps.map((label) => (
                        <Step key={label}>
                            <StepLabel>{label}</StepLabel>
                        </Step>
                    ))}
                </Stepper>

                {activeStep === 0 && renderTestDetails()}
                {activeStep === 1 && renderQuestionCreation()}
                {activeStep === 2 && renderReview()}

                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
                    <Button
                        disabled={activeStep === 0}
                        onClick={handleBack}
                        sx={{ mr: 1 }}
                    >
                        Back
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleNext}
                        disabled={activeStep === steps.length - 1}
                    >
                        Next
                    </Button>
                </Box>
            </Paper>

            {/* AI Generation Dialog */}
            <Dialog open={showAIDialog} onClose={() => setShowAIDialog(false)} maxWidth="md" fullWidth>
                <DialogTitle>
                    <Box display="flex" alignItems="center" gap={1}>
                        <AutorenewIcon color="primary" />
                        <Typography>Generate Questions with AI</Typography>
                    </Box>
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ mt: 2 }}>
                        <TextField
                            fullWidth
                            label="Topic Description"
                            multiline
                            rows={3}
                            value={aiConfig.prompt}
                            onChange={(e) => setAiConfig({ ...aiConfig, prompt: e.target.value })}
                            placeholder="Example: Python inheritance, polymorphism, and encapsulation"
                            sx={{ mb: 2 }}
                        />
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={4}>
                                <FormControl fullWidth>
                                    <InputLabel>Question Type</InputLabel>
                                    <Select
                                        value={aiConfig.type}
                                        onChange={(e) => setAiConfig({ ...aiConfig, type: e.target.value })}
                                    >
                                        <MenuItem value="mcq">Multiple Choice</MenuItem>
                                        <MenuItem value="written">Written Answer</MenuItem>
                                        <MenuItem value="mixed">Mixed</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <FormControl fullWidth>
                                    <InputLabel>Difficulty</InputLabel>
                                    <Select
                                        value={aiConfig.difficulty}
                                        onChange={(e) => setAiConfig({ ...aiConfig, difficulty: e.target.value })}
                                    >
                                        <MenuItem value="beginner">Beginner</MenuItem>
                                        <MenuItem value="intermediate">Intermediate</MenuItem>
                                        <MenuItem value="advanced">Advanced</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <TextField
                                    fullWidth
                                    type="number"
                                    label="Number of Questions"
                                    value={aiConfig.count}
                                    onChange={(e) => setAiConfig({
                                        ...aiConfig,
                                        count: Math.max(1, Math.min(20, parseInt(e.target.value) || 1))
                                    })}
                                    InputProps={{ inputProps: { min: 1, max: 20 } }}
                                />
                            </Grid>
                        </Grid>
                        {error && (
                            <Alert severity="error" sx={{ mt: 2 }}>
                                {error}
                            </Alert>
                        )}
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowAIDialog(false)}>Cancel</Button>
                    <LoadingButton
                        onClick={handleAIGenerate}
                        loading={loading}
                        variant="contained"
                        disabled={!aiConfig.prompt}
                    >
                        Generate Questions
                    </LoadingButton>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default TestCreation;