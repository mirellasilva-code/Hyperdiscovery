import React from 'react';
import { PartnerStore, UserRole } from '../types';
import { HelpTooltip } from './HelpTooltip';
import { 
  X, 
  Lock, 
  Unlock,
  SlidersHorizontal, 
  AlertTriangle, 
  CheckCircle2, 
  User, 
  TrendingUp, 
  ScanFace,
  Clock,
  Copy,
  ShieldCheck
} from 'lucide-react';

interface StoreDrawerProps {
  store: PartnerStore | null;
  isOpen: boolean;
  onClose: () => void;
  onToggleBlockStore: (store: PartnerStore) => void;
  onNavigateToRadar: (store: PartnerStore) => void;
  userRole: UserRole;
  onRestrictedAttempt: () => void;
  isDarkMode?: boolean;
}

export const StoreDrawer: React.FC<StoreDrawerProps> = ({
  store,
  isOpen,
  onClose,
  onToggleBlockStore,
  onNavigateToRadar,
  userRole,
  onRestrictedAttempt,
  isDarkMode = false,
}) => {
  if (!isOpen || !store) return null;

  const isManager = userRole === 'MANAGER';

  const dailyPoints = store.dailyVolume && store.dailyVolume.length > 0
    ? store.dailyVolume
    : [
        { day: 'D-6', actual: 62, threshold: 65 },
        { day: 'D-5', actual: 68, threshold: 65 },
        { day: 'D-4', actual: 110, threshold: 65 },
        { day: 'D-3', actual: 240, threshold: 65 },
        { day: 'D-2', actual: 460, threshold: 65 },
        { day: 'Ontem', actual: 690, threshold: 65 },
        { day: 'Hoje (24h)', actual: 850, threshold: 65 },
      ];

  const normalDailyThreshold = dailyPoints[0]?.threshold || 65;
  const maxDailyVolume = Math.max(...dailyPoints.map((d) => Math.max(d.actual, d.threshold)), normalDailyThreshold * 2);

  // Forensic Fraud Indicators (specific for critical store or adapted for the inspected store)
  const isCriticalStore = store.status === 'CRITICAL' || store.id === 'store-rio';

  const forensicIndicators = [
    {
      icon: ScanFace,
      title: 'Biometria Facial',
      value: isCriticalStore ? '60% de falhas/recusas por inconsistência facial' : `${Math.max(12, Math.round(store.refusalRate * 0.85))}% de falhas/recusas por inconsistência facial`,
      detail: 'Tentativas de captura fora do padrão Liveness ou divergência com base oficial.',
      severity: isCriticalStore ? 'HIGH' : store.status === 'WARNING' ? 'MEDIUM' : 'LOW',
    },
    {
      icon: Clock,
      title: 'Horário de Envio',
      value: isCriticalStore
        ? 'Pico de injeção noturna entre 01h e 04h (indício de automação/robôs)'
        : 'Envios distribuídos dentro da janela comercial regular (08h às 20h)',
      detail: 'Monitoramento de cadência de submissão por token de promotor no PDV.',
      severity: isCriticalStore ? 'HIGH' : 'LOW',
    },
    {
      icon: Copy,
      title: 'Duplicidade Cadastral',
      value: isCriticalStore ? '82% de repetição de dados' : `${Math.max(5, Math.round(store.refusalRate * 0.4))}% de repetição de dados`,
      detail: 'Reutilização de mesmos aparelhos celulares, e-mails, endereços ou chaves Pix em propostas distintas.',
      severity: isCriticalStore ? 'HIGH' : store.status === 'WARNING' ? 'MEDIUM' : 'LOW',
    },
  ];

  const drawerSurface = isDarkMode
    ? 'bg-slate-900 border-slate-800 text-slate-100'
    : 'bg-white border-slate-200 text-slate-900';

  const cardSurface = isDarkMode
    ? 'bg-slate-800/80 border-slate-700 text-slate-100'
    : 'bg-white border-slate-200 text-slate-900';

  const mutedText = isDarkMode ? 'text-slate-400' : 'text-slate-500';

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <aside className={`relative w-full max-w-2xl border-l shadow-2xl flex flex-col h-full z-10 overflow-hidden transition-colors ${drawerSurface}`}>
        
        {/* Drawer Header in Official Petrol Blue */}
        <div className="p-5 border-b border-[#003859] bg-[#004A75] text-white flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-white/15 text-[#00D2B4] border border-white/20">
                {store.code}
              </span>
              <span className="text-xs text-white/80">CNPJ: {store.cnpjFicticio}</span>
              <span aria-hidden="true" className="text-white/40">·</span>
              <span className="text-xs text-white/80">{store.region}</span>
            </div>
            
            <h2 className="text-lg font-bold text-white flex items-center gap-2.5 flex-wrap">
              <span>{store.name}</span>
              {store.isBlocked ? (
                <span className="text-xs font-bold px-2.5 py-0.5 rounded bg-purple-900 text-purple-200 border border-purple-700 flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  Bloqueada / Em Auditoria
                </span>
              ) : store.status === 'CRITICAL' ? (
                <span className="text-xs font-bold px-2.5 py-0.5 rounded bg-rose-900 text-rose-100 border border-rose-700 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 text-rose-300" />
                  Alerta Crítico
                </span>
              ) : store.status === 'WARNING' ? (
                <span className="text-xs font-bold px-2.5 py-0.5 rounded bg-amber-900 text-amber-100 border border-amber-700">
                  Atenção
                </span>
              ) : (
                <span className="text-xs font-bold px-2.5 py-0.5 rounded bg-emerald-900 text-emerald-100 border border-emerald-700">
                  Saudável
                </span>
              )}
            </h2>
            
            <div className="flex items-center gap-2 mt-1.5 text-xs text-white/85">
              <User className="w-3.5 h-3.5 text-[#00D2B4]" />
              <span>Promotor Responsável: <strong className="text-white font-semibold">{store.promoterName}</strong></span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Fechar Raio-X"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Body */}
        <div className={`flex-1 overflow-y-auto p-5 space-y-5 ${isDarkMode ? 'bg-slate-950/40' : 'bg-slate-50/60'}`}>

          {/* Summary KPI Strip */}
          <div className="grid grid-cols-3 gap-3">
            <div className={`${cardSurface} border rounded-xl p-3.5 shadow-2xs`}>
              <span className={`text-[11px] block mb-1 font-medium ${mutedText}`}>Volume Submetido</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg font-extrabold font-mono tabular-nums">
                  {store.monthlyProposals.toLocaleString('pt-BR')}
                </span>
                <span className={`text-[10px] font-mono ${mutedText}`}>/ {store.expectedProposals.toLocaleString('pt-BR')}</span>
              </div>
              <span className={`text-[10px] font-mono font-bold ${
                store.monthlyProposals > store.expectedProposals * 1.5
                  ? isDarkMode ? 'text-rose-400' : 'text-rose-600'
                  : mutedText
              }`}>
                {Math.round(((store.monthlyProposals - store.expectedProposals) / store.expectedProposals) * 100)}% vs base histórica
              </span>
            </div>

            <div className={`${cardSurface} border rounded-xl p-3.5 shadow-2xs`}>
              <span className={`text-[11px] block mb-1 font-medium ${mutedText}`}>Taxa de Recusa</span>
              <div className="flex items-baseline gap-1">
                <span className={`text-lg font-extrabold font-mono tabular-nums ${
                  store.refusalRate > 50
                    ? isDarkMode ? 'text-rose-400' : 'text-rose-600'
                    : store.refusalRate > 30
                    ? isDarkMode ? 'text-amber-400' : 'text-amber-600'
                    : isDarkMode ? 'text-emerald-400' : 'text-emerald-600'
                }`}>
                  {store.refusalRate.toFixed(1).replace('.', ',')}%
                </span>
              </div>
              <span className={`text-[10px] font-mono ${mutedText}`}>
                Inconsistência Cadastral
              </span>
            </div>

            <div className={`${cardSurface} border rounded-xl p-3.5 shadow-2xs`}>
              <span className={`text-[11px] block mb-1 font-medium ${mutedText}`}>Risco Contábil PCLD</span>
              <div className="flex items-baseline gap-1">
                <span className={`text-lg font-extrabold font-mono tabular-nums ${isDarkMode ? 'text-[#00D2B4]' : 'text-[#004A75]'}`}>
                  R$ {store.estimatedPCLDRisk.toLocaleString('pt-BR')}
                </span>
              </div>
              <span className={`text-[10px] font-mono ${mutedText}`}>
                {store.isBlocked ? 'Capital Blindado' : 'Exposição em M1'}
              </span>
            </div>
          </div>

          {/* 1. Simple Daily Volume Bar Chart with Normal Cutoff Line */}
          <div className={`${cardSurface} border rounded-xl p-4 shadow-2xs`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5">
                <TrendingUp className={`w-4 h-4 ${isCriticalStore ? 'text-rose-500' : 'text-[#004A75]'}`} />
                <h3 className="text-xs font-bold tracking-wide">
                  Evolução de Volume Diário de Propostas (Últimos 7 Dias)
                </h3>
                <HelpTooltip
                  position="bottom"
                  text="Compara o volume diário enviado pela filial com a Linha de Corte Normal (média histórica diária esperada para o porte da loja)."
                />
              </div>
              <span className={`text-[11px] font-mono ${mutedText}`}>
                Corte Normal: <strong>{normalDailyThreshold}/dia</strong>
              </span>
            </div>

            {/* Bar Chart Container */}
            <div className="mt-4 pt-4">
              <div className={`grid grid-cols-7 gap-2.5 h-44 items-end border-b pb-2 relative ${
                isDarkMode ? 'border-slate-700' : 'border-slate-200'
              }`}>
                
                {/* Horizontal Normal Cutoff Line */}
                <div 
                  className="absolute left-0 right-0 border-t-2 border-dashed border-amber-500 z-10 flex items-center justify-end pr-1 pointer-events-none"
                  style={{
                    bottom: `${Math.min(85, Math.max(12, Math.round((normalDailyThreshold / maxDailyVolume) * 100)))}%`,
                  }}
                >
                  <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border font-bold -mt-5 ${
                    isDarkMode ? 'bg-amber-950 text-amber-300 border-amber-800' : 'bg-amber-50 text-amber-800 border-amber-300'
                  }`}>
                    Linha de Corte Normal ({normalDailyThreshold}/dia)
                  </span>
                </div>

                {dailyPoints.map((pt) => {
                  const heightPercent = Math.min(100, Math.max(8, Math.round((pt.actual / maxDailyVolume) * 100)));
                  const isSpike = pt.actual > pt.threshold * 2.5;
                  const isModerate = pt.actual > pt.threshold * 1.2 && !isSpike;

                  return (
                    <div key={pt.day} className="flex flex-col items-center h-full justify-end group">
                      <span className={`text-[10px] font-mono tabular-nums font-bold mb-1 ${
                        isSpike
                          ? isDarkMode ? 'text-rose-400' : 'text-rose-600'
                          : isModerate
                          ? isDarkMode ? 'text-amber-400' : 'text-amber-600'
                          : mutedText
                      }`}>
                        {pt.actual}
                      </span>

                      <div className={`w-full max-w-[38px] rounded-t-md relative overflow-hidden flex items-end h-full ${
                        isDarkMode ? 'bg-slate-900/70' : 'bg-slate-100'
                      }`}>
                        <div
                          className={`w-full transition-all duration-300 rounded-t-md ${
                            isSpike
                              ? 'bg-rose-500'
                              : isModerate
                              ? 'bg-amber-500'
                              : 'bg-[#004A75]'
                          }`}
                          style={{ height: `${heightPercent}%` }}
                        />
                      </div>

                      <span className={`text-[10px] mt-2 font-medium text-center truncate w-full ${mutedText}`}>
                        {pt.day}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className={`flex items-center justify-between text-[11px] mt-3 ${mutedText}`}>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-xs bg-[#004A75]"></span> Dentro da Normalidade
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-xs bg-amber-500"></span> Acima da Média
                </span>
                <span className="flex items-center gap-1.5 font-semibold text-rose-500">
                  <span className="w-2.5 h-2.5 rounded-xs bg-rose-500"></span> Pico Anômalo Severo
                </span>
              </div>
            </div>
          </div>

          {/* 2. Card de Indicadores Ofensores (Métricas Forenses de Fraude) */}
          <div className={`${cardSurface} border rounded-xl p-4 shadow-2xs`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <h3 className="text-xs font-bold tracking-wide">
                  Card de Indicadores Ofensores (Auditoria Forense do Lote)
                </h3>
                <HelpTooltip
                  position="top"
                  text="Métricas forenses extraídas automaticamente dos logs de biometria facial, timestamp de submissão e cruzamento cadastral do lote da filial."
                />
              </div>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded border font-semibold ${
                isDarkMode ? 'bg-slate-900 border-slate-700 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-600'
              }`}>
                3 Vetores Analisados
              </span>
            </div>

            <div className="space-y-2.5">
              {forensicIndicators.map((ind, idx) => {
                const IconComp = ind.icon;
                return (
                  <div
                    key={idx}
                    className={`p-3.5 rounded-lg border flex items-start justify-between gap-3 ${
                      isDarkMode ? 'bg-slate-900/70 border-slate-700/80' : 'bg-slate-50/80 border-slate-200'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 border ${
                        ind.severity === 'HIGH'
                          ? isDarkMode ? 'bg-rose-950/80 text-rose-300 border-rose-800' : 'bg-rose-50 text-rose-600 border-rose-200'
                          : ind.severity === 'MEDIUM'
                          ? isDarkMode ? 'bg-amber-950/80 text-amber-300 border-amber-800' : 'bg-amber-50 text-amber-600 border-amber-200'
                          : isDarkMode ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800' : 'bg-emerald-50 text-emerald-600 border-emerald-200'
                      }`}>
                        <IconComp className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold">{ind.title}:</span>
                          <span className={`text-xs font-semibold ${
                            ind.severity === 'HIGH'
                              ? isDarkMode ? 'text-rose-300' : 'text-rose-700'
                              : ind.severity === 'MEDIUM'
                              ? isDarkMode ? 'text-amber-300' : 'text-amber-700'
                              : isDarkMode ? 'text-emerald-300' : 'text-emerald-700'
                          }`}>
                            {ind.value}
                          </span>
                        </div>
                        <p className={`text-[11px] mt-1 leading-relaxed ${mutedText}`}>
                          {ind.detail}
                        </p>
                      </div>
                    </div>

                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded shrink-0 border ${
                      ind.severity === 'HIGH'
                        ? isDarkMode ? 'bg-rose-950 text-rose-300 border-rose-800' : 'bg-rose-50 text-rose-700 border-rose-200'
                        : ind.severity === 'MEDIUM'
                        ? isDarkMode ? 'bg-amber-950 text-amber-300 border-amber-800' : 'bg-amber-50 text-amber-700 border-amber-200'
                        : isDarkMode ? 'bg-emerald-950 text-emerald-300 border-emerald-800' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}>
                      {ind.severity === 'HIGH' ? 'Crítico' : ind.severity === 'MEDIUM' ? 'Atenção' : 'Normal'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3. Additional Store Attributes / Quarantine Audit Note */}
          {store.isBlocked && (
            <div className={`p-3.5 rounded-xl border flex flex-col gap-1.5 text-xs ${
              isDarkMode ? 'bg-purple-950/50 border-purple-800 text-purple-200' : 'bg-purple-50 border-purple-200 text-purple-900'
            }`}>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-purple-500 shrink-0" />
                <span>
                  <strong>Status de Quarentena Ativo:</strong> O promotor <strong>{store.promoterName}</strong> encontra-se bloqueado cautelarmente e o lote da filial foi congelado para preservar R$ {store.estimatedPCLDRisk.toLocaleString('pt-BR')} em PCLD.
                </span>
              </div>
              <div className="flex items-center gap-1.5 pl-6 text-[11px] font-semibold text-[#004A75] dark:text-[#00D2B4]">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Ação executada com alçada de Gerente de Área (Mariana Souza)</span>
              </div>
            </div>
          )}

        </div>

        {/* Drawer Action Footer with Express Governance Seal & Automatic SSO Authority Recognition */}
        <div className={`p-4 border-t flex flex-col gap-3 ${
          isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}>
          {/* Top Governance Bar: Compliance Seal + Automatic SSO Recognition Status */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold border ${
              isDarkMode
                ? 'bg-slate-800/90 border-slate-700 text-slate-200'
                : 'bg-white border-slate-200 text-slate-700 shadow-2xs'
            }`}>
              <span>🔒 Ação restrita a Gerentes de Área</span>
            </span>

            {isManager ? (
              <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold ${
                isDarkMode ? 'text-[#00D2B4]' : 'text-[#004A75]'
              }`}>
                <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                <span>
                  {store.isBlocked
                    ? 'Ação executada com alçada de Gerente de Área (Mariana Souza)'
                    : 'Alçada reconhecida via SSO: Gerente de Área (Mariana Souza)'}
                </span>
              </span>
            ) : (
              <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold ${
                isDarkMode ? 'text-amber-400' : 'text-amber-700'
              }`}>
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>Permissão insuficiente (Perfil Analista sem alçada de bloqueio)</span>
              </span>
            )}
          </div>

          {/* Bottom Action Row: Risk Summary + Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className={`text-xs ${mutedText}`}>
              <span>Risco PCLD na filial: </span>
              <strong className={`font-mono text-sm font-extrabold ${isDarkMode ? 'text-rose-400' : 'text-rose-600'}`}>
                R$ {store.estimatedPCLDRisk.toLocaleString('pt-BR')}
              </strong>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              {/* RBAC-Controlled Block / Unblock Button */}
              {!isManager ? (
                <div className="relative group">
                  <button
                    type="button"
                    onClick={onRestrictedAttempt}
                    aria-disabled="true"
                    className={`px-4 py-2 rounded-lg text-xs font-bold border flex items-center gap-1.5 transition-all cursor-not-allowed select-none opacity-75 ${
                      isDarkMode
                        ? 'bg-slate-800 text-slate-400 border-slate-700'
                        : 'bg-slate-200 text-slate-500 border-slate-300'
                    }`}
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>
                      {store.isBlocked
                        ? '🔒 Desbloquear Promotor & Liberar Lote'
                        : '🔒 Bloquear Promotor & Congelar Lote'}
                    </span>
                  </button>

                  {/* Hover RBAC Explanatory Tooltip */}
                  <div
                    role="tooltip"
                    className="pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 absolute bottom-full mb-2.5 right-0 w-80 p-3 rounded-xl bg-slate-900 text-white text-[11px] font-medium leading-relaxed shadow-xl border border-amber-500/50 z-50"
                  >
                    🔒 Ação restrita a Gerentes de Área: Permissão insuficiente para o perfil Analista de Crédito.
                  </div>
                </div>
              ) : !store.isBlocked ? (
                <button
                  type="button"
                  onClick={() => onToggleBlockStore(store)}
                  className="px-4 py-2 rounded-lg text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>🔒 Bloquear Promotor & Congelar Lote</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => onToggleBlockStore(store)}
                  className={`px-4 py-2 rounded-lg text-xs font-bold border shadow-xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer ${
                    isDarkMode
                      ? 'bg-emerald-950 text-emerald-200 border-emerald-700 hover:bg-emerald-900'
                      : 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                  }`}
                >
                  <Unlock className="w-3.5 h-3.5 text-emerald-500" />
                  <span>🔓 Desbloquear Promotor & Liberar Lote</span>
                </button>
              )}

              {/* Calibrate on Radar Button (Accessible for BOTH Analyst and Manager) */}
              <button
                type="button"
                onClick={() => onNavigateToRadar(store)}
                className="px-4 py-2 rounded-lg text-xs font-bold text-white bg-[#004A75] hover:bg-[#003859] shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-[#00D2B4]" />
                <span>🎛️ Calibrar no Radar</span>
              </button>
            </div>
          </div>
        </div>

      </aside>
    </div>
  );
};
