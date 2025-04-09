import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from "../../context/AuthContext";
import {
    Box,
    Container,
    Typography,
    Button,
    Paper,
    SvgIcon
} from '@mui/material';

const ModuleNotAvailablePage = ({ moduleCode }) => {
    const navigate = useNavigate();
    const { user } = useAuth(); // Get the current user

    const handleReturn = () => {
        // Redirect based on user role
        if (user) {
            switch (user.role) {
                case 'STUDENT':
                    navigate('/student/dashboard');
                    break;
                case 'LECTURER':
                    navigate('/lecturer/dashboard');
                    break;
                case 'ADMIN':
                    navigate('/admin/dashboard');
                    break;
                default:
                    // Fallback to login if role is unknown
                    navigate('/login');
            }
        } else {
            // If no user found, redirect to login
            navigate('/login');
        }
    };

    return (
        <Container maxWidth="md" sx={{ mt: 8, mb: 4 }}>
            <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
                <Box sx={{ mb: 4, color: 'warning.main' }}>
                    <SvgIcon sx={{ fontSize: 80 }}>
                        <path d="M12 5.99L19.53 19H4.47L12 5.99M12 2L1 21h22L12 2zm1 14h-2v2h2v-2zm0-6h-2v4h2v-4z" />
                    </SvgIcon>
                </Box>

                <Typography variant="h4" component="h1" gutterBottom>
                    Module Not Available
                </Typography>

                <Typography variant="body1" paragraph>
                    {moduleCode
                        ? `The module ${moduleCode} is currently inactive.`
                        : "This module is currently inactive."}
                </Typography>

                <Typography variant="body1" paragraph color="text.secondary">
                    Please contact your instructor for more information or check back later.
                </Typography>

                <Button
                    variant="contained"
                    color="primary"
                    onClick={handleReturn}
                    sx={{ mt: 2 }}
                >
                    Return to Dashboard
                </Button>
            </Paper>
        </Container>
    );
};

export default ModuleNotAvailablePage;