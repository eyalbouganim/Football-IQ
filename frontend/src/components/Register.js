import React, { useState } from 'react';
import { Form, Input, Button, message, AutoComplete } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, HeartOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const famousTeams = [
    { value: 'Real Madrid' },
    { value: 'FC Barcelona' },
    { value: 'Manchester United' },
    { value: 'Liverpool FC' },
    { value: 'FC Bayern Munich' },
    { value: 'Juventus FC' },
    { value: 'Paris Saint-Germain' },
    { value: 'Chelsea FC' },
    { value: 'Arsenal FC' },
    { value: 'Manchester City' },
    { value: 'AC Milan' },
    { value: 'Inter Milan' },
    { value: 'Borussia Dortmund' },
    { value: 'Atletico Madrid' },
    { value: 'Tottenham Hotspur' },
];

const Register = () => {
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { register } = useAuth();

    const onFinish = async (values) => {
        setLoading(true);
        try {
            await register(values);
            message.success('Registration successful! Please sign in.');
            navigate('/login');
        } catch (error) {
            const errorMsg = error.response?.data?.message || 'Registration failed. Please try again.';
            message.error(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="logo">⚽</div>
                <h1>Join Football-IQ</h1>
                <p className="subtitle">Create your account and start playing</p>

                <Form
                    name="register"
                    onFinish={onFinish}
                    layout="vertical"
                    size="large"
                >
                    <Form.Item
                        name="username"
                        rules={[
                            { required: true, message: 'Please enter a username' },
                            { min: 3, message: 'Username must be at least 3 characters' },
                            { pattern: /^[a-zA-Z0-9_]+$/, message: 'Letters, numbers, and underscores only' }
                        ]}
                    >
                        <Input
                            prefix={<UserOutlined style={{ color: 'rgba(255,255,255,0.5)' }} />}
                            placeholder="Username"
                            className="custom-input"
                        />
                    </Form.Item>

                    <Form.Item
                        name="email"
                        rules={[
                            { required: true, message: 'Please enter your email' },
                            { type: 'email', message: 'Please enter a valid email' }
                        ]}
                    >
                        <Input
                            prefix={<MailOutlined style={{ color: 'rgba(255,255,255,0.5)' }} />}
                            placeholder="Email"
                            className="custom-input"
                        />
                    </Form.Item>

                    <Form.Item
                        name="password"
                        rules={[
                            { required: true, message: 'Please enter a password' },
                            { min: 8, message: 'Password must be at least 8 characters' },
                            {
                                pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                                message: 'Include uppercase, lowercase, and a number'
                            }
                        ]}
                    >
                        <Input.Password
                            prefix={<LockOutlined style={{ color: 'rgba(255,255,255,0.5)' }} />}
                            placeholder="Password"
                            className="custom-input"
                        />
                    </Form.Item>

                    <Form.Item
                        name="favoriteTeam"
                        rules={[{ required: true, message: 'Please select your favorite team' }]}
                    >
                        <AutoComplete
                            options={famousTeams}
                            filterOption={(input, option) =>
                                option.value.toLowerCase().includes(input.toLowerCase())
                            }
                        >
                            <Input
                                prefix={<HeartOutlined style={{ color: 'rgba(255,255,255,0.5)' }} />}
                                placeholder="Favorite Team"
                                className="custom-input"
                            />
                        </AutoComplete>
                    </Form.Item>

                    <Form.Item style={{ marginBottom: 16 }}>
                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={loading}
                            className="btn-primary"
                        >
                            Create Account
                        </Button>
                    </Form.Item>

                    <div style={{ textAlign: 'center' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>
                            Already have an account?{' '}
                        </span>
                        <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 500 }}>
                            Sign in
                        </Link>
                    </div>
                </Form>
            </div>
        </div>
    );
};

export default Register;
