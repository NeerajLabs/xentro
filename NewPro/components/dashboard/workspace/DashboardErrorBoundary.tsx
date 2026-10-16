'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  moduleName?: string;
  onReset?: () => void;
  onNavigateHome?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class DashboardErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Sanitize and log diagnostic info without credentials or personal data
    const sanitizedMessage = error?.message
      ? error.message.replace(/([a-zA-Z0-9_\-\.]+)@([a-zA-Z0-9_\-\.]+)\.([a-zA-Z]{2,5})/g, '[REDACTED_EMAIL]')
      : 'Unknown error';
    console.error(
      `[DashboardErrorBoundary] Recovered from exception in ${this.props.moduleName || 'workspace module'}:`,
      sanitizedMessage,
      errorInfo.componentStack
    );
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      const moduleTitle = this.props.moduleName
        ? this.props.moduleName.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
        : 'Module';

      return (
        <div className="p-6 max-w-2xl mx-auto my-8 rounded-3xl bg-white dark:bg-[#181B1A] border border-amber-200 dark:border-amber-500/20 shadow-xl text-center space-y-4 animate-fade-slide">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-[#101212] dark:text-white">
              {moduleTitle} Encountered an Unexpected Issue
            </h3>
            <p className="text-xs text-[#565B59] dark:text-[#B6B8B7] max-w-md mx-auto">
              A temporary display error occurred while rendering this section. Your workspace session and data remain safe.
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={this.handleRetry}
              className="px-4 py-2 rounded-xl bg-[#101212] dark:bg-[#D9FF3F] text-white dark:text-[#101212] text-xs font-bold hover:opacity-90 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer shadow-subtle"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retry {moduleTitle}</span>
            </button>
            {this.props.onNavigateHome && (
              <button
                type="button"
                onClick={this.props.onNavigateHome}
                className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-[#202422] text-[#565B59] dark:text-[#B6B8B7] hover:text-[#101212] dark:hover:text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border border-gray-200 dark:border-[#262A29]"
              >
                <Home className="w-3.5 h-3.5" />
                <span>Return to Overview</span>
              </button>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
