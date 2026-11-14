import React, { Component, ErrorInfo, ReactNode } from 'react';
import { RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
  title: string;
  retryLabel: string;
}

interface State {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    message: '',
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message || 'Unexpected error' };
  }

  public componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Mars Odyssey ErrorBoundary caught:', error, info);
  }

  private handleReload = (): void => {
    this.setState({ hasError: false, message: '' });
    window.location.reload();
  };

  public render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#120b36] p-6 text-white">
          <div className="max-w-md w-full rounded-3xl bg-[#1e1454] border-2 border-cyan-400/40 p-8 text-center shadow-2xl">
            <h1 className="font-display text-2xl font-bold text-yellow-300 mb-3">
              {this.props.title}
            </h1>
            <p className="text-sm text-indigo-200 mb-6 break-words">{this.state.message}</p>
            <button
              onClick={this.handleReload}
              className="btn-chunky inline-flex items-center gap-2 rounded-2xl bg-emerald-500 border-emerald-700 px-6 py-3 font-display text-base font-bold text-slate-950 cursor-pointer"
            >
              <RotateCcw className="w-5 h-5" />
              <span>{this.props.retryLabel}</span>
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
