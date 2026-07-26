import { Component, type ErrorInfo, type ReactNode } from "react";
import { logError } from "../services/logger-service";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    logError(`Unhandled UI error: ${error.message}\n${info.componentStack}`);
  }

  private handleReload = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <main className="flex h-screen items-center justify-center bg-neutral-100 dark:bg-neutral-900">
          <div className="text-center">
            <h1 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              Something went wrong
            </h1>
            <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
              The error has been logged. You can try continuing below.
            </p>
            <button
              type="button"
              onClick={this.handleReload}
              className="mt-6 rounded-lg bg-neutral-900 px-3 py-1.5 text-sm text-neutral-100 dark:bg-neutral-100 dark:text-neutral-900"
            >
              Try again
            </button>
          </div>
        </main>
      );
    }

    return this.props.children;
  }
}
