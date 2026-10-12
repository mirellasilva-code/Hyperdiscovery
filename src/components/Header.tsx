import React from 'react';
import { ActiveTab, UserRole } from '../types';
import { 
  RotateCcw, 
  SlidersHorizontal, 
  Radio, 
  CalendarRange,
  Sun,
  Moon
} from 'lucide-react';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onResetData: () => void;
  criticalAlertCount: number;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  userRole: UserRole;
  onChangeUserRole: (role: UserRole) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onResetData,
  criticalAlertCount,
  isDarkMode,
  onToggleDarkMode,
  userRole,
  onChangeUserRole,
}) => {
  return (
    <header className="border-b border-[#003859] bg-[#004A75] text-white shadow-md sticky top-0 z-40 transition-colors">
      <div className="max-w-[1560px] mx-auto px-4 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-4">
        
        {/* Zone 1: Official Tribanco Brand Identity */}
        <div className="flex items-center gap-3.5">
          {/* Logo Symbol with Cyan/Mint Gradient */}
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00D2B4] via-[#05B39A] to-[#10B981] flex items-center justify-center text-white shadow-md shadow-[#002D47]/40 shrink-0">
            <span className="font-extrabold text-2xl tracking-tighter leading-none select-none text-[#003859]">
              t
            </span>
          </div>

          {/* Wordmark and Slogan */}
          <div className="flex flex-col">
            <div className="flex items-center gap-2.5">
              <span className="font-extrabold text-2xl tracking-tight leading-none text-white font-sans lowercase">
                <span className="text-[#00D2B4]">t</span>ribanco
              </span>
              <span className="text-[11px] font-semibold text-[#00D2B4] tracking-wide border-l border-white/25 pl-2.5">
                Hub de Inteligência de Crédito
              </span>
            </div>
            <span className="text-xs text-white/90 font-medium tracking-tight mt-0.5">
              O banco do varejista.
            </span>
          </div>
        </div>

        {/* Zone 2: Primary Navigation Tabs */}
        <nav className="flex items-center gap-1 bg-[#003B5C] p-1 rounded-xl border border-[#002E47] shadow-inner">
          <button
            onClick={() => setActiveTab('farol')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'farol'
                ? 'bg-white text-[#004A75] shadow-xs font-bold'
                : 'text-white/80 hover:text-white hover:bg-white/10'
            }`}
            title="Monitoramento e Alertas em Tempo Real"
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Módulo Farol</span>
            {criticalAlertCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 text-[10px] font-bold bg-[#00D2B4] text-[#003859] rounded-full tabular-nums">
                {criticalAlertCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('radar')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'radar'
                ? 'bg-white text-[#004A75] shadow-xs font-bold'
                : 'text-white/80 hover:text-white hover:bg-white/10'
            }`}
            title="Motor Preditivo e Calibração por Filial"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Módulo Radar</span>
          </button>

          <button
            onClick={() => setActiveTab('historico')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'historico'
                ? 'bg-white text-[#004A75] shadow-xs font-bold'
                : 'text-white/80 hover:text-white hover:bg-white/10'
            }`}
            title="Evolução Mês a Mês das Safras e Inadimplência"
          >
            <CalendarRange className="w-3.5 h-3.5" />
            <span>Visão Histórica</span>
          </button>
        </nav>

        {/* Zone 3: Corporate SSO Authenticated Identity, Theme Toggle & Reset */}
        <div className="flex items-center gap-2.5 flex-wrap">
          
          {/* Identificação Corporativa SSO (Clique discreto sobre o nome alterna alçada para fins de teste na demo) */}
          <button
            type="button"
            onClick={() => onChangeUserRole(userRole === 'MANAGER' ? 'ANALYST' : 'MANAGER')}
            title="Sessão autenticada via SSO Corporativo Tribanco (Clique discreto para simular perfil sem alçada na demo)"
            className="flex items-center gap-2 bg-[#003B5C] hover:bg-[#002E47] border border-white/15 rounded-lg px-3 py-1.5 text-xs text-white transition-colors cursor-pointer select-none"
          >
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${
                userRole === 'MANAGER' ? 'bg-[#00D2B4]' : 'bg-amber-400'
              }`}
              aria-hidden="true"
            />
            <span className="font-semibold tracking-tight text-white">
              {userRole === 'MANAGER'
                ? '👤 Mariana Souza • Gerente de Área'
                : '👤 Rafael Mendes • Analista de Crédito'}
            </span>
          </button>

          {/* Dark / Light Mode Toggle */}
          <button
            onClick={onToggleDarkMode}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#003B5C] hover:bg-[#002E47] text-white border border-white/15 transition-all cursor-pointer"
            title={isDarkMode ? 'Alternar para Tema Claro Institucional' : 'Alternar para Tema Escuro (Conforto Visual)'}
          >
            {isDarkMode ? (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-300" />
                <span className="hidden sm:inline">Tema Claro</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-[#00D2B4]" />
                <span className="hidden sm:inline">Tema Escuro</span>
              </>
            )}
          </button>

          {/* Reset State Button */}
          <button
            onClick={onResetData}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors border border-transparent hover:border-white/20 cursor-pointer"
            title="Restaurar estado inicial do dashboard"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Resetar</span>
          </button>
        </div>

      </div>
    </header>
  );
};
