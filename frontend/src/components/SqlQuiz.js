import React, { useState } from 'react';
import { 
    Layout, Card, Button, message, Select, Tag, Typography, 
    Row, Col, Progress, Result, Radio, Space, Divider
} from 'antd';
import {
    TrophyOutlined,
    CodeOutlined,
    PlayCircleOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    ReloadOutlined,
    HomeOutlined,
    RocketOutlined,
    FireOutlined,
    StarOutlined,
    BulbOutlined,
    EyeOutlined,
    EyeInvisibleOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { sqlQuizAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const { Content } = Layout;
const { Option } = Select;
const { Text, Title } = Typography;

const SqlQuiz = () => {
    const [gameState, setGameState] = useState('menu'); // menu, playing, finished
    const [difficulty, setDifficulty] = useState('all');
    const [questionCount, setQuestionCount] = useState(5);
    const [questions, setQuestions] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState(null);
    const [answers, setAnswers] = useState([]);
    const [showResult, setShowResult] = useState(false);
    const [currentResult, setCurrentResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [gameResults, setGameResults] = useState(null);
    const [totalScore, setTotalScore] = useState(0);
    const [showQuery, setShowQuery] = useState(false); // For flip to reveal query
    const navigate = useNavigate();
    const { user } = useAuth();

    const startGame = async () => {
        setLoading(true);
        try {
            const params = { count: questionCount };
            if (difficulty !== 'all') params.difficulty = difficulty;
            
            const response = await sqlQuizAPI.startGame(params);
            setQuestions(response.data.data.questions);
            setCurrentIndex(0);
            setAnswers([]);
            setTotalScore(0);
            setGameState('playing');
            setShowResult(false);
            setSelectedAnswer(null);
        } catch (error) {
            message.error('Failed to start game. Make sure you are logged in!');
        } finally {
            setLoading(false);
        }
    };

    const submitAnswer = async () => {
        if (!selectedAnswer) {
            message.warning('Please select an answer!');
            return;
        }

        setSubmitting(true);
        try {
            const currentQuestion = questions[currentIndex];
            const response = await sqlQuizAPI.submitAnswer(currentQuestion.id, selectedAnswer);
            const result = response.data.data;
            
            setCurrentResult(result);
            setShowResult(true);
            
            if (result.isCorrect) {
                setTotalScore(prev => prev + result.pointsEarned);
            }

            setAnswers(prev => [...prev, {
                challengeId: currentQuestion.id,
                answer: selectedAnswer,
                isCorrect: result.isCorrect,
                pointsEarned: result.pointsEarned
            }]);
        } catch (error) {
            message.error('Failed to submit answer');
        } finally {
            setSubmitting(false);
        }
    };

    const nextQuestion = async () => {
        if (currentIndex + 1 >= questions.length) {
            const correct = answers.filter(a => a.isCorrect).length + (currentResult?.isCorrect ? 1 : 0);
            // Include the current question's points (which may not be in totalScore yet due to async state)
            const lastQuestionPoints = currentResult?.isCorrect ? currentResult.pointsEarned : 0;
            const finalScore = totalScore + (currentResult?.isCorrect && !answers.find(a => a.challengeId === questions[currentIndex]?.id) ? lastQuestionPoints : 0);
            
            // Save the game score to the database
            try {
                const response = await sqlQuizAPI.endGame({
                    totalScore: finalScore,
                    correctCount: correct,
                    totalQuestions: questions.length
                });
                console.log('Game saved:', response.data);
            } catch (error) {
                console.error('Failed to save game score:', error);
            }
            
            setGameResults({
                totalPoints: finalScore,
                correctCount: correct,
                totalQuestions: questions.length,
                percentage: Math.round((correct / questions.length) * 100)
            });
            setGameState('finished');
        } else {
            setCurrentIndex(prev => prev + 1);
            setSelectedAnswer(null);
            setShowResult(false);
            setCurrentResult(null);
            setShowQuery(false); // Reset query visibility for next question
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

    const currentQuestion = questions[currentIndex];

    // ========================================
    // GAME MENU SCREEN
    // ========================================
    if (gameState === 'menu') {
        return (
            <Layout style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
                <Content style={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    alignItems: 'center',
                    padding: 24
                }}>
                    <Card 
                        style={{ 
                            maxWidth: 600, 
                            width: '100%',
                            textAlign: 'center',
                            background: 'var(--bg-secondary)',
                            border: '1px solid var(--bg-elevated)'
                        }}
                    >
                        <div style={{ marginBottom: 32 }}>
                            <div style={{ fontSize: 64 }}>🇺🇸</div>
                            <Title level={2} style={{ marginTop: 16, color: '#fff' }}>
                                SQL Quiz
                            </Title>
                            <Text type="secondary" style={{ fontSize: 16 }}>
                                American-style multiple choice! Read the query and pick the correct answer.
                            </Text>
                        </div>

                        <Divider style={{ borderColor: 'var(--bg-elevated)' }}>Game Settings</Divider>

                        <Row gutter={[16, 24]} style={{ marginBottom: 32 }}>
                            <Col span={12}>
                                <Text style={{ color: '#fff', display: 'block', marginBottom: 8 }}>
                                    Difficulty
                                </Text>
                                <Select 
                                    value={difficulty} 
                                    onChange={setDifficulty}
                                    style={{ width: '100%' }}
                                    size="large"
                                >
                                    <Option value="all">🎲 Mixed</Option>
                                    <Option value="basic">🟢 Basic (10 pts)</Option>
                                    <Option value="medium">🟡 Medium (25 pts)</Option>
                                    <Option value="hard">🔴 Hard (50 pts)</Option>
                                </Select>
                            </Col>
                            <Col span={12}>
                                <Text style={{ color: '#fff', display: 'block', marginBottom: 8 }}>
                                    Questions
                                </Text>
                                <Select 
                                    value={questionCount} 
                                    onChange={setQuestionCount}
                                    style={{ width: '100%' }}
                                    size="large"
                                >
                                    <Option value={3}>3 Questions</Option>
                                    <Option value={5}>5 Questions</Option>
                                    <Option value={10}>10 Questions</Option>
                                </Select>
                            </Col>
                        </Row>

                        <Space direction="vertical" style={{ width: '100%' }} size="middle">
                            <Button 
                                type="primary" 
                                size="large" 
                                block
                                icon={<PlayCircleOutlined />}
                                onClick={startGame}
                                loading={loading}
                                style={{ height: 50, fontSize: 18 }}
                            >
                                Start Quiz
                            </Button>
                            <Button 
                                type="default" 
                                size="large" 
                                block
                                icon={<HomeOutlined />}
                                onClick={() => navigate('/dashboard')}
                            >
                                Back to Dashboard
                            </Button>
                        </Space>

                        {user && (
                            <div style={{ marginTop: 24, padding: 16, background: 'rgba(0,217,165,0.1)', borderRadius: 8 }}>
                                <Text style={{ color: 'var(--primary)' }}>
                                    💰 Your Score: <strong>{user.totalScore || 0}</strong> points
                                </Text>
                            </div>
                        )}
                    </Card>
                </Content>
            </Layout>
        );
    }

    // ========================================
    // GAME FINISHED SCREEN
    // ========================================
    if (gameState === 'finished') {
        const percentage = gameResults?.percentage || 0;
        
        return (
            <Layout style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
                <Content style={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    alignItems: 'center',
                    padding: 24
                }}>
                    <Card 
                        style={{ 
                            maxWidth: 600, 
                            width: '100%',
                            textAlign: 'center',
                            background: 'var(--bg-secondary)',
                            border: '1px solid var(--bg-elevated)'
                        }}
                    >
                        <Result
                            icon={
                                <TrophyOutlined style={{ 
                                    fontSize: 72, 
                                    color: percentage >= 80 ? '#52c41a' : percentage >= 50 ? '#faad14' : '#ff4d4f'
                                }} />
                            }
                            title={
                                <span style={{ color: '#fff' }}>
                                    {percentage >= 80 ? '🎉 Excellent!' : percentage >= 50 ? '👍 Good Job!' : '💪 Keep Practicing!'}
                                </span>
                            }
                            subTitle={
                                <span style={{ color: 'var(--text-secondary)' }}>
                                    You scored {gameResults?.correctCount}/{gameResults?.totalQuestions} correct
                                </span>
                            }
                        />

                        <div style={{ marginBottom: 32 }}>
                            <Progress 
                                type="circle" 
                                percent={percentage} 
                                strokeColor={percentage >= 80 ? '#52c41a' : percentage >= 50 ? '#faad14' : '#ff4d4f'}
                                strokeWidth={10}
                                format={() => (
                                    <div style={{ color: '#fff' }}>
                                        <div style={{ fontSize: 36, fontWeight: 'bold' }}>{gameResults?.totalPoints}</div>
                                        <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>points</div>
                                    </div>
                                )}
                            />
                        </div>

                        <Space direction="vertical" style={{ width: '100%' }} size="middle">
                            <Button 
                                type="primary" 
                                size="large" 
                                block
                                icon={<ReloadOutlined />}
                                onClick={() => setGameState('menu')}
                            >
                                Play Again
                            </Button>
                            <Button 
                                type="default" 
                                size="large" 
                                block
                                icon={<TrophyOutlined />}
                                onClick={() => navigate('/leaderboard')}
                            >
                                View Leaderboard
                            </Button>
                            <Button 
                                type="default" 
                                size="large" 
                                block
                                icon={<HomeOutlined />}
                                onClick={() => navigate('/dashboard')}
                            >
                                Back to Dashboard
                            </Button>
                        </Space>
                    </Card>
                </Content>
            </Layout>
        );
    }

    // ========================================
    // PLAYING SCREEN
    // ========================================
    return (
        <Layout style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
            <Content style={{ padding: 24 }}>
                {/* Progress Header */}
                <div style={{ marginBottom: 24, textAlign: 'center' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: 800, margin: '0 auto' }}>
                        <Text style={{ color: '#fff', fontSize: 18 }}>
                            Question {currentIndex + 1} of {questions.length}
                        </Text>
                        <Tag color="gold" style={{ fontSize: 16, padding: '4px 12px' }}>
                            💰 {totalScore} pts
                        </Tag>
                    </div>
                    <Progress 
                        percent={((currentIndex + 1) / questions.length) * 100} 
                        showInfo={false}
                        strokeColor="var(--primary)"
                        style={{ maxWidth: 800, margin: '12px auto 0' }}
                    />
                </div>

                {/* Question Card */}
                <Row justify="center">
                    <Col xs={24} lg={20} xl={16}>
                        <Card style={{ background: 'var(--bg-secondary)', border: '1px solid var(--bg-elevated)' }}>
                            {/* Question Header */}
                            <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <Tag 
                                        icon={getDifficultyIcon(currentQuestion?.difficulty)}
                                        color={getDifficultyColor(currentQuestion?.difficulty)}
                                        style={{ marginRight: 8 }}
                                    >
                                        {currentQuestion?.difficulty?.toUpperCase()}
                                    </Tag>
                                    <Tag color="blue">{currentQuestion?.category}</Tag>
                                </div>
                                <Tag color="gold" style={{ fontSize: 14 }}>
                                    {currentQuestion?.points} points
                                </Tag>
                            </div>

                            {/* Question */}
                            <Title level={4} style={{ color: '#fff', marginBottom: 16 }}>
                                {currentQuestion?.question}
                            </Title>

                            {/* SQL Query Display - Flip to Reveal */}
                            <div 
                                onClick={() => !showQuery && setShowQuery(true)}
                                style={{ 
                                    background: 'rgba(0,0,0,0.4)',
                                    borderRadius: 8,
                                    padding: 16,
                                    marginBottom: 24,
                                    border: `1px solid ${showQuery ? 'var(--bg-elevated)' : 'rgba(0, 217, 165, 0.5)'}`,
                                    cursor: showQuery ? 'default' : 'pointer',
                                    position: 'relative',
                                    minHeight: 80,
                                    transition: 'all 0.3s ease'
                                }}
                            >
                                {showQuery ? (
                                    <>
                                        <div style={{ 
                                            position: 'absolute', 
                                            top: 8, 
                                            right: 8,
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 4,
                                            color: 'var(--text-secondary)',
                                            fontSize: 12
                                        }}>
                                            <EyeOutlined /> Query Revealed
                                        </div>
                                        <pre style={{
                                            margin: 0,
                                            marginTop: 16,
                                            color: '#00d9a5',
                                            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                                            fontSize: 14,
                                            whiteSpace: 'pre-wrap',
                                            wordBreak: 'break-word'
                                        }}>
                                            {currentQuestion?.query}
                                        </pre>
                                    </>
                                ) : (
                                    <div style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        minHeight: 60,
                                        gap: 8
                                    }}>
                                        <EyeInvisibleOutlined style={{ fontSize: 24, color: 'var(--primary)' }} />
                                        <Text style={{ color: 'var(--primary)' }}>
                                            🤔 Try answering without seeing the query!
                                        </Text>
                                        <Text type="secondary" style={{ fontSize: 12 }}>
                                            Click here to reveal the SQL query if you need help
                                        </Text>
                                    </div>
                                )}
                            </div>

                            {/* Answer Options */}
                            {!showResult ? (
                                <>
                                    <Radio.Group 
                                        value={selectedAnswer}
                                        onChange={(e) => setSelectedAnswer(e.target.value)}
                                        style={{ width: '100%' }}
                                    >
                                        <Space direction="vertical" style={{ width: '100%' }} size="middle">
                                            {currentQuestion?.options.map((option, idx) => {
                                                const letter = ['A', 'B', 'C', 'D'][idx];
                                                return (
                                                    <Card
                                                        key={letter}
                                                        size="small"
                                                        style={{
                                                            cursor: 'pointer',
                                                            border: selectedAnswer === letter 
                                                                ? '2px solid var(--primary)' 
                                                                : '1px solid var(--bg-elevated)',
                                                            background: selectedAnswer === letter 
                                                                ? 'rgba(0,217,165,0.1)' 
                                                                : 'transparent'
                                                        }}
                                                        onClick={() => setSelectedAnswer(letter)}
                                                    >
                                                        <Radio value={letter} style={{ color: '#fff' }}>
                                                            <Text style={{ color: '#fff', marginLeft: 8 }}>
                                                                {option}
                                                            </Text>
                                                        </Radio>
                                                    </Card>
                                                );
                                            })}
                                        </Space>
                                    </Radio.Group>

                                    <Button
                                        type="primary"
                                        size="large"
                                        block
                                        icon={<CheckCircleOutlined />}
                                        onClick={submitAnswer}
                                        loading={submitting}
                                        disabled={!selectedAnswer}
                                        style={{ marginTop: 24, height: 50 }}
                                    >
                                        Submit Answer
                                    </Button>
                                </>
                            ) : (
                                /* Result Display */
                                <div>
                                    <Space direction="vertical" style={{ width: '100%' }} size="middle">
                                        {currentQuestion?.options.map((option, idx) => {
                                            const letter = ['A', 'B', 'C', 'D'][idx];
                                            const isCorrect = letter === currentResult?.correctAnswer;
                                            const isUserAnswer = letter === currentResult?.yourAnswer;
                                            
                                            let borderColor = 'var(--bg-elevated)';
                                            let bgColor = 'transparent';
                                            let icon = null;
                                            
                                            if (isCorrect) {
                                                borderColor = '#52c41a';
                                                bgColor = 'rgba(82,196,26,0.1)';
                                                icon = <CheckCircleOutlined style={{ color: '#52c41a' }} />;
                                            } else if (isUserAnswer && !currentResult?.isCorrect) {
                                                borderColor = '#ff4d4f';
                                                bgColor = 'rgba(255,77,79,0.1)';
                                                icon = <CloseCircleOutlined style={{ color: '#ff4d4f' }} />;
                                            }

                                            return (
                                                <Card
                                                    key={letter}
                                                    size="small"
                                                    style={{ border: `2px solid ${borderColor}`, background: bgColor }}
                                                >
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <Text style={{ color: '#fff' }}>{option}</Text>
                                                        {icon}
                                                    </div>
                                                </Card>
                                            );
                                        })}
                                    </Space>

                                    {/* Explanation */}
                                    <Card
                                        style={{ 
                                            marginTop: 16,
                                            background: currentResult?.isCorrect 
                                                ? 'rgba(82,196,26,0.1)' 
                                                : 'rgba(250,173,20,0.1)',
                                            border: `1px solid ${currentResult?.isCorrect ? '#52c41a' : '#faad14'}`
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                                            <BulbOutlined style={{ 
                                                color: currentResult?.isCorrect ? '#52c41a' : '#faad14',
                                                fontSize: 20,
                                                marginTop: 2
                                            }} />
                                            <div>
                                                <Text strong style={{ 
                                                    color: currentResult?.isCorrect ? '#52c41a' : '#faad14',
                                                    display: 'block',
                                                    marginBottom: 4
                                                }}>
                                                    {currentResult?.isCorrect 
                                                        ? `✅ Correct! +${currentResult?.pointsEarned} points` 
                                                        : '❌ Incorrect'}
                                                </Text>
                                                <Text style={{ color: 'var(--text-secondary)' }}>
                                                    {currentResult?.explanation}
                                                </Text>
                                            </div>
                                        </div>
                                    </Card>

                                    <Button
                                        type="primary"
                                        size="large"
                                        block
                                        icon={currentIndex + 1 >= questions.length ? <TrophyOutlined /> : <PlayCircleOutlined />}
                                        onClick={nextQuestion}
                                        style={{ marginTop: 24, height: 50 }}
                                    >
                                        {currentIndex + 1 >= questions.length ? 'See Results' : 'Next Question'}
                                    </Button>
                                </div>
                            )}
                        </Card>
                    </Col>
                </Row>
            </Content>
        </Layout>
    );
};

export default SqlQuiz;



