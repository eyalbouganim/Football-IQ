import React, { useState, useEffect } from 'react';
import { 
    Layout, Card, Button, Table, message, Select, Tag, 
    Collapse, Spin, Typography, Row, Col, Alert, Tabs, Tooltip
} from 'antd';
import {
    CodeOutlined,
    PlayCircleOutlined,
    CheckCircleOutlined,
    BulbOutlined,
    HomeOutlined,
    TableOutlined,
    DatabaseOutlined,
    StarOutlined,
    FireOutlined,
    RocketOutlined,
    KeyOutlined,
    LinkOutlined,
    InfoCircleOutlined,
    ApartmentOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { sqlQueryAPI, sqlAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const { Content } = Layout;
const { Option } = Select;
const { Panel } = Collapse;
const { Text, Title } = Typography;

const SqlGame = () => {
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
    const [runCount, setRunCount] = useState(0);
    const navigate = useNavigate();
    const { user } = useAuth();

    // Get max runs based on challenge difficulty
    const getMaxRuns = (diff) => {
        const limits = { basic: 3, medium: 4, hard: 5 };
        return limits[diff] || 3;
    };

    const maxRuns = selectedChallenge ? getMaxRuns(selectedChallenge.difficulty) : 3;
    const runsRemaining = maxRuns - runCount;

    useEffect(() => {
        fetchChallenges();
        fetchSchema();
    }, [difficulty]);

    const fetchChallenges = async () => {
        setLoading(true);
        try {
            const params = difficulty !== 'all' ? { difficulty } : {};
            const response = await sqlQueryAPI.getChallenges(params);
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

    const selectChallenge = async (challenge) => {
        try {
            const response = await sqlQueryAPI.getChallenge(challenge.id);
            setSelectedChallenge(response.data.data);
            setQuery('');
            setResults(null);
            setFeedback(null);
            setRunCount(0); // Reset run counter for new challenge
        } catch (error) {
            message.error('Failed to load challenge details');
        }
    };

    const executeQuery = async () => {
        if (!query.trim()) {
            message.warning('Please enter a SQL query');
            return;
        }
        if (runCount >= maxRuns) {
            message.warning('No runs remaining! You must submit your answer.');
            return;
        }
        setExecuting(true);
        setResults(null);
        setFeedback(null);
        try {
            const response = await sqlQueryAPI.executeQuery(query);
            setResults(response.data.data);
            setRunCount(prev => prev + 1); // Increment run counter
        } catch (error) {
            setFeedback({
                type: 'error',
                message: error.response?.data?.error || error.response?.data?.message || 'Query execution failed'
            });
            setRunCount(prev => prev + 1); // Count failed runs too
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
            const response = await sqlQueryAPI.submitQuery(selectedChallenge.id, query);
            const data = response.data.data;
            setFeedback({
                type: data.isCorrect ? 'success' : 'warning',
                message: data.feedback,
                points: data.pointsEarned,
                hint: data.hint,
                solution: data.solution
            });
            if (data.userResults) {
                setResults({ 
                    results: data.userResults, 
                    columns: data.userResults.length > 0 ? Object.keys(data.userResults[0]) : [],
                    rowCount: data.userResults.length
                });
            }
            if (data.isCorrect) {
                message.success(`🎉 Correct! +${data.pointsEarned} points`);
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
        const colors = { basic: '#52c41a', medium: '#faad14', hard: '#ff4d4f' };
        return colors[diff] || '#1890ff';
    };

    const getDifficultyIcon = (diff) => {
        if (diff === 'basic') return <StarOutlined />;
        if (diff === 'medium') return <FireOutlined />;
        if (diff === 'hard') return <RocketOutlined />;
        return <CodeOutlined />;
    };

    return (
        <Layout style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
            <Content style={{ padding: '24px' }}>
                {/* Header */}
                <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <Title level={2} style={{ color: '#fff', margin: 0 }}>
                            ✍️ SQL Query Challenge
                        </Title>
                        <Text type="secondary">Write your own SQL queries to solve challenges</Text>
                    </div>
                    <Button icon={<HomeOutlined />} onClick={() => navigate('/dashboard')}>
                        Dashboard
                    </Button>
                </div>

                <Row gutter={24}>
                    {/* Left Panel - Challenge List */}
                    <Col xs={24} lg={8}>
                        <Card 
                            title={
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span><DatabaseOutlined /> Challenges</span>
                                    <Select 
                                        value={difficulty} 
                                        onChange={setDifficulty} 
                                        size="small"
                                        style={{ width: 100 }}
                                    >
                                        <Option value="all">All</Option>
                                        <Option value="basic">Basic</Option>
                                        <Option value="medium">Medium</Option>
                                        <Option value="hard">Hard</Option>
                                    </Select>
                                </div>
                            }
                            style={{ marginBottom: 16, background: 'var(--bg-secondary)', border: '1px solid var(--bg-elevated)' }}
                            bodyStyle={{ maxHeight: 'calc(100vh - 280px)', overflow: 'auto' }}
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
                                                : '1px solid var(--bg-elevated)',
                                            background: selectedChallenge?.id === challenge.id 
                                                ? 'rgba(0,217,165,0.1)' 
                                                : 'transparent'
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
                                                <Tag 
                                                    icon={getDifficultyIcon(challenge.difficulty)}
                                                    color={getDifficultyColor(challenge.difficulty)}
                                                >
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

                        {/* Schema Reference */}
                        {schema && (
                            <Card 
                                title={<><DatabaseOutlined /> Database Schema</>}
                                style={{ background: 'var(--bg-secondary)', border: '1px solid var(--bg-elevated)' }}
                                bodyStyle={{ padding: 0 }}
                            >
                                <Tabs 
                                    defaultActiveKey="diagram" 
                                    size="small"
                                    style={{ padding: '0 12px' }}
                                    items={[
                                        {
                                            key: 'diagram',
                                            label: <><ApartmentOutlined /> Diagram</>,
                                            children: (
                                                <div style={{ 
                                                    background: 'rgba(0,0,0,0.3)', 
                                                    borderRadius: 8, 
                                                    padding: 12,
                                                    marginBottom: 12,
                                                    overflow: 'auto',
                                                    maxHeight: 350
                                                }}>
                                                    <pre style={{ 
                                                        margin: 0, 
                                                        fontSize: 9,
                                                        lineHeight: 1.3,
                                                        color: '#00d9a5',
                                                        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                                                        whiteSpace: 'pre'
                                                    }}>
                                                        {schema.diagram}
                                                    </pre>
                                                </div>
                                            )
                                        },
                                        {
                                            key: 'tables',
                                            label: <><TableOutlined /> Tables</>,
                                            children: (
                                                <div style={{ maxHeight: 350, overflow: 'auto', marginBottom: 12 }}>
                                                    <Collapse ghost size="small" accordion>
                                                        {schema.tables.map(table => (
                                                            <Panel 
                                                                header={
                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                                        <Text strong style={{ color: '#fff' }}>{table.name}</Text>
                                                                        {table.primaryKey && (
                                                                            <Tag color="gold" style={{ fontSize: 9 }}>
                                                                                <KeyOutlined /> {table.primaryKey}
                                                                            </Tag>
                                                                        )}
                                                                    </div>
                                                                } 
                                                                key={table.name}
                                                            >
                                                                <Text type="secondary" style={{ fontSize: 11, display: 'block', marginBottom: 8 }}>
                                                                    {table.description}
                                                                </Text>
                                                                
                                                                {/* Foreign Keys */}
                                                                {table.foreignKeys?.length > 0 && (
                                                                    <div style={{ marginBottom: 8 }}>
                                                                        <Text type="secondary" style={{ fontSize: 10 }}>
                                                                            <LinkOutlined /> Foreign Keys:
                                                                        </Text>
                                                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
                                                                            {table.foreignKeys.map((fk, i) => (
                                                                                <Tag key={i} color="blue" style={{ fontSize: 9 }}>
                                                                                    {fk.column} → {fk.references}
                                                                                </Tag>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                )}
                                                                
                                                                {/* Columns */}
                                                                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                                                    {table.columns.map(col => (
                                                                        <Tooltip 
                                                                            key={col.name} 
                                                                            title={`${col.type} - ${col.description}`}
                                                                            placement="right"
                                                                        >
                                                                            <div style={{ 
                                                                                display: 'flex', 
                                                                                alignItems: 'center', 
                                                                                gap: 6,
                                                                                padding: '2px 6px',
                                                                                background: col.key ? 'rgba(0,217,165,0.1)' : 'transparent',
                                                                                borderRadius: 4
                                                                            }}>
                                                                                {col.key === 'PK' && <KeyOutlined style={{ color: '#faad14', fontSize: 10 }} />}
                                                                                {col.key === 'FK' && <LinkOutlined style={{ color: '#1890ff', fontSize: 10 }} />}
                                                                                <Text style={{ fontSize: 11, color: col.key ? '#00d9a5' : '#fff' }}>
                                                                                    {col.name}
                                                                                </Text>
                                                                                <Text type="secondary" style={{ fontSize: 9 }}>
                                                                                    {col.type}
                                                                                </Text>
                                                                            </div>
                                                                        </Tooltip>
                                                                    ))}
                                                                </div>
                                                            </Panel>
                                                        ))}
                                                    </Collapse>
                                                </div>
                                            )
                                        },
                                        {
                                            key: 'tips',
                                            label: <><BulbOutlined /> SQL Tips</>,
                                            children: (
                                                <div style={{ maxHeight: 350, overflow: 'auto', marginBottom: 12 }}>
                                                    {schema.tips?.map((tip, i) => (
                                                        <div 
                                                            key={i} 
                                                            style={{ 
                                                                padding: '8px 12px',
                                                                background: 'rgba(0,0,0,0.2)',
                                                                borderRadius: 6,
                                                                marginBottom: 6
                                                            }}
                                                        >
                                                            <Text style={{ fontSize: 11, color: '#00d9a5' }}>
                                                                💡 {tip}
                                                            </Text>
                                                        </div>
                                                    ))}
                                                    
                                                    <div style={{ marginTop: 12 }}>
                                                        <Text strong style={{ color: '#fff', fontSize: 11 }}>
                                                            🔗 Common JOINs:
                                                        </Text>
                                                        <pre style={{ 
                                                            fontSize: 10, 
                                                            color: '#00d9a5',
                                                            background: 'rgba(0,0,0,0.3)',
                                                            padding: 8,
                                                            borderRadius: 4,
                                                            marginTop: 6
                                                        }}>
{`-- Players with their clubs
SELECT p.name, c.name as club
FROM players p
JOIN clubs c ON p.current_club_id = c.club_id

-- Player stats in games
SELECT p.name, a.goals, a.assists
FROM appearances a
JOIN players p ON a.player_id = p.player_id`}
                                                        </pre>
                                                    </div>
                                                </div>
                                            )
                                        }
                                    ]}
                                />
                            </Card>
                        )}
                    </Col>

                    {/* Right Panel - Query Editor & Results */}
                    <Col xs={24} lg={16}>
                        {selectedChallenge ? (
                            <>
                                {/* Challenge Description */}
                                <Card style={{ marginBottom: 16, background: 'var(--bg-secondary)', border: '1px solid var(--bg-elevated)' }}>
                                    <div style={{ marginBottom: 16 }}>
                                        <Title level={4} style={{ margin: 0, color: '#fff' }}>
                                            {selectedChallenge.title}
                                        </Title>
                                        <div style={{ marginTop: 8 }}>
                                            <Tag 
                                                icon={getDifficultyIcon(selectedChallenge.difficulty)}
                                                color={getDifficultyColor(selectedChallenge.difficulty)}
                                            >
                                                {selectedChallenge.difficulty}
                                            </Tag>
                                            <Tag color="blue">{selectedChallenge.category}</Tag>
                                            <Tag color="gold">{selectedChallenge.points} points</Tag>
                                        </div>
                                    </div>
                                    <Text style={{ color: 'var(--text-secondary)' }}>
                                        {selectedChallenge.description}
                                    </Text>
                                    
                                    {selectedChallenge.table && (
                                        <div style={{ marginTop: 12 }}>
                                            <Text type="secondary">Tables: </Text>
                                            {selectedChallenge.table.split(',').map(t => (
                                                <Tag key={t} color="cyan">{t.trim()}</Tag>
                                            ))}
                                        </div>
                                    )}
                                </Card>

                                {/* SQL Editor */}
                                <Card 
                                    title={<><CodeOutlined /> SQL Query Editor</>}
                                    style={{ marginBottom: 16, background: 'var(--bg-secondary)', border: '1px solid var(--bg-elevated)' }}
                                >
                                    <textarea
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                        placeholder={`Write your SQL query here...\n\nExample:\nSELECT column_name, COUNT(*) as count\nFROM table_name\nGROUP BY column_name\nORDER BY count DESC;`}
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
                                    <div style={{ marginTop: 16, display: 'flex', gap: 12, alignItems: 'center' }}>
                                        <Button 
                                            type="default" 
                                            icon={<PlayCircleOutlined />}
                                            onClick={executeQuery}
                                            loading={executing}
                                            disabled={runCount >= maxRuns}
                                        >
                                            Run Query
                                        </Button>
                                        <Tag 
                                            color={runsRemaining > 1 ? 'green' : runsRemaining === 1 ? 'orange' : 'red'}
                                            style={{ margin: 0, fontSize: 12, padding: '2px 8px' }}
                                        >
                                            {runsRemaining > 0 
                                                ? `${runsRemaining}/${maxRuns} runs left` 
                                                : 'No runs left'}
                                        </Tag>
                                        <Button 
                                            type="primary" 
                                            icon={<CheckCircleOutlined />}
                                            onClick={submitAnswer}
                                            loading={submitting}
                                        >
                                            Submit Answer
                                        </Button>
                                        <Button 
                                            type="dashed" 
                                            icon={<BulbOutlined />}
                                            onClick={() => message.info(selectedChallenge.hint)}
                                        >
                                            Hint
                                        </Button>
                                    </div>
                                </Card>

                                {/* Feedback */}
                                {feedback && (
                                    <Alert
                                        type={feedback.type}
                                        message={feedback.message}
                                        description={
                                            <>
                                                {feedback.hint && (
                                                    <div style={{ marginTop: 8 }}>
                                                        <strong>💡 Hint:</strong> {feedback.hint}
                                                    </div>
                                                )}
                                                {feedback.solution && (
                                                    <div style={{ marginTop: 8 }}>
                                                        <strong>✅ Solution:</strong>
                                                        <pre style={{ 
                                                            background: 'rgba(0,0,0,0.2)', 
                                                            padding: 8, 
                                                            borderRadius: 4,
                                                            marginTop: 4,
                                                            fontSize: 12,
                                                            color: '#00d9a5'
                                                        }}>
                                                            {feedback.solution}
                                                        </pre>
                                                    </div>
                                                )}
                                            </>
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
                                                    {results.rowCount} rows {results.truncated ? '(truncated)' : ''} 
                                                    {results.executionTime && ` • ${results.executionTime}`}
                                                </Text>
                                            </div>
                                        }
                                        style={{ background: 'var(--bg-secondary)', border: '1px solid var(--bg-elevated)' }}
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
                            <Card style={{ textAlign: 'center', padding: 60, background: 'var(--bg-secondary)', border: '1px solid var(--bg-elevated)' }}>
                                <CodeOutlined style={{ fontSize: 64, color: 'var(--primary)', opacity: 0.5 }} />
                                <Title level={3} style={{ marginTop: 24, color: '#fff' }}>Select a Challenge</Title>
                                <Text type="secondary">
                                    Choose a challenge from the left panel to start writing SQL queries.
                                </Text>
                                {user && (
                                    <div style={{ marginTop: 24, padding: 16, background: 'rgba(0,217,165,0.1)', borderRadius: 8 }}>
                                        <Text style={{ color: 'var(--primary)' }}>
                                            💰 Your Score: <strong>{user.totalScore || 0}</strong> points
                                        </Text>
                                    </div>
                                )}
                            </Card>
                        )}
                    </Col>
                </Row>
            </Content>
        </Layout>
    );
};

export default SqlGame;
