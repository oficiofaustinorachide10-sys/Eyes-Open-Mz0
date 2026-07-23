import React, { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Trash2 } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  constructor(props: Props) {
    super(props);
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
    (this as any).setState({ errorInfo });
  }

  private handleReset = () => {
    (this as any).setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  private handleClearCacheAndReload = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (e) {
      console.error('Error clearing storage:', e);
    }
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#050508] text-white flex items-center justify-center p-4 font-sans">
          <div className="max-w-md w-full bg-[#111119] border border-red-500/30 rounded-3xl p-6 shadow-2xl text-center space-y-5">
            <div className="w-16 h-16 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center justify-center mx-auto text-red-500">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h1 className="text-xl font-bold font-orbitron tracking-wider">Recuperação de Aplicação</h1>
              <p className="text-xs text-gray-400 leading-relaxed">
                Ocorreu um erro inesperado ao carregar a interface. A plataforma preveniu a falha total.
              </p>
            </div>

            {this.state.error && (
              <div className="p-3 bg-red-950/30 border border-red-500/20 rounded-xl text-left overflow-x-auto text-[10px] font-mono text-red-300 max-h-32 no-scrollbar">
                {this.state.error.toString()}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={this.handleReset}
                className="py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <RefreshCw className="w-4 h-4" />
                Recarregar
              </button>
              <button
                onClick={this.handleClearCacheAndReload}
                className="py-3 px-4 bg-white/10 hover:bg-white/20 text-gray-200 font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <Trash2 className="w-4 h-4" />
                Limpar Cache
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (this as any).props.children;
  }
}
