import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box, Typography, Button, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Chip, IconButton,
    Card, CardContent, Alert, CircularProgress, TextField,
    InputAdornment, Paper, Divider, Tabs, Tab, Grid
} from '@mui/material';
import {
    Search as SearchIcon,
    Sort as SortIcon,
    Download as DownloadIcon,
    Person as PersonIcon,
    ArrowUpward as ArrowUpwardIcon,
    ArrowDownward as ArrowDownwardIcon,
    Assessment as AssessmentIcon
} from '@mui/icons-material';
import { moduleAPI, testAPI } from '../../services/api';

const StudentPerformanceTab = ({ moduleId }) => {
    const navigate = useNavigate();
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortField, setSortField] = useState('name');
    const [sortDirection, setSortDirection] = useState('asc');
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [testHistory, setTestHistory] = useState([]);
    const [exportLoading, setExportLoading] = useState(false);
    const [studentTestsMap, setStudentTestsMap] = useState(new Map());
    const [initialLoadComplete, setInitialLoadComplete] = useState(false);

    // Debug logging for component mount
    useEffect(() => {
        console.log('StudentPerformanceTab mounted, moduleId:', moduleId);
    }, [moduleId]);

    // Fetch students for the module
    const fetchStudents = async () => {
        try {
            setLoading(true);
            setError(null);
            console.log('Fetching students for module:', moduleId);
            const response = await moduleAPI.getModuleStudents(moduleId);
            console.log('Raw students response:', response);

            if (Array.isArray(response) && response.length > 0) {
                console.log('Got valid student array with', response.length, 'students');

                // Store students without modifying them
                setStudents(response);

                // Now fetch test data for all students
                await fetchAllStudentTests(response);

            } else {
                console.warn('API returned empty or invalid student data');
                setStudents([]);
                setError('No student data available. This may be because there are no enrolled students or the data is still being prepared.');
            }

            // Reset selected student if not in the list anymore
            if (selectedStudent && Array.isArray(response) && !response.find(s => s.id === selectedStudent.id)) {
                setSelectedStudent(null);
                setTestHistory([]);
            }
        } catch (err) {
            console.error('Error in fetchStudents:', err);
            setStudents([]);
            setError('Could not load student data. Please try again later.');
        } finally {
            setLoading(false);
            setInitialLoadComplete(true);
        }
    };

    // Fetch test data for all students
    const fetchAllStudentTests = async (studentsList) => {
        const testsMap = new Map();

        console.log('Fetching test data for all students...');

        // Use Promise.all to fetch test data for all students in parallel
        await Promise.all(studentsList.map(async (student) => {
            try {
                console.log(`Fetching tests for student: ${student.id}`);
                const tests = await testAPI.getStudentTests(moduleId, student.id);

                // Process the test data
                const processedTests = processTestData(tests);
                testsMap.set(student.id, processedTests);

                console.log(`Fetched ${processedTests.length} tests for student ${student.id}`);
            } catch (error) {
                console.error(`Error fetching tests for student ${student.id}:`, error);
                testsMap.set(student.id, []);
            }
        }));

        console.log('Finished fetching test data for all students');
        setStudentTestsMap(testsMap);

        // If a student is selected, update their test history
        if (selectedStudent) {
            const selectedStudentTests = testsMap.get(selectedStudent.id) || [];
            setTestHistory(selectedStudentTests);
        }
    };

    useEffect(() => {
        fetchStudents();
    }, [moduleId]);

    // Process test data to ensure consistent format
    const processTestData = (rawTests) => {
        let tests = Array.isArray(rawTests) ? rawTests :
            (rawTests?.data && Array.isArray(rawTests.data)) ? rawTests.data : [];

        return tests.map(test => {
            // Parse and clean the score
            let score = 0;
            if (typeof test.score === 'number') {
                score = parseFloat(test.score.toFixed(1));
            } else if (typeof test.score === 'string') {
                const parsed = parseFloat(test.score);
                score = !isNaN(parsed) ? parseFloat(parsed.toFixed(1)) : 0;
            }

            return {
                ...test,
                id: test.id || test.testId || Math.random().toString(),
                title: test.title || `Test ${test.testId || ''}`,
                score: score
            };
        });
    };

    // Function to fetch test history for a specific student
    const fetchTestHistory = async (studentId) => {
        try {
            console.log(`Fetching test history for student: ${studentId} in module: ${moduleId}`);

            // Check if we already have the data in our map
            if (studentTestsMap.has(studentId)) {
                const tests = studentTestsMap.get(studentId);
                console.log(`Using cached test data for student ${studentId}: ${tests.length} tests`);
                setTestHistory(tests);
                return tests;
            }

            // Otherwise fetch from API
            const response = await testAPI.getStudentTests(moduleId, studentId);
            console.log('Test history raw response:', response);

            const transformedHistory = processTestData(response);

            console.log('Transformed test history:', transformedHistory);
            setTestHistory(transformedHistory);

            // Update the map
            const newMap = new Map(studentTestsMap);
            newMap.set(studentId, transformedHistory);
            setStudentTestsMap(newMap);

            return transformedHistory;
        } catch (error) {
            console.error('Error fetching test history:', error);
            setTestHistory([]);
            return [];
        }
    };

    // Update test history when selected student changes
    useEffect(() => {
        if (selectedStudent) {
            console.log('Selected student changed, updating test history', selectedStudent);

            // Check if we already have test data for this student in our map
            if (studentTestsMap.has(selectedStudent.id)) {
                const tests = studentTestsMap.get(selectedStudent.id);
                console.log(`Using cached test data for student ${selectedStudent.id}: ${tests.length} tests`);
                setTestHistory(tests);
            } else {
                // Fetch test data if we don't have it
                console.log(`No cached test data for student ${selectedStudent.id}, fetching from API`);
                fetchTestHistory(selectedStudent.id).catch(err => {
                    console.error('Failed to fetch test history:', err);
                });
            }
        } else {
            setTestHistory([]);
        }
    }, [selectedStudent, studentTestsMap]);

    // Calculate average score from test history
    const calculateAverageScore = (tests) => {
        if (!tests || tests.length === 0) return 0;
        const totalScore = tests.reduce((sum, test) => sum + (parseFloat(test.score) || 0), 0);
        return parseFloat((totalScore / tests.length).toFixed(1));
    };

    // Get average score for a student
    const getStudentAverageScore = (student) => {
        if (!student || !student.id) return 0;

        // Get test data from our map
        const tests = studentTestsMap.get(student.id) || [];
        return calculateAverageScore(tests);
    };

    // Handle sort change
    const handleSortChange = (field) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    // Handle student selection
    const handleStudentSelect = (student) => {
        // If clicking the same student, toggle selection off
        if (selectedStudent && selectedStudent.id === student.id) {
            setSelectedStudent(null);
            setTestHistory([]);
            return;
        }

        // Otherwise, select the new student
        setSelectedStudent(student);

        // Immediately set test history if we have it cached
        if (studentTestsMap.has(student.id)) {
            const tests = studentTestsMap.get(student.id);
            setTestHistory(tests);
        }
    };

    // Export student data - always use client-side generation
    const handleExportData = async () => {
        try {
            setExportLoading(true);
            setError(null);
            console.log('Starting export for module:', moduleId);

            // Generate CSV directly with the data we want
            console.log('Generating CSV with student data...');

            // Create headers matching our simplified UI
            const headers = ['Student ID', 'Name', 'Email', 'Average Score'].join(',');

            // Generate rows for each student
            const rows = students.map(student => {
                // Get test data from our map
                const tests = studentTestsMap.get(student.id) || [];

                // Calculate average score
                const avgScore = calculateAverageScore(tests);

                // Format the row
                return [
                    student.id || student.studentId || '',
                    student.fullName || student.name || '',
                    student.email || '',
                    avgScore
                ].join(',');
            });

            // Combine headers and rows
            const csvContent = headers + '\n' + rows.join('\n');

            // Create a blob and download the file
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `module-${moduleId}-student-performance.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            console.log('CSV export completed successfully');
        } catch (err) {
            console.error('Export error:', err);
            setError('Failed to export student data. Please try again later.');
        } finally {
            setExportLoading(false);
        }
    };

    // Handle clicking the details button
    const handleDetailsClick = (test) => {
        try {
            console.log('Details clicked for test:', test);
            if (!moduleId || !test?.id) {
                console.error('Missing required IDs for navigation:', { moduleId, testId: test?.id });
                return;
            }
            console.log(`Navigating to /module/${moduleId}/test/${test.id}/details`);
            navigate(`/module/${moduleId}/test/${test.id}/details`);
        } catch (error) {
            console.error('Navigation error:', error);
        }
    };

    // Filter students by search term
    const getFilteredStudents = () => {
        if (!searchTerm) return students;

        const term = searchTerm.toLowerCase();
        return students.filter(student =>
            (student.name?.toLowerCase() || '').includes(term) ||
            (student.fullName?.toLowerCase() || '').includes(term) ||
            (student.studentId?.toLowerCase() || '').includes(term) ||
            (student.email?.toLowerCase() || '').includes(term)
        );
    };

    // Sort filtered students
    const getSortedStudents = () => {
        const filtered = getFilteredStudents();

        return [...filtered].sort((a, b) => {
            let comparison = 0;

            switch (sortField) {
                case 'name':
                    const nameA = a.fullName || a.name || '';
                    const nameB = b.fullName || b.name || '';
                    comparison = nameA.localeCompare(nameB);
                    break;
                case 'id':
                    const idA = a.studentId || a.id || '';
                    const idB = b.studentId || b.id || '';
                    comparison = idA.localeCompare(idB);
                    break;
                case 'score':
                    // Use our cached test data for sorting by score
                    const scoreA = getStudentAverageScore(a);
                    const scoreB = getStudentAverageScore(b);
                    comparison = scoreA - scoreB;
                    break;
                default:
                    comparison = 0;
            }

            return sortDirection === 'asc' ? comparison : -comparison;
        });
    };

    // Sorted and filtered student list
    const filteredSortedStudents = getSortedStudents();

    return (
        <Grid container spacing={3}>
            {/* Left column - Student list */}
            <Grid item xs={12} md={selectedStudent ? 4 : 12}>
                <Card sx={{ height: '100%' }}>
                    <CardContent>
                        {/* Header with search and actions */}
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                            <Typography variant="h6">
                                Students ({students.length})
                            </Typography>
                            <Button
                                variant="outlined"
                                color="primary"
                                size="small"
                                startIcon={<DownloadIcon />}
                                onClick={handleExportData}
                                disabled={exportLoading || students.length === 0}
                            >
                                {exportLoading ? 'Exporting...' : 'Export'}
                            </Button>
                        </Box>

                        {error && (
                            <Alert severity="error" sx={{ mb: 2 }}>
                                {error}
                            </Alert>
                        )}

                        {/* Search and filtering */}
                        <TextField
                            fullWidth
                            placeholder="Search students..."
                            variant="outlined"
                            size="small"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon fontSize="small" />
                                    </InputAdornment>
                                )
                            }}
                            sx={{ mb: 2 }}
                        />

                        {/* Table header with sorting */}
                        <TableContainer>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>
                                            <Button
                                                size="small"
                                                endIcon={sortField === 'name' ?
                                                    (sortDirection === 'asc' ? <ArrowUpwardIcon fontSize="small" /> : <ArrowDownwardIcon fontSize="small" />)
                                                    : null}
                                                onClick={() => handleSortChange('name')}
                                                sx={{ textTransform: 'none' }}
                                            >
                                                Name
                                            </Button>
                                        </TableCell>
                                        <TableCell>
                                            <Button
                                                size="small"
                                                endIcon={sortField === 'id' ?
                                                    (sortDirection === 'asc' ? <ArrowUpwardIcon fontSize="small" /> : <ArrowDownwardIcon fontSize="small" />)
                                                    : null}
                                                onClick={() => handleSortChange('id')}
                                                sx={{ textTransform: 'none' }}
                                            >
                                                ID
                                            </Button>
                                        </TableCell>
                                        <TableCell>
                                            <Button
                                                size="small"
                                                endIcon={sortField === 'score' ?
                                                    (sortDirection === 'asc' ? <ArrowUpwardIcon fontSize="small" /> : <ArrowDownwardIcon fontSize="small" />)
                                                    : null}
                                                onClick={() => handleSortChange('score')}
                                                sx={{ textTransform: 'none' }}
                                            >
                                                Avg. Score
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {loading ? (
                                        <TableRow>
                                            <TableCell colSpan={3} align="center" sx={{ py: 4 }}>
                                                <CircularProgress size={24} />
                                            </TableCell>
                                        </TableRow>
                                    ) : filteredSortedStudents.length > 0 ? (
                                        filteredSortedStudents.map((student) => {
                                            const isSelected = selectedStudent?.id === student.id;

                                            // Get average score from our map of test data
                                            const avgScore = getStudentAverageScore(student);

                                            return (
                                                <TableRow
                                                    key={student.id}
                                                    hover
                                                    onClick={() => handleStudentSelect(student)}
                                                    selected={isSelected}
                                                    sx={{ cursor: 'pointer' }}
                                                >
                                                    <TableCell>
                                                        <Box display="flex" alignItems="center">
                                                            <PersonIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                                                            <Typography variant="body2">
                                                                {student.fullName || student.name || 'Unknown'}
                                                            </Typography>
                                                        </Box>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Typography variant="body2" color="text.secondary">
                                                            {student.id || student.studentId || '-'}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Chip
                                                            label={`${avgScore}%`}
                                                            size="small"
                                                            color={
                                                                avgScore >= 70 ? 'success' :
                                                                    avgScore >= 50 ? 'primary' :
                                                                        avgScore >= 40 ? 'warning' : 'error'
                                                            }
                                                            variant="outlined"
                                                        />
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={3} align="center" sx={{ py: 3 }}>
                                                <Typography color="text.secondary">
                                                    {searchTerm ? "No students match your search" : "No students enrolled"}
                                                </Typography>
                                                {searchTerm && (
                                                    <Button
                                                        variant="text"
                                                        size="small"
                                                        onClick={() => setSearchTerm('')}
                                                        sx={{ mt: 1 }}
                                                    >
                                                        Clear search
                                                    </Button>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </CardContent>
                </Card>
            </Grid>

            {/* Right column - Test History detail */}
            {selectedStudent && (
                <Grid item xs={12} md={8}>
                    <Card sx={{ height: '100%' }}>
                        <CardContent>
                            <Box display="flex" justifyContent="space-between" alignItems="start" mb={3}>
                                <Box>
                                    <Typography variant="h6">
                                        {selectedStudent.name || selectedStudent.fullName || 'Student'}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Student ID: {selectedStudent.studentId || selectedStudent.id || 'N/A'}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Email: {selectedStudent.email || 'N/A'}
                                    </Typography>
                                </Box>
                                <Chip
                                    label={`Average: ${calculateAverageScore(testHistory)}%`}
                                    color={
                                        calculateAverageScore(testHistory) >= 70 ? 'success' :
                                            calculateAverageScore(testHistory) >= 50 ? 'primary' :
                                                calculateAverageScore(testHistory) >= 40 ? 'warning' : 'error'
                                    }
                                    size="medium"
                                />
                            </Box>

                            <Box sx={{ mb: 3 }}>
                                <Typography variant="h6" gutterBottom>
                                    <AssessmentIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 1 }} />
                                    Test History
                                </Typography>
                            </Box>

                            <TableContainer component={Paper} variant="outlined">
                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Test Name</TableCell>
                                            <TableCell>Date Taken</TableCell>
                                            <TableCell>Score</TableCell>
                                            <TableCell>Time Spent</TableCell>
                                            <TableCell>Actions</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {testHistory && testHistory.length > 0 ? (
                                            testHistory.map((test) => (
                                                <TableRow key={test.id || `test-${Math.random()}`}>
                                                    <TableCell>{test.title || 'Unnamed Test'}</TableCell>
                                                    <TableCell>
                                                        {test.takenDate ? new Date(test.takenDate).toLocaleDateString() : '-'}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Chip
                                                            label={`${test.score}%`}
                                                            size="small"
                                                            color={
                                                                test.score >= 70 ? 'success' :
                                                                    test.score >= 50 ? 'primary' :
                                                                        test.score >= 40 ? 'warning' : 'error'
                                                            }
                                                            variant="outlined"
                                                        />
                                                    </TableCell>
                                                    <TableCell>{test.timeSpent || '-'}</TableCell>
                                                    <TableCell>
                                                        <Button
                                                            size="small"
                                                            variant="text"
                                                            onClick={() => handleDetailsClick(test)}
                                                        >
                                                            Details
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={5} align="center">
                                                    <Typography color="text.secondary">No test history available for this student</Typography>
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </CardContent>
                    </Card>
                </Grid>
            )}
        </Grid>
    );
};

export default StudentPerformanceTab;