import React, { useState } from 'react';
import { Form, Input, Button, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { login } = useAuth();

    const onFinish = async (values) => {
        setLoading(true);
        try {
            await login(values);
            message.success('Welcome back!');
            navigate('/dashboard');
        } catch (error) {
            const errorMsg = error.response?.data?.message || 'Login failed. Please try again.';
            message.error(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="logo">⚽</div>
                <h1>Football-IQ</h1>
                <p className="subtitle">Test your football knowledge</p>

                <Form
                    name="login"
                    onFinish={onFinish}
                    layout="vertical"
                    size="large"
                >
                    <Form.Item
                        name="username"
                        rules={[{ required: true, message: 'Please enter your username' }]}
                    >
                        <Input
                            prefix={<UserOutlined style={{ color: 'rgba(255,255,255,0.5)' }} />}
                            placeholder="Username or Email"
                            className="custom-input"
                        />
                    </Form.Item>

                    <Form.Item
                        name="password"
                        rules={[{ required: true, message: 'Please enter your password' }]}
                    >
                        <Input.Password
                            prefix={<LockOutlined style={{ color: 'rgba(255,255,255,0.5)' }} />}
                            placeholder="Password"
                            className="custom-input"
                        />
                    </Form.Item>

                    <Form.Item style={{ marginBottom: 16 }}>
                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={loading}
                            className="btn-primary"
                        >
                            Sign In
                        </Button>
                    </Form.Item>

                    <div style={{ textAlign: 'center' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>
                            Don't have an account?{' '}
                        </span>
                        <Link to="/register" style={{ color: 'var(--primary)', fontWeight: 500 }}>
                            Register now
                        </Link>
                    </div>
                </Form>
            </div>
        </div>
    );
};

export default Login;
