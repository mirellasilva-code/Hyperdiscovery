import React, { useState, useMemo } from 'react';
import { PartnerStore, HistoricalCohort } from '../types';
import { HelpTooltip } from './HelpTooltip';
import { exportToExcelCsv } from '../utils/exportExcel';
import { 
  Download, 
  TrendingDown, 
  BarChart3,
  Layers,
  Radio,
  SlidersHorizontal,
  Filter,
  ShieldCheck,
  ArrowUpRight,
  Lock
} from 'lucide-react';

interface HistoricalViewModuleProps {
  stores: PartnerStore[];
  cohorts: HistoricalCohort[];
  preservedPCLD: number;
  currentDefaultRate: number;
  onInspectStore: (store: PartnerStore) => void;
  onNavigateToRadar: (store: PartnerStore) => void;
  isDarkMode?: boolean;
  onExportToast?: (msg: string) => void;
}

type SubViewTab = 'trends' | 'panel360';

export const HistoricalViewModule: React.FC<HistoricalViewModuleProps> = ({
  stores,
  cohorts,
  preservedPCLD,
  currentDefaultRate,
  onInspectStore,
  onNavigateToRadar,
  isDarkMode = false,
  onExportToast,
}) => {
  const [subTab, setSubTab] = useState<SubViewTab>('trends');
  const [highlightedStoreId, setHighlightedStoreId] = useState<string>('ALL');

  const months = ['Mai/26', 'Jun/26', 'Jul/26', 'Ago/26', 'Set/26', 'Out/26'];

  // Distinct institutional & accessible chart colors per store for multi-store comparison
  const storeColors: Record<string, string> = {
    'store-rio': '#E11D48',      // Rose (Anomalia RJ)
    'store-recife': '#D97706',   // Amber (Recife)
    'store-salvador': '#0284C7', // Sky Blue (Salvador)
    'store-curitiba': '#00D2B4', // Tribanco Mint (Curitiba)
    'store-sp': '#004A75',       // Tribanco Petrol Blue (SP)
    'store-bh': '#4F46E5',       // Indigo (Minas)
    'store-poa': '#64748B',      // Slate (Porto Alegre)
  };

  // Monthly aggregated store volumes for Chart 1
  const monthlyStackedData = useMemo(() => {
    return months.map((m, mIdx) => {
      const storeEntries = stores.map((s) => ({
        id: s.id,
        code: s.code,
        name: s.name,
        proposals: s.monthlyHistory?.[mIdx]?.proposals || Math.round(s.monthlyProposals * 0.8),
        defaultRate: s.monthlyHistory?.[mIdx]?.defaultRate || s.defaultRate,
      }));
      const total = storeEntries.reduce((acc, curr) => acc + curr.proposals, 0);
      return {
        month: m,
        total,
        stores: storeEntries,
      };
    });
  }, [stores]);

  const maxMonthlyStoreTotal = useMemo(() => {
    if (highlightedStoreId === 'ALL') {
      return Math.max(...monthlyStackedData.map((d) => d.total), 22000);
    }
    const target = stores.find((s) => s.id === highlightedStoreId);
    if (!target) return 15000;
    return Math.max(...target.monthlyHistory.map((h) => h.proposals), 2500);
  }, [monthlyStackedData, highlightedStoreId, stores]);

  // Export 360° Executive Report (Consolidating Farol + Radar + Funnel + 6-Month Evolution)
  const handleExport360Report = () => {
    const headers = [
      'Código Filial',
      'Filial Parceira',
      'Região / UF',
      'Promotor Responsável',
      'Módulo Farol - Status',
      'Módulo Farol - Bloqueio Cautelar',
      'Volume Acumulado 6 Meses',
      'Volume Outubro/26',
      'Taxa de Recusa (%)',
      'Módulo Radar - Score Vigente (pts)',
      'Módulo Radar - Score Recomendado/Homologado (pts)',
      'Inadimplência Maio/26 (%)',
      'Inadimplência Outubro/26 (%)',
      'Risco / Economia PCLD (R$)',
      'Funil Repescagem - Conversão Digital (%)',
    ];

    const rows = stores.map((s) => {
      const sixMonthTotal = s.monthlyHistory.reduce((acc, h) => acc + h.proposals, 0);
      const mayDefault = s.monthlyHistory[0]?.defaultRate ?? s.defaultRate;
      const octDefault = s.defaultRate;
      const farolStatus = s.isBlocked
        ? 'CONGELADA / EM AUDITORIA'
        : s.status === 'CRITICAL'
        ? 'DESVIO CRÍTICO'
        : s.status === 'WARNING'
        ? 'MONITORAMENTO'
        : 'SAUDÁVEL';

      return [
        s.code,
        s.name,
        s.region,
        s.promoterName,
        farolStatus,
        s.isBlocked ? 'SIM (Lote Retido)' : 'NÃO',
        sixMonthTotal,
        s.monthlyProposals,
        s.refusalRate.toFixed(1).replace('.', ','),
        s.currentScoreThreshold,
        s.calibratedScore || s.recommendedScoreThreshold,
        mayDefault.toFixed(1).replace('.', ','),
        octDefault.toFixed(1).replace('.', ','),
        s.estimatedPCLDRisk,
        '8,0%',
      ];
    });

    exportToExcelCsv('Tribanco_Relatorio_Executivo_360_Consolidado.csv', headers, rows);
    if (onExportToast) {
      onExportToast('Relatório Executivo 360° Consolidado (Farol + Radar + Funil + Histórico) exportado para Excel (.csv).');
    }
  };

  const panelBg = isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900';
  const subCardBg = isDarkMode ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-50 border-slate-200';
  const mutedText = isDarkMode ? 'text-slate-400' : 'text-slate-500';

  // SVG Line Chart Helper for Default Rate Trajectory
  const renderDefaultCurveSvg = () => {
    const width = 640;
    const height = 210;
    const padLeft = 36;
    const padRight = 24;
    const padTop = 20;
    const padBottom = 28;
    const plotW = width - padLeft - padRight;
    const plotH = height - padTop - padBottom;
    const maxRate = 16.0;

    const getX = (idx: number) => padLeft + (idx / (months.length - 1)) * plotW;
    const getY = (rate: number) => padTop + plotH - Math.min(1, Math.max(0, rate / maxRate)) * plotH;

    const targetY = getY(5.0);

    const visibleStores =
      highlightedStoreId === 'ALL'
        ? stores
        : stores.filter((s) => s.id === highlightedStoreId);

    return (
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-52 overflow-visible">
        {/* Horizontal Grid Lines */}
        {[4, 8, 12, 16].map((val) => {
          const y = getY(val);
          return (
            <g key={val}>
              <line
                x1={padLeft}
                y1={y}
                x2={width - padRight}
                y2={y}
                stroke={isDarkMode ? '#1e293b' : '#f1f5f9'}
                strokeWidth="1"
              />
              <text
                x={padLeft - 6}
                y={y + 3}
                textAnchor="end"
                className="text-[9px] font-mono fill-slate-400"
              >
                {val}%
              </text>
            </g>
          );
        })}

        {/* Target Line 5.0% */}
        <line
          x1={padLeft}
          y1={targetY}
          x2={width - padRight}
          y2={targetY}
          stroke="#00D2B4"
          strokeWidth="1.5"
          strokeDasharray="4 4"
        />
        <text
          x={width - padRight}
          y={targetY - 5}
          textAnchor="end"
          className="text-[9px] font-mono font-bold fill-[#00D2B4]"
        >
          Meta Corporativa &lt; 5,0%
        </text>

        {/* Store Lines */}
        {visibleStores.map((s) => {
          const color = storeColors[s.id] || '#004A75';
          const points = s.monthlyHistory.map((h, i) => `${getX(i)},${getY(h.defaultRate)}`).join(' ');
          return (
            <g key={s.id}>
              <polyline
                fill="none"
                stroke={color}
                strokeWidth={highlightedStoreId === s.id ? '3' : '2'}
                points={points}
              />
              {s.monthlyHistory.map((h, i) => (
                <circle
                  key={`${s.id}-${i}`}
                  cx={getX(i)}
                  cy={getY(h.defaultRate)}
                  r={highlightedStoreId === s.id ? 4 : 3}
                  fill={color}
                >
                  <title>{`${s.name} (${h.month}): ${h.defaultRate.toFixed(1).replace('.', ',')}%`}</title>
                </circle>
              ))}
            </g>
          );
        })}

        {/* X Axis Month Labels */}
        {months.map((m, i) => (
          <text
            key={m}
            x={getX(i)}
            y={height - 6}
            textAnchor="middle"
            className="text-[10px] font-mono fill-slate-400"
          >
            {m}
          </text>
        ))}
      </svg>
    );
  };

  return (
    <div className="space-y-5">
      
      {/* Top Bar: Internal Sub-Tab Selector ("Gráficos de Tendência" vs "Painel de Controle 360°") & Export 360° Button */}
      <div className={`${panelBg} border rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-xs transition-colors`}>
        <div className="flex flex-wrap items-center gap-3">
          {/* Sub-tab Segmented Control */}
          <div className={`flex items-center p-1 rounded-lg border ${
            isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-100 border-slate-200'
          }`}>
            <button
              onClick={() => setSubTab('trends')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                subTab === 'trends'
                  ? 'bg-[#004A75] text-white shadow-xs font-bold'
                  : isDarkMode ? 'text-slate-300 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Gráficos de Tendência (Multi-Filial)</span>
            </button>

            <button
              onClick={() => setSubTab('panel360')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                subTab === 'panel360'
                  ? 'bg-[#004A75] text-white shadow-xs font-bold'
                  : isDarkMode ? 'text-slate-300 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-[#00D2B4]" />
              <span>Painel de Controle 360°</span>
            </button>
          </div>

          {/* Store Highlighter Filter (for Trends view) */}
          {subTab === 'trends' && (
            <div className="flex items-center gap-2 text-xs">
              <span className={`font-semibold hidden sm:inline ${mutedText}`}>Filtrar Filial:</span>
              <select
                value={highlightedStoreId}
                onChange={(e) => setHighlightedStoreId(e.target.value)}
                className={`border rounded-lg px-2.5 py-1.5 text-xs font-semibold cursor-pointer focus:outline-none ${
                  isDarkMode
                    ? 'bg-slate-800 border-slate-700 text-slate-100'
                    : 'bg-slate-50 border-slate-200 text-[#004A75]'
                }`}
              >
                <option value="ALL">Todas as Filiais Comparadas ({stores.length})</option>
                {stores.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.code} - {s.name} ({s.uf})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Highlighted Executive 360 Export Button */}
        <button
          onClick={handleExport360Report}
          className="px-4 py-2 rounded-lg text-xs font-bold text-white bg-[#004A75] hover:bg-[#003859] shadow-xs flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
        >
          <Download className="w-3.5 h-3.5 text-[#00D2B4]" />
          <span>📥 Exportar Relatório Executivo 360° (Excel)</span>
        </button>
      </div>

      {/* =====================================================================
          SUB-VIEW 1: GRÁFICOS DE TENDÊNCIA & GRID VISUAL RÁPIDO DAS FILIAIS
         ===================================================================== */}
      {subTab === 'trends' && (
        <div className="space-y-5">
          
          {/* Two Interactive Multi-Store Charts (Maio a Outubro) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            
            {/* 1. Gráfico de Volumetria de Propostas por Filial (Maio a Outubro) */}
            <div className={`lg:col-span-6 ${panelBg} border rounded-xl p-5 shadow-xs transition-colors`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1.5">
                  <BarChart3 className={`w-4 h-4 ${isDarkMode ? 'text-[#00D2B4]' : 'text-[#004A75]'}`} />
                  <h3 className="text-xs font-bold">
                    Volumetria de Propostas por Filial (Maio a Outubro)
                  </h3>
                  <HelpTooltip
                    position="top"
                    text="Comparativo mês a mês do volume de propostas originadas por filial parceira. Permite identificar visualmente o salto anômalo da filial Rio de Janeiro em Setembro/Outubro."
                  />
                </div>
                <span className={`text-[10px] font-mono ${mutedText}`}>
                  Últimos 6 Meses
                </span>
              </div>

              <div className="mt-4 pt-2">
                <div className={`grid grid-cols-6 gap-3 h-52 items-end border-b pb-2 ${
                  isDarkMode ? 'border-slate-800' : 'border-slate-200'
                }`}>
                  {monthlyStackedData.map((mData) => {
                    const displayStores =
                      highlightedStoreId === 'ALL'
                        ? mData.stores
                        : mData.stores.filter((st) => st.id === highlightedStoreId);
                    const monthSum = displayStores.reduce((a, b) => a + b.proposals, 0);
                    const totalHeightPct = Math.min(100, Math.max(10, Math.round((monthSum / maxMonthlyStoreTotal) * 100)));

                    return (
                      <div key={mData.month} className="flex flex-col items-center h-full justify-end">
                        <span className={`text-[10px] font-mono tabular-nums font-bold mb-1 ${
                          isDarkMode ? 'text-slate-200' : 'text-slate-800'
                        }`}>
                          {monthSum >= 1000
                            ? `${(monthSum / 1000).toFixed(1).replace('.', ',')}k`
                            : monthSum}
                        </span>

                        <div className={`w-full max-w-[44px] rounded-t-md flex flex-col justify-end overflow-hidden h-full ${
                          isDarkMode ? 'bg-slate-800/60' : 'bg-slate-100'
                        }`}>
                          <div
                            style={{ height: `${totalHeightPct}%` }}
                            className="w-full flex flex-col justify-end rounded-t-md overflow-hidden transition-all duration-300"
                          >
                            {displayStores.map((st) => {
                              const sharePct = Math.max(6, Math.round((st.proposals / (monthSum || 1)) * 100));
                              return (
                                <div
                                  key={st.id}
                                  style={{
                                    height: `${sharePct}%`,
                                    backgroundColor: storeColors[st.id] || '#004A75',
                                  }}
                                  className="w-full border-b border-white/15 last:border-none transition-opacity hover:opacity-85"
                                  title={`${st.name} (${mData.month}): ${st.proposals.toLocaleString('pt-BR')} propostas`}
                                />
                              );
                            })}
                          </div>
                        </div>

                        <span className={`text-[10px] font-mono mt-2 font-semibold ${mutedText}`}>
                          {mData.month}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Store Legend */}
                <div className="flex flex-wrap items-center gap-3 mt-3 text-[10px]">
                  {stores.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setHighlightedStoreId(highlightedStoreId === s.id ? 'ALL' : s.id)}
                      className={`flex items-center gap-1.5 cursor-pointer transition-opacity ${
                        highlightedStoreId !== 'ALL' && highlightedStoreId !== s.id ? 'opacity-35' : 'opacity-100 font-semibold'
                      }`}
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-xs shrink-0"
                        style={{ backgroundColor: storeColors[s.id] || '#004A75' }}
                      />
                      <span>{s.code} ({s.uf})</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 2. Gráfico da Curva de Inadimplência por Filial */}
            <div className={`lg:col-span-6 ${panelBg} border rounded-xl p-5 shadow-xs transition-colors`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1.5">
                  <TrendingDown className="w-4 h-4 text-[#00D2B4]" />
                  <h3 className="text-xs font-bold">
                    Curva de Inadimplência por Filial (Trajetória FPD M1)
                  </h3>
                  <HelpTooltip
                    position="top"
                    text="Mostra a evolução da taxa de inadimplência de cada filial em direção à meta corporativa de < 5,0%. Passe o mouse sobre os pontos ou clique na legenda para isolar uma filial."
                  />
                </div>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded border font-semibold ${
                  isDarkMode ? 'bg-slate-800 text-[#00D2B4] border-slate-700' : 'bg-slate-100 text-[#004A75] border-slate-200'
                }`}>
                  Meta &lt; 5,0%
                </span>
              </div>

              <div className="mt-2">
                {renderDefaultCurveSvg()}
              </div>
            </div>

          </div>

          {/* 3. Grid Visual Rápido das Filiais (Sparkline Cards Side-by-Side) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h3 className={`text-xs font-bold flex items-center gap-1.5 ${isDarkMode ? 'text-slate-200' : 'text-[#004A75]'}`}>
                <span>Grid Visual Rápido das Filiais Parceiras (Comparativo Instantâneo)</span>
                <HelpTooltip
                  position="right"
                  text="Visão executiva lado a lado com mini-gráfico de tendência (sparkline), volume acumulado nos 6 meses e taxa de inadimplência atual."
                />
              </h3>
              <span className={`text-[11px] ${mutedText}`}>
                Clique em uma filial para abrir o Raio-X ou calibrar no Radar
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {stores.map((s) => {
                const sixMonthVolume = s.monthlyHistory.reduce((acc, h) => acc + h.proposals, 0);
                const firstDef = s.monthlyHistory[0]?.defaultRate ?? s.defaultRate;
                const deltaDef = Number((s.defaultRate - firstDef).toFixed(1));
                const sparkColor = storeColors[s.id] || '#004A75';

                // Sparkline SVG points
                const maxP = Math.max(...s.monthlyHistory.map((h) => h.proposals), 100);
                const minP = Math.min(...s.monthlyHistory.map((h) => h.proposals), 0);
                const sparkPoints = s.monthlyHistory
                  .map((h, i) => {
                    const x = (i / (s.monthlyHistory.length - 1)) * 110;
                    const y = 32 - ((h.proposals - minP) / (maxP - minP || 1)) * 26;
                    return `${x},${y}`;
                  })
                  .join(' ');

                return (
                  <div
                    key={s.id}
                    className={`${panelBg} border rounded-xl p-4 shadow-xs hover:border-[#004A75] transition-all flex flex-col justify-between`}
                  >
                    <div>
                      {/* Top Header */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <span className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded ${
                            isDarkMode ? 'bg-slate-800 text-[#00D2B4]' : 'bg-slate-100 text-[#004A75]'
                          }`}>
                            {s.code} · {s.uf}
                          </span>
                          <h4 className="text-xs font-bold mt-1.5 line-clamp-1" title={s.name}>
                            {s.name}
                          </h4>
                        </div>

                        {/* Sparkline Mini-Chart */}
                        <div className="w-28 h-9 shrink-0 flex items-center justify-end">
                          <svg viewBox="0 0 115 36" className="w-28 h-9 overflow-visible">
                            <polyline
                              fill="none"
                              stroke={sparkColor}
                              strokeWidth="2.2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              points={sparkPoints}
                            />
                          </svg>
                        </div>
                      </div>

                      {/* Key Figures */}
                      <div className={`grid grid-cols-2 gap-2 pt-2.5 mt-2 border-t text-xs ${
                        isDarkMode ? 'border-slate-800' : 'border-slate-100'
                      }`}>
                        <div>
                          <span className={`text-[10px] block ${mutedText}`}>Volume Acumulado (6m)</span>
                          <span className="font-mono tabular-nums font-extrabold text-sm">
                            {sixMonthVolume.toLocaleString('pt-BR')}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className={`text-[10px] block ${mutedText}`}>Inadimplência Atual</span>
                          <div className="flex items-baseline justify-end gap-1">
                            <span className={`font-mono tabular-nums font-extrabold text-sm ${
                              isDarkMode ? 'text-white' : 'text-[#004A75]'
                            }`}>
                              {s.defaultRate.toFixed(1).replace('.', ',')}%
                            </span>
                            <span className={`text-[10px] font-mono ${mutedText}`}>
                              ({deltaDef > 0 ? `+${deltaDef}` : deltaDef}%)
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Quick Action Footer */}
                    <div className={`flex items-center justify-between gap-2 mt-3 pt-2.5 border-t text-[11px] ${
                      isDarkMode ? 'border-slate-800' : 'border-slate-100'
                    }`}>
                      <button
                        onClick={() => onInspectStore(s)}
                        className={`font-semibold hover:underline cursor-pointer ${
                          isDarkMode ? 'text-slate-300' : 'text-slate-600'
                        }`}
                      >
                        Abrir Raio-X
                      </button>
                      <button
                        onClick={() => onNavigateToRadar(s)}
                        className={`font-bold flex items-center gap-0.5 hover:underline cursor-pointer ${
                          isDarkMode ? 'text-[#00D2B4]' : 'text-[#004A75]'
                        }`}
                      >
                        <span>Calibrar Score ({s.calibratedScore || s.currentScoreThreshold})</span>
                        <ArrowUpRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}

      {/* =====================================================================
          SUB-VIEW 2: PAINEL DE CONTROLE 360° (VISÃO EXECUTIVA CONSOLIDADA)
         ===================================================================== */}
      {subTab === 'panel360' && (
        <div className="space-y-5">
          
          {/* 3 Pillars Consolidation Row: 1. Farol | 2. Radar | 3. Funil */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            
            {/* Pillar 1: Métricas do Farol */}
            <div className={`${panelBg} border rounded-xl p-5 shadow-xs flex flex-col justify-between`}>
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold flex items-center gap-2 text-[#004A75] dark:text-[#00D2B4]">
                    <Radio className="w-4 h-4" />
                    1. Consolidado Módulo Farol
                  </span>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${subCardBg}`}>
                    Prevenção de Fraude
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 my-3">
                  <div className={`p-3 rounded-lg border ${subCardBg}`}>
                    <span className={`text-[10px] block ${mutedText}`}>Anomalias Barradas</span>
                    <span className="text-xl font-extrabold font-mono tabular-nums">
                      12.000+
                    </span>
                    <span className={`text-[10px] block mt-0.5 ${mutedText}`}>propostas atípicas</span>
                  </div>
                  <div className={`p-3 rounded-lg border ${subCardBg}`}>
                    <span className={`text-[10px] block ${mutedText}`}>Filiais em Risco Severo</span>
                    <span className="text-xl font-extrabold font-mono tabular-nums">
                      {stores.filter((s) => s.status === 'CRITICAL').length} PDVs
                    </span>
                    <span className={`text-[10px] block mt-0.5 ${mutedText}`}>
                      {stores.filter((s) => s.isBlocked).length} com lote congelado
                    </span>
                  </div>
                </div>
              </div>

              <div className={`text-xs pt-3 border-t flex items-center justify-between ${
                isDarkMode ? 'border-slate-800' : 'border-slate-100'
              }`}>
                <span className={mutedText}>PCLD Blindado Contábil:</span>
                <strong className={`font-mono text-sm ${isDarkMode ? 'text-[#00D2B4]' : 'text-[#004A75]'}`}>
                  R$ {preservedPCLD.toLocaleString('pt-BR')}
                </strong>
              </div>
            </div>

            {/* Pillar 2: Métricas do Radar */}
            <div className={`${panelBg} border rounded-xl p-5 shadow-xs flex flex-col justify-between`}>
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold flex items-center gap-2 text-[#004A75] dark:text-[#00D2B4]">
                    <SlidersHorizontal className="w-4 h-4" />
                    2. Consolidado Módulo Radar
                  </span>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${subCardBg}`}>
                    Política de Crédito
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 my-3">
                  <div className={`p-3 rounded-lg border ${subCardBg}`}>
                    <span className={`text-[10px] block ${mutedText}`}>Réguas Homologadas</span>
                    <span className="text-xl font-extrabold font-mono tabular-nums">
                      {stores.filter((s) => s.isCalibrated || s.status === 'HEALTHY').length} / {stores.length}
                    </span>
                    <span className={`text-[10px] block mt-0.5 ${mutedText}`}>filiais calibradas</span>
                  </div>
                  <div className={`p-3 rounded-lg border ${subCardBg}`}>
                    <span className={`text-[10px] block ${mutedText}`}>Inadimplência Contida</span>
                    <span className="text-xl font-extrabold font-mono tabular-nums">
                      {currentDefaultRate.toFixed(1).replace('.', ',')}%
                    </span>
                    <span className={`text-[10px] block mt-0.5 ${mutedText}`}>vs 7,2% inicial</span>
                  </div>
                </div>
              </div>

              <div className={`text-xs pt-3 border-t flex items-center justify-between ${
                isDarkMode ? 'border-slate-800' : 'border-slate-100'
              }`}>
                <span className={mutedText}>Corte Médio de Segurança:</span>
                <strong className="font-mono text-sm">585 pts (Serasa)</strong>
              </div>
            </div>

            {/* Pillar 3: Métricas do Funil & Repescagem */}
            <div className={`${panelBg} border rounded-xl p-5 shadow-xs flex flex-col justify-between`}>
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold flex items-center gap-2 text-[#004A75] dark:text-[#00D2B4]">
                    <Filter className="w-4 h-4" />
                    3. Consolidado Funil &amp; Repescagem
                  </span>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${subCardBg}`}>
                    Ativação 1ª Compra
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 my-3">
                  <div className={`p-3 rounded-lg border ${subCardBg}`}>
                    <span className={`text-[10px] block ${mutedText}`}>Leads em Repescagem</span>
                    <span className="text-xl font-extrabold font-mono tabular-nums">
                      1.056
                    </span>
                    <span className={`text-[10px] block mt-0.5 ${mutedText}`}>aprovados sem 1ª compra</span>
                  </div>
                  <div className={`p-3 rounded-lg border ${subCardBg}`}>
                    <span className={`text-[10px] block ${mutedText}`}>Conversão Digital</span>
                    <span className="text-xl font-extrabold font-mono tabular-nums">
                      8,0%
                    </span>
                    <span className={`text-[10px] block mt-0.5 ${mutedText}`}>2.524 cartões ativos/mês</span>
                  </div>
                </div>
              </div>

              <div className={`text-xs pt-3 border-t flex items-center justify-between ${
                isDarkMode ? 'border-slate-800' : 'border-slate-100'
              }`}>
                <span className={mutedText}>Potencial de Ativação Limpa:</span>
                <strong className={`font-mono text-sm ${isDarkMode ? 'text-[#00D2B4]' : 'text-[#004A75]'}`}>
                  R$ 500.000
                </strong>
              </div>
            </div>

          </div>

          {/* Executive Decision Matrix across all Partner Branches */}
          <div className={`${panelBg} border rounded-xl p-5 shadow-xs`}>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <div>
                <h3 className="text-xs font-bold flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#00D2B4]" />
                  <span>Visão Consolidada da Carteira por Filial para Tomada de Decisão (Diretoria)</span>
                </h3>
              </div>
              <span className={`text-[11px] ${mutedText}`}>
                Cobertura Global: <strong>2.000 Filiais Parceiras</strong> · <strong>{cohorts[cohorts.length - 1]?.totalProposals.toLocaleString('pt-BR')} propostas/mês</strong>
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
              {stores.map((s) => (
                <div
                  key={s.id}
                  className={`p-4 rounded-xl border flex flex-col justify-between gap-3 ${subCardBg}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] font-bold text-[#004A75] dark:text-[#00D2B4]">
                          {s.code}
                        </span>
                        <span className={`text-[11px] ${mutedText}`}>· {s.region}</span>
                      </div>
                      <h4 className="text-xs font-bold mt-0.5">{s.name}</h4>
                      <span className={`text-[11px] ${mutedText}`}>Promotor: {s.promoterName}</span>
                    </div>

                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                      s.isBlocked
                        ? 'bg-[#004A75] text-white border-[#004A75]'
                        : isDarkMode ? 'bg-slate-900 border-slate-700 text-slate-300' : 'bg-white border-slate-200 text-[#004A75]'
                    }`}>
                      {s.isBlocked ? 'Lote Bloqueado' : s.isCalibrated ? `Calibrada (${s.calibratedScore})` : s.status === 'CRITICAL' ? 'Ação Requerida' : 'Regular'}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200 dark:border-slate-700 text-[11px]">
                    <div>
                      <span className={`block text-[10px] ${mutedText}`}>Volume/Mês</span>
                      <strong className="font-mono">{s.monthlyProposals.toLocaleString('pt-BR')}</strong>
                    </div>
                    <div>
                      <span className={`block text-[10px] ${mutedText}`}>Score Corte</span>
                      <strong className="font-mono">{s.calibratedScore || s.currentScoreThreshold} pts</strong>
                    </div>
                    <div className="text-right">
                      <span className={`block text-[10px] ${mutedText}`}>Risco PCLD</span>
                      <strong className="font-mono">R$ {(s.estimatedPCLDRisk / 1000).toFixed(0)}k</strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
