"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase, Profile, TIER_PRICES, TIER_DESCRIPTIONS } from '@/lib/supabase';

// Força renderização apenas no cliente (evita pré-render durante build)
export const dynamic = 'force-dynamic';

type TabType = 'pendentes' | 'aprovados' | 'todos';

// Emails autorizados como admin (adicione os seus aqui)
const ADMIN_EMAILS = [
  'lucas@pxeconomics.com.br',
  'peixonaut01@gmail.com',
  // Adicione outros emails admin aqui
];

export default function AdminClientes() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('pendentes');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  // Senha admin simples (em produção, use algo mais seguro)
  const ADMIN_PASSWORD = '@pxadmin2025';

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPassword === ADMIN_PASSWORD) {
      setIsAdmin(true);
      setShowPasswordPrompt(false);
      localStorage.setItem('px_admin_auth', 'true');
    } else {
      setMessage({ type: 'error', text: 'Senha incorreta' });
    }
  };

  useEffect(() => {
    // Verifica se já está autenticado
    const savedAuth = localStorage.getItem('px_admin_auth');
    if (savedAuth === 'true') {
      setIsAdmin(true);
      setShowPasswordPrompt(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) {
      fetchProfiles();
    }
  }, [activeTab, isAdmin]);

  const fetchProfiles = async () => {
    setLoading(true);
    
    let query = supabase.from('profiles').select('*').order('created_at', { ascending: false });
    
    if (activeTab === 'pendentes') {
      query = query.eq('approved', false);
    } else if (activeTab === 'aprovados') {
      query = query.eq('approved', true);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching profiles:', error);
      setMessage({ type: 'error', text: 'Erro ao carregar clientes' });
    } else {
      setProfiles(data || []);
    }
    
    setLoading(false);
  };

  const handleApprove = async (profileId: string) => {
    const { error } = await supabase
      .from('profiles')
      .update({ approved: true })
      .eq('id', profileId);
    
    if (error) {
      setMessage({ type: 'error', text: 'Erro ao aprovar cliente' });
    } else {
      setMessage({ type: 'success', text: 'Cliente aprovado com sucesso!' });
      fetchProfiles();
    }
  };

  const handleReject = async (profileId: string) => {
    if (!confirm('Tem certeza que deseja rejeitar este cliente? Isso irá deletar a conta.')) {
      return;
    }

    // First delete from profiles (will cascade to auth.users via trigger or manually)
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', profileId);
    
    if (error) {
      setMessage({ type: 'error', text: 'Erro ao rejeitar cliente' });
    } else {
      setMessage({ type: 'success', text: 'Cliente rejeitado' });
      fetchProfiles();
    }
  };

  const handleChangeTier = async (profileId: string, newTier: string) => {
    const { error } = await supabase
      .from('profiles')
      .update({ tier: newTier })
      .eq('id', profileId);
    
    if (error) {
      setMessage({ type: 'error', text: 'Erro ao alterar plano' });
    } else {
      setMessage({ type: 'success', text: 'Plano alterado com sucesso!' });
      fetchProfiles();
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Tela de senha
  if (showPasswordPrompt && !isAdmin) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4">
              Px
            </div>
            <h1 className="text-2xl font-bold text-white">Área Administrativa</h1>
            <p className="text-slate-400 mt-2">Digite a senha para acessar</p>
          </div>
          
          <form onSubmit={handlePasswordSubmit} className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
            {message && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/20 text-red-300 border border-red-500/30 text-sm">
                {message.text}
              </div>
            )}
            
            <div className="relative mb-4">
              <input
                type={showPassword ? "text" : "password"}
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="Senha administrativa"
                className="w-full px-4 py-3 pr-12 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
            
            <button
              type="submit"
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
            >
              Entrar
            </button>
          </form>
          
          <div className="mt-6 text-center">
            <Link href="/" className="text-slate-400 hover:text-white text-sm">
              ← Voltar ao site
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                Px
              </div>
              <span className="text-xl font-bold text-white">PX Economics</span>
            </Link>
            <span className="text-slate-500">|</span>
            <span className="text-slate-400">Admin - Clientes</span>
          </div>
          
          <div className="flex items-center gap-4">
            <Link
              href="/admin/projecoes"
              className="text-slate-400 hover:text-white text-sm transition-colors"
            >
              Projeções
            </Link>
            <button
              onClick={() => {
                localStorage.removeItem('px_admin_auth');
                setIsAdmin(false);
                setShowPasswordPrompt(true);
                setAdminPassword('');
              }}
              className="text-slate-400 hover:text-white text-sm transition-colors"
            >
              Sair do Admin
            </button>
            <Link
              href="/"
              className="text-slate-400 hover:text-white text-sm transition-colors"
            >
              Voltar ao site
            </Link>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-white mb-6">Gerenciar Clientes</h1>

        {/* Message */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              message.type === 'success'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'bg-red-500/20 text-red-300 border border-red-500/30'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {(['pendentes', 'aprovados', 'todos'] as TabType[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === tab
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {tab === 'pendentes' && '🕐 Pendentes'}
              {tab === 'aprovados' && '✅ Aprovados'}
              {tab === 'todos' && '📋 Todos'}
              {tab === 'pendentes' && profiles.length > 0 && activeTab === 'pendentes' && (
                <span className="ml-2 bg-amber-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                  {profiles.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
            <div className="text-slate-400 text-sm">Total de clientes</div>
            <div className="text-2xl font-bold text-white">{profiles.length}</div>
          </div>
          <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
            <div className="text-slate-400 text-sm">Plano Básico</div>
            <div className="text-2xl font-bold text-blue-400">
              {profiles.filter(p => p.tier === 'basico').length}
            </div>
          </div>
          <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
            <div className="text-slate-400 text-sm">Plano Avançado</div>
            <div className="text-2xl font-bold text-purple-400">
              {profiles.filter(p => p.tier === 'avancado').length}
            </div>
          </div>
          <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
            <div className="text-slate-400 text-sm">Plano Ultra</div>
            <div className="text-2xl font-bold text-amber-400">
              {profiles.filter(p => p.tier === 'ultra').length}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-slate-400">
              <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
              Carregando...
            </div>
          ) : profiles.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              Nenhum cliente encontrado
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-900/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Cliente
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Contato
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Plano
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Downloads
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Cadastro
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {profiles.map((profile) => (
                    <tr key={profile.id} className="hover:bg-slate-700/30">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${profile.approved ? 'bg-green-500' : 'bg-amber-500'}`} />
                          <div>
                            <div className="font-medium text-white">
                              {profile.full_name || 'Sem nome'}
                            </div>
                            <div className="text-sm text-slate-400">
                              {profile.company || 'Sem empresa'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm text-white">{profile.email}</div>
                        <div className="text-sm text-slate-400">{profile.phone || 'Sem telefone'}</div>
                      </td>
                      <td className="px-4 py-4">
                        <select
                          value={profile.tier}
                          onChange={(e) => handleChangeTier(profile.id, e.target.value)}
                          className="bg-slate-900 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500"
                        >
                          <option value="free">Free - {TIER_PRICES.free}</option>
                          <option value="basico">Básico - {TIER_PRICES.basico}</option>
                          <option value="avancado">Avançado - {TIER_PRICES.avancado}</option>
                          <option value="ultra">Ultra - {TIER_PRICES.ultra}</option>
                        </select>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-white">{profile.downloads_today} hoje</div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm text-slate-400">
                          {formatDate(profile.created_at)}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex gap-2">
                          {!profile.approved && (
                            <>
                              <button
                                onClick={() => handleApprove(profile.id)}
                                className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
                              >
                                Aprovar
                              </button>
                              <button
                                onClick={() => handleReject(profile.id)}
                                className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors"
                              >
                                Rejeitar
                              </button>
                            </>
                          )}
                          {profile.approved && (
                            <span className="text-green-400 text-sm">✓ Aprovado</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Tier info */}
        <div className="mt-8 grid md:grid-cols-4 gap-4">
          {(['free', 'basico', 'avancado', 'ultra'] as const).map((tier) => (
            <div key={tier} className="bg-slate-800 rounded-xl p-4 border border-slate-700">
              <div className="font-semibold text-white capitalize mb-1">{tier}</div>
              <div className="text-blue-400 text-sm mb-2">{TIER_PRICES[tier]}</div>
              <div className="text-slate-400 text-xs">{TIER_DESCRIPTIONS[tier]}</div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

