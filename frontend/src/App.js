import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, theme } from 'antd';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './components/Login';
import Register from './components/Register';
import Game from './components/Game';
import Dashboard from './components/Dashboard';
import Leaderboard from './components/Leaderboard';
import SqlGame from './components/SqlGame';
import SqlQuiz from './components/SqlQuiz';
import './App.css';

// Custom theme configuration
const customTheme = {
    algorithm: theme.darkAlgorithm,
    token: {
        colorPrimary: '#00d9a5',
        colorBgContainer: '#0a1929',
        colorBgElevated: '#132f4c',
        borderRadius: 8,
        fontFamily: "'Outfit', 'Segoe UI', sans-serif",
    },
    components: {
        Button: {
            primaryColor: '#0a1929',
        },
        Card: {
            colorBgContainer: 'rgba(19, 47, 76, 0.8)',
        },
        Input: {
            colorBgContainer: 'rgba(10, 25, 41, 0.8)',
            colorBorder: '#1e4976',
        }
    }
};

// Protected route component
const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return (
            <div className="loading-screen">
                <div className="loading-spinner"></div>
                <p>Loading...</p>
            </div>
        );
    }

    return isAuthenticated ? children : <Navigate to="/login" replace />;
};

// Public route - redirect if authenticated
const PublicRoute = ({ children }) => {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return (
            <div className="loading-screen">
                <div className="loading-spinner"></div>
                <p>Loading...</p>
            </div>
        );
    }

    return !isAuthenticated ? children : <Navigate to="/dashboard" replace />;
};

const AppRoutes = () => {
    return (
        <Routes>
            <Route
                path="/login"
                element={
                    <PublicRoute>
                        <Login />
                    </PublicRoute>
                }
            />
            <Route
                path="/register"
                element={
                    <PublicRoute>
                        <Register />
                    </PublicRoute>
                }
            />
            <Route
                path="/dashboard"
                element={
                    <ProtectedRoute>
                        <Dashboard />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/game"
                element={
                    <ProtectedRoute>
                        <Game />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/sql"
                element={
                    <ProtectedRoute>
                        <SqlGame />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/sql-quiz"
                element={
                    <ProtectedRoute>
                        <SqlQuiz />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/leaderboard"
                element={
                    <ProtectedRoute>
                        <Leaderboard />
                    </ProtectedRoute>
                }
            />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
    );
};

function App() {
    return (
        <ConfigProvider theme={customTheme}>
            <AuthProvider>
                <Router>
                    <div className="app">
                        <AppRoutes />
                    </div>
                </Router>
            </AuthProvider>
        </ConfigProvider>
    );
}

export default App;
