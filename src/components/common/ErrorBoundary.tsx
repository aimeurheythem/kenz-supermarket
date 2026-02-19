import { Component, ErrorInfo, ReactNode } from 'react';
import i18n from '@/i18n';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
}

/**
 * Error Boundary component to catch JavaScript errors anywhere in the child component tree
 * and display a fallback UI instead of crashing the entire application
 */
export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
    };

    public static getDerivedStateFromError(error: Error): State {
        // Update state so the next render will show the fallback UI
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="min-h-screen flex items-center justify-center bg-secondary p-4">
                    <div className="max-w-md w-full bg-primary rounded-[3rem] p-8 text-center border border-gray-100 shadow-lg">
                        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg
                                className="w-10 h-10 text-red-500"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-black text-black mb-2 tracking-tight uppercase">
                            {i18n.t('error_boundary.title')}
                        </h2>
                        <p className="text-sm text-zinc-400 mb-6 font-medium">{i18n.t('error_boundary.message')}</p>
                        {this.state.error && (
                            <div className="bg-zinc-50 rounded-2xl p-4 mb-6 text-left overflow-auto max-h-32">
                                <code className="text-xs text-red-500 font-mono">{this.state.error.message}</code>
                            </div>
                        )}
                        <button
                            onClick={() => window.location.reload()}
                            className="w-full py-4 bg-black text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-zinc-800 transition-all"
                        >
                            {i18n.t('error_boundary.reload')}
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
