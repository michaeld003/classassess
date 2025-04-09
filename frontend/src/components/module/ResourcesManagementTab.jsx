import { useState, useEffect, useRef } from 'react';
import {
    Box, Typography, Button, Card, CardContent, Grid, IconButton,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    TextField, InputAdornment, Dialog, DialogTitle, DialogContent,
    DialogActions, Chip, CircularProgress, Alert, FormControl,
    InputLabel, Select, MenuItem, Paper, List, ListItem, ListItemText,
    ListItemSecondaryAction, Divider, Tooltip, FormHelperText
} from '@mui/material';
import {
    CloudUpload as UploadIcon,
    Search as SearchIcon,
    FilterList as FilterIcon,
    Delete as DeleteIcon,
    Edit as EditIcon,
    Description as FileIcon,
    Visibility as ViewIcon,
    Link as LinkIcon,
    Book as BookIcon,
    YouTube as YouTubeIcon,
    Article as ArticleIcon,
    Event as EventIcon,
    Add as AddIcon,
    Close as CloseIcon,
    BarChart as ChartIcon,
    Category as CategoryIcon,
    Download as DownloadIcon,
    Refresh as RefreshIcon
} from '@mui/icons-material';
import { moduleAPI } from '../../services/api';

const ResourcesManagementTab = ({ moduleId }) => {
    const [resources, setResources] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState('all');
    const [uploadDialog, setUploadDialog] = useState(false);
    const [deleteConfirmation, setDeleteConfirmation] = useState({ open: false, resource: null });
    const [resourceStats, setResourceStats] = useState(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isUploading, setIsUploading] = useState(false);
    const [categoryDialog, setCategoryDialog] = useState(false);
    const [categories, setCategories] = useState(['Lecture Notes', 'Tutorial Materials', 'Additional Reading', 'Sample Code']);
    const [newCategory, setNewCategory] = useState('');

    // Form state for resource upload
    const [resourceForm, setResourceForm] = useState({
        title: '',
        description: '',
        type: 'FILE',
        category: '',
        url: '',
        file: null
    });
    const [formErrors, setFormErrors] = useState({});

    // Ref for the file input
    const fileInputRef = useRef(null);

    // Fetch resources
    const fetchResources = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await moduleAPI.getModuleResources(moduleId);
            setResources(response?.data || []);


            const resourceCategories = [...new Set(response.map(r => r.category).filter(Boolean))];


            const newCategories = resourceCategories.filter(c => !categories.includes(c));
            if (newCategories.length > 0) {
                setCategories([...categories, ...newCategories]);
            }

            // Calculate resource stats
            setResourceStats({
                totalViews: response.reduce((sum, r) => sum + (r.views || 0), 0),
                mostViewed: response.length > 0
                    ? response.reduce((prev, current) => (prev.views > current.views) ? prev : current)
                    : null,
                categories: resourceCategories.length,
                totalDownloads: response.reduce((sum, r) => sum + (r.downloads || 0), 0)
            });
        } catch (err) {
            console.error('Error fetching resources:', err);
            setError('Failed to load resources. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchResources();
    }, [moduleId]);

    // Handle resource form changes
    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setResourceForm({
            ...resourceForm,
            [name]: value
        });

        // Clear error for this field if it exists
        if (formErrors[name]) {
            setFormErrors({
                ...formErrors,
                [name]: null
            });
        }
    };

    // Handle file selection
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setResourceForm({
                ...resourceForm,
                file,
                title: file.name.split('.')[0] // Use filename as default title
            });

            // Clear file error if it exists
            if (formErrors.file) {
                setFormErrors({
                    ...formErrors,
                    file: null
                });
            }
        }
    };

    // Fetch categories
    const fetchCategories = async () => {
        try {
            const response = await moduleAPI.getResourceCategories(moduleId);
            if (response && Array.isArray(response)) {
                setCategories(response);
            }
        } catch (err) {
            console.error('Error fetching categories:', err);

        }
    };

    // Validate form before submission
    const validateForm = () => {
        const errors = {};

        if (!resourceForm.title.trim()) {
            errors.title = 'Title is required';
        }

        if (resourceForm.type === 'FILE' && !resourceForm.file) {
            errors.file = 'Please select a file to upload';
        }

        if (resourceForm.type === 'URL' && !resourceForm.url.trim()) {
            errors.url = 'URL is required';
        } else if (resourceForm.type === 'URL' && !isValidUrl(resourceForm.url)) {
            errors.url = 'Please enter a valid URL';
        }

        if (!resourceForm.category) {
            errors.category = 'Please select a category';
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    // Check if URL is valid
    const isValidUrl = (url) => {
        try {
            new URL(url);
            return true;
        } catch (e) {
            return false;
        }
    };

    // Handle resource upload
    const handleResourceUpload = async () => {
        if (!validateForm()) {
            return;
        }

        try {
            setIsUploading(true);
            setUploadProgress(0);

            // Create form data for API
            const formData = new FormData();
            formData.append('title', resourceForm.title);
            formData.append('description', resourceForm.description || '');
            formData.append('type', resourceForm.type);
            formData.append('category', resourceForm.category);

            if (resourceForm.type === 'FILE') {
                formData.append('file', resourceForm.file);
            } else {
                formData.append('url', resourceForm.url);
            }

            // Simulate upload progress
            const progressInterval = setInterval(() => {
                setUploadProgress(prev => {
                    if (prev >= 90) {
                        clearInterval(progressInterval);
                        return 90;
                    }
                    return prev + 10;
                });
            }, 300);

            // Upload the resource
            await moduleAPI.uploadResource(moduleId, formData);

            // Set progress to 100% when done
            clearInterval(progressInterval);
            setUploadProgress(100);

            // Close dialog and refresh resource list
            setTimeout(() => {
                setUploadDialog(false);
                setIsUploading(false);
                resetForm();
                fetchResources();
            }, 500);
        } catch (err) {
            console.error('Error uploading resource:', err);
            setFormErrors({
                ...formErrors,
                submit: 'Failed to upload resource. Please try again.'
            });
            setIsUploading(false);
            setUploadProgress(0);
        }
    };

    // Handle resource deletion
    const handleDeleteResource = async () => {
        if (!deleteConfirmation.resource) return;

        try {
            await moduleAPI.deleteResource(moduleId, deleteConfirmation.resource.id);
            setDeleteConfirmation({ open: false, resource: null });

            // Update local state
            setResources(resources.filter(r => r.id !== deleteConfirmation.resource.id));
        } catch (err) {
            console.error('Error deleting resource:', err);
            setError('Failed to delete resource. Please try again.');
        }
    };

    // Handle view/download resource
    const handleViewResource = async (resource) => {
        try {
            // For File type resources
            if (resource.type === 'FILE') {
                const blob = await moduleAPI.downloadResource(moduleId, resource.id);

                // Create URL and open in new tab
                const url = URL.createObjectURL(blob);
                window.open(url, '_blank');

                // Update resource views count locally
                setResources(resources.map(r =>
                    r.id === resource.id
                        ? { ...r, views: (r.views || 0) + 1, downloads: (r.downloads || 0) + 1 }
                        : r
                ));
            }
            // For URL type resources
            else if (resource.type === 'URL') {
                window.open(resource.url, '_blank');

                // Update resource views count locally
                setResources(resources.map(r =>
                    r.id === resource.id
                        ? { ...r, views: (r.views || 0) + 1 }
                        : r
                ));
            }
        } catch (err) {
            console.error('Error accessing resource:', err);
            setError('Failed to access the resource. Please try again.');
        }
    };

    // Add new category
    const handleAddCategory = () => {
        if (newCategory.trim() && !categories.includes(newCategory.trim())) {
            setCategories([...categories, newCategory.trim()]);
            setNewCategory('');
        }
    };

    // Reset form after submission
    const resetForm = () => {
        setResourceForm({
            title: '',
            description: '',
            type: 'FILE',
            category: '',
            url: '',
            file: null
        });
        setFormErrors({});
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    // Filter resources by search term and category
    const getFilteredResources = () => {
        return resources.filter(resource => {
            const matchesSearch =
                resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                resource.description?.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesFilter =
                filter === 'all' ||
                resource.category.toLowerCase() === filter.toLowerCase() ||
                (filter === 'url' && resource.type === 'URL') ||
                (filter === 'file' && resource.type === 'FILE');

            return matchesSearch && matchesFilter;
        });
    };

    // Get icon for resource type
    const getResourceIcon = (type, category) => {
        if (type === 'URL') {
            // Different icons based on URL category
            if (category?.toLowerCase().includes('video') || category?.toLowerCase().includes('youtube')) {
                return <YouTubeIcon color="error" />;
            } else if (category?.toLowerCase().includes('article') || category?.toLowerCase().includes('reading')) {
                return <ArticleIcon color="primary" />;
            } else if (category?.toLowerCase().includes('event') || category?.toLowerCase().includes('workshop')) {
                return <EventIcon color="secondary" />;
            } else {
                return <LinkIcon color="primary" />;
            }
        } else {
            // Icon for file types
            return <FileIcon color="action" />;
        }
    };

    // Filter options for the resource list
    const filterOptions = [
        { value: 'all', label: 'All Resources' },
        { value: 'file', label: 'Files Only' },
        { value: 'url', label: 'URLs Only' },
        ...categories.map(cat => ({ value: cat.toLowerCase(), label: cat }))
    ];

    const filteredResources = getFilteredResources();

    return (
        <Card>
            <CardContent>
                {/* Header with title and actions */}
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                    <Typography variant="h6">Learning Resources</Typography>
                    <Box>
                        <Button
                            variant="outlined"
                            color="primary"
                            startIcon={<CategoryIcon />}
                            onClick={() => setCategoryDialog(true)}
                            sx={{ mr: 1 }}
                        >
                            Categories
                        </Button>
                        <Button
                            variant="outlined"
                            color="primary"
                            startIcon={<RefreshIcon />}
                            onClick={fetchResources}
                            sx={{ mr: 1 }}
                        >
                            Refresh
                        </Button>
                        <Button
                            variant="contained"
                            color="primary"
                            startIcon={<UploadIcon />}
                            onClick={() => setUploadDialog(true)}
                        >
                            Add Resource
                        </Button>
                    </Box>
                </Box>

                {/* Error message */}
                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                {/* Resource statistics */}
                {resourceStats && (
                    <Grid container spacing={2} sx={{ mb: 3 }}>
                        <Grid item xs={6} sm={3}>
                            <Card variant="outlined">
                                <CardContent>
                                    <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                                        Total Resources
                                    </Typography>
                                    <Typography variant="h5">
                                        {resources.length}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                            <Card variant="outlined">
                                <CardContent>
                                    <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                                        Total Views
                                    </Typography>
                                    <Typography variant="h5">
                                        {resourceStats.totalViews}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                            <Card variant="outlined">
                                <CardContent>
                                    <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                                        Categories
                                    </Typography>
                                    <Typography variant="h5">
                                        {resourceStats.categories}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                            <Card variant="outlined">
                                <CardContent>
                                    <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                                        Downloads
                                    </Typography>
                                    <Typography variant="h5">
                                        {resourceStats.totalDownloads}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>
                )}

                {/* Search and filtering */}
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <TextField
                        placeholder="Search resources..."
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
                        sx={{ width: 300 }}
                    />

                    <FormControl variant="outlined" size="small" sx={{ minWidth: 200 }}>
                        <InputLabel>Filter</InputLabel>
                        <Select
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            label="Filter"
                            startAdornment={<FilterIcon fontSize="small" sx={{ mr: 1 }} />}
                        >
                            {filterOptions.map(option => (
                                <MenuItem key={option.value} value={option.value}>
                                    {option.label}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Box>

                {/* Resources table */}
                {loading ? (
                    <Box display="flex" justifyContent="center" py={4}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <TableContainer component={Paper} variant="outlined">
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell width="40%">Resource</TableCell>
                                    <TableCell>Category</TableCell>
                                    <TableCell>Type</TableCell>
                                    <TableCell>Views</TableCell>
                                    <TableCell>Date Added</TableCell>
                                    <TableCell align="right">Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredResources.length > 0 ? (
                                    filteredResources.map((resource) => (
                                        <TableRow key={resource.id} hover>
                                            <TableCell>
                                                <Box display="flex" alignItems="center">
                                                    {getResourceIcon(resource.type, resource.category)}
                                                    <Box ml={2}>
                                                        <Typography variant="body2" fontWeight="medium">
                                                            {resource.title}
                                                        </Typography>
                                                        {resource.description && (
                                                            <Typography variant="caption" color="text.secondary">
                                                                {resource.description.length > 60
                                                                    ? `${resource.description.substring(0, 60)}...`
                                                                    : resource.description}
                                                            </Typography>
                                                        )}
                                                    </Box>
                                                </Box>
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={resource.category}
                                                    size="small"
                                                    color="primary"
                                                    variant="outlined"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                {resource.type === 'FILE' ? 'File' : 'URL'}
                                            </TableCell>
                                            <TableCell>
                                                {resource.views || 0}
                                            </TableCell>
                                            <TableCell>
                                                {new Date(resource.createdAt).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell align="right">
                                                <Tooltip title={resource.type === 'FILE' ? 'Download' : 'Open Link'}>
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleViewResource(resource)}
                                                    >
                                                        {resource.type === 'FILE'
                                                            ? <DownloadIcon fontSize="small" />
                                                            : <ViewIcon fontSize="small" />
                                                        }
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Delete">
                                                    <IconButton
                                                        size="small"
                                                        color="error"
                                                        onClick={() => setDeleteConfirmation({ open: true, resource })}
                                                    >
                                                        <DeleteIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                                            <Typography color="text.secondary">
                                                {searchTerm || filter !== 'all'
                                                    ? 'No resources match your filters'
                                                    : 'No resources available for this module'}
                                            </Typography>
                                            {searchTerm || filter !== 'all' ? (
                                                <Button
                                                    variant="text"
                                                    color="primary"
                                                    onClick={() => {
                                                        setSearchTerm('');
                                                        setFilter('all');
                                                    }}
                                                    sx={{ mt: 1 }}
                                                >
                                                    Clear filters
                                                </Button>
                                            ) : (
                                                <Button
                                                    variant="outlined"
                                                    color="primary"
                                                    startIcon={<UploadIcon />}
                                                    onClick={() => setUploadDialog(true)}
                                                    sx={{ mt: 1 }}
                                                >
                                                    Add your first resource
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}

                {/* Upload Resource Dialog */}
                <Dialog
                    open={uploadDialog}
                    onClose={() => !isUploading && setUploadDialog(false)}
                    maxWidth="md"
                    fullWidth
                >
                    <DialogTitle>
                        Add Learning Resource
                    </DialogTitle>
                    <DialogContent>
                        <Grid container spacing={2} sx={{ mt: 1 }}>
                            <Grid item xs={12}>
                                <FormControl fullWidth>
                                    <InputLabel>Resource Type</InputLabel>
                                    <Select
                                        name="type"
                                        value={resourceForm.type}
                                        onChange={handleFormChange}
                                        label="Resource Type"
                                    >
                                        <MenuItem value="FILE">File Upload</MenuItem>
                                        <MenuItem value="URL">External Link</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>

                            {resourceForm.type === 'FILE' && (
                                <Grid item xs={12}>
                                    <Button
                                        variant="outlined"
                                        component="label"
                                        fullWidth
                                        startIcon={<UploadIcon />}
                                        sx={{ py: 1.5 }}
                                    >
                                        {resourceForm.file ? resourceForm.file.name : 'Select File'}
                                        <input
                                            type="file"
                                            hidden
                                            onChange={handleFileChange}
                                            ref={fileInputRef}
                                        />
                                    </Button>
                                    {formErrors.file && (
                                        <FormHelperText error>{formErrors.file}</FormHelperText>
                                    )}
                                </Grid>
                            )}

                            {resourceForm.type === 'URL' && (
                                <Grid item xs={12}>
                                    <TextField
                                        name="url"
                                        label="Resource URL"
                                        value={resourceForm.url}
                                        onChange={handleFormChange}
                                        fullWidth
                                        error={!!formErrors.url}
                                        helperText={formErrors.url}
                                        placeholder="https://example.com/resource"
                                    />
                                </Grid>
                            )}

                            <Grid item xs={12}>
                                <TextField
                                    name="title"
                                    label="Resource Title"
                                    value={resourceForm.title}
                                    onChange={handleFormChange}
                                    fullWidth
                                    required
                                    error={!!formErrors.title}
                                    helperText={formErrors.title}
                                />
                            </Grid>

                            <Grid item xs={12}>
                                <TextField
                                    name="description"
                                    label="Description (Optional)"
                                    value={resourceForm.description}
                                    onChange={handleFormChange}
                                    fullWidth
                                    multiline
                                    rows={3}
                                />
                            </Grid>

                            <Grid item xs={12}>
                                <FormControl fullWidth error={!!formErrors.category}>
                                    <InputLabel>Category</InputLabel>
                                    <Select
                                        name="category"
                                        value={resourceForm.category}
                                        onChange={handleFormChange}
                                        label="Category"
                                    >
                                        {categories.map(category => (
                                            <MenuItem key={category} value={category}>
                                                {category}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                    {formErrors.category && (
                                        <FormHelperText>{formErrors.category}</FormHelperText>
                                    )}
                                </FormControl>
                            </Grid>

                            {formErrors.submit && (
                                <Grid item xs={12}>
                                    <Alert severity="error">{formErrors.submit}</Alert>
                                </Grid>
                            )}

                            {isUploading && (
                                <Grid item xs={12}>
                                    <Box sx={{ width: '100%', mt: 1 }}>
                                        <Box display="flex" alignItems="center">
                                            <Box width="100%" mr={1}>
                                                <LinearProgress variant="determinate" value={uploadProgress} />
                                            </Box>
                                            <Box minWidth={35}>
                                                <Typography variant="body2" color="text.secondary">
                                                    {uploadProgress}%
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </Box>
                                </Grid>
                            )}
                        </Grid>
                    </DialogContent>
                    <DialogActions>
                        <Button
                            onClick={() => {
                                if (!isUploading) {
                                    setUploadDialog(false);
                                    resetForm();
                                }
                            }}
                            disabled={isUploading}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={handleResourceUpload}
                            disabled={isUploading}
                            startIcon={isUploading ? <CircularProgress size={16} /> : <UploadIcon />}
                        >
                            {isUploading ? 'Uploading...' : 'Upload Resource'}
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* Category Management Dialog */}
                <Dialog
                    open={categoryDialog}
                    onClose={() => setCategoryDialog(false)}
                    maxWidth="sm"
                    fullWidth
                >
                    <DialogTitle>
                        Manage Resource Categories
                    </DialogTitle>
                    <DialogContent>
                        <Box sx={{ mb: 2, mt: 1 }}>
                            <Typography variant="body2" gutterBottom>
                                Create categories to organize your learning resources.
                            </Typography>

                            <Box display="flex" alignItems="center" sx={{ mt: 2 }}>
                                <TextField
                                    fullWidth
                                    label="New Category"
                                    value={newCategory}
                                    onChange={(e) => setNewCategory(e.target.value)}
                                    variant="outlined"
                                    size="small"
                                    sx={{ mr: 1 }}
                                />
                                <Button
                                    variant="outlined"
                                    color="primary"
                                    startIcon={<AddIcon />}
                                    onClick={handleAddCategory}
                                    disabled={!newCategory.trim() || categories.includes(newCategory.trim())}
                                >
                                    Add
                                </Button>
                            </Box>
                        </Box>

                        <Divider sx={{ my: 2 }} />

                        <Typography variant="subtitle2" gutterBottom>
                            Current Categories
                        </Typography>

                        <List>
                            {categories.map(category => (
                                <ListItem key={category}>
                                    <ListItemText primary={category} />
                                    <ListItemSecondaryAction>
                                        <IconButton
                                            edge="end"
                                            onClick={() => setCategories(categories.filter(c => c !== category))}
                                            disabled={resources.some(r => r.category === category)}
                                            size="small"
                                        >
                                            <DeleteIcon fontSize="small" />
                                        </IconButton>
                                    </ListItemSecondaryAction>
                                </ListItem>
                            ))}
                        </List>

                        <Alert severity="info" sx={{ mt: 2 }}>
                            Categories that are in use cannot be deleted.
                        </Alert>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setCategoryDialog(false)}>
                            Close
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* Delete Confirmation Dialog */}
                <Dialog
                    open={deleteConfirmation.open}
                    onClose={() => setDeleteConfirmation({ open: false, resource: null })}
                >
                    <DialogTitle>
                        Delete Resource
                    </DialogTitle>
                    <DialogContent>
                        <Typography>
                            Are you sure you want to delete "{deleteConfirmation.resource?.title}"? This action cannot be undone.
                        </Typography>
                    </DialogContent>
                    <DialogActions>
                        <Button
                            onClick={() => setDeleteConfirmation({ open: false, resource: null })}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="contained"
                            color="error"
                            onClick={handleDeleteResource}
                            startIcon={<DeleteIcon />}
                        >
                            Delete
                        </Button>
                    </DialogActions>
                </Dialog>
            </CardContent>
        </Card>
    );
};

export default ResourcesManagementTab;