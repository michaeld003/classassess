import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
    Container,
    Paper,
    Typography,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    CircularProgress,
    Alert
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { getModuleTests } from '../../services/module';

const TestsList = () => {
    const { moduleId } = useParams();
    const [tests, setTests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [moduleName, setModuleName] = useState('');

    useEffect(() => {
        const fetchTests = async () => {
            setLoading(true);
            try {
                const data = await getModuleTests(moduleId);
                setTests(data);
                // I need to also want to fetch module details to show the module name
                // setModuleName(moduleDetails.title);
            } catch (err) {
                console.error('Error fetching tests:', err);
                setError('Failed to load tests. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        fetchTests();
    }, [moduleId]);

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <Typography variant="h5">Tests for {moduleName || `Module ${moduleId}`}</Typography>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        component={Link}
                        to={`/lecturer/create-test?moduleId=${moduleId}`}
                    >
                        Create New Test
                    </Button>
                </div>

                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                {loading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
                        <CircularProgress />
                    </div>
                ) : tests.length > 0 ? (
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Title</TableCell>
                                    <TableCell>Duration</TableCell>
                                    <TableCell>Start Date</TableCell>
                                    <TableCell>End Date</TableCell>
                                    <TableCell>Status</TableCell>
                                    <TableCell>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {tests.map((test) => (
                                    <TableRow key={test.id}>
                                        <TableCell>{test.title}</TableCell>
                                        <TableCell>{test.durationMinutes} minutes</TableCell>
                                        <TableCell>{new Date(test.startTime).toLocaleString()}</TableCell>
                                        <TableCell>{new Date(test.endTime).toLocaleString()}</TableCell>
                                        <TableCell>
                                            {test.status === 'CANCELLED' ? 'Cancelled' :
                                                new Date(test.endTime) < new Date() ? 'Completed' :
                                                    new Date(test.startTime) > new Date() ? 'Upcoming' : 'Active'}
                                        </TableCell>
                                        <TableCell>
                                            <Button
                                                variant="outlined"
                                                size="small"
                                                component={Link}
                                                to={`/lecturer/modules/${moduleId}/tests/${test.id}`}
                                            >
                                                View
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                ) : (
                    <Typography variant="body1" sx={{ textAlign: 'center', py: 4 }}>
                        No tests found for this module. Create your first test by clicking the button above.
                    </Typography>
                )}
            </Paper>
        </Container>
    );
};

export default TestsList;