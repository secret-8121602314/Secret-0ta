import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error details
    console.error('🚨 [ErrorBoundary] Caught error:', error);
    console.error('🚨 [ErrorBoundary] Error info:', errorInfo);
    
    // Update state with error info
    this.setState({
      error,
      errorInfo,
    });
    
    // You can also log to an error reporting service here
    // Example: errorReportingService.logError(error, errorInfo);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div className="min-h-screen bg-gradient-to-br from-[#111111] to-[#0A0A0A] flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-[#1C1C1C] border border-[#424242] rounded-xl p-6 text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-[#F5F5F5] mb-2">Something Went Wrong</h1>
            <p className="text-[#CFCFCF] mb-4">
              We encountered an unexpected error. Don't worry, your data is safe.
            </p>
            
            {this.state.error && (
              <div className="bg-[#2E2E2E] rounded-lg p-4 mb-4 text-left">
                <p className="text-xs font-mono text-[#FF4D4D] mb-2">
                  {this.state.error.toString()}
                </p>
                {this.state.errorInfo && (
                  <details className="text-xs text-[#A3A3A3]">
                    <summary className="cursor-pointer hover:text-[#CFCFCF] transition-colors">
                      Error Details
                    </summary>
                    <pre className="mt-2 overflow-auto max-h-40">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                )}
              </div>
            )}
            
            <div className="flex gap-3">
              <button
                onClick={this.handleReset}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-[#FF4D4D] to-[#FFAB40] text-white rounded-lg font-semibold hover:scale-105 transition-transform"
              >
                Try Again
              </button>
              <button
                onClick={() => window.location.reload()}
                className="flex-1 px-4 py-2 bg-[#2E2E2E] text-[#CFCFCF] rounded-lg font-semibold hover:bg-[#424242] transition-colors"
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

