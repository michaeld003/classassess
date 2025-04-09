import axios from 'axios';


const API_BASE_URL = 'http://localhost:8080';


const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    },
    withCredentials: true
});

// Request interceptor
api.interceptors.request.use(
    config => {
        const token = localStorage.getItem('token');
        if (token && token !== 'null' && token !== 'undefined') {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    error => {
        return Promise.reject(error);
    }
);

// Request interceptor
api.interceptors.request.use(
    config => {
        const token = localStorage.getItem('token');

        // Only add token if it's valid (has exactly 2 periods = 3 parts)
        const isValidToken = token &&
            typeof token === 'string' &&
            token !== 'null' &&
            token !== 'undefined' &&
            token.split('.').length === 3;

        if (isValidToken) {
            console.log('Token being sent:', token);
            config.headers.Authorization = `Bearer ${token}`;
        } else if (token) {
            // If token exists but is invalid, remove it
            console.warn('Invalid token detected, removing from storage');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
        }

        console.log('Making request to:', API_BASE_URL + config.url);
        return config;
    },
    error => {
        return Promise.reject(error);
    }
);

// Admin API endpoints
export const adminAPI = {
    // Users
    getAllUsers: (includeDeleted = false) => {
        return api.get(`/api/admin/users?includeDeleted=${includeDeleted}`);
    },
    getUserById: (id) => api.get(`/api/admin/users/${id}`),
    createUser: (userData) => api.post('/api/admin/users', userData),
    updateUser: (id, userData) => api.put(`/api/admin/users/${id}`, userData),
    deleteUser: (id) => api.delete(`/api/admin/users/${id}`),
    updateUserStatus: (id, statusUpdate) => api.put(`/api/admin/users/${id}/status`, statusUpdate),
    changeUserPassword: (id, newPassword) => api.put(`/api/admin/users/${id}/password`, { newPassword }),
    getUsersByRole: (role) => api.get(`/api/admin/users/role/${role}`),

    // Stats
    getDashboardStats: () => api.get('/api/admin/dashboard/stats'),

    // Module Management
    getAllModules: () => api.get('/api/modules/admin/all'),
    getModuleById: (id) => api.get(`/api/modules/${id}`),
    createModule: (moduleData) => api.post('/api/modules', moduleData),
    updateModule: (id, moduleData) => api.put(`/api/modules/${id}`, moduleData),
    deleteModule: (id) => api.delete(`/api/modules/${id}`),
    toggleModuleStatus: (id, isActive) => api.patch(`/api/modules/${id}/status`, { active: isActive }),
    getModuleStats: () => api.get('/api/modules/stats'),

    // Sessions
    getActiveSessions: () => api.get('/api/admin/stats/sessions'),

    // Appeals
    getAllAppeals: () => api.get('/api/admin/appeals'),
    updateAppealStatus: (id, status) => api.put(`/api/admin/appeals/${id}/status`, { status }),

    // New account request endpoints
    getAccountRequests: () => api.get('/api/admin/account-requests'),
    approveAccount: (userId) => api.post(`/api/admin/account-requests/${userId}/approve`),
    rejectAccount: (userId) => api.post(`/api/admin/account-requests/${userId}/reject`),

    // Methods for soft delete and restore
    softDeleteUser: (id) => api.put(`/api/admin/users/${id}/soft-delete`),
    restoreUser: (id) => api.put(`/api/admin/users/${id}/restore`)


};

// Auth API endpoints
export const authAPI = {
    login: (credentials) => api.post('/api/auth/login', credentials),
    register: (userData) => api.post('/api/auth/register', userData),
    getProfile: () => api.get('/api/auth/profile'),
    clearAuth: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    },
    isAuthenticated: () => {
        const token = localStorage.getItem('token');
        return !!token && token !== 'undefined';
    },
    requestPasswordReset: (data) => api.post('/api/auth/forgot-password', data),
    resetPassword: (data) => api.post('/api/auth/reset-password', data),
    validateResetToken: (token) => api.get(`/api/auth/validate-reset-token/${token}`)
};

// Module API endpoints
export const moduleAPI = {
    getAll: () => api.get('/api/modules'),
    getById: (id) => api.get(`/api/modules/${id}`),
    getEnrolled: () => api.get('/api/modules/enrolled'),
    enroll: (moduleId) => api.post(`/api/modules/${moduleId}/enroll`),
    getResource: (resourceId) => {
        console.log(`Fetching resource with ID: ${resourceId}`);
        return api.get(`/api/resources/${resourceId}`, {
            responseType: 'blob',
            timeout: 15000, // Increase timeout for larger files
            headers: {
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
            }
        })
            .then(response => {
                console.log('Resource download successful:', response);
                return response.data;
            })
            .catch(error => {
                console.error('Error fetching resource:', error);

                // Handle different error scenarios
                if (error.response) {
                    if (error.response.status === 500) {
                        throw new Error('Server error when downloading resource. Please try again later.');
                    } else if (error.response.status === 404) {
                        throw new Error('Resource not found. It may have been deleted or moved.');
                    } else if (error.response.status === 403) {
                        throw new Error('You do not have permission to access this resource.');
                    }
                } else if (error.request) {
                    throw new Error('No response from server. Please check your internet connection.');
                }

                throw new Error('Failed to download resource: ' + (error.message || 'Unknown error'));
            });
    },
    getResourceWithFallback: (resourceId, moduleId) => {
        // Try multiple potential endpoints in sequence
        const tryEndpoints = [
            () => api.get(`/api/resources/${resourceId}`, { responseType: 'blob' }),
            () => api.get(`/api/modules/${moduleId}/resources/${resourceId}/download`, { responseType: 'blob' }),
            () => api.get(`/api/modules/${moduleId}/resources/${resourceId}`, { responseType: 'blob' })
        ];

        // Recursively try each endpoint until one works
        const tryNext = async (index = 0) => {
            if (index >= tryEndpoints.length) {
                throw new Error('Could not download resource from any endpoint');
            }

            try {
                const response = await tryEndpoints[index]();
                return response.data;
            } catch (error) {
                console.warn(`Endpoint ${index + 1} failed, trying next endpoint...`);
                return tryNext(index + 1);
            }
        };

        return tryNext();
    },
    getTeaching: () => api.get('/api/modules/teaching'),
    getStudentDashboard: () => api.get('/api/modules/student/dashboard'),
    getModuleDetails: (id) => api.get(`/api/modules/${id}/details`),
    getModuleAnnouncements: (id) => {
        return api.get(`/api/modules/${id}/announcements`)
            .then(response => response.data)
            .catch(error => {
                console.error('Error fetching module announcements:', error);
                return [];  // Return empty array on error
            });
    },
    toggleModuleStatus: (id, isActive) => {
        console.log(`Toggling module status: id=${id}, isActive=${isActive}`);
        return api.patch(`/api/modules/${id}/status`, { active: isActive });
    },

    getModuleResources: (id) => {
        return api.get(`/api/modules/${id}/resources`)
            .then(response => response.data)
            .catch(error => {
                console.error('Error fetching module resources:', error);
                return [];  // Return empty array on error
            });
    },
    getModuleTests: (id) => api.get(`/api/modules/${id}/tests`),
    updateModule: (id, moduleData) => api.put(`/api/modules/${id}`, moduleData),

    getModuleStudents: (id) => {
        return api.get(`/api/modules/${id}/students`)
            .then(response => {
                console.log('Student API response:', response);

                // Check the structure of the response
                if (!Array.isArray(response.data)) {
                    console.warn('Expected array from getModuleStudents, got:', response.data);

                    // Try to extract students from the response if it's nested
                    if (response.data && response.data.students && Array.isArray(response.data.students)) {
                        return response.data.students;
                    }

                    // Try to convert object to array if it's an object with numeric keys
                    if (response.data && typeof response.data === 'object' && !Array.isArray(response.data)) {
                        return Object.values(response.data);
                    }

                    // Return empty array if no valid data
                    return [];
                }

                return response.data;
            })
            .catch(error => {
                console.error('Error in getModuleStudents:', error);
                return []; // Return empty array instead of throwing
            });
    },


    postAnnouncement: (moduleId, announcementData) => {
        return api.post(`/api/modules/${moduleId}/announcements`, announcementData)
            .then(response => response.data)
            .catch(error => {
                console.error('Error posting announcement:', error);
                throw error;
            });
    },

    deleteAnnouncement: (moduleId, announcementId) => {
        return api.delete(`/api/modules/${moduleId}/announcements/${announcementId}`)
            .then(response => response.data)
            .catch(error => {
                console.error('Error deleting announcement:', error);
                throw error;
            });
    },

    // In api.js
    uploadResource: (moduleId, formData) => {
        console.log('Uploading resource to module:', moduleId);
        console.log('FormData entries:');
        for (let [key, value] of formData.entries()) {
            console.log(key, ':', value instanceof File ? value.name : value);
        }

        return api.post(`/api/modules/${moduleId}/resources`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        })
            .then(response => {
                console.log('Upload success response:', response);
                return response.data;
            })
            .catch(error => {
                console.error('Upload error details:', error.response || error);
                throw error;
            });
    },

    deleteResource: (moduleId, resourceId) => {
        return api.delete(`/api/modules/${moduleId}/resources/${resourceId}`)
            .then(response => response.data)
            .catch(error => {
                console.error('Error deleting resource:', error);
                throw error;
            });
    },

    exportStudentData: (moduleId, format = 'csv') => {
        return new Promise((resolve, reject) => {
            // Try the API endpoint first
            api.get(`/api/modules/${moduleId}/students/export?format=${format}`, {
                responseType: 'blob'
            })
                .then(response => {
                    resolve(response.data);
                })
                .catch(async error => {
                    console.error('Export API failed, falling back to client-side generation:', error);

                    try {
                        // Get students data for client-side generation
                        const students = await moduleAPI.getModuleStudents(moduleId);

                        // Generate CSV content
                        const header = 'Student ID,Name,Email,Overall Score,Participation Rate,Tests Completed,Tests Pending\n';
                        const rows = students.map(student => {
                            return `${student.studentId || ''},${student.name || ''},${student.email || ''},${student.overallScore || 0},${student.participationRate || 0},${student.testsCompleted || 0},${student.testsPending || 0}`;
                        }).join('\n');

                        // Create blob
                        const csvContent = header + rows;
                        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                        resolve(blob);
                    } catch (fallbackError) {
                        reject(fallbackError);
                    }
                });
        });
    },


    // Enhanced version of getTestDetails with better error handling
    getTestDetails: (moduleId, testId) => {
        console.log(`Fetching test details: moduleId=${moduleId}, testId=${testId}`);

        // Validate parameters
        if (!moduleId || !testId) {
            console.error('Missing required parameters:', { moduleId, testId });
            return Promise.reject(new Error('Module ID and Test ID are required'));
        }

        return api.get(`/api/modules/${moduleId}/tests/${testId}`, {
            // Add timeout to avoid hanging requests
            timeout: 10000,
        })
            .then(response => {
                console.log('Test details response:', response);
                return response.data;
            })
            .catch(error => {
                console.error('Error getting test details:', error);

                // Detailed error logging
                if (error.response) {
                    console.error('Server responded with error:', {
                        status: error.response.status,
                        data: error.response.data
                    });

                    // Return null with a specific pattern so we can detect the error type
                    return { error: true, status: error.response.status, message: error.response.data?.message || 'Server error' };
                } else if (error.request) {
                    console.error('No response received:', error.request);
                    return { error: true, status: 0, message: 'No response from server' };
                } else {
                    console.error('Request setup error:', error.message);
                    return { error: true, message: error.message };
                }
            });
    }
};

// Test API endpoints
export const testAPI = {
    getUpcoming: () => api.get('/api/tests/upcoming'),

    getById: (id) => {
        console.log(`Fetching test with ID: ${id}`);
        return api.get(`/api/tests/${id}`)
            .then(response => {
                console.log('Test data response:', response);
                return response.data;
            })
            .catch(error => {
                console.error('Error getting test details:', error);
                throw new Error(error.response?.data?.message || 'Failed to load test');
            });
    },

    submit: (testId, answers) => {
        console.log(`Submitting answers for test ${testId}:`, answers);
        return api.post(`/api/tests/${testId}/submit`, answers)
            .then(response => {
                console.log('Submission response:', response);
                return response.data;
            })
            .catch(error => {
                console.error('Submission error:', error);
                throw new Error(error.response?.data?.message || 'Failed to submit test');
            });
    },

    saveProgress: (testId, answers) => {
        return api.post(`/api/tests/${testId}/progress`, answers)
            .then(response => {
                console.log('Progress save response:', response);
                return response.data;
            })
            .catch(error => {
                console.error('Progress save error:', error);
                throw new Error(error.response?.data?.message || 'Failed to save progress');
            });
    },

    getDetailedTestResults: (id) => {
        console.log(`Fetching detailed test results for ID: ${id}`);
        return api.get(`/api/tests/${id}/detailed-results`)
            .then(response => {
                console.log('Detailed results response:', response);
                return response.data;
            })
            .catch(error => {
                console.error('Error getting detailed test results:', error);

                // Handle different error types
                if (error.response) {
                    // Server returned an error response (4xx, 5xx)
                    const status = error.response.status;
                    const errorMsg = error.response.data?.message || 'Unknown error';

                    if (status === 404) {
                        return {
                            error: true,
                            message: `Test not found with ID: ${id}. Please make sure you're accessing your own test.`
                        };
                    } else {
                        return { error: true, message: errorMsg };
                    }
                } else if (error.request) {
                    // No response received
                    return { error: true, message: 'No response from server' };
                } else {
                    // Something else went wrong
                    return { error: true, message: error.message };
                }
            });
    },

    getSubmissionStats: () => {
        return api.get('/api/submissions/stats')
            .then(response => response.data)
            .catch(error => {
                console.error('Error getting submission stats:', error);
                return { completedCount: 0, averageScore: 0 };
            });
    },



    getProgress: (testId) => {
        return api.get(`/api/tests/${testId}/progress`)
            .then(response => {
                console.log('Progress data:', response);
                return response.data;
            })
            .catch(error => {
                console.error('Error getting progress:', error);
                return { status: 'NOT_STARTED', answers: {} };
            });
    },

    getStudentTest: (id) => {
        console.log(`Fetching student test with ID: ${id}`);
        return api.get(`/api/tests/student/${id}`)
            .then(response => {
                console.log('Student test data response:', response);
                return response.data;
            })
            .catch(error => {
                console.error('Error getting student test details:', error);
                throw new Error(error.response?.data?.message || 'Failed to load test');
            });
    },
    getLecturerStats: () => api.get('/api/tests/lecturer/stats'),
    getLecturerTests: () => api.get('/api/tests/lecturer'),
    getStudentTests: (moduleId, studentId) => {
        console.log(`API call: Getting tests for student ${studentId} in module ${moduleId}`);
        return api.get(`/api/modules/${moduleId}/students/${studentId}/tests`)
            .then(response => {
                console.log('Student tests API response:', response);

                // Check if response contains an error property
                if (response.data && response.data.error) {
                    console.error('API returned error:', response.data.message);
                    return [];
                }

                // If it's wrapped in a data property, return response.data.data
                if (response.data && Array.isArray(response.data.data)) {
                    return response.data.data;
                }

                // If it's an array directly, return it
                if (Array.isArray(response.data)) {
                    return response.data;
                }

                // Default case - empty array
                console.warn('Unexpected response format:', response.data);
                return [];
            })
            .catch(error => {
                console.error('Error getting student tests:', error);
                return [];
            });
    },
    createTest: (testData) => api.post('/api/tests', testData),
    getTestResults: (testId, moduleId = null) => {
        // Create an array of endpoints to try in order of preference
        const endpoints = [
            `/api/submissions/test/${testId}/details`,  // Try this first - from SubmissionController
            `/api/tests/${testId}/results`,             // Try this next - from TestController
            `/api/modules/${moduleId}/tests/${testId}/results` // Try this if moduleId is available
        ].filter(endpoint => endpoint); // Remove any undefined endpoints

        console.log(`Will try these endpoints for test results:`, endpoints);

        // Try each endpoint in sequence
        const tryNextEndpoint = (index = 0) => {
            if (index >= endpoints.length) {
                console.log('All endpoints failed, returning empty array');
                return Promise.resolve({ data: [] });
            }

            const url = endpoints[index];
            console.log(`Trying endpoint ${index + 1}/${endpoints.length}: ${url}`);

            return api.get(url)
                .then(response => {
                    console.log(`Endpoint ${url} succeeded:`, response);

                    // Transform the data to match expected format
                    if (Array.isArray(response.data)) {
                        return { data: response.data };
                    } else if (response.data && response.data.answers) {
                        // If we got a single submission with answers, format it properly
                        return {
                            data: [{
                                // Map the fields explicitly
                                studentName: response.data.studentName || 'Unknown',
                                score: response.data.totalScore || 0, // Use totalScore as the score
                                timeSpent: response.data.timeSpent || '-',
                                submittedAt: response.data.submissionDate || '-',
                                status: response.data.status || 'GRADED'
                            }]
                        };
                    }
                    // Return as-is if format already matches
                    return response.data;
                })
                .catch(error => {
                    console.warn(`Endpoint ${url} failed:`, error.message);
                    return tryNextEndpoint(index + 1);
                });
        };

        return tryNextEndpoint();
    },
    getTestWithAllQuestions: (testId) => {
        return api.get(`/api/tests/${testId}`) // Use the existing endpoint to get complete test data
            .then(response => {
                console.log('Complete test data response:', response);
                return response.data;
            })
            .catch(error => {
                console.error('Error getting complete test data:', error);
                throw new Error(error.response?.data?.message || 'Failed to load test with all questions');
            });
    },

    // Appeal-related endpoints
    getLecturerAppeals: () => api.get('/api/tests/lecturer/appeals'),
    getLecturerAppealCount: () => api.get('/api/tests/lecturer/appeals/count'),
    resolveAppeal: (id, resolutionData) => api.post(`/api/tests/appeals/${id}/resolve`, resolutionData),


    getAppealById: (appealId) => {
        return api.get(`/api/tests/appeals/${appealId}`)
            .then(response => response.data)
            .catch(error => {
                console.error('Error fetching appeal details:', error);
                throw handleApiError(error);
            });
    },

    submitAppeal: (submissionId, appealData) => {
        return api.post(`/api/tests/submissions/${submissionId}/appeal`, appealData)
            .then(response => response.data)
            .catch(error => {
                console.error('Error submitting appeal:', error);
                throw handleApiError(error);
            });
    },


    getTestQuestions: (testId) => {
        return api.get(`/api/tests/${testId}/questions`)
            .then(response => {
                console.log('Questions response:', response);
                return response.data;
            })
            .catch(error => {
                console.error('Error getting test questions:', error);
                throw new Error(error.response?.data?.message || 'Failed to load questions');
            });
    },

    updateTestQuestions: (testId, questions) => {
        return api.put(`/api/tests/${testId}/questions`, questions)
            .then(response => {
                console.log('Update questions response:', response);
                return response.data;
            })
            .catch(error => {
                console.error('Error updating test questions:', error);
                throw new Error(error.response?.data?.message || 'Failed to update questions');
            });
    },


    deleteQuestions: (testId, questionIds) => {
        return api.post(`/api/tests/${testId}/questions/delete`, { questionIds })
            .then(response => response.data)
            .catch(error => {
                console.error('Error deleting questions:', error);
                throw new Error(error.response?.data?.message || 'Failed to delete questions');
            });
    },


    updateTest: (id, testData) => {
        return api.put(`/api/tests/${id}`, testData)
            .then(response => response.data)
            .catch(error => {
                console.error('Error updating test:', error);
                throw new Error(error.response?.data?.message || 'Failed to update test');
            });
    },



    // New analytics endpoints
    getDashboardAnalytics: () => api.get('/api/tests/lecturer/analytics'),
    getModulePerformance: () => api.get('/api/tests/lecturer/analytics/performance'),
    getTestActivity: () => api.get('/api/tests/lecturer/analytics/activity'),
    getAIConfidence: () => api.get('/api/tests/lecturer/analytics/ai-confidence'),
    cancelTest: (moduleId, testId) => {
        console.log(`Cancelling test: moduleId=${moduleId}, testId=${testId}`);
        return api.patch(`/api/tests/modules/${moduleId}/tests/${testId}/cancel`)
            .then(response => {
                console.log('Test cancellation response:', response);
                return response.data;
            })
            .catch(error => {
                console.error('Error cancelling test:', error);
                throw handleApiError(error);
            });
    }
};

// Submission API endpoints
export const submissionAPI = {
    getCompleted: () => api.get('/api/submissions/completed'),
    getById: (id) => api.get(`/api/submissions/${id}`),

    getPerformanceSummary: () => {
        return api.get('/api/submissions/performance')
            .then(response => {
                console.log('Performance data response:', response);
                return response.data;
            })
            .catch(error => {
                console.error('Error getting performance data:', error);

                // Return default empty structure instead of throwing
                return {
                    overallAverage: 0,
                    completedModulesCount: 0,
                    totalModulesCount: 0,
                    modules: []
                };
            });
    }
};


export const handleApiError = (error) => {
    if (error.response) {
        console.error('API Error:', error.response.data);
        return error.response.data.message || 'An error occurred';
    } else if (error.request) {
        console.error('Network Error:', error.request);
        return 'No response from server';
    } else {
        console.error('Request Error:', error.message);
        return 'Error setting up request';
    }
};

export default api;