import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '' };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error('ErrorBoundary caught:', error, info);
  }

  reset = () => this.setState({ hasError: false, message: '' });

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="min-h-screen flex items-center justify-center bg-cream-50 px-4">
          <div className="max-w-md text-center">
            <h2 className="font-display font-bold text-xl text-primary-800 mb-2">
              Something went wrong
            </h2>
            <p className="text-sm text-primary-500 mb-2">
              The page encountered an unexpected error. Try refreshing, or go back to the home page.
            </p>
            {this.state.message && (
              <p className="text-xs text-danger-500 mb-4 font-mono break-all">
                {this.state.message}
              </p>
            )}
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => { this.reset(); window.location.href = '/'; }}
                className="px-4 py-2 rounded-lg bg-primary-700 text-white text-sm font-medium hover:bg-primary-800 transition-colors"
              >
                Back to home
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 rounded-lg bg-white border border-ink-200 text-primary-700 text-sm font-medium hover:border-sage-200 transition-colors"
              >
                Refresh page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
