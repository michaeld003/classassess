import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Container,
    Grid,
    Paper,
    Typography,
    Box,
    Card,
    CardContent,
    Button,
    List,
    ListItem,
    ListItemText,
    Chip,
    IconButton,
    CircularProgress,
    Alert,
    Tabs,
    Tab,
    Tooltip,
    Divider,
    Select,
    MenuItem,
    FormControl,
    InputLabel
} from '@mui/material';
import {
    Add as AddIcon,
    Assignment as AssignmentIcon,
    Group as GroupIcon,
    Timer as TimerIcon,
    Refresh as RefreshIcon,
    ArrowForward as ArrowForwardIcon,
    Warning as WarningIcon,
    TrendingUp as TrendingUpIcon,
    TrendingDown as TrendingDownIcon,
    Schedule as ScheduleIcon,
    BarChart as BarChartIcon,
    CheckCircle as CheckCircleIcon,
    Edit as EditIcon,
    Cancel as CancelIcon,
    Visibility as VisibilityIcon,
    NoteAlt as NoteAltIcon,
    FilterList as FilterListIcon,
    Assessment as AssessmentIcon
} from '@mui/icons-material';
import { testAPI, handleApiError } from '../../services/api';
import webSocketService from '../../services/websocket';
import LecturerAppealSystem from './LecturerAppealSystem';

const LecturerDashboard = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        totalStudents: 0,
        activeTests: 0,
        pendingGrading: 0,
        completedTests: 0,
        pendingAppeals: 0,
        changeStudents: 0,
        changeActiveTests: 0,
        changePendingGrading: 0,
        changeCompletedTests: 0,
        changePendingAppeals: 0
    });
    const [recentTests, setRecentTests] = useState([]);
    const [upcomingTests, setUpcomingTests] = useState([]);
    const [appeals, setAppeals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [tabValue, setTabValue] = useState(0);


    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setLoading(true);
                setError(null);

                // Fetch basic dashboard data
                const [statsResponse, testsResponse, appealsResponse, appealsCountResponse] = await Promise.all([
                    testAPI.getLecturerStats(),
                    testAPI.getLecturerTests(),
                    testAPI.getLecturerAppeals(),
                    testAPI.getLecturerAppealCount()
                ]);

                // Process dashboard stats
                const statsData = {
                    ...statsResponse.data,
                    pendingAppeals: appealsCountResponse.data.count,
                    // Add change percentages - these could come from the API in a real implementation
                    changeStudents: 5.2,
                    changeActiveTests: 0,
                    changePendingGrading: -2.5,
                    changeCompletedTests: 8.7,
                    changePendingAppeals: 0
                };
                setStats(statsData);

                // Separate tests into recent and upcoming
                const now = new Date();
                const tests = testsResponse.data;

                setRecentTests(
                    tests.filter(test => new Date(test.startTime) <= now)
                        .sort((a, b) => new Date(b.startTime) - new Date(a.startTime))
                        .slice(0, 5)
                );

                setUpcomingTests(
                    tests.filter(test => new Date(test.startTime) > now)
                        .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
                        .slice(0, 5)
                );

                // Process appeals data
                setAppeals(appealsResponse.data);

            } catch (err) {
                console.error('Error fetching dashboard data:', err);
                setError(handleApiError(err));
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    const handleCreateTest = () => {
        navigate('/lecturer/create-test');
    };

    const handleViewTest = (test) => {
        // Uses the moduleId from the test object to construct the correct URL
        navigate(`/lecturer/modules/${test.moduleId}/tests/${test.id}`);
    };

    const handleEditTest = (testId) => {
        navigate(`/lecturer/test/${testId}/edit`);
    };

    const handleCancelTest = (testId, moduleId) => {
        if (window.confirm('Are you sure you want to cancel this test? This cannot be undone.')) {
            // Call the API to delete the test
            testAPI.cancelTest(moduleId, testId)
                .then(response => {
                    // If successful, update the UI by filtering out the cancelled test
                    setUpcomingTests(upcomingTests.filter(test => test.id !== testId));


                })
                .catch(error => {
                    // Handle errors
                    console.error('Error cancelling test:', error);
                    setError('Failed to cancel test. Please try again.');
                });
        }
    }

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };

    // Determine test status based on dates
    const getTestStatus = (test) => {
        const now = new Date();
        const startTime = new Date(test.startTime);
        const endTime = new Date(test.endTime);

        if (now < startTime) return 'scheduled';
        if (now >= startTime && now <= endTime) return 'inProgress';
        return 'completed';
    };

    // Render status chip based on test status
    const getStatusChip = (status) => {
        const statusConfig = {
            scheduled: { color: 'primary', label: 'Scheduled' },
            inProgress: { color: 'secondary', label: 'In Progress' },
            completed: { color: 'success', label: 'Completed' }
        };

        const config = statusConfig[status] || { color: 'default', label: status };
        return (
            <Chip
                label={config.label}
                color={config.color}
                size="small"
                sx={{ ml: 1 }}
            />
        );
    };

    // Determine urgency level for appeals
    const getAppealUrgency = (appeal) => {
        if (appeal.status === 'PENDING') {
            return Math.random() > 0.5 ? 'high' : 'medium';
        }
        return 'low';
    };

    // Render urgency chip for appeals
    const getUrgencyIndicator = (urgency) => {
        const colors = {
            high: 'error',
            medium: 'warning',
            low: 'info'
        };
        return <Chip label={urgency} color={colors[urgency]} size="small" />;
    };

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
                <Button variant="contained" onClick={() => window.location.reload()}>
                    Retry
                </Button>
            </Container>
        );
    }

    // Helper function to render stat card with trend indicator
    const renderStatCard = (title, value, icon, change, tooltip) => (
        <Card sx={{ height: '100%' }}>
            <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                    <Tooltip title={tooltip} placement="top">
                        <Typography color="textSecondary" gutterBottom>
                            {title}
                        </Typography>
                    </Tooltip>
                    {icon}
                </Box>
                <Box display="flex" alignItems="center" mt={1}>
                    <Typography variant="h4">
                        {value}
                    </Typography>
                    {change !== 0 && (
                        <Box display="flex" alignItems="center" ml={1}>
                            {change > 0 ? (
                                <TrendingUpIcon color="success" fontSize="small" />
                            ) : (
                                <TrendingDownIcon color="error" fontSize="small" />
                            )}
                            <Typography
                                variant="body2"
                                color={change > 0 ? "success.main" : "error.main"}
                                sx={{ ml: 0.5 }}
                            >
                                {Math.abs(change)}%
                            </Typography>
                        </Box>
                    )}
                </Box>
            </CardContent>
        </Card>
    );

    // Helper function to render test card with status and actions
    const renderTestCard = (test) => {
        const testStatus = getTestStatus(test);
        const testDate = new Date(test.startTime);
        const isUpcoming = testStatus === 'scheduled';

        return (
            <ListItem
                key={test.id}
                sx={{
                    border: '1px solid #e0e0e0',
                    borderRadius: 1,
                    mb: 1,
                    '&:last-child': { mb: 0 },
                    flexDirection: 'column',
                    alignItems: 'stretch',
                    p: 2
                }}
            >
                {/* Test header with title and status */}
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="subtitle1" fontWeight="medium">
                        {test.title}
                    </Typography>
                    {getStatusChip(testStatus)}
                </Box>

                {/* Test details */}
                <Grid container spacing={1} mb={2}>
                    <Grid item xs={6}>
                        <Box display="flex" alignItems="center">
                            <ScheduleIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                            <Typography variant="body2">
                                {testDate.toLocaleDateString()} {testDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </Typography>
                        </Box>
                    </Grid>
                    <Grid item xs={6}>
                        <Box display="flex" alignItems="center">
                            <TimerIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                            <Typography variant="body2">
                                {test.durationMinutes} minutes
                            </Typography>
                        </Box>
                    </Grid>
                    <Grid item xs={6}>
                        <Box display="flex" alignItems="center">
                            <NoteAltIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                            <Typography variant="body2">
                                Module: {test.moduleCode}
                            </Typography>
                        </Box>
                    </Grid>
                    <Grid item xs={6}>
                        <Box display="flex" alignItems="center">
                            <GroupIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                            <Typography variant="body2">
                                {isUpcoming ? 'Expected: ' : 'Submissions: '}
                                {isUpcoming ? (test.enrolledCount || 0) : (test.submissionCount || 0)}
                            </Typography>
                        </Box>
                    </Grid>
                </Grid>

                {/* Action buttons */}
                <Box display="flex" gap={1}>
                    <Button
                        variant="outlined"
                        size="small"
                        startIcon={<VisibilityIcon />}
                        onClick={() => handleViewTest(test)}  // Pass full test object instead of just test.id
                    >
                        View
                    </Button>

                    {isUpcoming && (
                        <>
                            <Button
                                variant="outlined"
                                size="small"
                                startIcon={<EditIcon />}
                                onClick={() => handleEditTest(test.id)}
                            >
                                Edit
                            </Button>
                            <Button
                                variant="outlined"
                                color="error"
                                size="small"
                                startIcon={<CancelIcon />}
                                onClick={() => handleCancelTest(test.id, test.moduleId)}
                            >
                                Cancel
                            </Button>
                        </>
                    )}
                </Box>
            </ListItem>
        );
    };

    // Helper function to render appeal card with urgency indicator
    const renderAppealCard = (appeal) => {
        const urgency = getAppealUrgency(appeal);

        return (
            <Paper
                elevation={2}
                key={appeal.id}
                sx={{
                    p: 2,
                    mb: 2,
                    borderLeft: 4,
                    borderColor:
                        urgency === 'high' ? 'error.main' :
                            urgency === 'medium' ? 'warning.main' : 'info.main'
                }}
            >
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                    <Typography variant="subtitle1" fontWeight="medium">
                        {appeal.student}
                    </Typography>
                    <Box display="flex" alignItems="center">
                        {getUrgencyIndicator(urgency)}
                        <Chip
                            label={appeal.status}
                            color={appeal.status === 'PENDING' ? 'warning' : appeal.status === 'APPROVED' ? 'success' : 'error'}
                            size="small"
                            sx={{ ml: 1 }}
                        />
                    </Box>
                </Box>

                <Box mb={1}>
                    <Typography variant="body2" color="text.secondary">
                        Test: {appeal.testTitle}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Module: {appeal.moduleCode}
                    </Typography>
                </Box>

                <Box display="flex" gap={2} mb={1}>
                    <Typography variant="body2">
                        Current Score: {appeal.originalScore}
                    </Typography>
                    <Typography variant="body2">
                        Requested: {appeal.requestedScore}
                    </Typography>
                </Box>

                <Typography variant="body2" color="text.secondary" noWrap sx={{ mb: 2 }}>
                    Reason: {appeal.appealReason}
                </Typography>

                {appeal.status === 'PENDING' && (
                    <Box display="flex" gap={1}>
                        <Button
                            variant="contained"
                            color="primary"
                            size="small"
                            onClick={() => navigate(`/lecturer/appeals/${appeal.id}`)}
                        >
                            Review
                        </Button>
                    </Box>
                )}
            </Paper>
        );
    };

    return (
        <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h5" sx={{ fontWeight: 600 }}>
                    Lecturer Dashboard
                </Typography>
                <Box>
                    <Button
                        variant="outlined"
                        startIcon={<AssessmentIcon />}
                        onClick={() => navigate('/lecturer/performance')}
                        sx={{ mr: 2 }}
                    >
                        Performance Analytics
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={handleCreateTest}
                    >
                        Create New Test
                    </Button>
                </Box>
            </Box>

            {/* Enhanced Statistics Cards */}
            <Grid container spacing={3} mb={4}>
                <Grid item xs={12} sm={6} md={4} lg={2.4}>
                    {renderStatCard(
                        'Students',
                        stats.totalStudents,
                        <GroupIcon sx={{ fontSize: 30, color: 'primary.main' }} />,
                        stats.changeStudents,
                        'Total number of students enrolled in your courses'
                    )}
                </Grid>
                <Grid item xs={12} sm={6} md={4} lg={2.4}>
                    {renderStatCard(
                        'Active Tests',
                        stats.activeTests,
                        <TimerIcon sx={{ fontSize: 30, color: 'success.main' }} />,
                        stats.changeActiveTests,
                        'Tests currently in progress or scheduled to start soon'
                    )}
                </Grid>
                <Grid item xs={12} sm={6} md={4} lg={2.4}>
                    {renderStatCard(
                        'Pending Grading',
                        stats.pendingGrading,
                        <AssignmentIcon sx={{ fontSize: 30, color: 'warning.main' }} />,
                        stats.changePendingGrading,
                        'Tests awaiting your evaluation and grading'
                    )}
                </Grid>
                <Grid item xs={12} sm={6} md={4} lg={2.4}>
                    {renderStatCard(
                        'Completed Tests',
                        stats.completedTests,
                        <CheckCircleIcon sx={{ fontSize: 30, color: 'info.main' }} />,
                        stats.changeCompletedTests,
                        'Tests that have been fully graded and finalized'
                    )}
                </Grid>
                <Grid item xs={12} sm={6} md={4} lg={2.4}>
                    {renderStatCard(
                        'Pending Appeals',
                        stats.pendingAppeals,
                        <WarningIcon sx={{ fontSize: 30, color: 'error.main' }} />,
                        stats.changePendingAppeals,
                        'Grade appeals that require your review'
                    )}
                </Grid>
            </Grid>

            {/* Tabbed Interface */}
            <Box sx={{ width: '100%', mb: 4 }}>
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <Tabs value={tabValue} onChange={handleTabChange}>
                        <Tab icon={<AssignmentIcon />} iconPosition="start" label="Tests" />
                        <Tab icon={<WarningIcon />} iconPosition="start" label="Appeals" />
                    </Tabs>
                </Box>

                {/* Tests Tab */}
                {tabValue === 0 && (
                    <Grid container spacing={3} mt={1}>
                        {/* Recent Tests */}
                        <Grid item xs={12} md={6}>
                            <Paper elevation={3} sx={{ p: 3 }}>
                                <Typography variant="h6" gutterBottom>
                                    Recent Tests
                                </Typography>
                                <List>
                                    {recentTests.length === 0 ? (
                                        <Typography color="textSecondary">No recent tests</Typography>
                                    ) : (
                                        recentTests.map((test) => renderTestCard(test))
                                    )}
                                </List>
                            </Paper>
                        </Grid>

                        {/* Upcoming Tests */}
                        <Grid item xs={12} md={6}>
                            <Paper elevation={3} sx={{ p: 3 }}>
                                <Typography variant="h6" gutterBottom>
                                    Upcoming Tests
                                </Typography>
                                <List>
                                    {upcomingTests.length === 0 ? (
                                        <Typography color="textSecondary">No upcoming tests</Typography>
                                    ) : (
                                        upcomingTests.map((test) => renderTestCard(test))
                                    )}
                                </List>
                            </Paper>
                        </Grid>
                    </Grid>
                )}

                {/* Appeals Tab - Enhanced with filtering and urgency indicators */}
                {tabValue === 1 && (
                    <Box mt={2}>
                        <Box mb={3}>
                            <Typography variant="h6">Grade Appeals</Typography>
                        </Box>

                        {appeals.length === 0 ? (
                            <Alert severity="info">No appeals to review at this time.</Alert>
                        ) : (
                            appeals.map(appeal => renderAppealCard(appeal))
                        )}
                    </Box>
                )}

            </Box>
        </Container>
    );
};

export default LecturerDashboard;