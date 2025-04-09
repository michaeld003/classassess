import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Container, Paper, Typography, Box, Grid,
    Card, CardContent, Tab, Tabs, List, ListItem, ListItemText,
    Button, useTheme, CircularProgress, Alert, TextField,
    IconButton, Divider, Dialog, DialogActions, DialogContent,
    DialogContentText, DialogTitle, InputAdornment
} from '@mui/material';
import {
    School as SchoolIcon,
    Timeline as TimelineIcon,
    People as PeopleIcon,
    Edit as EditIcon,
    Save as SaveIcon,
    Cancel as CancelIcon,
    Upload as UploadIcon,
    AddComment as AddCommentIcon,
    Delete as DeleteIcon
} from '@mui/icons-material';
import StudentPerformanceTab from './StudentPerformanceTab';
import { moduleAPI, authAPI, testAPI } from '../../services/api';

const ModuleDetails = () => {
    const { moduleId } = useParams();
    const navigate = useNavigate();
    const [currentTab, setCurrentTab] = useState(0);
    const theme = useTheme();
    const [moduleData, setModuleData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [userRole, setUserRole] = useState(null);
    const [editMode, setEditMode] = useState(false);
    const [editedDescription, setEditedDescription] = useState('');

    // state variables for announcements and resources
    const [announcements, setAnnouncements] = useState([]);
    const [resources, setResources] = useState([]);

    //a refresh trigger to force re-renders
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    // Resource upload states
    const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
    const [resourceTitle, setResourceTitle] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef(null);

    // Announcement states
    const [announcementDialogOpen, setAnnouncementDialogOpen] = useState(false);
    const [announcementTitle, setAnnouncementTitle] = useState('');
    const [announcementContent, setAnnouncementContent] = useState('');
    const [postingAnnouncement, setPostingAnnouncement] = useState(false);

    const [downloading, setDownloading] = useState(null);
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    // Fetch user role from auth context or localStorage
    useEffect(() => {
        const fetchUserRole = async () => {
            try {
                // Get user profile from API
                const response = await authAPI.getProfile();

                // Extract role from response
                const role = response.data?.role;
                setUserRole(role);
            } catch (err) {
                console.error('Error fetching user role:', err);
                // Default to student for safety
                setUserRole('STUDENT');
            }
        };

        fetchUserRole();
    }, []);

    // Fetch module data
    const fetchModuleData = useCallback(async () => {
        try {
            console.log('Starting to fetch module data...');
            setLoading(true);
            setError(null);

            if (!authAPI.isAuthenticated()) {
                console.log('Not authenticated, redirecting to login');
                navigate('/login');
                return;
            }

            console.log('Fetching module with ID:', moduleId);

            // Add timeout to prevent hanging requests
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

            try {
                const response = await moduleAPI.getById(moduleId);
                clearTimeout(timeoutId);

                console.log('Module data response received:', response);

                if (response && response.data) {
                    console.log('Setting module data from response.data');
                    setModuleData(response.data);
                    setEditedDescription(response.data.description || '');
                } else if (response) {
                    console.log('Setting module data directly from response');
                    setModuleData(response);
                    setEditedDescription(response.description || '');
                } else {
                    throw new Error('No data received from server');
                }
            } catch (fetchError) {
                clearTimeout(timeoutId);
                throw fetchError;
            }
        } catch (err) {
            console.error('Error in fetchModuleData:', err);

            // Always set error state regardless of error type
            setError(err.message || 'Failed to fetch module details');

            // Important: Set moduleData to null or a default state
            setModuleData(null);
        } finally {
            // Always set loading to false, no matter what happens
            console.log('Finished fetchModuleData, setting loading to false');
            setLoading(false);
        }
    }, [moduleId, navigate]);

    useEffect(() => {
        console.log('useEffect triggered for fetchModuleData');
        if (moduleId) {
            fetchModuleData();
            fetchAnnouncements();
            fetchResources();
        }
    }, [moduleId, fetchModuleData, refreshTrigger]); // Added refreshTrigger to dependencies

    const handleTabChange = (event, newValue) => {
        setCurrentTab(newValue);
    };

    const handleSaveDescription = async () => {
        try {
            await moduleAPI.updateModule(moduleId, {
                ...moduleData,
                description: editedDescription
            });

            setModuleData(prevData => ({
                ...prevData,
                description: editedDescription
            }));

            setEditMode(false);
        } catch (err) {
            console.error('Error updating module description:', err);
            // Show error message to user
        }
    };

    // Resource handling functions
    const handleViewResource = async (resourceId) => {
        try {
            setDownloading(resourceId); // Track which resource is downloading

            let blob;
            try {
                // Try the standard method first
                blob = await moduleAPI.getResource(resourceId);
            } catch (err) {
                console.warn('Standard download failed, trying fallback...', err);
                // If that fails, try the fallback method
                blob = await moduleAPI.getResourceWithFallback(resourceId, moduleId);
            }

            // Create a download link
            const url = window.URL.createObjectURL(blob);
            const filename = getResourceFilename(resources.find(r => r.id === resourceId));

            // Create a temporary link element and trigger download
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();

            // Clean up
            window.URL.revokeObjectURL(url);
            document.body.removeChild(link);

            // Show success message
            setSuccessMessage('Resource downloaded successfully');
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (err) {
            console.error('Error fetching resource:', err);
            setErrorMessage(err.message || 'Failed to download resource');
            setTimeout(() => setErrorMessage(''), 5000);
        } finally {
            setDownloading(null);
        }
    };

// Add this helper function near your other utility functions
    const getResourceFilename = (resource) => {
        if (!resource) return 'download';

        // Use title as filename if available, otherwise use a generic name
        let filename = resource.title || 'resource';

        // Clean up filename (remove invalid characters)
        filename = filename.replace(/[/\\?%*:|"<>]/g, '-');

        // Add extension if type is known
        if (resource.type) {
            const typeToExt = {
                'application/pdf': '.pdf',
                'application/msword': '.doc',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
                'application/vnd.ms-excel': '.xls',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
                'application/vnd.ms-powerpoint': '.ppt',
                'application/vnd.openxmlformats-officedocument.presentationml.presentation': '.pptx',
                'text/plain': '.txt',
                'text/csv': '.csv',
                'image/jpeg': '.jpg',
                'image/png': '.png',
                'image/gif': '.gif'
            };

            // Add appropriate extension based on mime type
            const ext = typeToExt[resource.type] || '';
            if (ext && !filename.endsWith(ext)) {
                filename += ext;
            }
        }

        return filename;
    };

    const handleUploadDialogOpen = () => {
        setResourceTitle('');
        setSelectedFile(null);
        setUploadDialogOpen(true);
    };

    const handleUploadDialogClose = () => {
        setUploadDialogOpen(false);
    };

    const handleFileSelect = (event) => {
        setSelectedFile(event.target.files[0]);
    };

    const handleResourceUpload = async () => {
        if (!selectedFile || !resourceTitle) {
            alert("Please provide both a title and select a file");
            return;
        }

        try {
            setUploading(true);

            // Create form data
            const formData = new FormData();
            formData.append('title', resourceTitle);
            formData.append('description', '');
            formData.append('file', selectedFile);

            console.log('Uploading file:', selectedFile.name);

            // Upload the resource
            const newResource = await moduleAPI.uploadResource(moduleId, formData);
            console.log('New resource uploaded:', newResource);

            // Update both state variables
            setResources(prev => [newResource, ...prev]);

            // Update moduleData as well
            setModuleData(prevData => {
                const currentResources = prevData?.resources || [];
                return {
                    ...prevData,
                    resources: [newResource, ...currentResources]
                };
            });

            // Close dialog and reset form
            setUploadDialogOpen(false);
            setResourceTitle('');
            setSelectedFile(null);

        } catch (err) {
            console.error('Error uploading resource:', err);
            alert('Failed to upload resource: ' + (err.message || 'Unknown error'));
        } finally {
            setUploading(false);
        }
    };

    const handleDeleteResource = async (resourceId) => {
        try {
            if (window.confirm('Are you sure you want to delete this resource?')) {
                await moduleAPI.deleteResource(moduleId, resourceId);

                // Update both state variables
                setResources(prev => prev.filter(r => r.id !== resourceId));

                // Update moduleData as well
                setModuleData(prevData => {
                    if (!prevData || !prevData.resources) return prevData;
                    return {
                        ...prevData,
                        resources: prevData.resources.filter(r => r.id !== resourceId)
                    };
                });
            }
        } catch (err) {
            console.error('Error deleting resource:', err);
        }
    };

    // Announcement handling functions
    const handleAnnouncementDialogOpen = () => {
        setAnnouncementTitle('');
        setAnnouncementContent('');
        setAnnouncementDialogOpen(true);
    };

    const handleAnnouncementDialogClose = () => {
        setAnnouncementDialogOpen(false);
    };

    const handlePostAnnouncement = async () => {
        if (!announcementTitle.trim() || !announcementContent.trim()) {
            return;
        }

        try {
            setPostingAnnouncement(true);

            // Post announcement
            const newAnnouncement = await moduleAPI.postAnnouncement(moduleId, {
                title: announcementTitle,
                content: announcementContent
            });

            console.log('New announcement:', newAnnouncement);

            // Update both state variables
            setAnnouncements(prev => [newAnnouncement, ...prev]);

            // Update moduleData as well for consistency
            setModuleData(prevData => {
                const currentAnnouncements = prevData?.announcements || [];
                return {
                    ...prevData,
                    announcements: [newAnnouncement, ...currentAnnouncements]
                };
            });

            // Close dialog and reset form
            setAnnouncementDialogOpen(false);
            setAnnouncementTitle('');
            setAnnouncementContent('');

        } catch (err) {
            console.error('Error posting announcement:', err);
        } finally {
            setPostingAnnouncement(false);
        }
    };

    const fetchAnnouncements = async () => {
        try {
            console.log('Fetching announcements for module:', moduleId);
            const announcementsData = await moduleAPI.getModuleAnnouncements(moduleId);
            console.log('Announcements response:', announcementsData);

            // Set announcements state directly
            setAnnouncements(announcementsData || []);

            // Also update moduleData but only if needed for other components
            setModuleData(prevData => {
                if (!prevData) return prevData;
                return {
                    ...prevData,
                    announcements: announcementsData
                };
            });
        } catch (err) {
            console.error('Error fetching announcements:', err);
            setAnnouncements([]);
        }
    };

    const fetchResources = async () => {
        try {
            console.log('Fetching resources for module:', moduleId);
            const resourcesData = await moduleAPI.getModuleResources(moduleId);
            console.log('Resources response:', resourcesData);

            // Set resources state directly
            setResources(resourcesData || []);

            // Also update moduleData but only if needed for other components
            setModuleData(prevData => {
                if (!prevData) return prevData;
                return {
                    ...prevData,
                    resources: resourcesData
                };
            });
        } catch (err) {
            console.error('Error fetching resources:', err);
            setResources([]);
        }
    };

    const handleDeleteAnnouncement = async (announcementId) => {
        try {
            if (window.confirm('Are you sure you want to delete this announcement?')) {
                await moduleAPI.deleteAnnouncement(moduleId, announcementId);

                // Update both state variables
                setAnnouncements(prev => prev.filter(a => a.id !== announcementId));

                // Update moduleData as well
                setModuleData(prevData => {
                    if (!prevData || !prevData.announcements) return prevData;
                    return {
                        ...prevData,
                        announcements: prevData.announcements.filter(a => a.id !== announcementId)
                    };
                });
            }
        } catch (err) {
            console.error('Error deleting announcement:', err);
        }
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
            <Container>
                <Alert severity="error" sx={{ mt: 4 }}>
                    {error}
                </Alert>
                <Button onClick={() => navigate('/dashboard')} sx={{ mt: 2 }}>
                    Back to Dashboard
                </Button>
            </Container>
        );
    }

    if (!moduleData) {
        return (
            <Container>
                <Alert severity="warning" sx={{ mt: 4 }}>
                    Unable to load module data. The module may not exist or you may not have permission to view it.
                </Alert>
                <Button onClick={() => navigate('/dashboard')} sx={{ mt: 2 }}>
                    Back to Dashboard
                </Button>
                <Button onClick={() => {
                    setLoading(true);
                    fetchModuleData().finally(() => setLoading(false));
                }} sx={{ mt: 2, ml: 2 }}>
                    Retry Loading
                </Button>
            </Container>
        );
    }

    // Module Information Section with edit functionality for lecturers
    const renderModuleInformation = () => (
        <Card sx={{ mb: 3 }}>
            <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h6">Module Information</Typography>
                    {userRole === 'LECTURER' && !editMode && (
                        <IconButton onClick={() => setEditMode(true)} size="small">
                            <EditIcon />
                        </IconButton>
                    )}
                </Box>

                {!editMode ? (
                    <Typography variant="body1" paragraph>
                        {moduleData.description || 'No description available.'}
                    </Typography>
                ) : (
                    <Box mb={2}>
                        <TextField
                            fullWidth
                            multiline
                            rows={4}
                            value={editedDescription}
                            onChange={(e) => setEditedDescription(e.target.value)}
                            variant="outlined"
                        />
                        <Box display="flex" justifyContent="flex-end" mt={1}>
                            <Button
                                startIcon={<CancelIcon />}
                                onClick={() => {
                                    setEditMode(false);
                                    setEditedDescription(moduleData.description || '');
                                }}
                                sx={{ mr: 1 }}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="contained"
                                color="primary"
                                startIcon={<SaveIcon />}
                                onClick={handleSaveDescription}
                            >
                                Save
                            </Button>
                        </Box>
                    </Box>
                )}
            </CardContent>
        </Card>
    );

    // Announcements Section - Updated to use announcements state
    const renderAnnouncements = () => (
        <Card sx={{ mb: 3 }}>
            <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h6">Recent Announcements</Typography>
                    {userRole === 'LECTURER' && (
                        <Button
                            variant="outlined"
                            color="primary"
                            startIcon={<AddCommentIcon />}
                            size="small"
                            onClick={handleAnnouncementDialogOpen}
                        >
                            Post Announcement
                        </Button>
                    )}
                </Box>
                <div className="announcement-list">
                    {announcements && announcements.length > 0 ? (
                        announcements.map((announcement) => (
                            <Box key={`announcement-${announcement.id}`} sx={{ mb: 2, p: 2, border: '1px solid #ddd', borderRadius: 1 }}>
                                <Typography variant="subtitle1">{announcement.title}</Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Posted on {new Date(announcement.date).toLocaleDateString()}
                                </Typography>
                                <Typography variant="body2" sx={{ mt: 1 }}>
                                    {announcement.content}
                                </Typography>
                                {userRole === 'LECTURER' && (
                                    <IconButton
                                        edge="end"
                                        size="small"
                                        onClick={() => handleDeleteAnnouncement(announcement.id)}
                                    >
                                        <DeleteIcon />
                                    </IconButton>
                                )}
                            </Box>
                        ))
                    ) : (
                        <Typography color="textSecondary">No announcements</Typography>
                    )}
                </div>
            </CardContent>
        </Card>
    );

    // Resources Section
    const renderResources = () => (
        <Card>
            <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h6">Learning Resources</Typography>
                    {userRole === 'LECTURER' && (
                        <Button
                            variant="outlined"
                            color="primary"
                            startIcon={<UploadIcon />}
                            size="small"
                            onClick={handleUploadDialogOpen}
                        >
                            Upload Resource
                        </Button>
                    )}
                </Box>

                {/* Success/Error Messages */}
                {successMessage && (
                    <Alert severity="success" sx={{ mb: 2 }}>
                        {successMessage}
                    </Alert>
                )}
                {errorMessage && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {errorMessage}
                    </Alert>
                )}

                <div className="resource-list">
                    {resources && resources.length > 0 ? (
                        resources.map((resource) => (
                            <Box key={`resource-${resource.id}`} sx={{ mb: 2, p: 2, border: '1px solid #ddd', borderRadius: 1 }}>
                                <Typography variant="subtitle1">{resource.title}</Typography>
                                <Typography variant="body2">Type: {resource.type}</Typography>
                                <Box sx={{ mt: 1, display: 'flex', justifyContent: 'flex-end' }}>
                                    <Button
                                        size="small"
                                        onClick={() => handleViewResource(resource.id)}
                                        disabled={downloading === resource.id}
                                        startIcon={downloading === resource.id ? <CircularProgress size={16} /> : null}
                                        sx={{ mr: 1 }}
                                    >
                                        {downloading === resource.id ? 'Downloading...' : 'Download'}
                                    </Button>
                                    {userRole === 'LECTURER' && (
                                        <IconButton
                                            edge="end"
                                            size="small"
                                            onClick={() => handleDeleteResource(resource.id)}
                                            disabled={downloading === resource.id}
                                        >
                                            <DeleteIcon />
                                        </IconButton>
                                    )}
                                </Box>
                            </Box>
                        ))
                    ) : (
                        <Typography color="textSecondary">No resources available</Typography>
                    )}
                </div>
            </CardContent>
        </Card>
    );

    // Overview Tab Content for Student and Lecturer
    const renderOverview = () => (
        <Grid container spacing={3}>
            <Grid item xs={12}>
                {renderModuleInformation()}
            </Grid>
            <Grid item xs={12}>
                {renderAnnouncements()}
            </Grid>
            <Grid item xs={12}>
                {renderResources()}
            </Grid>
        </Grid>
    );

    // Student Performance Tab
    const renderStudentPerformance = () => (
        <StudentPerformanceTab moduleId={moduleId} />
    );

    return (
        <>
            <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
                <Paper
                    elevation={3}
                    sx={{
                        p: 3,
                        mb: 3,
                        backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)'
                    }}
                >
                    <Box display="flex" alignItems="center" mb={2}>
                        <SchoolIcon sx={{ fontSize: 40, mr: 2, color: 'primary.main' }} />
                        <Box>
                            <Typography variant="h4">
                                {moduleData.code}
                            </Typography>
                            <Typography variant="h6" color="textSecondary">
                                {moduleData.title}
                            </Typography>
                        </Box>
                    </Box>
                    <Typography variant="subtitle1">
                        Instructor: {moduleData.lecturerName}
                    </Typography>
                    {moduleData.isActive === false && (
                        <Alert severity="warning" sx={{ mt: 2 }}>
                            This module is currently inactive. Students cannot access it.
                        </Alert>
                    )}
                </Paper>

                <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                    {userRole === 'STUDENT' ? (
                        // Tabs for student - just Overview
                        <Tabs value={currentTab} onChange={handleTabChange}>
                            <Tab icon={<TimelineIcon />} label="Overview" />
                        </Tabs>
                    ) : (
                        // Tabs for lecturer - Overview and Student Performance
                        <Tabs value={currentTab} onChange={handleTabChange}>
                            <Tab icon={<TimelineIcon />} label="Overview" />
                            <Tab icon={<PeopleIcon />} label="Student Performance" />
                        </Tabs>
                    )}
                </Box>

                {userRole === 'STUDENT' ? (
                    // Content for student tabs - just Overview
                    renderOverview()
                ) : (
                    // Content for lecturer tabs - Overview and Student Performance
                    <>
                        {currentTab === 0 && renderOverview()}
                        {currentTab === 1 && renderStudentPerformance()}
                    </>
                )}
            </Container>

            {/* Resource Upload Dialog */}
            <Dialog open={uploadDialogOpen} onClose={handleUploadDialogClose}>
                <DialogTitle>Upload Resource</DialogTitle>
                <DialogContent>
                    <DialogContentText mb={2}>
                        Upload a resource for students to download.
                    </DialogContentText>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Resource Title"
                        fullWidth
                        value={resourceTitle}
                        onChange={(e) => setResourceTitle(e.target.value)}
                        sx={{ mb: 2 }}
                    />
                    <input
                        type="file"
                        ref={fileInputRef}
                        style={{ display: 'none' }}
                        onChange={handleFileSelect}
                    />
                    <Button
                        variant="outlined"
                        onClick={() => fileInputRef.current?.click()}
                        startIcon={<UploadIcon />}
                        sx={{ mb: 1 }}
                    >
                        Select File
                    </Button>
                    {selectedFile && (
                        <Typography variant="body2" color="text.secondary">
                            Selected file: {selectedFile.name}
                        </Typography>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleUploadDialogClose}>Cancel</Button>
                    <Button
                        onClick={handleResourceUpload}
                        variant="contained"
                        disabled={!selectedFile || !resourceTitle || uploading}
                    >
                        {uploading ? 'Uploading...' : 'Upload'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Announcement Dialog */}
            <Dialog
                open={announcementDialogOpen}
                onClose={handleAnnouncementDialogClose}
                fullWidth
                maxWidth="sm"
            >
                <DialogTitle>Post Announcement</DialogTitle>
                <DialogContent>
                    <DialogContentText mb={2}>
                        Post an announcement for students to see.
                    </DialogContentText>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Announcement Title"
                        fullWidth
                        value={announcementTitle}
                        onChange={(e) => setAnnouncementTitle(e.target.value)}
                        sx={{ mb: 2 }}
                    />
                    <TextField
                        margin="dense"
                        label="Announcement Content"
                        multiline
                        rows={4}
                        fullWidth
                        value={announcementContent}
                        onChange={(e) => setAnnouncementContent(e.target.value)}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleAnnouncementDialogClose}>Cancel</Button>
                    <Button
                        onClick={handlePostAnnouncement}
                        variant="contained"
                        disabled={!announcementTitle || !announcementContent || postingAnnouncement}
                    >
                        {postingAnnouncement ? 'Posting...' : 'Post'}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default ModuleDetails;