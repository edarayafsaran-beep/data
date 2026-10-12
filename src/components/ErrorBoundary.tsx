import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
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
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleRefresh = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#040b16] flex items-center justify-center p-4" dir="rtl">
          <div className="max-w-md w-full bg-slate-900/60 backdrop-blur-xl border border-white/10 p-8 rounded-[32px] text-center shadow-md">
            <div className="w-20 h-20 bg-rose-500/20 border border-rose-500/40 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-10 h-10 text-rose-500" />
            </div>
            <h1 className="text-2xl font-black text-white mb-4">هەڵەیەک ڕوویدا</h1>
            <p className="text-slate-400 mb-8 text-sm leading-relaxed">
              ببوورە، کێشەیەک لە بارکردنی بەرنامەکەدا دروست بوو. تکایە دووبارە هەوڵ بدەرەوە یان لاپەڕەکە نوێ بکەرەوە.
            </p>
            {this.state.error && (
               <div className="bg-black/40 rounded-2xl p-4 mb-8 text-left overflow-auto max-h-32 border border-white/5">
                 <code className="text-rose-400 text-xs">
                   {this.state.error.toString()}
                 </code>
               </div>
            )}
            <button
              onClick={this.handleRefresh}
              className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-2xl shadow-md active:scale-95 transition-all hover:shadow-indigo-500/20"
            >
              <RefreshCw className="w-5 h-5" />
              نوێکردنەوەی لاپەڕە
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
