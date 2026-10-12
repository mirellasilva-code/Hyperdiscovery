import React from 'react';
import { HelpTooltip } from './HelpTooltip';
import { 
  TrendingDown, 
  ShieldAlert, 
  Store
} from 'lucide-react';

interface KPIBannerProps {
  currentDefaultRate: number;
  preservedPCLD: number;
  totalStores: number;
  criticalAlertsCount: number;
  initialDefaultRate?: number;
  totalProposals?: number;
  periodLabel?: string;
  isDarkMode?: boolean;
}

export const KPIBanner: React.FC<KPIBannerProps> = ({
  currentDefaultRate,
  preservedPCLD,
  totalStores = 2000,
  criticalAlertsCount,
  initialDefaultRate = 7.2,
  totalProposals = 31550,
  periodLabel = 'Este Mês',
  isDarkMode = false,
}) => {
  const reductionDelta = (initialDefaultRate - currentDefaultRate).toFixed(1);

  const cardSurface = isDarkMode
    ? 'bg-slate-900 border-slate-800 text-slate-100'
    : 'bg-white border-slate-200 text-slate-900';

  const mutedText = isDarkMode ? 'text-slate-400' : 'text-slate-500';
  const labelText = isDarkMode ? 'text-slate-300' : 'text-slate-700';
  const institutionalBadge = isDarkMode
    ? 'bg-slate-800 text-[#00D2B4] border border-slate-700'
    : 'bg-slate-100 text-[#004A75] border border-slate-200';

  return (
    <div className="mb-6">
      {/* 5 Executive KPI Cards in Strictly Institutional Tribanco Palette */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        
        {/* KPI 1: Volume Total de Propostas */}
        <div className={`${cardSurface} border rounded-xl p-4 shadow-xs transition-colors`}>
          <div className="flex items-center justify-between text-xs mb-2">
            <span className={`font-semibold ${labelText} flex items-center`}>
              Volume de Propostas
              <HelpTooltip
                position="bottom"
                text="Somatória consolidada de propostas originadas na esteira digital e balcão nas 2.000 filiais parceiras no período selecionado."
              />
            </span>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${institutionalBadge}`}>
              {periodLabel}
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-2xl font-extrabold font-mono tabular-nums tracking-tight ${isDarkMode ? 'text-white' : 'text-[#004A75]'}`}>
              {totalProposals.toLocaleString('pt-BR')}
            </span>
            <span className={`text-xs font-medium ${mutedText}`}>Propostas</span>
          </div>
          <div className={`mt-2.5 flex items-center justify-between gap-1.5 text-[11px] ${mutedText}`}>
            <span>Conversão: <strong className={isDarkMode ? 'text-[#00D2B4]' : 'text-[#004A75]'}>8,0%</strong> (Digital)</span>
            <span aria-hidden="true">·</span>
            <span>2.000 filiais</span>
          </div>
        </div>

        {/* KPI 2: Inadimplência da Carteira */}
        <div className={`${cardSurface} border rounded-xl p-4 shadow-xs transition-colors`}>
          <div className="flex items-center justify-between text-xs mb-2">
            <span className={`font-semibold ${labelText} flex items-center`}>
              Inadimplência da Carteira
              <HelpTooltip
                position="bottom"
                text="Índice de atraso de primeira fatura (First Payment Default - FPD M1). A meta corporativa do Tribanco é manter o indicador abaixo de 5,0%."
              />
            </span>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${institutionalBadge}`}>
              Meta: &lt; 5,0%
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-2xl font-extrabold font-mono tabular-nums tracking-tight ${
              isDarkMode ? 'text-white' : 'text-[#004A75]'
            }`}>
              {currentDefaultRate.toFixed(1).replace('.', ',')}%
            </span>
            {parseFloat(reductionDelta) > 0 && (
              <span className={`text-xs font-mono tabular-nums font-bold ${isDarkMode ? 'text-[#00D2B4]' : 'text-[#004A75]'}`}>
                ↓ -{reductionDelta}%
              </span>
            )}
          </div>
          <div className={`mt-2.5 flex items-center gap-1.5 text-[11px] ${mutedText}`}>
            <span>Esteira Cartões Parceiros</span>
            <span aria-hidden="true">·</span>
            <span>Safra FPD M1</span>
          </div>
        </div>

        {/* KPI 3: PCLD Preservado Contábil */}
        <div className={`${cardSurface} border rounded-xl p-4 shadow-xs transition-colors`}>
          <div className="flex items-center justify-between text-xs mb-2">
            <span className={`font-semibold ${labelText} flex items-center`}>
              PCLD Preservado Contábil
              <HelpTooltip
                position="bottom"
                text="Provisão para Créditos de Liquidação Duvidosa (Res. CMN 4.966) preservada pelo bloqueio cautelar de lotes sob suspeita e calibração cirúrgica de score."
              />
            </span>
            <TrendingDown className="w-3.5 h-3.5 text-[#00D2B4]" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-2xl font-extrabold font-mono tabular-nums tracking-tight ${isDarkMode ? 'text-[#00D2B4]' : 'text-[#004A75]'}`}>
              R$ {preservedPCLD.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </span>
          </div>
          <div className={`mt-2.5 flex items-center gap-1.5 text-[11px] ${mutedText}`}>
            <span>Economia de Provisão</span>
            <span aria-hidden="true">·</span>
            <span>Res. CMN 4.966</span>
          </div>
        </div>

        {/* KPI 4: Lojas Ativas Monitoradas */}
        <div className={`${cardSurface} border rounded-xl p-4 shadow-xs transition-colors`}>
          <div className="flex items-center justify-between text-xs mb-2">
            <span className={`font-semibold ${labelText} flex items-center`}>
              Lojas Ativas Monitoradas
              <HelpTooltip
                position="bottom"
                text="Cobertura integral dos 2.000 pontos de venda parceiros da rede Tribanco, além de 1.056 leads aprovados rastreados para ativação da 1ª compra."
              />
            </span>
            <Store className={`w-3.5 h-3.5 ${isDarkMode ? 'text-[#00D2B4]' : 'text-[#004A75]'}`} />
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-2xl font-extrabold font-mono tabular-nums tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              {totalStores.toLocaleString('pt-BR')}
            </span>
            <span className={`text-xs font-medium ${mutedText}`}>PDVs na rede</span>
          </div>
          <div className={`mt-2.5 flex items-center gap-1.5 text-[11px] ${mutedText}`}>
            <span>100% Cobertura</span>
            <span aria-hidden="true">·</span>
            <span>Monitoramento Contínuo</span>
          </div>
        </div>

        {/* KPI 5: Alertas Críticos Ativos */}
        <div className={`${cardSurface} border rounded-xl p-4 shadow-xs transition-colors`}>
          <div className="flex items-center justify-between text-xs mb-2">
            <span className={`font-semibold ${labelText} flex items-center`}>
              Alertas Críticos Ativos
              <HelpTooltip
                position="bottom"
                text="Gatilho automático do Módulo Farol: acionado quando o volume de propostas supera +150% da média histórica ou a taxa de recusa cadastral ultrapassa 50%."
              />
            </span>
            <span className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded ${institutionalBadge}`}>
              <ShieldAlert className="w-3 h-3" />
              {criticalAlertsCount > 0 ? 'Monitoramento' : 'Estável'}
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-2xl font-extrabold font-mono tabular-nums tracking-tight ${
              isDarkMode ? 'text-white' : 'text-[#004A75]'
            }`}>
              {criticalAlertsCount}
            </span>
            <span className={`text-xs font-medium ${mutedText}`}>
              {criticalAlertsCount === 1 ? 'filial em desvio severo' : 'filiais em desvio severo'}
            </span>
          </div>
          <div className={`mt-2.5 flex items-center gap-1.5 text-[11px] ${mutedText}`}>
            <span>Regra Farol</span>
            <span aria-hidden="true">·</span>
            <span>Vol &gt;150% ou Recusa &gt;50%</span>
          </div>
        </div>

      </section>
    </div>
  );
};
