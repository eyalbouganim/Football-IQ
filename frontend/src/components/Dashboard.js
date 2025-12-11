import React, { useState, useEffect } from 'react';
import { Layout, Menu, Row, Col, Card, Button, Statistic, message, Modal } from 'antd';
import {
    DashboardOutlined,
    PlayCircleOutlined,
    TrophyOutlined,
    UserOutlined,
    LogoutOutlined,
    FireOutlined,
    ThunderboltOutlined,
    StarOutlined,
    CodeOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { gameAPI } from '../services/api';

const { Sider, Content } = Layout;

const Dashboard = () => {
    const [collapsed, setCollapsed] = useState(false);
    const [stats, setStats] = useState(null);
    const [recentGames, setRecentGames] = useState([]);
    const [loading, setLoading] = useState(true);
    const [logoutModalVisible, setLogoutModalVisible] = useState(false);
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const response = await gameAPI.getStats();
            setStats(response.data.data.user);
            setRecentGames(response.data.data.recentGames || []);
        } catch (error) {
            console.error('Failed to fetch stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        logout();
        message.success('Logged out successfully');
        navigate('/login');
    };

    const menuItems = [
        { key: 'dashboard', icon: <DashboardOutlined />, label: 'Dashboard' },
        { key: 'sql', icon: <CodeOutlined />, label: 'SQL Challenges' },
        { key: 'play', icon: <PlayCircleOutlined />, label: 'Trivia Quiz' },
        { key: 'leaderboard', icon: <TrophyOutlined />, label: 'Leaderboard' },
        { key: 'profile', icon: <UserOutlined />, label: 'Profile' },
        { type: 'divider' },
        { key: 'logout', icon: <LogoutOutlined />, label: 'Logout', danger: true },
    ];

    const handleMenuClick = ({ key }) => {
        switch (key) {
            case 'sql':
                navigate('/sql');
                break;
            case 'play':
                navigate('/game');
                break;
            case 'leaderboard':
                navigate('/leaderboard');
                break;
            case 'logout':
                setLogoutModalVisible(true);
                break;
            default:
                break;
        }
    };

    return (
        <Layout className="main-layout" style={{ minHeight: '100vh' }}>
            <Sider
                collapsible
                collapsed={collapsed}
                onCollapse={setCollapsed}
                className="sidebar"
                breakpoint="lg"
            >
                <div className="logo-container">
                    <h2>⚽ {!collapsed && 'Football-IQ'}</h2>
                    {!collapsed && <span>Test Your Knowledge</span>}
                </div>
                <Menu
                    theme="dark"
                    mode="inline"
                    defaultSelectedKeys={['dashboard']}
                    items={menuItems}
                    onClick={handleMenuClick}
                />
            </Sider>

            <Layout>
                <Content style={{ padding: '24px', minHeight: '100vh' }}>
                    {/* Welcome Section */}
                    <div style={{ marginBottom: 32 }}>
                        <h1 style={{ 
                            fontSize: 32, 
                            fontWeight: 700, 
                            marginBottom: 8,
                            background: 'linear-gradient(135deg, #ffffff 0%, #00d9a5 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent'
                        }}>
                            Welcome back, {user?.username || 'Player'}! 👋
                        </h1>
                        <p style={{ color: 'var(--text-secondary)', fontSize: 16 }}>
                            Ready to test your football knowledge?
                        </p>
                    </div>

                    {/* SQL Challenges Card */}
                    <Card 
                        style={{ 
                            marginBottom: 24,
                            background: 'linear-gradient(135deg, rgba(0, 217, 165, 0.2) 0%, rgba(19, 47, 76, 0.9) 100%)',
                            border: '1px solid rgba(0, 217, 165, 0.3)'
                        }}
                    >
                        <Row align="middle" justify="space-between">
                            <Col>
                                <h2 style={{ margin: 0, marginBottom: 8 }}>⚡ SQL Challenges</h2>
                                <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
                                    Master SQL with real football data - GROUP BY, JOINs, aggregations & more!
                                </p>
                            </Col>
                            <Col>
                                <Button 
                                    type="primary" 
                                    size="large"
                                    icon={<CodeOutlined />}
                                    onClick={() => navigate('/sql')}
                                    style={{ 
                                        height: 48,
                                        paddingLeft: 32,
                                        paddingRight: 32,
                                        fontSize: 16,
                                        fontWeight: 600
                                    }}
                                >
                                    Start Challenges
                                </Button>
                            </Col>
                        </Row>
                    </Card>

                    {/* Trivia Quiz Card */}
                    <Card 
                        style={{ 
                            marginBottom: 24,
                            background: 'linear-gradient(135deg, rgba(138, 43, 226, 0.15) 0%, rgba(19, 47, 76, 0.9) 100%)',
                            border: '1px solid rgba(138, 43, 226, 0.3)'
                        }}
                    >
                        <Row align="middle" justify="space-between">
                            <Col>
                                <h2 style={{ margin: 0, marginBottom: 8 }}>🎮 Trivia Quiz</h2>
                                <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
                                    Test your football knowledge with fun trivia questions
                                </p>
                            </Col>
                            <Col>
                                <Button 
                                    size="large"
                                    icon={<PlayCircleOutlined />}
                                    onClick={() => navigate('/game')}
                                    style={{ 
                                        height: 48,
                                        paddingLeft: 32,
                                        paddingRight: 32,
                                        fontSize: 16
                                    }}
                                >
                                    Play Trivia
                                </Button>
                            </Col>
                        </Row>
                    </Card>

                    {/* Stats Cards */}
                    <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                        <Col xs={24} sm={12} lg={6}>
                            <div className="stats-card">
                                <div className="icon" style={{ background: 'rgba(0, 217, 165, 0.2)' }}>
                                    <FireOutlined style={{ color: 'var(--primary)' }} />
                                </div>
                                <div className="value">{stats?.highestScore || 0}</div>
                                <div className="label">Highest Score</div>
                            </div>
                        </Col>
                        <Col xs={24} sm={12} lg={6}>
                            <div className="stats-card">
                                <div className="icon" style={{ background: 'rgba(255, 215, 0, 0.2)' }}>
                                    <TrophyOutlined style={{ color: 'var(--accent-gold)' }} />
                                </div>
                                <div className="value">{stats?.totalScore || 0}</div>
                                <div className="label">Total Points</div>
                            </div>
                        </Col>
                        <Col xs={24} sm={12} lg={6}>
                            <div className="stats-card">
                                <div className="icon" style={{ background: 'rgba(138, 43, 226, 0.2)' }}>
                                    <ThunderboltOutlined style={{ color: '#8a2be2' }} />
                                </div>
                                <div className="value">{stats?.gamesPlayed || 0}</div>
                                <div className="label">Games Played</div>
                            </div>
                        </Col>
                        <Col xs={24} sm={12} lg={6}>
                            <div className="stats-card">
                                <div className="icon" style={{ background: 'rgba(255, 107, 107, 0.2)' }}>
                                    <StarOutlined style={{ color: 'var(--error)' }} />
                                </div>
                                <div className="value">{stats?.averageScore || 0}</div>
                                <div className="label">Avg Score</div>
                            </div>
                        </Col>
                    </Row>

                    {/* Recent Games */}
                    <Card title="Recent Games" loading={loading}>
                        {recentGames.length > 0 ? (
                            <div>
                                {recentGames.map((game, index) => (
                                    <div 
                                        key={index}
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            padding: '12px 0',
                                            borderBottom: index < recentGames.length - 1 
                                                ? '1px solid rgba(255,255,255,0.1)' 
                                                : 'none'
                                        }}
                                    >
                                        <div>
                                            <div style={{ fontWeight: 500 }}>
                                                {game.correctAnswers}/{game.totalQuestions} correct
                                            </div>
                                            <div style={{ color: 'var(--text-secondary)', fontSize: 12 }}>
                                                {game.difficulty} • {new Date(game.completedAt).toLocaleDateString()}
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ 
                                                fontSize: 20, 
                                                fontWeight: 700, 
                                                color: 'var(--primary)' 
                                            }}>
                                                {game.score}
                                            </div>
                                            <div style={{ color: 'var(--text-secondary)', fontSize: 12 }}>
                                                {game.accuracy}% accuracy
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)' }}>
                                <PlayCircleOutlined style={{ fontSize: 48, marginBottom: 16, opacity: 0.5 }} />
                                <p>No games played yet. Start your first game!</p>
                            </div>
                        )}
                    </Card>
                </Content>
            </Layout>

            <Modal
                title="Confirm Logout"
                open={logoutModalVisible}
                onOk={handleLogout}
                onCancel={() => setLogoutModalVisible(false)}
                okText="Logout"
                okButtonProps={{ danger: true }}
            >
                <p>Are you sure you want to logout?</p>
            </Modal>
        </Layout>
    );
};

export default Dashboard;

