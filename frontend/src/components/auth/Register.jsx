import { useState, useEffect } from 'react';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import LockIcon from '@mui/icons-material/Lock';
import { InputAdornment, IconButton } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import {
    Container, Paper, TextField, Button, Typography, Box,
    Alert, FormGroup, FormControlLabel, Checkbox
} from '@mui/material';
import { authAPI, moduleAPI } from '../../services/api';
import axios from "axios";

const Register = () => {
    const navigate = useNavigate();
    const [error, setError] = useState('');
    const [selectedModules, setSelectedModules] = useState([]);
    const [showPassword, setShowPassword] = useState(false);
    const [availableModules, setAvailableModules] = useState([]);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        fullName: '',
        phoneNumber: '',
        department: 'Computer Science' // Hardcoded department
    });

    useEffect(() => {
        const fetchModules = async () => {
            try {
                // Use axios directly to bypass authentication
                const response = await axios.get('http://localhost:8080/api/modules/public/available-for-registration');
                setAvailableModules(
                    response.data.map(module => ({
                        code: module.code,
                        name: module.title || module.name
                    }))
                );
            } catch (error) {
                console.error('Error fetching modules:', error);
                setError('Failed to load available modules');
            }
        };

        fetchModules();
    }, []);


    const isValidEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return email === '' || emailRegex.test(email);
    };


    const handleModuleChange = (moduleCode) => {
        if (selectedModules.includes(moduleCode)) {
            setSelectedModules(selectedModules.filter(code => code !== moduleCode));
        } else if (selectedModules.length < 3) {
            setSelectedModules([...selectedModules, moduleCode]);
        }
    };


    const isStrongPassword = (password) => {
        if (password === '') return true; // Don't show error for empty field initially

        const minLength = password.length >= 8;
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumbers = /\d/.test(password);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

        return minLength && hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar;
    };

    const getPasswordStrengthMessage = (password) => {
        if (password === '') return '';

        const checks = [];
        if (password.length < 8) checks.push('at least 8 characters');
        if (!/[A-Z]/.test(password)) checks.push('an uppercase letter');
        if (!/[a-z]/.test(password)) checks.push('a lowercase letter');
        if (!/\d/.test(password)) checks.push('a number');
        if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) checks.push('a special character');

        if (checks.length === 0) return 'Strong password';
        return `Password must contain ${checks.join(', ')}`;
    };


    const handleTogglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Check if email is valid before proceeding
        if (!isValidEmail(formData.email) || formData.email === '') {
            setError('Please enter a valid email address');
            return;
        }

        // Check password strength
        if (!isStrongPassword(formData.password)) {
            setError('Please create a strong password');
            return;
        }

        if (selectedModules.length !== 3) {
            setError('Please select exactly 3 modules');
            return;
        }

        try {
            await authAPI.register({
                ...formData,
                selectedModules
            });
            navigate('/login', { state: { message: 'Registration successful! Please login.' } });
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed');
        }
    };

    return (
        <Container component="main" maxWidth="sm">
            <Box sx={{ mt: 8 }}>
                <Paper elevation={3} sx={{ p: 4 }}>
                    <Typography component="h1" variant="h5" align="center" gutterBottom>
                        Student Registration
                    </Typography>
                    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                    <form onSubmit={handleSubmit}>
                        <TextField
                            fullWidth
                            margin="normal"
                            required
                            label="Email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                            error={!isValidEmail(formData.email) && formData.email !== ''}
                            helperText={(!isValidEmail(formData.email) && formData.email !== '') ? 'Please enter a valid email address' : ''}
                        />
                        <TextField
                            fullWidth
                            margin="normal"
                            required
                            label="Password"
                            type={showPassword ? "text" : "password"}
                            value={formData.password}
                            onChange={(e) => setFormData({...formData, password: e.target.value})}
                            onPaste={(e) => {
                                e.preventDefault();
                                alert("Pasting passwords is not allowed for security reasons");
                            }}
                            onCopy={(e) => {
                                e.preventDefault();
                                alert("Copying passwords is not allowed for security reasons");
                            }}
                            error={!isStrongPassword(formData.password) && formData.password !== ''}
                            helperText={getPasswordStrengthMessage(formData.password)}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <LockIcon color="primary" />
                                    </InputAdornment>
                                ),
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            aria-label="toggle password visibility"
                                            onClick={handleTogglePasswordVisibility}
                                            edge="end"
                                        >
                                            {showPassword ? <VisibilityOff /> : <Visibility />}
                                        </IconButton>
                                    </InputAdornment>
                                )
                            }}
                        />
                        <TextField
                            fullWidth margin="normal" required
                            label="Full Name"
                            value={formData.fullName}
                            onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                        />
                        <TextField
                            fullWidth margin="normal" required
                            label="Phone Number"
                            value={formData.phoneNumber}
                            onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                        />
                        <TextField
                            fullWidth margin="normal" required
                            label="Department"
                            value={formData.department}
                            disabled
                        />

                        <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
                            Select 3 Modules:
                        </Typography>
                        <FormGroup>
                            {availableModules.map((module) => (
                                <FormControlLabel
                                    key={module.code}
                                    control={
                                        <Checkbox
                                            checked={selectedModules.includes(module.code)}
                                            onChange={() => handleModuleChange(module.code)}
                                            disabled={!selectedModules.includes(module.code) && selectedModules.length >= 3}
                                        />
                                    }
                                    label={`${module.code} - ${module.name}`}
                                />
                            ))}
                        </FormGroup>

                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            sx={{ mt: 3 }}
                        >
                            Register
                        </Button>
                        <Button
                            fullWidth
                            variant="text"
                            sx={{ mt: 1 }}
                            onClick={() => navigate('/login')}
                        >
                            Already have an account? Login
                        </Button>
                    </form>
                </Paper>
            </Box>
        </Container>
    );
};

export default Register;