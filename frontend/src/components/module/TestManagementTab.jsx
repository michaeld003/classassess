import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box, Typography, Button, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Chip, IconButton,
    Menu, MenuItem, FormControl, InputLabel, Select, Tooltip,
    Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, Card, CardContent, Alert, CircularProgress, Paper
} from '@mui/material';
import {
    RefreshOutlined as RefreshIcon,
    AssignmentOutlined as AssignmentIcon,
    MoreVert as MoreVertIcon,
    FileCopyOutlined as CopyIcon,
    VisibilityOutlined as ViewIcon,
    EditOutlined as EditIcon,
    DeleteOutlined as DeleteIcon,
    ArchiveOutlined as ArchiveIcon,
    UnarchiveOutlined as UnarchiveIcon,
    Check as CheckIcon,
    ArrowUpward as ArrowUpwardIcon,
    ArrowDownward as ArrowDownwardIcon,
    Search as SearchIcon
} from '@mui/icons-material';
import { moduleAPI, testAPI } from '../../services/api';

const TestManagementTab = ({ moduleId, onRefresh }) => {
    const navigate = useNavigate();
    const [tests, setTests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [sortField, setSortField] = useState('date');
    const [sortDirection, setSortDirection] = useState('desc');
    const [filter, setFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [anchorEl, setAnchorEl] = useState(null);
    const [selectedTest, setSelectedTest] = useState(null);
    const [confirmation, setConfirmation] = useState({ open: false, action: null, test: null });
    const [cloneDialog, setCloneDialog] = useState({ open: false, test: null, newTitle: '' });

    // Fetch tests for the module
    const fetchTests = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await moduleAPI.getModuleTests(moduleId);
            setTests(response?.data || []);
        } catch (err) {
            console.error('Error fetching tests:', err);
            setError('Failed to load tests. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTests();
    }, [moduleId]);

    // Handle menu open for a test
    const handleMenuOpen = (event, test) => {
        setAnchorEl(event.currentTarget);
        setSelectedTest(test);
    };

    // Handle menu close
    const handleMenuClose = () => {
        setAnchorEl(null);
        setSelectedTest(null);
    };

    // Handle sort change
    const handleSortChange = (field) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('desc');
        }
    };

    // Handle filter change
    const handleFilterChange = (event) => {
        setFilter(event.target.value);
    };

    // Handle search
    const handleSearch = (event) => {
        setSearchTerm(event.target.value);
    };

    // Clone test
    const handleCloneTest = async () => {
        try {
            if (!cloneDialog.newTitle.trim()) {
                return; // Don't proceed if title is empty
            }

            await moduleAPI.cloneTest(moduleId, cloneDialog.test.id, {
                title: cloneDialog.newTitle
            });

            setCloneDialog({ open: false, test: null, newTitle: '' });
            fetchTests();
        } catch (err) {
            console.error('Error cloning test:', err);
            setError('Failed to clone test. Please try again.');
        }
    };

    // Archive/Unarchive test
    const handleArchiveTest = async (test, archive = true) => {
        try {
            await moduleAPI.archiveTest(moduleId, test.id, archive);
            setConfirmation({ open: false, action: null, test: null });
            fetchTests();
        } catch (err) {
            console.error('Error updating test status:', err);
            setError(`Failed to ${archive ? 'archive' : 'unarchive'} test. Please try again.`);
        }
    };

    // Delete test
    const handleDeleteTest = async (test) => {
        try {
            await moduleAPI.deleteTest(moduleId, test.id);
            setConfirmation({ open: false, action: null, test: null });
            fetchTests();
        } catch (err) {
            console.error('Error deleting test:', err);
            setError('Failed to delete test. Please try again.');
        }
    };

    // Filter and sort tests
    const getFilteredAndSortedTests = () => {
        // First filter the tests
        let filteredTests = [...tests];

        if (filter !== 'all') {
            filteredTests = filteredTests.filter(test => {
                switch (filter) {
                    case 'active':
                        return test.status === 'ACTIVE';
                    case 'upcoming':
                        return test.status === 'SCHEDULED';
                    case 'completed':
                        return test.status === 'COMPLETED';
                    case 'draft':
                        return test.status === 'DRAFT';
                    case 'archived':
                        return test.status === 'ARCHIVED';
                    default:
                        return true;
                }
            });
        }

        // Then apply search term filtering
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filteredTests = filteredTests.filter(test =>
                test.title.toLowerCase().includes(term) ||
                test.description?.toLowerCase().includes(term)
            );
        }

        // Then sort the filtered tests
        return filteredTests.sort((a, b) => {
            let comparison = 0;

            switch (sortField) {
                case 'name':
                    comparison = a.title.localeCompare(b.title);
                    break;
                case 'date':
                    comparison = new Date(a.startTime || a.createdAt) - new Date(b.startTime || b.createdAt);
                    break;
                case 'status':
                    comparison = a.status.localeCompare(b.status);
                    break;
                case 'score':
                    comparison = (a.averageScore || 0) - (b.averageScore || 0);
                    break;
                case 'completion':
                    comparison = (a.completionRate || 0) - (b.completionRate || 0);
                    break;
                default:
                    comparison = 0;
            }

            return sortDirection === 'asc' ? comparison : -comparison;
        });
    };

    // Get status chip for a test
    const getStatusChip = (status) => {
        let color, label;

        switch (status) {
            case 'DRAFT':
                color = 'default';
                label = 'Draft';
                break;
            case 'SCHEDULED':
                color = 'primary';
                label = 'Scheduled';
                break;
            case 'ACTIVE':
                color = 'warning';
                label = 'Active';
                break;
            case 'COMPLETED':
                color = 'success';
                label = 'Completed';
                break;
            case 'ARCHIVED':
                color = 'default';
                label = 'Archived';
                break;
            default:
                color = 'default';
                label = status;
        }

        return <Chip size="small" color={color} label={label} />;
    };

    // Format date for display
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleString();
    };

    // Format percentage for display
    const formatPercentage = (value) => {
        if (value === null || value === undefined) return 'N/A';
        return `${value.toFixed(1)}%`;
    };

    const filteredAndSortedTests = getFilteredAndSortedTests();

    // Update the handleViewTest function to navigate to test details
    const handleViewTest = (test) => {
        handleMenuClose();
        navigate(`/module/${moduleId}/test/${test.id}`);
    };

    // Add a function to create a new test
    const handleCreateTest = () => {
        navigate(`/module/${moduleId}/create-test`);
    };

    return (
        <Card>
            <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                    <Typography variant="h6">Tests</Typography>
                    <Box>
                        <Button
                            variant="contained"
                            startIcon={<AssignmentIcon />}
                            onClick={handleCreateTest}
                        >
                            Create New Test
                        </Button>
                        <IconButton onClick={fetchTests} sx={{ ml: 1 }}>
                            <RefreshIcon />
                        </IconButton>
                    </Box>
                </Box>

                {/* Error message */}
                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                {/* Filters and search */}
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Box display="flex" alignItems="center">
                        <FormControl variant="outlined" size="small" sx={{ minWidth: 150, mr: 2 }}>
                            <InputLabel>Filter</InputLabel>
                            <Select
                                value={filter}
                                onChange={handleFilterChange}
                                label="Filter"
                            >
                                <MenuItem value="all">All Tests</MenuItem>
                                <MenuItem value="active">Active</MenuItem>
                                <MenuItem value="upcoming">Upcoming</MenuItem>
                                <MenuItem value="completed">Completed</MenuItem>
                                <MenuItem value="draft">Draft</MenuItem>
                                <MenuItem value="archived">Archived</MenuItem>
                            </Select>
                        </FormControl>

                        <TextField
                            size="small"
                            placeholder="Search tests..."
                            value={searchTerm}
                            onChange={handleSearch}
                            InputProps={{
                                startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                            }}
                            variant="outlined"
                        />
                    </Box>

                    <Box display="flex" alignItems="center">
                        <Typography variant="body2" sx={{ mr: 1 }}>Sort by:</Typography>
                        <Button
                            size="small"
                            variant={sortField === 'name' ? 'contained' : 'outlined'}
                            onClick={() => handleSortChange('name')}
                            endIcon={sortField === 'name' ?
                                (sortDirection === 'asc' ? <ArrowUpwardIcon fontSize="small" /> : <ArrowDownwardIcon fontSize="small" />)
                                : null
                            }
                            sx={{ mr: 1 }}
                        >
                            Name
                        </Button>
                        <Button
                            size="small"
                            variant={sortField === 'date' ? 'contained' : 'outlined'}
                            onClick={() => handleSortChange('date')}
                            endIcon={sortField === 'date' ?
                                (sortDirection === 'asc' ? <ArrowUpwardIcon fontSize="small" /> : <ArrowDownwardIcon fontSize="small" />)
                                : null
                            }
                            sx={{ mr: 1 }}
                        >
                            Date
                        </Button>
                        <Button
                            size="small"
                            variant={sortField === 'status' ? 'contained' : 'outlined'}
                            onClick={() => handleSortChange('status')}
                            endIcon={sortField === 'status' ?
                                (sortDirection === 'asc' ? <ArrowUpwardIcon fontSize="small" /> : <ArrowDownwardIcon fontSize="small" />)
                                : null
                            }
                            sx={{ mr: 1 }}
                        >
                            Status
                        </Button>
                        <Button
                            size="small"
                            variant={sortField === 'completion' ? 'contained' : 'outlined'}
                            onClick={() => handleSortChange('completion')}
                            endIcon={sortField === 'completion' ?
                                (sortDirection === 'asc' ? <ArrowUpwardIcon fontSize="small" /> : <ArrowDownwardIcon fontSize="small" />)
                                : null
                            }
                        >
                            Completion
                        </Button>
                    </Box>
                </Box>

                {/* Test table */}
                {loading ? (
                    <Box display="flex" justifyContent="center" p={3}>
                        <CircularProgress />
                    </Box>
                ) : error ? (
                    <Alert severity="error">{error}</Alert>
                ) : filteredAndSortedTests.length === 0 ? (
                    <Alert severity="info">
                        No tests found. {filter !== 'all' && 'Try changing your filter or '}
                        Create a new test to get started.
                    </Alert>
                ) : (
                    <TableContainer component={Paper} variant="outlined">
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Title</TableCell>
                                    <TableCell>Status</TableCell>
                                    <TableCell>Date</TableCell>
                                    <TableCell>Duration</TableCell>
                                    <TableCell>Questions</TableCell>
                                    <TableCell>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredAndSortedTests.map((test) => (
                                    <TableRow key={test.id}>
                                        <TableCell>{test.title}</TableCell>
                                        <TableCell>
                                            <Chip
                                                label={test.status || 'DRAFT'}
                                                color={
                                                    test.status === 'COMPLETED' ? 'success' :
                                                    test.status === 'ACTIVE' ? 'warning' :
                                                    test.status === 'SCHEDULED' ? 'primary' : 'default'
                                                }
                                                size="small"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            {test.startTime ? new Date(test.startTime).toLocaleDateString() : 'Not set'}
                                        </TableCell>
                                        <TableCell>{test.durationMinutes || 0} min</TableCell>
                                        <TableCell>{test.questionCount || test.questions?.length || 0}</TableCell>
                                        <TableCell>
                                            <IconButton onClick={() => handleViewTest(test)}>
                                                <ViewIcon />
                                            </IconButton>
                                            <IconButton onClick={(e) => handleMenuOpen(e, test)}>
                                                <MoreVertIcon />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}

                {/* Test actions menu */}
                <Menu
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={handleMenuClose}
                >
                    <MenuItem
                        onClick={() => {
                            handleMenuClose();
                            setCloneDialog({ open: true, test: selectedTest, newTitle: `Copy of ${selectedTest.title}` });
                        }}
                    >
                        <CopyIcon fontSize="small" sx={{ mr: 1 }} />
                        Clone Test
                    </MenuItem>

                    {selectedTest?.status !== 'ARCHIVED' && (
                        <MenuItem
                            onClick={() => {
                                handleMenuClose();
                                setConfirmation({
                                    open: true,
                                    action: 'archive',
                                    test: selectedTest
                                });
                            }}
                        >
                            <ArchiveIcon fontSize="small" sx={{ mr: 1 }} />
                            Archive Test
                        </MenuItem>
                    )}

                    {selectedTest?.status === 'ARCHIVED' && (
                        <MenuItem
                            onClick={() => {
                                handleMenuClose();
                                setConfirmation({
                                    open: true,
                                    action: 'unarchive',
                                    test: selectedTest
                                });
                            }}
                        >
                            <UnarchiveIcon fontSize="small" sx={{ mr: 1 }} />
                            Unarchive Test
                        </MenuItem>
                    )}

                    <MenuItem
                        onClick={() => {
                            handleMenuClose();
                            setConfirmation({
                                open: true,
                                action: 'delete',
                                test: selectedTest
                            });
                        }}
                        sx={{ color: 'error.main' }}
                    >
                        <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
                        Delete Test
                    </MenuItem>
                </Menu>

                {/* Clone test dialog */}
                <Dialog
                    open={cloneDialog.open}
                    onClose={() => setCloneDialog({ open: false, test: null, newTitle: '' })}
                    maxWidth="sm"
                    fullWidth
                >
                    <DialogTitle>Clone Test</DialogTitle>
                    <DialogContent>
                        <Typography variant="body2" paragraph>
                            Create a copy of "{cloneDialog.test?.title}" with a new title:
                        </Typography>
                        <TextField
                            fullWidth
                            label="New Test Title"
                            value={cloneDialog.newTitle}
                            onChange={(e) => setCloneDialog({ ...cloneDialog, newTitle: e.target.value })}
                            autoFocus
                            margin="dense"
                        />
                    </DialogContent>
                    <DialogActions>
                        <Button
                            onClick={() => setCloneDialog({ open: false, test: null, newTitle: '' })}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="contained"
                            color="primary"
                            startIcon={<CheckIcon />}
                            onClick={handleCloneTest}
                            disabled={!cloneDialog.newTitle.trim()}
                        >
                            Clone Test
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* Confirmation dialog */}
                <Dialog
                    open={confirmation.open}
                    onClose={() => setConfirmation({ open: false, action: null, test: null })}
                >
                    <DialogTitle>
                        {confirmation.action === 'delete' ? 'Delete Test' :
                            confirmation.action === 'archive' ? 'Archive Test' :
                                'Unarchive Test'}
                    </DialogTitle>
                    <DialogContent>
                        {confirmation.action === 'delete' ? (
                            <Typography>
                                Are you sure you want to delete "{confirmation.test?.title}"? This action cannot be undone.
                            </Typography>
                        ) : confirmation.action === 'archive' ? (
                            <Typography>
                                Are you sure you want to archive "{confirmation.test?.title}"?
                                Archived tests are hidden from students but can be unarchived later.
                            </Typography>
                        ) : (
                            <Typography>
                                Are you sure you want to unarchive "{confirmation.test?.title}"?
                                This will restore the test to its previous state.
                            </Typography>
                        )}
                    </DialogContent>
                    <DialogActions>
                        <Button
                            onClick={() => setConfirmation({ open: false, action: null, test: null })}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="contained"
                            color={confirmation.action === 'delete' ? 'error' : 'primary'}
                            onClick={() => {
                                if (confirmation.action === 'delete') {
                                    handleDeleteTest(confirmation.test);
                                } else if (confirmation.action === 'archive') {
                                    handleArchiveTest(confirmation.test, true);
                                } else {
                                    handleArchiveTest(confirmation.test, false);
                                }
                            }}
                        >
                            {confirmation.action === 'delete' ? 'Delete' :
                                confirmation.action === 'archive' ? 'Archive' :
                                    'Unarchive'}
                        </Button>
                    </DialogActions>
                </Dialog>
            </CardContent>
        </Card>
    );
};

export default TestManagementTab;