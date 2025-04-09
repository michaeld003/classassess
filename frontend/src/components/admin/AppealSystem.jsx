import React from 'react';
import { Card, CardContent, Box, Typography, Button, Chip } from '@mui/material';
import { CheckCircle, Cancel } from '@mui/icons-material';

const AppealSystem = () => {
    const appeals = [
        {
            id: 1,
            student: 'Jane Doe',
            module: 'CS101',
            test: 'Introduction to Programming',
            originalScore: 75,
            appealReason: 'AI marking system did not recognize alternative solution',
            status: 'PENDING'
        },
        {
            id: 2,
            student: 'John Smith',
            module: 'CS102',
            test: 'Data Structures Quiz',
            originalScore: 65,
            appealReason: 'Technical issue during test submission',
            status: 'REVIEWING'
        }
    ];

    const getStatusColor = (status) => {
        const colors = {
            PENDING: 'warning',
            REVIEWING: 'info',
            APPROVED: 'success',
            REJECTED: 'error'
        };
        return colors[status] || 'default';
    };

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>Grade Appeals</Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {appeals.map((appeal) => (
                    <Card key={appeal.id}>
                        <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                <Typography variant="h6">Appeal #{appeal.id}</Typography>
                                <Chip label={appeal.status} color={getStatusColor(appeal.status)} />
                            </Box>

                            <Typography variant="subtitle1">Student: {appeal.student}</Typography>
                            <Typography color="text.secondary" sx={{ mb: 2 }}>
                                Module: {appeal.module} - {appeal.test}
                            </Typography>

                            <Typography variant="body2" sx={{ mb: 1 }}>
                                Original Score: {appeal.originalScore}
                            </Typography>
                            <Typography variant="body2" sx={{ mb: 2 }}>
                                Reason: {appeal.appealReason}
                            </Typography>

                            <Box sx={{ display: 'flex', gap: 1 }}>
                                <Button
                                    variant="contained"
                                    color="success"
                                    startIcon={<CheckCircle />}
                                >
                                    Approve
                                </Button>
                                <Button
                                    variant="contained"
                                    color="error"
                                    startIcon={<Cancel />}
                                >
                                    Reject
                                </Button>
                            </Box>
                        </CardContent>
                    </Card>
                ))}
            </Box>
        </Box>
    );
};

export default AppealSystem;