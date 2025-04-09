import axios from 'axios';

const API_URL = 'http://localhost:8080/api/modules';

const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    };
};

// Basic module operations
export const getAllModules = async () => {
    try {
        const response = await axios.get(API_URL, getAuthHeader());
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const getModuleById = async (id) => {
    try {
        const response = await axios.get(`${API_URL}/${id}`, getAuthHeader());
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const getModuleByCode = async (code) => {
    try {
        const response = await axios.get(`${API_URL}/code/${code}`, getAuthHeader());
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const createModule = async (moduleData) => {
    try {
        console.log('Creating module with data:', moduleData);
        const response = await axios.post(API_URL, moduleData, getAuthHeader());
        console.log('Module created:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error creating module:', error);
        if (error.response?.data) {
            console.error('Server error details:', error.response.data);
            throw error.response.data;
        }
        throw new Error(error.message || 'Unknown error creating module');
    }
};

export const updateModule = async (id, moduleData) => {
    try {
        const response = await axios.put(`${API_URL}/${id}`, moduleData, getAuthHeader());
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const deleteModule = async (id) => {
    try {
        console.log(`Deleting module with id: ${id}`);
        const response = await axios.delete(`${API_URL}/${id}`, getAuthHeader());
        console.log('Module deleted successfully');
        return response.data;
    } catch (error) {
        console.error('Error deleting module:', error);

        if (error.response?.data) {
            console.error('Server response:', error.response.data);
            // If the server returned an ApiResponse with a message
            if (error.response.data.message) {
                throw new Error(error.response.data.message);
            }
            throw error.response.data;
        }

        throw new Error(error.message || 'Failed to delete module');
    }
};

// Module enrollment methods
export const getAvailableModules = async () => {
    try {
        const response = await axios.get(`${API_URL}/available`, getAuthHeader());
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const enrollInModules = async (moduleIds) => {
    try {
        const response = await axios.post(`${API_URL}/enroll`, { moduleIds }, getAuthHeader());
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const getEnrolledModules = async () => {
    try {
        const response = await axios.get(`${API_URL}/enrolled`, getAuthHeader());
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

// Admin module methods
export const getModulesForAdmin = async () => {
    try {
        const response = await axios.get(`${API_URL}/admin/all`, getAuthHeader());
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const toggleModuleStatus = async (id, isActive) => {
    try {
        console.log(`API call: Setting module ${id} active status to ${isActive}`);
        const response = await axios.patch(
            `${API_URL}/${id}/status`,
            { active: isActive },
            getAuthHeader()
        );
        console.log('API response:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error in toggleModuleStatus API call:', error);
        throw error.response?.data || error.message;
    }
};

export const getModuleStats = async () => {
    try {
        const response = await axios.get(`${API_URL}/stats`, getAuthHeader());
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

// Test management API methods
export const getModuleTests = async (moduleId) => {
    try {
        const response = await axios.get(`${API_URL}/${moduleId}/tests`, getAuthHeader());
        return response.data;
    } catch (error) {
        console.error('Error fetching module tests:', error);
        throw error.response?.data || error.message;
    }
};

export const createTest = async (moduleId, testData) => {
    try {
        const response = await axios.post(`${API_URL}/${moduleId}/tests`, testData, getAuthHeader());
        return response.data;
    } catch (error) {
        console.error('Error creating test:', error);
        throw error.response?.data || error.message;
    }
};

export const updateTest = async (moduleId, testId, testData) => {
    try {
        const response = await axios.put(`${API_URL}/${moduleId}/tests/${testId}`, testData, getAuthHeader());
        return response.data;
    } catch (error) {
        console.error('Error updating test:', error);
        throw error.response?.data || error.message;
    }
};

export const deleteTest = async (moduleId, testId) => {
    try {
        const response = await axios.delete(`${API_URL}/${moduleId}/tests/${testId}`, getAuthHeader());
        return response.data;
    } catch (error) {
        console.error('Error deleting test:', error);
        throw error.response?.data || error.message;
    }
};

export const archiveTest = async (moduleId, testId, archive = true) => {
    try {
        const response = await axios.patch(
            `${API_URL}/${moduleId}/tests/${testId}/archive`,
            { archived: archive },
            getAuthHeader()
        );
        return response.data;
    } catch (error) {
        console.error('Error archiving test:', error);
        throw error.response?.data || error.message;
    }
};

export const cloneTest = async (moduleId, testId, newTestData) => {
    try {
        const response = await axios.post(
            `${API_URL}/${moduleId}/tests/${testId}/clone`,
            newTestData,
            getAuthHeader()
        );
        return response.data;
    } catch (error) {
        console.error('Error cloning test:', error);
        throw error.response?.data || error.message;
    }
};

// Student performance API methods
export const getModuleStudents = async (moduleId) => {
    try {
        const response = await axios.get(`${API_URL}/${moduleId}/students`, getAuthHeader());
        return response.data;
    } catch (error) {
        console.error('Error fetching module students:', error);
        // Return empty array instead of throwing error for better UI handling
        return [];
    }
};

export const getStudentPerformance = async (moduleId, studentId) => {
    try {
        const response = await axios.get(
            `${API_URL}/${moduleId}/students/${studentId}/performance`,
            getAuthHeader()
        );
        return response.data;
    } catch (error) {
        console.error('Error fetching student performance:', error);
        throw error.response?.data || error.message;
    }
};

export const exportStudentData = async (moduleId, format = 'csv') => {
    try {
        const response = await axios.get(
            `${API_URL}/${moduleId}/students/export?format=${format}`,
            {
                ...getAuthHeader(),
                responseType: 'blob'
            }
        );
        return response.data;
    } catch (error) {
        console.error('Error exporting student data:', error);
        throw error.response?.data || error.message;
    }
};

// Resource management API methods
export const getModuleResources = async (moduleId) => {
    try {
        const response = await axios.get(`${API_URL}/${moduleId}/resources`, getAuthHeader());
        return response.data;
    } catch (error) {
        console.error('Error fetching module resources:', error);
        return [];
    }
};

export const uploadResource = async (moduleId, formData) => {
    try {
        const response = await axios.post(
            `${API_URL}/${moduleId}/resources`,
            formData,
            {
                ...getAuthHeader(),
                headers: {
                    ...getAuthHeader().headers,
                    'Content-Type': 'multipart/form-data'
                },
                onUploadProgress: progressEvent => {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    // You can use this for progress tracking if needed
                    console.log(`Upload progress: ${percentCompleted}%`);
                }
            }
        );
        return response.data;
    } catch (error) {
        console.error('Error uploading resource:', error);
        throw error.response?.data || error.message;
    }
};

export const downloadResource = async (moduleId, resourceId) => {
    try {
        const response = await axios.get(
            `${API_URL}/${moduleId}/resources/${resourceId}/download`,
            {
                ...getAuthHeader(),
                responseType: 'blob'
            }
        );
        return response.data;
    } catch (error) {
        console.error('Error downloading resource:', error);
        throw error.response?.data || error.message;
    }
};

export const deleteResource = async (moduleId, resourceId) => {
    try {
        const response = await axios.delete(
            `${API_URL}/${moduleId}/resources/${resourceId}`,
            getAuthHeader()
        );
        return response.data;
    } catch (error) {
        console.error('Error deleting resource:', error);
        throw error.response?.data || error.message;
    }
};

export const getResourceCategories = async (moduleId) => {
    try {
        const response = await axios.get(
            `${API_URL}/${moduleId}/resource-categories`,
            getAuthHeader()
        );
        return response.data;
    } catch (error) {
        console.error('Error fetching resource categories:', error);
        throw error.response?.data || error.message;
    }
};

export const updateResourceCategories = async (moduleId, categories) => {
    try {
        const response = await axios.put(
            `${API_URL}/${moduleId}/resource-categories`,
            { categories },
            getAuthHeader()
        );
        return response.data;
    } catch (error) {
        console.error('Error updating resource categories:', error);
        throw error.response?.data || error.message;
    }
};

// Add the following methods to your module.js file

// Announcement management API methods
export const getModuleAnnouncements = async (moduleId) => {
    try {
        const response = await axios.get(
            `${API_URL}/${moduleId}/announcements`,
            getAuthHeader()
        );
        return response.data;
    } catch (error) {
        console.error('Error fetching module announcements:', error);
        return [];
    }
};

export const postAnnouncement = async (moduleId, announcement) => {
    try {
        const response = await axios.post(
            `${API_URL}/${moduleId}/announcements`,
            announcement,
            getAuthHeader()
        );
        return response.data;
    } catch (error) {
        console.error('Error posting announcement:', error);
        throw error.response?.data || error.message;
    }
};

export const deleteAnnouncement = async (moduleId, announcementId) => {
    try {
        const response = await axios.delete(
            `${API_URL}/${moduleId}/announcements/${announcementId}`,
            getAuthHeader()
        );
        return response.data;
    } catch (error) {
        console.error('Error deleting announcement:', error);
        throw error.response?.data || error.message;
    }
};