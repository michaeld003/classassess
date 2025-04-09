import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    FormControl,
    FormControlLabel,
    Checkbox,
    Box,
    Typography,
    Alert,
    CircularProgress
} from '@mui/material';
import * as moduleAPI from '@/services/module';

const ModuleEnrollmentDialog = ({ open, onClose, onEnrollmentComplete }) => {
    const [availableModules, setAvailableModules] = useState([]);
    const [selectedModules, setSelectedModules] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (open) {
            fetchAvailableModules();
            setSelectedModules([]);
            setError(null);
        }
    }, [open]);

    const fetchAvailableModules = async () => {
        try {
            setLoading(true);
            const modules = await moduleAPI.getAvailableModules();
            setAvailableModules(modules);
        } catch (err) {
            setError('Failed to fetch available modules');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleModuleToggle = (moduleId) => {
        setSelectedModules(prev => {
            if (prev.includes(moduleId)) {
                return prev.filter(id => id !== moduleId);
            }
            if (prev.length >= 3) {
                return prev;
            }
            return [...prev, moduleId];
        });
    };

    const handleEnroll = async () => {
        if (selectedModules.length !== 3) {
            setError('Please select exactly 3 modules');
            return;
        }

        try {
            setLoading(true);
            await moduleAPI.enrollInModules(selectedModules);
            onEnrollmentComplete();
            onClose();
        } catch (err) {
            setError(err.message || 'Failed to enroll in modules');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>Enroll in Modules</DialogTitle>
            <DialogContent>
                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                <Typography variant="body1" sx={{ mb: 2 }}>
                    Please select exactly 3 modules to enroll in:
                </Typography>

                {loading ? (
                    <Box display="flex" justifyContent="center" p={2}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <FormControl component="fieldset">
                        {availableModules.map((module) => (
                            <FormControlLabel
                                key={module.id}
                                control={
                                    <Checkbox
                                        checked={selectedModules.includes(module.id)}
                                        onChange={() => handleModuleToggle(module.id)}
                                        disabled={!selectedModules.includes(module.id) &&
                                            selectedModules.length >= 3}
                                    />
                                }
                                label={`${module.code} - ${module.title}`}
                            />
                        ))}
                    </FormControl>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} color="inherit">
                    Cancel
                </Button>
                <Button
                    onClick={handleEnroll}
                    variant="contained"
                    color="primary"
                    disabled={loading || selectedModules.length !== 3}
                >
                    Enroll
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ModuleEnrollmentDialog;