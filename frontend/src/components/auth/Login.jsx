import { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
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
    Divider,
    InputAdornment,
    IconButton,
    styled
} from '@mui/material';
import { useAuth } from '../../context/AuthContext';
import { authAPI, handleApiError } from '../../services/api';
// Import icons if  using Material UI icons
// import EmailIcon from '@mui/icons-material/Email';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import LockIcon from '@mui/icons-material/Lock';

// Styled components for enhanced visuals
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

const RegisterLink = styled(Button)(({ theme }) => ({
    marginTop: theme.spacing(1),
    borderRadius: '8px',
}));

const AppLogo = styled(Typography)(({ theme }) => ({
    color: 'white',
    marginBottom: theme.spacing(4),
    fontWeight: 'bold'
}));

const Login = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [error, setError] = useState('');
    const [statusMessage, setStatusMessage] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [credentials, setCredentials] = useState({
        email: '',
        password: ''
    });

    const theme = useTheme();

    const isValidEmail = (email) => {
        // Basic email validation regex
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return email === '' || emailRegex.test(email);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setStatusMessage('');

        // Clear any existing auth data first to avoid conflicts
        authAPI.clearAuth();

        try {
            const response = await authAPI.login(credentials);
            const { token, email, role, fullName, requiresApproval, message, accountStatus } = response.data;

            // Check account status
            if (requiresApproval) {
                setStatusMessage(message || `Your account is ${accountStatus.toLowerCase()}. Please wait for admin approval.`);
                return;
            }

            if (accountStatus === 'REJECTED' || accountStatus === 'SUSPENDED') {
                setStatusMessage(message || `Your account is ${accountStatus.toLowerCase()}. Please contact an administrator.`);
                return;
            }

            // Validate token before proceeding
            if (!token || typeof token !== 'string' || token === 'null' || token === 'undefined' || token.split('.').length !== 3) {
                setError('Authentication failed: Invalid token received');
                return;
            }

            // Store token first
            localStorage.setItem('token', token);

            // Login user with full details
            login({
                email,
                role,
                name: fullName
            });

            // Navigate based on role
            navigate(`/${role.toLowerCase()}/dashboard`);
        } catch (err) {
            console.error('Login error:', err);

            // Clear any auth data on error
            authAPI.clearAuth();

            const errorMessage = handleApiError(err);
            setError(errorMessage || 'An error occurred during login');
        }
    };

    const handleTogglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

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
                    Welcome Back
                </Typography>

                <Typography
                    variant="body1"
                    align="center"
                    color="textSecondary"
                    sx={{ mb: 3 }}
                >
                    Sign in to continue to ClassAssess
                </Typography>

                {error && (
                    <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
                        {error}
                    </Alert>
                )}

                {statusMessage && (
                    <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>
                        {statusMessage}
                    </Alert>
                )}

                <StyledForm onSubmit={handleSubmit}>
                    <StyledTextField
                        required
                        fullWidth
                        label="Email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        autoFocus
                        value={credentials.email}
                        onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
                        error={!isValidEmail(credentials.email) && credentials.email !== ''}
                        helperText={(!isValidEmail(credentials.email) && credentials.email !== '') ? 'Please enter a valid email address' : ''}

                    />
                    <StyledTextField
                        required
                        fullWidth
                        label="Password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="current-password"
                        value={credentials.password}
                        onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
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

                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                        <Link
                            component={RouterLink}
                            to="/forgot-password"
                            variant="body2"
                            color="primary"
                            underline="hover"
                        >
                            Forgot password?
                        </Link>
                    </Box>

                    <LoginButton
                        type="submit"
                        fullWidth
                        variant="contained"
                        disableElevation
                    >
                        Sign In
                    </LoginButton>

                    <Divider sx={{ my: 2 }}>
                        <Typography variant="body2" color="textSecondary">
                            OR
                        </Typography>
                    </Divider>

                    <RegisterLink
                        fullWidth
                        variant="outlined"
                        onClick={() => navigate('/register')}
                    >
                        Don't have an account? Register
                    </RegisterLink>
                </StyledForm>
            </LoginCard>

            <Typography variant="body2" color="white" sx={{ mt: 3, opacity: 0.8 }}>
                © 2025 ClassAssess. All rights reserved.
            </Typography>
        </LoginContainer>
    );
};

export default Login;