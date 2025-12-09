import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { db } from '../services/dbService';

export const Login: React.FC = () => {
  const [isResetMode, setIsResetMode] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [pharmacyName, setPharmacyName] = useState('PharmaDash Admin');
  const [logoUrl, setLogoUrl] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await db.getSettings();
        if (settings.pharmacy.name) setPharmacyName(settings.pharmacy.name);
        if (settings.pharmacy.logoUrl) setLogoUrl(settings.pharmacy.logoUrl);
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    };
    loadSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      if (isResetMode) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin + '/reset-password',
        });
        if (error) throw error;
        setMessage('Instruções de recuperação enviadas para o seu email.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (error) throw error;
        navigate('/');
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao processar solicitação');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
        <div className="text-center mb-8">
          {logoUrl ? (
            <img src={logoUrl} alt="Logo" className="h-20 object-contain mx-auto mb-4" />
          ) : (
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xl mx-auto mb-4">
              {pharmacyName.charAt(0)}
            </div>
          )}
          <h1 className="text-2xl font-bold text-gray-800">{pharmacyName}</h1>
          <p className="text-gray-500">
            {isResetMode ? 'Recupere sua senha' : 'Faça login para acessar o painel'}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4">
            {error}
          </div>
        )}

        {message && (
          <div className="bg-green-50 text-green-600 p-3 rounded-lg text-sm mb-4">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="seu@email.com"
            />
          </div>

          {!isResetMode && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
              <input
                type="password"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="••••••••"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Processando...' : (isResetMode ? 'Enviar Instruções' : 'Entrar')}
          </button>
        </form>

        <div className="mt-6 text-center space-y-2">
          {!isResetMode ? (
            <button
              onClick={() => {
                setIsResetMode(true);
                setError('');
                setMessage('');
              }}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Esqueci minha senha
            </button>
          ) : (
            <button
              onClick={() => {
                setIsResetMode(false);
                setError('');
                setMessage('');
              }}
              className="text-sm text-gray-500 hover:text-gray-700 font-medium"
            >
              Voltar para o Login
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

