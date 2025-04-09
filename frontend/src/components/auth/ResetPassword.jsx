import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import {
    Container,
    Paper,
    TextField,
    Button,
    Typography,
    Box,
    Alert,
    useTheme,
    Link,
    CircularProgress,
    InputAdornment,
    IconButton,
    styled
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import LockIcon from '@mui/icons-material/Lock';
import { authAPI } from '../../services/api';

// Same styles from Login page
const LoginContainer = styled(Container)(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
    padding: theme.spacing(2)
}));

const LoginCard = styled(Paper)(({ theme }) => ({
    padding: theme.spacing(4),
    width: '100%',
    maxWidth: '450px',
    borderRadius: '12px',
    boxShadow: '0 8px 30px rgba(0, 0, 0, 0.12)',
}));

const StyledForm = styled('form')(({ theme }) => ({
    marginTop: theme.spacing(2),
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
    marginBottom: theme.spacing(2),
    '& .MuiOutlinedInput-root': {
        borderRadius: '8px',
        '&:hover fieldset': {
            borderColor: theme.palette.primary.main,
        },
    },
}));

const LoginButton = styled(Button)(({ theme }) => ({
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(2),
    padding: theme.spacing(1.5),
    borderRadius: '8px',
    fontWeight: 'bold',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    transition: 'all 0.2s',
    '&:hover': {
        transform: 'translateY(-2px)',
        boxShadow: '0 6px 8px rgba(0, 0, 0, 0.15)',
    }
}));

const AppLogo = styled(Typography)(({ theme }) => ({
    color: 'white',
    marginBottom: theme.spacing(4),
    fontWeight: 'bold'
}));

const ResetPassword = () => {
    const { token } = useParams();
    const navigate = useNavigate();
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const [tokenValid, setTokenValid] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const theme = useTheme();

    useEffect(() => {
        const validateToken = async () => {
            try {
                const response = await authAPI.validateResetToken(token);
                setTokenValid(response.data.valid);
                if (!response.data.valid) {
                    setError('This password reset link is invalid or has expired.');
                }
            } catch (err) {
                console.error('Token validation error:', err);
                setError('An error occurred while validating your reset link.');
                setTokenValid(false);
            } finally {
                setLoading(false);
            }
        };

        validateToken();
    }, [token]);

    const handleTogglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    const handleToggleConfirmPasswordVisibility = () => {
        setShowConfirmPassword(!showConfirmPassword);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');
        setSubmitting(true);

        // Validate passwords match
        if (newPassword !== confirmPassword) {
            setError('Passwords do not match');
            setSubmitting(false);
            return;
        }

        // Validate password strength
        if (newPassword.length < 8) {
            setError('Password must be at least 8 characters long');
            setSubmitting(false);
            return;
        }

        try {
            const response = await authAPI.resetPassword({ token, newPassword });
            setMessage(response.data.message);
            // Redirect to login after 3 seconds
            setTimeout(() => navigate('/login'), 3000);
        } catch (err) {
            console.error('Password reset error:', err);
            setError('An error occurred while resetting your password. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <LoginContainer maxWidth={false}>
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                    <CircularProgress />
                </Box>
            </LoginContainer>
        );
    }

    return (
        <LoginContainer maxWidth={false}>
            <AppLogo variant="h3" component="h1">
                ClassAssess
            </AppLogo>

            <LoginCard elevation={6}>
                <Typography
                    component="h1"
                    variant="h4"
                    align="center"
                    color="primary"
                    sx={{ mb: 1, fontWeight: 'bold' }}
                >
                    Reset Your Password
                </Typography>

                {error && (
                    <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
                        {error}
                    </Alert>
                )}

                {message && (
                    <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>
                        {message}
                        <Typography variant="body2" sx={{ mt: 1 }}>
                            Redirecting to login page...
                        </Typography>
                    </Alert>
                )}

                {tokenValid && !message ? (
                    <StyledForm onSubmit={handleSubmit}>
                        <StyledTextField
                            required
                            fullWidth
                            label="New Password"
                            name="newPassword"
                            type={showPassword ? "text" : "password"}
                            margin="normal"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            disabled={submitting}
                            onPaste={(e) => {
                                e.preventDefault();
                                alert("Pasting passwords is not allowed for security reasons");
                            }}
                            onCopy={(e) => {
                                e.preventDefault();
                                alert("Copying passwords is not allowed for security reasons");
                            }}
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

                        <StyledTextField
                            required
                            fullWidth
                            label="Confirm New Password"
                            name="confirmPassword"
                            type={showConfirmPassword ? "text" : "password"}
                            margin="normal"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            disabled={submitting}
                            onPaste={(e) => {
                                e.preventDefault();
                                alert("Pasting passwords is not allowed for security reasons");
                            }}
                            onCopy={(e) => {
                                e.preventDefault();
                                alert("Copying passwords is not allowed for security reasons");
                            }}
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
                                            onClick={handleToggleConfirmPasswordVisibility}
                                            edge="end"
                                        >
                                            {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                                        </IconButton>
                                    </InputAdornment>
                                )
                            }}
                        />

                        <LoginButton
                            type="submit"
                            fullWidth
                            variant="contained"
                            disableElevation
                            disabled={submitting || !newPassword || !confirmPassword}
                        >
                            {submitting ? <CircularProgress size={24} /> : "Reset Password"}
                        </LoginButton>
                    </StyledForm>
                ) : !tokenValid ? (
                    <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="body1" sx={{ mb: 3 }}>
                            Your password reset link is invalid or has expired.
                        </Typography>
                        <LoginButton
                            variant="contained"
                            component={RouterLink}
                            to="/forgot-password"
                            disableElevation
                            sx={{ mb: 2 }}
                        >
                            Request New Reset Link
                        </LoginButton>
                    </Box>
                ) : null}

                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                    <Link
                        component={RouterLink}
                        to="/login"
                        variant="body2"
                        color="primary"
                        underline="hover"
                    >
                        Back to Login
                    </Link>
                </Box>
            </LoginCard>

            <Typography variant="body2" color="white" sx={{ mt: 3, opacity: 0.8 }}>
                © 2025 ClassAssess. All rights reserved.
            </Typography>
        </LoginContainer>
    );
};

export default ResetPassword;