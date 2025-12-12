"use client";

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase, Profile, TIER_LIMITS } from '@/lib/supabase';
import { ThemeToggle } from '@/components/ThemeToggle';

// Categories and files for sidebar
const FILE_CATEGORIES = [
  {
    id: 'inflacao',
    name: 'Inflação',
    icon: '📊',
    files: [
      { name: 'IPCA Completo', file: 'ipca_completo.xlsx' },
      { name: 'IPCA-15 Completo', file: 'ipca15_completo.xlsx' },
      { name: 'Núcleos de Inflação', file: 'nucleos_inflacao.xlsx' },
      { name: 'Difusão IPCA', file: 'difusao_ipca.xlsx' },
    ],
  },
  {
    id: 'atividade',
    name: 'Atividade',
    icon: '📈',
    files: [
      { name: 'PIB Trimestral', file: 'pib_trimestral.xlsx' },
      { name: 'PIM', file: 'pim.xlsx' },
      { name: 'PMC', file: 'pmc.xlsx' },
      { name: 'PMS', file: 'pms.xlsx' },
      { name: 'IBC-Br', file: 'ibc_br.xlsx' },
    ],
  },
  {
    id: 'emprego',
    name: 'Emprego',
    icon: '💼',
    files: [
      { name: 'PNAD Contínua', file: 'pnad.xlsx' },
      { name: 'Caged', file: 'caged.xlsx' },
    ],
  },
  {
    id: 'fiscal',
    name: 'Fiscal',
    icon: '💰',
    files: [
      { name: 'Resultado Primário', file: 'resultado_primario.xlsx' },
      { name: 'Dívida Pública', file: 'divida.xlsx' },
    ],
  },
  {
    id: 'externo',
    name: 'Setor Externo',
    icon: '🌎',
    files: [
      { name: 'Câmbio', file: 'cambio.xlsx' },
      { name: 'Balança Comercial', file: 'balanca.xlsx' },
    ],
  },
];

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export default function ClienteDashboard() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: 'Olá! 👋 Sou o assistente de IA da PX Economics. Posso te ajudar com análises sobre inflação, atividade econômica, emprego, política fiscal e setor externo do Brasil. O que você gostaria de saber?'
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      router.push('/cliente');
      return;
    }

    // Try to get existing profile
    let { data: profileData, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();

    // If no profile exists, create one (for new users, especially Google OAuth)
    if (error || !profileData) {
      const newProfile = {
        id: session.user.id,
        email: session.user.email || '',
        full_name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || null,
        company: null,
        phone: null,
        tier: 'free' as const,
        approved: true, // Auto-approve all users
        downloads_today: 0,
        last_download_date: null,
      };

      const { data: createdProfile, error: createError } = await supabase
        .from('profiles')
        .upsert(newProfile)
        .select()
        .single();

      if (createError) {
        console.error('Error creating profile:', createError);
        // Still allow access with a default profile
        profileData = newProfile as Profile;
      } else {
        profileData = createdProfile;
      }
    }

    setProfile(profileData);
    setLoading(false);
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isTyping) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsTyping(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage }),
      });

      const data = await response.json();
      
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: data.response || 'Desculpe, não consegui processar sua pergunta. Tente novamente.'
      }]);
    } catch (error) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Desculpe, ocorreu um erro. Por favor, tente novamente.'
      }]);
    }

    setIsTyping(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/cliente');
  };

  const handleDownload = (fileName: string) => {
    // TODO: Implement download with limit check
    window.open(`/data/excel/${fileName}`, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  const firstName = profile?.full_name?.split(' ')[0] || profile?.email?.split('@')[0] || 'Usuário';

  return (
    <div className="h-screen bg-gray-50 dark:bg-slate-900 flex flex-col overflow-hidden">
      {/* Header */}
      <header data-dashboard="true" className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-4 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-gray-600 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
              Px
            </div>
            <span className="text-lg font-bold text-gray-900 dark:text-white hidden sm:block">PX Economics</span>
          </Link>
        </div>
        
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <div className="text-right hidden sm:block">
            <div className="text-gray-900 dark:text-white font-medium text-sm">{firstName}</div>
            <div className="text-xs text-gray-600 dark:text-slate-400">
              {profile?.tier === 'free' ? 'Plano Gratuito' : `Plano ${profile?.tier}`}
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white text-sm transition-colors"
          >
            Sair
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className={`${sidebarOpen ? 'w-64' : 'w-0'} bg-white dark:bg-slate-800 border-r border-gray-200 dark:border-slate-700 transition-all duration-300 overflow-hidden flex-shrink-0`}>
          <div className="w-64 h-full overflow-y-auto p-4">
            <div className="mb-4">
              <h3 className="text-xs font-semibold text-gray-600 dark:text-slate-400 uppercase tracking-wider mb-2">
                📁 Planilhas
              </h3>
              <div className="text-xs text-gray-500 dark:text-slate-500 mb-3">
                Downloads: {profile?.downloads_today || 0}/{TIER_LIMITS[profile?.tier as keyof typeof TIER_LIMITS] || 2}
              </div>
            </div>
            
            {FILE_CATEGORIES.map((category) => (
              <div key={category.id} className="mb-4">
                <div className="flex items-center gap-2 text-gray-700 dark:text-slate-300 text-sm font-medium mb-2">
                  <span>{category.icon}</span>
                  <span>{category.name}</span>
                </div>
                <div className="space-y-1 pl-6">
                  {category.files.map((file) => (
                    <button
                      key={file.file}
                      onClick={() => handleDownload(file.file)}
                      className="w-full text-left text-xs text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-700/50 px-2 py-1.5 rounded transition-colors truncate"
                    >
                      {file.name}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            {profile?.tier === 'free' && (
              <div className="mt-6 p-3 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-lg border border-amber-500/30">
                <div className="text-xs text-amber-800 dark:text-amber-200 font-medium mb-1">🚀 Upgrade</div>
                <div className="text-xs text-gray-700 dark:text-slate-300">Downloads ilimitados a partir de R$ 200/mês</div>
                <a
                  href="mailto:contato@pxeconomics.com.br?subject=Upgrade"
                  className="mt-2 block text-center text-xs bg-amber-500 hover:bg-amber-600 text-white py-1.5 rounded transition-colors"
                >
                  Solicitar
                </a>
              </div>
            )}
          </div>
        </aside>

        {/* Main Chat Area */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-200 border border-gray-200 dark:border-slate-700'
                  }`}
                >
                  {message.role === 'assistant' && (
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-5 h-5 bg-blue-600 rounded flex items-center justify-center text-white text-xs font-bold">
                        Px
                      </div>
                      <span className="text-xs text-gray-600 dark:text-slate-400">PX Assistant</span>
                    </div>
                  )}
                  <div 
                    className={`text-sm whitespace-pre-wrap prose prose-sm max-w-none ${
                      message.role === 'user' 
                        ? 'prose-invert' 
                        : 'prose-gray dark:prose-invert'
                    }`}
                    dangerouslySetInnerHTML={{ 
                      __html: message.content
                        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                        .replace(/\n/g, '<br/>')
                    }}
                  />
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-200 border border-gray-200 dark:border-slate-700 rounded-2xl px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 bg-blue-600 rounded flex items-center justify-center text-white text-xs font-bold">
                      Px
                    </div>
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-gray-400 dark:bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                      <span className="w-2 h-2 bg-gray-400 dark:bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                      <span className="w-2 h-2 bg-gray-400 dark:bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input */}
          <div className="p-4 border-t border-gray-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50">
            <div className="max-w-4xl mx-auto flex gap-3">
              <textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Pergunte sobre inflação, PIB, emprego, câmbio..."
                className="flex-1 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-600 rounded-xl px-4 py-3 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none text-sm"
                rows={1}
                disabled={isTyping}
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isTyping}
                className="px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 dark:disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-xl transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
            <p className="text-center text-xs text-gray-500 dark:text-slate-500 mt-2">
              IA treinada com dados econômicos da PX Economics
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
