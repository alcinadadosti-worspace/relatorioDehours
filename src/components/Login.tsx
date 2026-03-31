import { useState, useRef, useEffect } from 'react';
import { BarChart3, ArrowLeft, LogIn } from 'lucide-react';
import {
  validateCode,
  validateBirthMonth,
  requiresBirthMonth,
  MONTH_NAMES,
} from '../lib/auth';
import type { AuthSession } from '../lib/auth';

interface LoginProps {
  onLogin: (session: AuthSession) => void;
}

type Step = 'code' | 'name' | 'month';

export function Login({ onLogin }: LoginProps) {
  const [step, setStep] = useState<Step>('code');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [names, setNames] = useState<string[]>([]);
  const [selectedName, setSelectedName] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (step === 'code') inputRef.current?.focus();
  }, [step]);

  function goToMonthOrLogin(name: string) {
    if (requiresBirthMonth(name)) {
      setSelectedName(name);
      setSelectedMonth(0);
      setError('');
      setStep('month');
    } else {
      onLogin({ isMaster: false, gestorName: name });
    }
  }

  function handleCodeSubmit() {
    const result = validateCode(code);
    if (!result) {
      setError('Código inválido. Tente novamente.');
      setCode('');
      return;
    }
    if (result === 'master') {
      onLogin({ isMaster: true, gestorName: null });
      return;
    }
    setError('');
    if (result.length === 1) {
      goToMonthOrLogin(result[0]);
    } else {
      setNames(result);
      setStep('name');
    }
  }

  function handleNameSelect(name: string) {
    goToMonthOrLogin(name);
  }

  function handleMonthSubmit() {
    if (selectedMonth === 0) {
      setError('Selecione o mês de aniversário.');
      return;
    }
    if (!validateBirthMonth(selectedName, selectedMonth)) {
      setError('Mês de aniversário incorreto. Tente novamente.');
      setSelectedMonth(0);
      return;
    }
    onLogin({ isMaster: false, gestorName: selectedName });
  }

  function backToCode() {
    setStep('code');
    setCode('');
    setError('');
    setNames([]);
    setSelectedName('');
    setSelectedMonth(0);
  }

  function backToName() {
    setStep('name');
    setError('');
    setSelectedMonth(0);
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

      {/* Indicador de etapas */}
      <div className="flex items-center gap-2 mb-6">
        {['Código', 'Identificação', 'Verificação'].map((label, i) => {
          const stepIndex = step === 'code' ? 0 : step === 'name' ? 1 : 2;
          const active = i === stepIndex;
          const done = i < stepIndex;
          return (
            <div key={label} className="flex items-center gap-2">
              <div className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full transition-colors ${
                active ? 'bg-primary-600 text-white' :
                done ? 'bg-dark-700 text-primary-400' :
                'bg-dark-800 text-dark-500'
              }`}>
                <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  active ? 'bg-white/20' : done ? 'bg-primary-500/20' : 'bg-dark-600'
                }`}>{i + 1}</span>
                {label}
              </div>
              {i < 2 && <div className={`w-4 h-px ${done || active ? 'bg-primary-600' : 'bg-dark-700'}`} />}
            </div>
          );
        })}
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
                onChange={(e) => { setCode(e.target.value.replace(/\D/g, '')); setError(''); }}
                onKeyDown={(e) => e.key === 'Enter' && handleCodeSubmit()}
                placeholder="••••"
                className="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-lg text-white text-center text-2xl tracking-[0.5em] placeholder-dark-600 focus:outline-none focus:border-primary-500 transition-colors"
              />
            </div>

            {error && <p className="text-sm text-red-400 mb-4 text-center">{error}</p>}

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
            <button onClick={backToCode} className="flex items-center gap-1.5 text-sm text-dark-400 hover:text-white mb-5 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Voltar
            </button>

            <h2 className="text-lg font-semibold text-white mb-1">Selecione seu nome</h2>
            <p className="text-sm text-dark-400 mb-5">Escolha o nome associado ao seu acesso.</p>

            <div className="space-y-2">
              {names.map((name) => (
                <button
                  key={name}
                  onClick={() => handleNameSelect(name)}
                  className="w-full text-left px-4 py-3 bg-dark-700 hover:bg-primary-600/20 border border-dark-600 hover:border-primary-500/50 rounded-lg text-white text-sm font-medium transition-colors"
                >
                  {name}
                </button>
              ))}
            </div>
          </>
        )}

        {/* Etapa 3 — Mês de aniversário */}
        {step === 'month' && (
          <>
            <button
              onClick={names.length > 1 ? backToName : backToCode}
              className="flex items-center gap-1.5 text-sm text-dark-400 hover:text-white mb-5 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Voltar
            </button>

            <h2 className="text-lg font-semibold text-white mb-1">Verificação final</h2>
            <p className="text-sm text-dark-400 mb-6">
              Olá, <span className="text-white font-medium">{selectedName.split(' ')[0]}</span>. Selecione o seu mês de aniversário.
            </p>

            <div className="mb-4">
              <label className="block text-xs font-medium text-dark-400 mb-2 uppercase tracking-wider">
                Mês de aniversário
              </label>
              <select
                value={selectedMonth}
                onChange={(e) => { setSelectedMonth(Number(e.target.value)); setError(''); }}
                className="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-lg text-white text-sm focus:outline-none focus:border-primary-500 transition-colors"
              >
                <option value={0}>Selecione o mês...</option>
                {MONTH_NAMES.slice(1).map((m, i) => (
                  <option key={m} value={i + 1}>{m}</option>
                ))}
              </select>
            </div>

            {error && <p className="text-sm text-red-400 mb-4 text-center">{error}</p>}

            <button
              onClick={handleMonthSubmit}
              disabled={selectedMonth === 0}
              className="w-full flex items-center justify-center gap-2 py-3 bg-primary-600 hover:bg-primary-500 disabled:bg-dark-700 disabled:text-dark-500 text-white font-semibold rounded-lg transition-colors"
            >
              <LogIn className="w-4 h-4" />
              Entrar
            </button>
          </>
        )}
      </div>
    </div>
  );
}
