import React from 'react';
import { Button, Result } from 'antd';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        this.setState({
            error: error,
            errorInfo: errorInfo
        });
        
        // Log to error reporting service in production
        if (process.env.NODE_ENV === 'production') {
            // Example: logErrorToService(error, errorInfo);
            console.error('Application Error:', error);
        }
    }

    handleReload = () => {
        window.location.reload();
    };

    handleGoHome = () => {
        window.location.href = '/';
    };

    render() {
        if (this.state.hasError) {
            return (
                <div style={{ 
                    minHeight: '100vh', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    background: 'linear-gradient(135deg, #0a1929 0%, #132f4c 100%)',
                    padding: 20
                }}>
                    <Result
                        status="error"
                        title="Something went wrong"
                        subTitle="We're sorry, but something unexpected happened. Please try again."
                        extra={[
                            <Button 
                                type="primary" 
                                key="reload" 
                                onClick={this.handleReload}
                                style={{ marginRight: 8 }}
                            >
                                Reload Page
                            </Button>,
                            <Button 
                                key="home" 
                                onClick={this.handleGoHome}
                            >
                                Go to Home
                            </Button>
                        ]}
                        style={{
                            background: 'rgba(19, 47, 76, 0.9)',
                            borderRadius: 16,
                            padding: 40,
                            border: '1px solid rgba(0, 217, 165, 0.2)'
                        }}
                    />
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
