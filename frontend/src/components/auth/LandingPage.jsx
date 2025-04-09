import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import classroomSvg from '../../assets/classroom.svg';
import {
    AppBar,
    Box,
    Button,
    Card,
    CardContent,
    Container,
    Divider,
    Grid,
    Paper,
    Toolbar,
    Typography,
    useTheme,
    styled
} from '@mui/material';

// Material UI icons
// import SchoolIcon from '@mui/icons-material/School';
// import AssignmentIcon from '@mui/icons-material/Assignment';
// import InsightsIcon from '@mui/icons-material/Insights';
// import PersonIcon from '@mui/icons-material/Person';
// import AnalyticsIcon from '@mui/icons-material/Analytics';
// import SmartToyIcon from '@mui/icons-material/SmartToy';

// Styled components for enhanced design
const GradientHero = styled(Box)(({ theme }) => ({
    background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
    color: theme.palette.common.white,
    padding: theme.spacing(12, 0, 8),
    [theme.breakpoints.down('md')]: {
        padding: theme.spacing(6, 0, 4),
    },
}));

const StyledAppBar = styled(AppBar)(({ theme }) => ({
    background: 'transparent',
    boxShadow: 'none',
    position: 'absolute',
}));

const FeatureCard = styled(Card)(({ theme }) => ({
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    borderRadius: '12px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
    transition: 'transform 0.3s, box-shadow 0.3s',
    '&:hover': {
        transform: 'translateY(-5px)',
        boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15)',
    },
}));

const CTA = styled(Box)(({ theme }) => ({
    background: theme.palette.primary.main,
    color: theme.palette.common.white,
    padding: theme.spacing(8, 0),
    textAlign: 'center',
}));

const RoleCard = styled(Paper)(({ theme }) => ({
    padding: theme.spacing(3),
    height: '100%',
    borderRadius: '12px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
}));

const HeroButton = styled(Button)(({ theme }) => ({
    padding: theme.spacing(1.5, 4),
    borderRadius: '28px',
    fontWeight: 'bold',
    marginRight: theme.spacing(2),
    marginTop: theme.spacing(2),
    [theme.breakpoints.down('sm')]: {
        width: '100%',
        marginRight: 0,
    },
}));

const Footer = styled(Box)(({ theme }) => ({
    background: theme.palette.grey[900],
    color: theme.palette.common.white,
    padding: theme.spacing(5, 0),
}));

const LandingPage = () => {
    const navigate = useNavigate();
    const theme = useTheme();

    return (
        <Box>
            {/* Header */}
            <StyledAppBar>
                <Toolbar>
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
                        ClassAssess
                    </Typography>
                    <Button
                        color="inherit"
                        variant="outlined"
                        sx={{ mr: 2, borderRadius: 28 }}
                        onClick={() => navigate('/login')}
                    >
                        Login
                    </Button>
                    <Button
                        color="inherit"
                        variant="contained"
                        sx={{
                            bgcolor: 'white',
                            color: theme.palette.primary.main,
                            borderRadius: 28,
                            '&:hover': {
                                bgcolor: 'rgba(255, 255, 255, 0.9)',
                            }
                        }}
                        onClick={() => navigate('/register')}
                    >
                        Register
                    </Button>
                </Toolbar>
            </StyledAppBar>

            {/* Hero Section */}
            <GradientHero>
                <Container maxWidth="lg">
                    <Grid container spacing={4} alignItems="center">
                        <Grid item xs={12} md={6}>
                            <Typography variant="h2" component="h1" fontWeight="bold" gutterBottom>
                                AI-Powered Learning Assessment
                            </Typography>
                            <Typography variant="h6" paragraph sx={{ opacity: 0.9, mb: 3 }}>
                                Revolutionize your educational experience with AI-graded tests and intelligent question creation. ClassAssess makes assessment smarter, faster, and more effective.
                            </Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap' }}>
                                <HeroButton
                                    variant="contained"
                                    color="secondary"
                                    size="large"
                                    onClick={() => navigate('/login')}
                                >
                                    Get Started
                                </HeroButton>
                                <HeroButton
                                    variant="outlined"
                                    color="inherit"
                                    size="large"
                                    sx={{ borderColor: 'white', '&:hover': { borderColor: 'white' } }}
                                    onClick={() => {
                                        document.getElementById('features-section').scrollIntoView({
                                            behavior: 'smooth'
                                        });
                                    }}
                                >
                                    Learn More
                                </HeroButton>
                            </Box>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Paper
                                elevation={6}
                                sx={{
                                    borderRadius: '12px',
                                    overflow: 'hidden',
                                    maxWidth: 500,
                                    margin: '0 auto',
                                }}
                            >
                                {/* image */}
                                <Box
                                    component="img"
                                    src={classroomSvg}
                                    alt="ClassAssess Platform"
                                    sx={{
                                        width: '100%',
                                        display: 'block',
                                    }}
                                />
                            </Paper>
                        </Grid>
                    </Grid>
                </Container>
            </GradientHero>

            {/* Features Section */}
            <Box id="features-section" sx={{ py: 8 }}>
            <Container maxWidth="lg">
                    <Typography variant="h3" component="h2" textAlign="center" fontWeight="bold" gutterBottom>
                        Key Features
                    </Typography>
                    <Typography variant="h6" textAlign="center" color="textSecondary" paragraph sx={{ mb: 6, maxWidth: 700, mx: 'auto' }}>
                        ClassAssess combines cutting-edge AI with intuitive design to create a seamless assessment experience.
                    </Typography>

                    <Grid container spacing={4}>
                        <Grid item xs={12} md={4}>
                            <FeatureCard>
                                <CardContent sx={{ p: 3, flexGrow: 1 }}>
                                    <Box sx={{ mb: 2, color: theme.palette.primary.main }}>
                                        {/* Icon placeholder  */}
                                        <Box sx={{
                                            bgcolor: theme.palette.primary.light,
                                            width: 60,
                                            height: 60,
                                            borderRadius: '50%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            mb: 2
                                        }}>
                                            {/* <SmartToyIcon fontSize="large" sx={{ color: theme.palette.primary.main }} /> */}
                                            {/* I might use a simple box until I import icons */}
                                            <Typography variant="h5" color="primary">AI</Typography>
                                        </Box>
                                    </Box>
                                    <Typography variant="h5" component="h3" fontWeight="bold" gutterBottom>
                                        AI-Powered Grading
                                    </Typography>
                                    <Typography variant="body1" color="textSecondary">
                                        Our intelligent algorithms automatically grade assessments with human-like accuracy, providing instant feedback to students.
                                    </Typography>
                                </CardContent>
                            </FeatureCard>
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <FeatureCard>
                                <CardContent sx={{ p: 3, flexGrow: 1 }}>
                                    <Box sx={{ mb: 2, color: theme.palette.primary.main }}>
                                        <Box sx={{
                                            bgcolor: theme.palette.primary.light,
                                            width: 60,
                                            height: 60,
                                            borderRadius: '50%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            mb: 2
                                        }}>
                                            {/* <AssignmentIcon fontSize="large" sx={{ color: theme.palette.primary.main }} /> */}
                                            <Typography variant="h5" color="primary">Q</Typography>
                                        </Box>
                                    </Box>
                                    <Typography variant="h5" component="h3" fontWeight="bold" gutterBottom>
                                        Smart Question Creation
                                    </Typography>
                                    <Typography variant="body1" color="textSecondary">
                                        Lecturers can generate high-quality questions with AI assistance, saving time and enhancing assessment quality.
                                    </Typography>
                                </CardContent>
                            </FeatureCard>
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <FeatureCard>
                                <CardContent sx={{ p: 3, flexGrow: 1 }}>
                                    <Box sx={{ mb: 2, color: theme.palette.primary.main }}>
                                        <Box sx={{
                                            bgcolor: theme.palette.primary.light,
                                            width: 60,
                                            height: 60,
                                            borderRadius: '50%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            mb: 2
                                        }}>
                                            {/* <InsightsIcon fontSize="large" sx={{ color: theme.palette.primary.main }} /> */}
                                            <Typography variant="h5" color="primary">📊</Typography>
                                        </Box>
                                    </Box>
                                    <Typography variant="h5" component="h3" fontWeight="bold" gutterBottom>
                                        Comprehensive Analytics
                                    </Typography>
                                    <Typography variant="body1" color="textSecondary">
                                        Gain deep insights into student performance with detailed analytics and progress tracking across modules.
                                    </Typography>
                                </CardContent>
                            </FeatureCard>
                        </Grid>
                    </Grid>
                </Container>
            </Box>

            {/* Roles Section */}
            <Box sx={{ py: 8, bgcolor: theme.palette.grey[50] }}>
                <Container maxWidth="lg">
                    <Typography variant="h3" component="h2" textAlign="center" fontWeight="bold" gutterBottom>
                        Who Uses ClassAssess?
                    </Typography>
                    <Typography variant="h6" textAlign="center" color="textSecondary" paragraph sx={{ mb: 6, maxWidth: 700, mx: 'auto' }}>
                        Our platform is designed for all educational stakeholders
                    </Typography>

                    <Grid container spacing={4}>
                        <Grid item xs={12} md={6}>
                            <RoleCard>
                                <Typography variant="h4" component="h3" fontWeight="bold" color="primary" gutterBottom>
                                    For Students
                                </Typography>
                                <Divider sx={{ my: 2 }} />
                                <Grid container spacing={2} sx={{ mt: 1 }}>
                                    <Grid item xs={12}>
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            <Box sx={{
                                                mr: 2,
                                                bgcolor: theme.palette.success.light,
                                                color: theme.palette.success.main,
                                                width: 24,
                                                height: 24,
                                                borderRadius: '50%',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: 14
                                            }}>✓</Box>
                                            <Typography variant="body1">
                                                Take assessments with instant feedback
                                            </Typography>
                                        </Box>
                                    </Grid>
                                    <Grid item xs={12}>
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            <Box sx={{
                                                mr: 2,
                                                bgcolor: theme.palette.success.light,
                                                color: theme.palette.success.main,
                                                width: 24,
                                                height: 24,
                                                borderRadius: '50%',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: 14
                                            }}>✓</Box>
                                            <Typography variant="body1">
                                                Track your progress across modules
                                            </Typography>
                                        </Box>
                                    </Grid>
                                    <Grid item xs={12}>
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            <Box sx={{
                                                mr: 2,
                                                bgcolor: theme.palette.success.light,
                                                color: theme.palette.success.main,
                                                width: 24,
                                                height: 24,
                                                borderRadius: '50%',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: 14
                                            }}>✓</Box>
                                            <Typography variant="body1">
                                                Request appeals for AI-graded assessments
                                            </Typography>
                                        </Box>
                                    </Grid>
                                    <Grid item xs={12}>
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            <Box sx={{
                                                mr: 2,
                                                bgcolor: theme.palette.success.light,
                                                color: theme.palette.success.main,
                                                width: 24,
                                                height: 24,
                                                borderRadius: '50%',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: 14
                                            }}>✓</Box>
                                            <Typography variant="body1">
                                                Access learning resources by module
                                            </Typography>
                                        </Box>
                                    </Grid>
                                </Grid>
                            </RoleCard>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <RoleCard>
                                <Typography variant="h4" component="h3" fontWeight="bold" color="primary" gutterBottom>
                                    For Lecturers
                                </Typography>
                                <Divider sx={{ my: 2 }} />
                                <Grid container spacing={2} sx={{ mt: 1 }}>
                                    <Grid item xs={12}>
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            <Box sx={{
                                                mr: 2,
                                                bgcolor: theme.palette.success.light,
                                                color: theme.palette.success.main,
                                                width: 24,
                                                height: 24,
                                                borderRadius: '50%',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: 14
                                            }}>✓</Box>
                                            <Typography variant="body1">
                                                Create AI-assisted tests and questions
                                            </Typography>
                                        </Box>
                                    </Grid>
                                    <Grid item xs={12}>
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            <Box sx={{
                                                mr: 2,
                                                bgcolor: theme.palette.success.light,
                                                color: theme.palette.success.main,
                                                width: 24,
                                                height: 24,
                                                borderRadius: '50%',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: 14
                                            }}>✓</Box>
                                            <Typography variant="body1">
                                                Review student performance analytics
                                            </Typography>
                                        </Box>
                                    </Grid>
                                    <Grid item xs={12}>
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            <Box sx={{
                                                mr: 2,
                                                bgcolor: theme.palette.success.light,
                                                color: theme.palette.success.main,
                                                width: 24,
                                                height: 24,
                                                borderRadius: '50%',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: 14
                                            }}>✓</Box>
                                            <Typography variant="body1">
                                                Manage appeal systems for assessment results
                                            </Typography>
                                        </Box>
                                    </Grid>
                                    <Grid item xs={12}>
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            <Box sx={{
                                                mr: 2,
                                                bgcolor: theme.palette.success.light,
                                                color: theme.palette.success.main,
                                                width: 24,
                                                height: 24,
                                                borderRadius: '50%',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: 14
                                            }}>✓</Box>
                                            <Typography variant="body1">
                                                Organize module resources and materials
                                            </Typography>
                                        </Box>
                                    </Grid>
                                </Grid>
                            </RoleCard>
                        </Grid>
                    </Grid>
                </Container>
            </Box>

            {/* CTA Section */}
            <CTA>
                <Container maxWidth="md">
                    <Typography variant="h3" component="h2" fontWeight="bold" gutterBottom>
                        Ready to transform assessment?
                    </Typography>
                    <Typography variant="h6" paragraph sx={{ mb: 4, opacity: 0.9 }}>
                        Join thousands of students and educators already using ClassAssess to improve learning outcomes.
                    </Typography>
                    <Button
                        variant="contained"
                        color="secondary"
                        size="large"
                        sx={{
                            py: 1.5,
                            px: 4,
                            borderRadius: 28,
                            fontWeight: 'bold'
                        }}
                        onClick={() => navigate('/login')}
                    >
                        Get Started Today
                    </Button>
                </Container>
            </CTA>

            {/* Footer */}
            <Footer>
                <Container maxWidth="lg">
                    <Grid container spacing={4}>
                        <Grid item xs={12} md={6}>
                            <Typography variant="h6" fontWeight="bold" gutterBottom>
                                ClassAssess
                            </Typography>
                            <Typography variant="body2" sx={{ opacity: 0.7 }}>
                                © 2025 ClassAssess. All rights reserved.
                            </Typography>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 3 }}>
                                <Typography variant="body2" sx={{ opacity: 0.7 }}>
                                    Privacy Policy
                                </Typography>
                                <Typography variant="body2" sx={{ opacity: 0.7 }}>
                                    Terms of Service
                                </Typography>
                                <Typography variant="body2" sx={{ opacity: 0.7 }}>
                                    Contact Us
                                </Typography>
                            </Box>
                        </Grid>
                    </Grid>
                </Container>
            </Footer>
        </Box>
    );
};

export default LandingPage;