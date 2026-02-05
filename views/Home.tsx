import React from 'react';
import { useNavigate } from 'react-router-dom';

const Home: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#000814] p-6 text-white font-['Inter'] relative overflow-hidden">
      {/* Background Dinâmico */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-blue-600/10 rounded-full blur-[150px] animate-pulse"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[70%] h-[70%] bg-cyan-600/10 rounded-full blur-[150px] animate-pulse" style={{ animationDelay: '3s' }}></div>
      </div>

      <div className="max-w-5xl w-full relative z-10 flex flex-col items-center">
        <div className="text-center mb-20 animate-[fadeIn_1s]">
          <div className="inline-block mb-8 px-8 py-3 rounded-full border border-blue-500/30 bg-blue-500/5 text-blue-400 text-[11px] font-black uppercase tracking-[0.6em] animate-[bounce_3s_infinite]">
            TUPÃ Enterprise
          </div>
          <h1 className="text-6xl md:text-9xl font-black tracking-tighter mb-6 bg-gradient-to-b from-white via-white to-blue-500/40 bg-clip-text text-transparent leading-none">
            Acesso <br className="md:hidden" />
            <span className="text-blue-500">Premium</span>
          </h1>
          <p className="text-blue-200/20 text-xs font-bold uppercase tracking-[1em] mt-4">Selecione o seu perfil de entrada</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 w-full">
          {/* Botão 1: Gestor */}
          <button
            onClick={() => navigate('/manager')}
            className="group relative bg-white/[0.02] backdrop-blur-2xl border border-white/10 rounded-[4rem] p-14 text-center hover:bg-white/[0.05] hover:border-blue-500/50 transition-all duration-700 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] active:scale-[0.98]"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-[4rem]"></div>
            <div className="relative z-10">
              <div className="w-24 h-24 bg-blue-600/10 rounded-3xl flex items-center justify-center mx-auto mb-10 group-hover:scale-110 transition-transform duration-700 group-hover:bg-blue-600/30 border border-blue-500/20 shadow-2xl">
                <svg className="w-12 h-12 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                </svg>
              </div>
              <h2 className="text-4xl font-black text-white mb-6 tracking-tight uppercase">Gestor</h2>
              <p className="text-blue-200/30 text-[10px] font-black uppercase tracking-[0.3em] mb-12">Administração Central</p>
              <div className="inline-flex items-center text-blue-500 font-black text-[11px] uppercase tracking-[0.3em] border-b-2 border-blue-500/0 group-hover:border-blue-500/100 transition-all pb-2">
                Autenticar
                <svg className="ml-3 w-5 h-5 group-hover:translate-x-2 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg>
              </div>
            </div>
          </button>

          {/* Botão 2: Sites Demonstração */}
          <button
            onClick={() => navigate('/showcase')}
            className="group relative bg-white/[0.02] backdrop-blur-2xl border border-white/10 rounded-[4rem] p-14 text-center hover:bg-white/[0.05] hover:border-cyan-400/50 transition-all duration-700 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] active:scale-[0.98]"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-[4rem]"></div>
            <div className="relative z-10">
              <div className="w-24 h-24 bg-cyan-400/10 rounded-3xl flex items-center justify-center mx-auto mb-10 group-hover:scale-110 transition-transform duration-700 group-hover:bg-cyan-400/30 border border-cyan-400/20 shadow-2xl">
                <svg className="w-12 h-12 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"/>
                </svg>
              </div>
              <h2 className="text-4xl font-black text-white mb-6 tracking-tight uppercase leading-[0.9]">Showcase<br/><span className="text-3xl opacity-50">Projetos</span></h2>
              <p className="text-cyan-200/30 text-[10px] font-black uppercase tracking-[0.3em] mb-12">Catálogo Interativo</p>
              <div className="inline-flex items-center text-cyan-400 font-black text-[11px] uppercase tracking-[0.3em] border-b-2 border-cyan-400/0 group-hover:border-cyan-400/100 transition-all pb-2">
                Explorar Acervo
                <svg className="ml-3 w-5 h-5 group-hover:translate-x-2 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg>
              </div>
            </div>
          </button>
        </div>

        <div className="mt-24 text-center opacity-20 animate-pulse">
          <p className="text-white text-[10px] font-black uppercase tracking-[1.2em]">TUPÃ 2025 • High Performance Architecture</p>
        </div>
      </div>
    </div>
  );
};

export default Home;