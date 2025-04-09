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
    styled,
    CircularProgress
} from '@mui/material';
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

const ForgotPassword = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const theme = useTheme();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');
        setLoading(true);

        try {
            const response = await authAPI.requestPasswordReset({ email });
            setMessage(response.data.message);
            setSubmitted(true);
        } catch (err) {
            console.error('Password reset request error:', err);
            setError('An error occurred while processing your request. Please try again later.');
        } finally {
            setLoading(false);
        }
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
                    Reset Your Password
                </Typography>

                <Typography
                    variant="body1"
                    align="center"
                    color="textSecondary"
                    sx={{ mb: 3 }}
                >
                    Enter your email address and we'll send you a link to reset your password.
                </Typography>

                {error && (
                    <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
                        {error}
                    </Alert>
                )}

                {message && (
                    <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>
                        {message}
                    </Alert>
                )}

                {!submitted ? (
                    <StyledForm onSubmit={handleSubmit}>
                        <StyledTextField
                            required
                            fullWidth
                            label="Email"
                            name="email"
                            type="email"
                            autoComplete="email"
                            margin="normal"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={loading}
                        />

                        <LoginButton
                            type="submit"
                            fullWidth
                            variant="contained"
                            disableElevation
                            disabled={loading || !email}
                        >
                            {loading ? <CircularProgress size={24} /> : "Send Reset Link"}
                        </LoginButton>

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
                    </StyledForm>
                ) : (
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                        <LoginButton
                            variant="contained"
                            component={RouterLink}
                            to="/login"
                            disableElevation
                        >
                            Back to Login
                        </LoginButton>
                    </Box>
                )}
            </LoginCard>

            <Typography variant="body2" color="white" sx={{ mt: 3, opacity: 0.8 }}>
                © 2025 ClassAssess. All rights reserved.
            </Typography>
        </LoginContainer>
    );
};

export default ForgotPassword;