
import React from 'react';
import { useNavigate } from 'react-router-dom';

const Home: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#000814] p-6 text-white font-['Inter'] relative overflow-hidden">
      {/* Background Decorativo Animado */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-900/10 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-cyan-900/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="max-w-4xl w-full relative z-10">
        <div className="text-center mb-16">
          <div className="inline-block mb-6 px-6 py-2 rounded-full border border-blue-500/30 bg-blue-500/5 text-blue-400 text-[10px] font-black uppercase tracking-[0.4em] animate-bounce">
            TUPÃ Enterprise
          </div>
          <h1 className="text-7xl md:text-9xl font-black tracking-tighter mb-4 bg-gradient-to-b from-white via-white to-blue-500/30 bg-clip-text text-transparent">
            SELECT
          </h1>
          <p className="text-blue-200/30 text-[10px] font-bold uppercase tracking-[0.6em]">Acesse o sistema</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Botão 1: Gestor */}
          <button
            onClick={() => navigate('/manager')}
            className="group relative bg-white/[0.02] backdrop-blur-xl border border-white/5 rounded-[3rem] p-12 text-center hover:bg-white/[0.06] hover:border-blue-500/40 transition-all duration-500 shadow-2xl"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-[3rem]"></div>
            <div className="relative z-10">
              <div className="w-20 h-20 bg-blue-600/10 rounded-3xl flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition-transform duration-500 group-hover:bg-blue-600/20">
                <svg className="w-10 h-10 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                </svg>
              </div>
              <h2 className="text-3xl font-black text-white mb-4 tracking-tight uppercase">Gestor</h2>
              <p className="text-blue-200/40 text-[11px] font-bold uppercase tracking-[0.2em] mb-10">Painel Administrativo</p>
              <div className="inline-flex items-center text-blue-500 font-black text-[10px] uppercase tracking-widest border-b border-blue-500/0 group-hover:border-blue-500/100 transition-all pb-1">
                Entrar agora
                <svg className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg>
              </div>
            </div>
          </button>

          {/* Botão 2: Sites Demonstração */}
          <button
            onClick={() => navigate('/showcase')}
            className="group relative bg-white/[0.02] backdrop-blur-xl border border-white/5 rounded-[3rem] p-12 text-center hover:bg-white/[0.06] hover:border-cyan-400/40 transition-all duration-500 shadow-2xl"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-[3rem]"></div>
            <div className="relative z-10">
              <div className="w-20 h-20 bg-cyan-600/10 rounded-3xl flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition-transform duration-500 group-hover:bg-cyan-600/20">
                <svg className="w-10 h-10 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"/>
                </svg>
              </div>
              <h2 className="text-3xl font-black text-white mb-4 tracking-tight uppercase leading-none">Sites<br/>Demonstração</h2>
              <p className="text-cyan-200/40 text-[11px] font-bold uppercase tracking-[0.2em] mb-10">Catálogo de Projetos</p>
              <div className="inline-flex items-center text-cyan-400 font-black text-[10px] uppercase tracking-widest border-b border-cyan-400/0 group-hover:border-cyan-400/100 transition-all pb-1">
                Ver Projetos
                <svg className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg>
              </div>
            </div>
          </button>
        </div>

        <div className="mt-20 text-center opacity-20">
          <p className="text-white text-[9px] font-black uppercase tracking-[1em]">Enterprise Excellence • 2025</p>
        </div>
      </div>
    </div>
  );
};

export default Home;
