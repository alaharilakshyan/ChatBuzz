import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = "/";
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#F4F7F6] to-[#E9EFEF] p-6">
          <div className="max-w-md w-full bg-white border border-white/60 shadow-[0_20px_50px_rgba(0,0,0,0.04)] rounded-3xl p-8 text-center space-y-6">
            <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
              <AlertCircle className="w-8 h-8" />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-2xl font-bold tracking-tight text-[#0C1412]">Something went wrong</h2>
              <p className="text-sm text-[#1A2421]/70 leading-relaxed">
                An unexpected runtime error has occurred. This could be due to dynamic route context or profile load mismatches.
              </p>
              {this.state.error && (
                <pre className="text-xs bg-red-50/50 text-red-700/80 p-3 rounded-xl overflow-x-auto text-left border border-red-100 max-h-40 scrollbar-thin">
                  {this.state.error.message}
                </pre>
              )}
            </div>

            <Button
              onClick={this.handleReset}
              className="w-full bg-[#0C1412] hover:bg-[#1A2421] text-white rounded-xl py-6 font-semibold flex items-center justify-center gap-2 transition-all duration-300"
            >
              <RotateCcw className="w-4 h-4" />
              Reload Application
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
export default ErrorBoundary;
