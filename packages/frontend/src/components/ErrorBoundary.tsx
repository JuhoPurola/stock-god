import { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from './ui/Button';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
    window.location.href = '/dashboard';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="max-w-md w-full">
            <div className="bg-white rounded-lg shadow-lg p-8 text-center">
              <div className="flex justify-center mb-4">
                <div className="bg-red-100 rounded-full p-3">
                  <AlertTriangle className="w-8 h-8 text-red-600" />
                </div>
              </div>

              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Something went wrong
              </h1>

              <p className="text-gray-600 mb-6">
                We apologize for the inconvenience. An unexpected error occurred.
              </p>

              {this.state.error && (
                <details className="mb-6 text-left">
                  <summary className="cursor-pointer text-sm text-gray-700 hover:text-gray-900 mb-2">
                    Error details
                  </summary>
                  <div className="bg-gray-50 rounded p-4 text-xs text-gray-800 font-mono overflow-auto max-h-40">
                    <div className="font-bold mb-2">{this.state.error.message}</div>
                    {this.state.error.stack && (
                      <pre className="whitespace-pre-wrap">{this.state.error.stack}</pre>
                    )}
                  </div>
                </details>
              )}

              <div className="space-y-3">
                <Button onClick={this.handleReset} className="w-full">
                  Return to Dashboard
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => window.location.reload()}
                  className="w-full"
                >
                  Reload Page
                </Button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
