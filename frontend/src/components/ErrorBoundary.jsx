import React from 'react';
import { AlertCircle, RefreshCcw, Home } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
          <div className="max-w-md w-full bg-white p-12 rounded-[3rem] shadow-2xl border border-slate-100 text-center">
            <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner">
              <AlertCircle className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-4 tracking-tight">Something went wrong</h2>
            <p className="text-slate-500 font-medium mb-10 leading-relaxed italic">
              Our system encountered an unexpected error. Don't worry, your data is safe.
            </p>
            
            <div className="space-y-4">
              <button
                onClick={() => window.location.reload()}
                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 hover:bg-black transition-all shadow-xl shadow-slate-900/10"
              >
                <RefreshCcw className="w-4 h-4" />
                Reload Application
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="w-full py-4 bg-white text-slate-900 border border-slate-200 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 hover:bg-slate-50 transition-all"
              >
                <Home className="w-4 h-4" />
                Back to Safety
              </button>
            </div>
            
            <div className="mt-10 pt-8 border-t border-slate-100">
                <p className="text-[9px] text-slate-300 font-black uppercase tracking-tighter">
                    Error Signature: {this.state.error?.message || "Unknown Runtime Exception"}
                </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
