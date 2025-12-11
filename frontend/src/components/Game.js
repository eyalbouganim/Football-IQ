import React, { useState, useEffect, useCallback } from 'react';
import { Button, Modal, Select, message, Spin, Progress } from 'antd';
import {
    ArrowLeftOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    TrophyOutlined,
    ReloadOutlined,
    HomeOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { gameAPI } from '../services/api';

const { Option } = Select;

const GAME_STATES = {
    SETUP: 'setup',
    PLAYING: 'playing',
    ANSWERED: 'answered',
    RESULTS: 'results'
};

const Game = () => {
    const navigate = useNavigate();
    const [gameState, setGameState] = useState(GAME_STATES.SETUP);
    const [loading, setLoading] = useState(false);
    const [sessionId, setSessionId] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState(null);
    const [answerResult, setAnswerResult] = useState(null);
    const [score, setScore] = useState(0);
    const [correctCount, setCorrectCount] = useState(0);
    const [finalResults, setFinalResults] = useState(null);
    const [timeLeft, setTimeLeft] = useState(30);
    const [timerActive, setTimerActive] = useState(false);

    // Game settings
    const [difficulty, setDifficulty] = useState('mixed');
    const [questionCount, setQuestionCount] = useState(10);

    // Timer effect
    useEffect(() => {
        let interval = null;
        if (timerActive && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft(time => time - 1);
            }, 1000);
        } else if (timeLeft === 0 && timerActive) {
            handleTimeUp();
        }
        return () => clearInterval(interval);
    }, [timerActive, timeLeft]);

    const handleTimeUp = useCallback(async () => {
        setTimerActive(false);
        if (selectedAnswer === null && questions[currentIndex]) {
            // Auto-submit with empty answer
            try {
                const response = await gameAPI.submitAnswer(sessionId, {
                    questionId: questions[currentIndex].id,
                    answer: '',
                    timeSpent: 30
                });
                setAnswerResult(response.data.data);
                setGameState(GAME_STATES.ANSWERED);
            } catch (error) {
                console.error('Error submitting timeout:', error);
            }
        }
    }, [selectedAnswer, questions, currentIndex, sessionId]);

    const startGame = async () => {
        setLoading(true);
        try {
            const response = await gameAPI.startGame({ 
                difficulty, 
                questionCount 
            });
            const { sessionId: newSessionId, questions: gameQuestions } = response.data.data;
            
            setSessionId(newSessionId);
            setQuestions(gameQuestions);
            setCurrentIndex(0);
            setScore(0);
            setCorrectCount(0);
            setGameState(GAME_STATES.PLAYING);
            setTimeLeft(30);
            setTimerActive(true);
        } catch (error) {
            message.error(error.response?.data?.message || 'Failed to start game');
        } finally {
            setLoading(false);
        }
    };

    const handleAnswerSelect = (answer) => {
        if (gameState !== GAME_STATES.PLAYING) return;
        setSelectedAnswer(answer);
    };

    const submitAnswer = async () => {
        if (!selectedAnswer || gameState !== GAME_STATES.PLAYING) return;
        
        setTimerActive(false);
        setLoading(true);
        
        try {
            const response = await gameAPI.submitAnswer(sessionId, {
                questionId: questions[currentIndex].id,
                answer: selectedAnswer,
                timeSpent: 30 - timeLeft
            });
            
            const result = response.data.data;
            setAnswerResult(result);
            setScore(result.currentScore);
            if (result.isCorrect) {
                setCorrectCount(prev => prev + 1);
            }
            setGameState(GAME_STATES.ANSWERED);
        } catch (error) {
            message.error(error.response?.data?.message || 'Failed to submit answer');
        } finally {
            setLoading(false);
        }
    };

    const nextQuestion = () => {
        if (currentIndex < questions.length - 1) {
            setCurrentIndex(prev => prev + 1);
            setSelectedAnswer(null);
            setAnswerResult(null);
            setGameState(GAME_STATES.PLAYING);
            setTimeLeft(30);
            setTimerActive(true);
        } else {
            endGame();
        }
    };

    const endGame = async () => {
        setLoading(true);
        try {
            const response = await gameAPI.endGame(sessionId);
            setFinalResults(response.data.data);
            setGameState(GAME_STATES.RESULTS);
        } catch (error) {
            message.error(error.response?.data?.message || 'Failed to end game');
        } finally {
            setLoading(false);
        }
    };

    const currentQuestion = questions[currentIndex];

    // Setup Screen
    if (gameState === GAME_STATES.SETUP) {
        return (
            <div className="game-container">
                <div className="question-card" style={{ maxWidth: 500, textAlign: 'center' }}>
                    <Button 
                        type="text" 
                        icon={<ArrowLeftOutlined />}
                        onClick={() => navigate('/dashboard')}
                        style={{ position: 'absolute', top: 16, left: 16, color: 'var(--text-secondary)' }}
                    >
                        Back
                    </Button>
                    
                    <div style={{ fontSize: 64, marginBottom: 16 }}>⚽</div>
                    <h1 style={{ marginBottom: 8 }}>Start New Game</h1>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: 32 }}>
                        Configure your game settings
                    </p>

                    <div style={{ marginBottom: 24, textAlign: 'left' }}>
                        <label style={{ display: 'block', marginBottom: 8, color: 'var(--text-secondary)' }}>
                            Difficulty
                        </label>
                        <Select
                            value={difficulty}
                            onChange={setDifficulty}
                            style={{ width: '100%' }}
                            size="large"
                        >
                            <Option value="mixed">Mixed</Option>
                            <Option value="easy">Easy</Option>
                            <Option value="medium">Medium</Option>
                            <Option value="hard">Hard</Option>
                            <Option value="expert">Expert (SQL)</Option>
                        </Select>
                    </div>

                    <div style={{ marginBottom: 32, textAlign: 'left' }}>
                        <label style={{ display: 'block', marginBottom: 8, color: 'var(--text-secondary)' }}>
                            Number of Questions
                        </label>
                        <Select
                            value={questionCount}
                            onChange={setQuestionCount}
                            style={{ width: '100%' }}
                            size="large"
                        >
                            <Option value={5}>5 Questions</Option>
                            <Option value={10}>10 Questions</Option>
                            <Option value={15}>15 Questions</Option>
                            <Option value={20}>20 Questions</Option>
                        </Select>
                    </div>

                    <Button
                        type="primary"
                        size="large"
                        loading={loading}
                        onClick={startGame}
                        className="btn-primary"
                        style={{ height: 56, fontSize: 18 }}
                    >
                        Start Game
                    </Button>
                </div>
            </div>
        );
    }

    // Results Screen
    if (gameState === GAME_STATES.RESULTS && finalResults) {
        return (
            <div className="game-container">
                <div className="question-card results-container">
                    <div style={{ fontSize: 80, marginBottom: 16 }}>
                        {finalResults.accuracy >= 80 ? '🏆' : finalResults.accuracy >= 50 ? '⭐' : '💪'}
                    </div>
                    <h1>Game Complete!</h1>
                    
                    <div className="results-score">{finalResults.score}</div>
                    <div className="results-label">Total Points</div>

                    <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(3, 1fr)', 
                        gap: 24,
                        margin: '32px 0',
                        padding: 24,
                        background: 'rgba(10, 25, 41, 0.5)',
                        borderRadius: 12
                    }}>
                        <div>
                            <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--primary)' }}>
                                {finalResults.correctAnswers}
                            </div>
                            <div style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Correct</div>
                        </div>
                        <div>
                            <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--text-primary)' }}>
                                {finalResults.totalQuestions}
                            </div>
                            <div style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Total</div>
                        </div>
                        <div>
                            <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--accent-gold)' }}>
                                {finalResults.accuracy}%
                            </div>
                            <div style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Accuracy</div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
                        <Button
                            size="large"
                            icon={<ReloadOutlined />}
                            onClick={() => setGameState(GAME_STATES.SETUP)}
                            style={{ height: 48 }}
                        >
                            Play Again
                        </Button>
                        <Button
                            type="primary"
                            size="large"
                            icon={<HomeOutlined />}
                            onClick={() => navigate('/dashboard')}
                            style={{ height: 48 }}
                        >
                            Dashboard
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    // Playing Screen
    return (
        <div className="game-container">
            <Spin spinning={loading}>
                <div className="question-card">
                    {/* Progress */}
                    <div className="progress-container">
                        <div style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            marginBottom: 8,
                            color: 'var(--text-secondary)'
                        }}>
                            <span>Question {currentIndex + 1} of {questions.length}</span>
                            <span>{Math.round((currentIndex / questions.length) * 100)}%</span>
                        </div>
                        <div className="progress-bar">
                            <div 
                                className="progress-fill" 
                                style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
                            />
                        </div>
                    </div>

                    {/* Score & Timer */}
                    <div className="score-display">
                        <div className="score-item">
                            <div className="value">{score}</div>
                            <div className="label">Score</div>
                        </div>
                        <div className="score-item">
                            <div className="value" style={{ 
                                color: timeLeft <= 10 ? 'var(--error)' : 'var(--primary)'
                            }}>
                                {timeLeft}s
                            </div>
                            <div className="label">Time Left</div>
                        </div>
                        <div className="score-item">
                            <div className="value">{correctCount}/{currentIndex + (gameState === GAME_STATES.ANSWERED ? 1 : 0)}</div>
                            <div className="label">Correct</div>
                        </div>
                    </div>

                    {currentQuestion && (
                        <>
                            {/* Question */}
                            <div style={{ marginBottom: 8 }}>
                                <span className="question-number">
                                    {currentQuestion.category} • {currentQuestion.points} pts
                                </span>
                            </div>
                            <h2 className="question-text">{currentQuestion.question}</h2>

                            {/* Options */}
                            <div className="options-grid">
                                {currentQuestion.options.map((option, index) => {
                                    const letter = String.fromCharCode(65 + index);
                                    let className = 'option-btn';
                                    
                                    if (gameState === GAME_STATES.ANSWERED && answerResult) {
                                        if (option === answerResult.correctAnswer) {
                                            className += ' correct';
                                        } else if (option === selectedAnswer && !answerResult.isCorrect) {
                                            className += ' incorrect';
                                        }
                                    } else if (selectedAnswer === option) {
                                        className += ' selected';
                                    }

                                    return (
                                        <button
                                            key={index}
                                            className={className}
                                            onClick={() => handleAnswerSelect(option)}
                                            disabled={gameState === GAME_STATES.ANSWERED}
                                        >
                                            <span className="option-letter">{letter}</span>
                                            <span>{option}</span>
                                            {gameState === GAME_STATES.ANSWERED && option === answerResult?.correctAnswer && (
                                                <CheckCircleOutlined style={{ marginLeft: 'auto', color: 'var(--success)' }} />
                                            )}
                                            {gameState === GAME_STATES.ANSWERED && option === selectedAnswer && !answerResult?.isCorrect && (
                                                <CloseCircleOutlined style={{ marginLeft: 'auto', color: 'var(--error)' }} />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Answer Feedback */}
                            {gameState === GAME_STATES.ANSWERED && answerResult && (
                                <div style={{ 
                                    marginTop: 24, 
                                    padding: 20,
                                    background: answerResult.isCorrect 
                                        ? 'rgba(0, 217, 165, 0.1)' 
                                        : 'rgba(255, 107, 107, 0.1)',
                                    borderRadius: 12,
                                    border: `1px solid ${answerResult.isCorrect ? 'var(--success)' : 'var(--error)'}`
                                }}>
                                    <div style={{ 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        gap: 8,
                                        marginBottom: 8,
                                        fontWeight: 600,
                                        color: answerResult.isCorrect ? 'var(--success)' : 'var(--error)'
                                    }}>
                                        {answerResult.isCorrect ? (
                                            <><CheckCircleOutlined /> Correct! +{answerResult.pointsEarned} points</>
                                        ) : (
                                            <><CloseCircleOutlined /> Incorrect</>
                                        )}
                                    </div>
                                    {answerResult.explanation && (
                                        <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: 14 }}>
                                            {answerResult.explanation}
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* Actions */}
                            <div style={{ marginTop: 24, display: 'flex', gap: 16, justifyContent: 'flex-end' }}>
                                {gameState === GAME_STATES.PLAYING ? (
                                    <Button
                                        type="primary"
                                        size="large"
                                        onClick={submitAnswer}
                                        disabled={!selectedAnswer}
                                        style={{ minWidth: 150 }}
                                    >
                                        Submit Answer
                                    </Button>
                                ) : (
                                    <Button
                                        type="primary"
                                        size="large"
                                        onClick={nextQuestion}
                                        style={{ minWidth: 150 }}
                                    >
                                        {currentIndex < questions.length - 1 ? 'Next Question' : 'See Results'}
                                    </Button>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </Spin>
        </div>
    );
};

export default Game;
