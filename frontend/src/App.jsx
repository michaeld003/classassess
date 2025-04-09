import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Box } from '@mui/material';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Navbar from './components/layout/Navbar';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import StudentDashboard from './components/student/Dashboard';
import TestTaking from './components/student/TestTaking';
import TestCreation from './components/lecturer/TestCreation';
import LecturerDashboard from './components/lecturer/LecturerDashboard';
import ModuleDetails from './components/module/ModuleDetails';
import ModuleList from './components/module/ModuleList';
import LecturerModuleList from './components/lecturer/LecturerModuleList';
import AdminDashboard from './components/admin/AdminDashboard';
import UserManagement from './components/admin/UserManagement';
import AppealSystem from './components/admin/AppealSystem';
import Reports from './components/admin/Reports';
import ModuleNotAvailablePage from './components/shared/ModuleNotAvailablePage';
import AdminModuleDetails from "@/components/admin/AdminModuleDetails.jsx";
import TestDetails from './components/lecturer/TestDetails';
import TestsList from './components/lecturer/TestsList';
import TestResults from './components/student/TestResults';
import StudentAppeal from './components/student/StudentAppeal';
import LecturerAppealDetail from './components/lecturer/LecturerAppealDetail';
import LecturerAppealSystem from './components/lecturer/LecturerAppealSystem';
import StudentPerformance from './components/student/StudentPerformance';
import LecturerPerformance from "@/components/lecturer/LecturerPerformance.jsx";
import LandingPage from "./components/auth/LandingPage.jsx";
import AppContent from './components/layout/AppContent';
import ForgotPassword from "@/components/auth/ForgotPassword.jsx";
import ResetPassword from "@/components/auth/ResetPassword.jsx";



function App() {
    return (
        <AuthProvider>
            <Router>
                <AppContent>
                    <Routes>
                        <Route path="/" element={<LandingPage />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />

                        <Route path="/forgot-password" element={<ForgotPassword />} />
                        <Route path="/reset-password/:token" element={<ResetPassword />} />

                            {/* Student Routes */}
                            <Route path="/student/*">
                                <Route
                                    path="dashboard"
                                    element={
                                        <ProtectedRoute allowedRoles={['STUDENT']}>
                                            <StudentDashboard />
                                        </ProtectedRoute>
                                    }
                                />

                                <Route path="results/:id" element={<TestResults />} />

                                {/* Performance route */}
                                <Route
                                    path="performance"
                                    element={
                                        <ProtectedRoute allowedRoles={['STUDENT']}>
                                            <StudentPerformance />
                                        </ProtectedRoute>
                                    }
                                />

                                <Route
                                    path="appeal/:id"
                                    element={
                                        <ProtectedRoute allowedRoles={['STUDENT']}>
                                            <StudentAppeal />
                                        </ProtectedRoute>
                                    }
                                />

                                <Route
                                    path="test/:id"
                                    element={
                                        <ProtectedRoute allowedRoles={['STUDENT']}>
                                            <TestTaking />
                                        </ProtectedRoute>
                                    }
                                />
                            </Route>

                            {/* Lecturer Routes */}
                            <Route path="/lecturer/*">
                                <Route
                                    path="dashboard"
                                    element={
                                        <ProtectedRoute allowedRoles={['LECTURER']}>
                                            <LecturerDashboard />
                                        </ProtectedRoute>
                                    }
                                />

                                <Route
                                    path="test/:testId"
                                    element={
                                        <ProtectedRoute allowedRoles={['LECTURER']}>
                                            <TestDetails />
                                        </ProtectedRoute>
                                    }
                                />

                                <Route
                                    path="test/:id/edit"
                                    element={
                                        <ProtectedRoute allowedRoles={['LECTURER']}>
                                            <TestCreation editMode={true} />
                                        </ProtectedRoute>
                                    }
                                />

                                {/* Performance routes */}
                                <Route
                                    path="performance"
                                    element={
                                        <ProtectedRoute allowedRoles={['LECTURER']}>
                                            <LecturerPerformance />
                                        </ProtectedRoute>
                                    }
                                />

                                <Route
                                    path="performance/:id"
                                    element={
                                        <ProtectedRoute allowedRoles={['LECTURER']}>
                                            <LecturerPerformance />
                                        </ProtectedRoute>
                                    }
                                />

                                {/* Appeals routes */}
                                <Route
                                    path="appeals"
                                    element={
                                        <ProtectedRoute allowedRoles={['LECTURER']}>
                                            <LecturerAppealSystem />
                                        </ProtectedRoute>
                                    }
                                />

                                <Route
                                    path="appeals/:id"
                                    element={
                                        <ProtectedRoute allowedRoles={['LECTURER']}>
                                            <LecturerAppealDetail />
                                        </ProtectedRoute>
                                    }
                                />

                                <Route
                                    path="create-test"
                                    element={
                                        <ProtectedRoute allowedRoles={['LECTURER']}>
                                            <TestCreation />
                                        </ProtectedRoute>
                                    }
                                />

                                <Route
                                    path="module/:moduleId/create-test"
                                    element={
                                        <ProtectedRoute allowedRoles={['LECTURER']}>
                                            <TestCreation />
                                        </ProtectedRoute>
                                    }
                                />

                                <Route
                                    path="modules/:moduleId/tests"
                                    element={
                                        <ProtectedRoute allowedRoles={['LECTURER']}>
                                            <TestsList />
                                        </ProtectedRoute>
                                    }
                                />

                                {/* Add this new route for test details */}
                                <Route
                                    path="modules/:moduleId/tests/:testId"
                                    element={
                                        <ProtectedRoute allowedRoles={['LECTURER']}>
                                            <TestDetails />
                                        </ProtectedRoute>
                                    }
                                />
                            </Route>


                            {/* Admin Routes */}
                            <Route path="/admin/*">
                                <Route
                                    path="dashboard"
                                    element={
                                        <ProtectedRoute allowedRoles={['ADMIN']}>
                                            <AdminDashboard />
                                        </ProtectedRoute>
                                    }
                                />
                                <Route
                                    path="users"
                                    element={
                                        <ProtectedRoute allowedRoles={['ADMIN']}>
                                            <UserManagement />
                                        </ProtectedRoute>
                                    }
                                />
                                <Route
                                    path="appeals"
                                    element={
                                        <ProtectedRoute allowedRoles={['ADMIN']}>
                                            <AppealSystem />
                                        </ProtectedRoute>
                                    }
                                />
                                <Route path="modules/:id" element={
                                    <ProtectedRoute allowedRoles={['ADMIN']}>
                                        <AdminModuleDetails />
                                    </ProtectedRoute>
                                } />
                                <Route
                                    path="reports"
                                    element={
                                        <ProtectedRoute allowedRoles={['ADMIN']}>
                                            <Reports />
                                        </ProtectedRoute>
                                    }
                                />
                            </Route>


                            {/* Module Routes */}
                            <Route
                                path="/modules"
                                element={
                                    <ProtectedRoute allowedRoles={['STUDENT', 'LECTURER']}>
                                        {({ user }) => (
                                            user?.role === 'LECTURER' ? <LecturerModuleList /> : <ModuleList />
                                        )}
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/module/:moduleId"
                                element={
                                    <ProtectedRoute allowedRoles={['STUDENT', 'LECTURER']}>
                                        <ModuleDetails />
                                    </ProtectedRoute>
                                }
                            />

                            {/* Add the missing module/test routes */}
                            <Route
                                path="/module/:moduleId/create-test"
                                element={
                                    <ProtectedRoute allowedRoles={['LECTURER']}>
                                        <TestCreation />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/module/:moduleId/test/:testId"
                                element={
                                    <ProtectedRoute allowedRoles={['LECTURER', 'STUDENT']}>
                                        {({ user }) => (
                                            user?.role === 'LECTURER' ? <TestCreation /> : <TestTaking />
                                        )}
                                    </ProtectedRoute>
                                }
                            />

                            <Route
                                path="/module/:moduleId/test/:testId/details"
                                element={
                                    <ProtectedRoute allowedRoles={['LECTURER']}>
                                        <TestDetails />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/module/:moduleId/test/:testId/edit"
                                element={
                                    <ProtectedRoute allowedRoles={['LECTURER']}>
                                        <TestCreation />
                                    </ProtectedRoute>
                                }
                            />

                            {/* Module Not Available Page */}
                            <Route
                                path="/module-unavailable/:moduleId?"
                                element={
                                    <ProtectedRoute allowedRoles={['STUDENT', 'LECTURER']}>
                                        <ModuleNotAvailablePage />
                                    </ProtectedRoute>
                                }
                            />
                    </Routes>
                </AppContent>
            </Router>
        </AuthProvider>
    );
}

export default App;
