import { useState, useRef, useEffect } from 'react';
import { BarChart3, ArrowLeft, LogIn } from 'lucide-react';
import { validateCode } from '../lib/auth';
import type { AuthSession } from '../lib/auth';

interface LoginProps {
  onLogin: (session: AuthSession) => void;
}

export function Login({ onLogin }: LoginProps) {
  const [step, setStep] = useState<'code' | 'name'>('code');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [names, setNames] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, [step]);

  function handleCodeSubmit() {
    const result = validateCode(code);
    if (!result) {
      setError('Código inválido. Tente novamente.');
      setCode('');
      inputRef.current?.focus();
      return;
    }
    if (result === 'master') {
      onLogin({ isMaster: true, gestorName: null });
      return;
    }
    if (result.length === 1) {
      // Só um nome — vai direto
      onLogin({ isMaster: false, gestorName: result[0] });
      return;
    }
    // Múltiplos nomes — mostra seleção
    setNames(result);
    setStep('name');
    setError('');
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleCodeSubmit();
  }

  return (
    <div className="min-h-screen bg-dark-900 flex flex-col items-center justify-center px-4">
      {/* Logo */}
      <div className="flex items-center gap-3 mb-10">
        <div className="w-12 h-12 bg-primary-600 rounded-xl flex items-center justify-center">
          <BarChart3 className="w-7 h-7 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Saldo de Horas</h1>
          <p className="text-sm text-dark-400">Análise por Gestor</p>
        </div>
      </div>

      <div className="w-full max-w-sm bg-dark-800 border border-dark-700 rounded-2xl p-8 shadow-xl">

        {/* Etapa 1 — Código */}
        {step === 'code' && (
          <>
            <h2 className="text-lg font-semibold text-white mb-1">Acesso restrito</h2>
            <p className="text-sm text-dark-400 mb-6">Digite seu código de acesso para continuar.</p>

            <div className="mb-4">
              <label className="block text-xs font-medium text-dark-400 mb-2 uppercase tracking-wider">
                Código
              </label>
              <input
                ref={inputRef}
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.replace(/\D/g, ''));
                  setError('');
                }}
                onKeyDown={handleKeyDown}
                placeholder="••••"
                className="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-lg text-white text-center text-2xl tracking-[0.5em] placeholder-dark-600 focus:outline-none focus:border-primary-500 transition-colors"
              />
            </div>

            {error && (
              <p className="text-sm text-red-400 mb-4 text-center">{error}</p>
            )}

            <button
              onClick={handleCodeSubmit}
              disabled={code.length === 0}
              className="w-full flex items-center justify-center gap-2 py-3 bg-primary-600 hover:bg-primary-500 disabled:bg-dark-700 disabled:text-dark-500 text-white font-semibold rounded-lg transition-colors"
            >
              <LogIn className="w-4 h-4" />
              Continuar
            </button>
          </>
        )}

        {/* Etapa 2 — Seleção de nome */}
        {step === 'name' && (
          <>
            <button
              onClick={() => { setStep('code'); setCode(''); setError(''); }}
              className="flex items-center gap-1.5 text-sm text-dark-400 hover:text-white mb-5 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </button>

            <h2 className="text-lg font-semibold text-white mb-1">Selecione seu nome</h2>
            <p className="text-sm text-dark-400 mb-5">Escolha o nome associado ao seu acesso.</p>

            <div className="space-y-2">
              {names.map((name) => (
                <button
                  key={name}
                  onClick={() => onLogin({ isMaster: false, gestorName: name })}
                  className="w-full text-left px-4 py-3 bg-dark-700 hover:bg-primary-600/20 border border-dark-600 hover:border-primary-500/50 rounded-lg text-white text-sm font-medium transition-colors"
                >
                  {name}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
