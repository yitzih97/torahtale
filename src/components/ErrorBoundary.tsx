import { Component, type ErrorInfo, type ReactNode } from "react";

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
    console.error("Unhandled render error:", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-[hsl(42_60%_96%)] px-6 text-center">
          <p className="text-lg font-medium text-foreground">
            Something went wrong.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="rounded-md bg-gold px-4 py-2 text-sm font-medium text-white"
          >
            Reload page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
