import React, { useState, useEffect } from 'react';
import { 
    Layout, Menu, Card, Button, Table, message, Select, Tag, 
    Collapse, Spin, Typography, Row, Col, Tabs, Alert, Tooltip
} from 'antd';
import {
    DashboardOutlined,
    CodeOutlined,
    TrophyOutlined,
    DatabaseOutlined,
    PlayCircleOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    BulbOutlined,
    HomeOutlined,
    TableOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { sqlAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const { Sider, Content } = Layout;
const { Option } = Select;
const { Panel } = Collapse;
const { Text, Title } = Typography;
const { TabPane } = Tabs;

const SqlGame = () => {
    const [collapsed, setCollapsed] = useState(false);
    const [challenges, setChallenges] = useState([]);
    const [selectedChallenge, setSelectedChallenge] = useState(null);
    const [schema, setSchema] = useState(null);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState(null);
    const [loading, setLoading] = useState(false);
    const [executing, setExecuting] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [feedback, setFeedback] = useState(null);
    const [difficulty, setDifficulty] = useState('all');
    const navigate = useNavigate();
    const { logout } = useAuth();

    useEffect(() => {
        fetchChallenges();
        fetchSchema();
    }, [difficulty]);

    const fetchChallenges = async () => {
        setLoading(true);
        try {
            const params = difficulty !== 'all' ? { difficulty } : {};
            const response = await sqlAPI.getChallenges(params);
            setChallenges(response.data.data.challenges);
        } catch (error) {
            message.error('Failed to load challenges');
        } finally {
            setLoading(false);
        }
    };

    const fetchSchema = async () => {
        try {
            const response = await sqlAPI.getSchema();
            setSchema(response.data.data.schema);
        } catch (error) {
            console.error('Failed to load schema');
        }
    };

    const selectChallenge = (challenge) => {
        setSelectedChallenge(challenge);
        setQuery('');
        setResults(null);
        setFeedback(null);
    };

    const executeQuery = async () => {
        if (!query.trim()) {
            message.warning('Please enter a SQL query');
            return;
        }
        setExecuting(true);
        setResults(null);
        setFeedback(null);
        try {
            const response = await sqlAPI.executeQuery(query);
            setResults(response.data.data);
        } catch (error) {
            setFeedback({
                type: 'error',
                message: error.response?.data?.error || error.response?.data?.message || 'Query execution failed'
            });
        } finally {
            setExecuting(false);
        }
    };

    const submitAnswer = async () => {
        if (!selectedChallenge || !query.trim()) {
            message.warning('Please select a challenge and enter a query');
            return;
        }
        setSubmitting(true);
        try {
            const response = await sqlAPI.submitChallenge(selectedChallenge.id, query);
            const data = response.data.data;
            setFeedback({
                type: data.isCorrect ? 'success' : 'warning',
                message: data.feedback,
                points: data.points,
                hint: data.hint,
                expectedSample: data.expectedSample
            });
            if (data.userResults) {
                setResults({ results: data.userResults, columns: Object.keys(data.userResults[0] || {}) });
            }
            if (data.isCorrect) {
                message.success(`🎉 Correct! +${data.points} points`);
            }
        } catch (error) {
            setFeedback({
                type: 'error',
                message: error.response?.data?.message || 'Submission failed'
            });
        } finally {
            setSubmitting(false);
        }
    };

    const getDifficultyColor = (diff) => {
        const colors = { easy: 'green', medium: 'orange', hard: 'red', expert: 'purple' };
        return colors[diff] || 'default';
    };

    const menuItems = [
        { key: 'dashboard', icon: <DashboardOutlined />, label: 'Dashboard' },
        { key: 'sql', icon: <CodeOutlined />, label: 'SQL Challenges' },
        { key: 'leaderboard', icon: <TrophyOutlined />, label: 'Leaderboard' },
    ];

    const handleMenuClick = ({ key }) => {
        if (key === 'dashboard') navigate('/dashboard');
        if (key === 'leaderboard') navigate('/leaderboard');
    };

    return (
        <Layout style={{ minHeight: '100vh' }}>
            <Sider
                collapsible
                collapsed={collapsed}
                onCollapse={setCollapsed}
                className="sidebar"
                breakpoint="lg"
            >
                <div className="logo-container">
                    <h2>⚽ {!collapsed && 'Football-IQ'}</h2>
                    {!collapsed && <span>SQL Challenges</span>}
                </div>
                <Menu
                    theme="dark"
                    mode="inline"
                    selectedKeys={['sql']}
                    items={menuItems}
                    onClick={handleMenuClick}
                />
            </Sider>

            <Layout>
                <Content style={{ padding: '24px', overflow: 'auto' }}>
                    <Row gutter={24}>
                        {/* Left Panel - Challenge List */}
                        <Col xs={24} lg={8}>
                            <Card 
                                title={
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span><DatabaseOutlined /> SQL Challenges</span>
                                        <Select 
                                            value={difficulty} 
                                            onChange={setDifficulty} 
                                            size="small"
                                            style={{ width: 100 }}
                                        >
                                            <Option value="all">All</Option>
                                            <Option value="easy">Easy</Option>
                                            <Option value="medium">Medium</Option>
                                            <Option value="hard">Hard</Option>
                                            <Option value="expert">Expert</Option>
                                        </Select>
                                    </div>
                                }
                                style={{ marginBottom: 16 }}
                                bodyStyle={{ maxHeight: 'calc(100vh - 200px)', overflow: 'auto' }}
                            >
                                <Spin spinning={loading}>
                                    {challenges.map((challenge) => (
                                        <Card
                                            key={challenge.id}
                                            size="small"
                                            style={{ 
                                                marginBottom: 8, 
                                                cursor: 'pointer',
                                                border: selectedChallenge?.id === challenge.id 
                                                    ? '2px solid var(--primary)' 
                                                    : '1px solid rgba(255,255,255,0.1)'
                                            }}
                                            onClick={() => selectChallenge(challenge)}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                                <div>
                                                    <Text strong style={{ color: '#fff' }}>{challenge.title}</Text>
                                                    <br />
                                                    <Text type="secondary" style={{ fontSize: 12 }}>
                                                        {challenge.category}
                                                    </Text>
                                                </div>
                                                <div style={{ textAlign: 'right' }}>
                                                    <Tag color={getDifficultyColor(challenge.difficulty)}>
                                                        {challenge.difficulty}
                                                    </Tag>
                                                    <br />
                                                    <Text style={{ color: 'var(--primary)', fontWeight: 600 }}>
                                                        {challenge.points} pts
                                                    </Text>
                                                </div>
                                            </div>
                                        </Card>
                                    ))}
                                </Spin>
                            </Card>
                        </Col>

                        {/* Right Panel - Query Editor & Results */}
                        <Col xs={24} lg={16}>
                            {selectedChallenge ? (
                                <>
                                    {/* Challenge Description */}
                                    <Card style={{ marginBottom: 16 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 16 }}>
                                            <div>
                                                <Title level={4} style={{ margin: 0, color: '#fff' }}>
                                                    {selectedChallenge.title}
                                                </Title>
                                                <Tag color={getDifficultyColor(selectedChallenge.difficulty)} style={{ marginTop: 8 }}>
                                                    {selectedChallenge.difficulty}
                                                </Tag>
                                                <Tag color="blue">{selectedChallenge.category}</Tag>
                                                <Tag color="gold">{selectedChallenge.points} points</Tag>
                                            </div>
                                        </div>
                                        <Text style={{ color: 'var(--text-secondary)', display: 'block', marginBottom: 12 }}>
                                            {selectedChallenge.description}
                                        </Text>
                                        <Collapse ghost>
                                            <Panel header={<><TableOutlined /> Schema Reference</>} key="schema">
                                                <pre style={{ 
                                                    background: 'rgba(0,0,0,0.3)', 
                                                    padding: 12, 
                                                    borderRadius: 8,
                                                    fontSize: 12,
                                                    overflow: 'auto'
                                                }}>
                                                    {selectedChallenge.schema}
                                                </pre>
                                            </Panel>
                                            <Panel header={<><BulbOutlined /> Hint</>} key="hint">
                                                <Text type="secondary">{selectedChallenge.hint}</Text>
                                            </Panel>
                                        </Collapse>
                                    </Card>

                                    {/* SQL Editor */}
                                    <Card 
                                        title={<><CodeOutlined /> SQL Query Editor</>}
                                        style={{ marginBottom: 16 }}
                                    >
                                        <textarea
                                            value={query}
                                            onChange={(e) => setQuery(e.target.value)}
                                            placeholder="Write your SQL query here...

Example:
SELECT column_name, COUNT(*) as count
FROM table_name
GROUP BY column_name
ORDER BY count DESC;"
                                            style={{
                                                width: '100%',
                                                height: 200,
                                                background: 'rgba(0,0,0,0.4)',
                                                border: '1px solid var(--bg-elevated)',
                                                borderRadius: 8,
                                                padding: 16,
                                                color: '#00d9a5',
                                                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                                                fontSize: 14,
                                                resize: 'vertical'
                                            }}
                                        />
                                        <div style={{ marginTop: 16, display: 'flex', gap: 12 }}>
                                            <Button 
                                                type="default" 
                                                icon={<PlayCircleOutlined />}
                                                onClick={executeQuery}
                                                loading={executing}
                                            >
                                                Run Query
                                            </Button>
                                            <Button 
                                                type="primary" 
                                                icon={<CheckCircleOutlined />}
                                                onClick={submitAnswer}
                                                loading={submitting}
                                            >
                                                Submit Answer
                                            </Button>
                                        </div>
                                    </Card>

                                    {/* Feedback */}
                                    {feedback && (
                                        <Alert
                                            type={feedback.type}
                                            message={
                                                feedback.type === 'success' 
                                                    ? `✅ ${feedback.message} (+${feedback.points} points)`
                                                    : feedback.message
                                            }
                                            description={
                                                feedback.hint && (
                                                    <div style={{ marginTop: 8 }}>
                                                        <strong>Hint:</strong> {feedback.hint}
                                                    </div>
                                                )
                                            }
                                            style={{ marginBottom: 16 }}
                                            showIcon
                                        />
                                    )}

                                    {/* Results Table */}
                                    {results && (
                                        <Card 
                                            title={
                                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <span>Query Results</span>
                                                    <Text type="secondary" style={{ fontSize: 12 }}>
                                                        {results.rowCount} rows {results.truncated ? '(truncated)' : ''} • {results.executionTime}
                                                    </Text>
                                                </div>
                                            }
                                        >
                                            <div style={{ overflow: 'auto' }}>
                                                <Table
                                                    dataSource={results.results?.map((row, i) => ({ key: i, ...row }))}
                                                    columns={results.columns?.map(col => ({
                                                        title: col,
                                                        dataIndex: col,
                                                        key: col,
                                                        ellipsis: true,
                                                        render: (val) => val === null ? <Text type="secondary">NULL</Text> : String(val)
                                                    }))}
                                                    size="small"
                                                    pagination={{ pageSize: 10 }}
                                                    scroll={{ x: true }}
                                                />
                                            </div>
                                        </Card>
                                    )}
                                </>
                            ) : (
                                <Card style={{ textAlign: 'center', padding: 60 }}>
                                    <DatabaseOutlined style={{ fontSize: 64, color: 'var(--primary)', opacity: 0.5 }} />
                                    <Title level={3} style={{ marginTop: 24 }}>Select a Challenge</Title>
                                    <Text type="secondary">
                                        Choose a SQL challenge from the left panel to start practicing your aggregation queries.
                                    </Text>

                                    {/* Quick Schema Reference */}
                                    {schema && (
                                        <div style={{ marginTop: 32, textAlign: 'left' }}>
                                            <Title level={5}>📊 Database Tables</Title>
                                            <Collapse ghost>
                                                {schema.tables.map(table => (
                                                    <Panel 
                                                        header={<><TableOutlined /> {table.name}</>} 
                                                        key={table.name}
                                                    >
                                                        <Text type="secondary">{table.description}</Text>
                                                        <div style={{ marginTop: 8 }}>
                                                            {table.columns.slice(0, 6).map(col => (
                                                                <Tag key={col.name} style={{ margin: 2 }}>
                                                                    {col.name}
                                                                </Tag>
                                                            ))}
                                                            {table.columns.length > 6 && (
                                                                <Tag>+{table.columns.length - 6} more</Tag>
                                                            )}
                                                        </div>
                                                    </Panel>
                                                ))}
                                            </Collapse>
                                        </div>
                                    )}
                                </Card>
                            )}
                        </Col>
                    </Row>
                </Content>
            </Layout>
        </Layout>
    );
};

export default SqlGame;

