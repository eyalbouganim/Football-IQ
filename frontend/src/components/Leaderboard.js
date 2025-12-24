import React, { useState, useEffect } from 'react';
import { Layout, Menu, Card, Select, Spin, Empty } from 'antd';
import {
    DashboardOutlined,
    PlayCircleOutlined,
    TrophyOutlined,
    UserOutlined,
    LogoutOutlined,
    ArrowLeftOutlined,
    CrownOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { gameAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const { Sider, Content } = Layout;
const { Option } = Select;

const Leaderboard = () => {
    const [collapsed, setCollapsed] = useState(false);
    const [loading, setLoading] = useState(true);
    const [leaderboard, setLeaderboard] = useState([]);
    const [period, setPeriod] = useState('all');
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    useEffect(() => {
        fetchLeaderboard();
    }, [period]);

    const fetchLeaderboard = async () => {
        setLoading(true);
        try {
            const response = await gameAPI.getLeaderboard({ period, limit: 20 });
            setLeaderboard(response.data.data.leaderboard || []);
        } catch (error) {
            console.error('Failed to fetch leaderboard:', error);
        } finally {
            setLoading(false);
        }
    };

    const menuItems = [
        { key: 'dashboard', icon: <DashboardOutlined />, label: 'Dashboard' },
        { key: 'play', icon: <PlayCircleOutlined />, label: 'Play Game' },
        { key: 'leaderboard', icon: <TrophyOutlined />, label: 'Leaderboard' },
        { key: 'profile', icon: <UserOutlined />, label: 'Profile' },
        { type: 'divider' },
        { key: 'logout', icon: <LogoutOutlined />, label: 'Logout', danger: true },
    ];

    const handleMenuClick = ({ key }) => {
        switch (key) {
            case 'dashboard':
                navigate('/dashboard');
                break;
            case 'play':
                navigate('/game');
                break;
            case 'logout':
                logout();
                navigate('/login');
                break;
            default:
                break;
        }
    };

    const getRankIcon = (rank) => {
        if (rank === 1) return <CrownOutlined style={{ color: '#ffd700' }} />;
        if (rank === 2) return <CrownOutlined style={{ color: '#c0c0c0' }} />;
        if (rank === 3) return <CrownOutlined style={{ color: '#cd7f32' }} />;
        return rank;
    };

    const getRankClass = (rank) => {
        if (rank === 1) return 'gold';
        if (rank === 2) return 'silver';
        if (rank === 3) return 'bronze';
        return 'default';
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
                    selectedKeys={['leaderboard']}
                    items={menuItems}
                    onClick={handleMenuClick}
                />
            </Sider>

            <Layout>
                <Content style={{ padding: '24px', minHeight: '100vh' }}>
                    {/* Header */}
                    <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        marginBottom: 32 
                    }}>
                        <div>
                            <h1 style={{ 
                                fontSize: 32, 
                                fontWeight: 700, 
                                marginBottom: 8,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 12
                            }}>
                                <TrophyOutlined style={{ color: 'var(--accent-gold)' }} />
                                Leaderboard
                            </h1>
                            <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
                                See how you rank against other players
                            </p>
                        </div>
                        <Select
                            value={period}
                            onChange={setPeriod}
                            style={{ width: 150 }}
                            size="large"
                        >
                            <Option value="all">All Time</Option>
                            <Option value="month">This Month</Option>
                            <Option value="week">This Week</Option>
                        </Select>
                    </div>

                    {/* Leaderboard List */}
                    <Card style={{ background: 'transparent', border: 'none' }} bodyStyle={{ padding: 0 }}>
                        <Spin spinning={loading}>
                            {leaderboard.length > 0 ? (
                                <div>
                                    {leaderboard.map((entry, index) => (
                                        <div 
                                            key={index}
                                            className={`leaderboard-item ${entry.rank <= 3 ? `top-${entry.rank}` : ''}`}
                                            style={{
                                                background: entry.username === user?.username 
                                                    ? 'rgba(0, 217, 165, 0.15)' 
                                                    : undefined
                                            }}
                                        >
                                            <div className={`rank ${getRankClass(entry.rank)}`}>
                                                {entry.rank <= 3 ? getRankIcon(entry.rank) : entry.rank}
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ 
                                                    fontWeight: 600, 
                                                    fontSize: 16,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 8
                                                }}>
                                                    {entry.username}
                                                    {entry.username === user?.username && (
                                                        <span style={{ 
                                                            fontSize: 10, 
                                                            background: 'var(--primary)',
                                                            color: 'var(--bg-dark)',
                                                            padding: '2px 8px',
                                                            borderRadius: 10,
                                                            fontWeight: 700
                                                        }}>
                                                            YOU
                                                        </span>
                                                    )}
                                                </div>
                                                <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                                                    {entry.favoriteTeam || 'No team'} • {entry.gamesPlayed || 0} games
                                                </div>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{ 
                                                    fontSize: 24, 
                                                    fontWeight: 700, 
                                                    color: entry.rank === 1 ? 'var(--accent-gold)' : 'var(--primary)'
                                                }}>
                                                    {period === 'all' ? entry.highestScore : entry.score}
                                                </div>
                                                <div style={{ color: 'var(--text-secondary)', fontSize: 12 }}>
                                                    {period === 'all' ? 'Best Score' : 'Score'}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <Empty 
                                    description={
                                        <span style={{ color: 'var(--text-secondary)' }}>
                                            No entries yet. Be the first to play!
                                        </span>
                                    }
                                    style={{ padding: 60 }}
                                />
                            )}
                        </Spin>
                    </Card>
                </Content>
            </Layout>
        </Layout>
    );
};

export default Leaderboard;



