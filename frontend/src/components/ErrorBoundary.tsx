import { Component, ReactNode } from 'react';

interface Props { children: ReactNode; }
interface State { hasError: boolean; }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error('[TaskFlow] Uncaught error:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center gap-4 px-4 text-center">
          <div className="text-5xl mb-2">⚠</div>
          <h1 className="text-xl font-semibold">Something went wrong</h1>
          <p className="text-gray-500 text-sm max-w-xs">
            An unexpected error occurred. Try reloading the page.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 px-6 py-2 bg-white text-black rounded font-medium text-sm hover:bg-gray-100 transition"
          >
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
