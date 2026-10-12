import React, { useState, useMemo, useEffect } from 'react';
import { PartnerStore } from '../types';
import { HelpTooltip } from './HelpTooltip';
import { exportToExcelCsv } from '../utils/exportExcel';
import { 
  SlidersHorizontal, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowRight,
  ChevronDown,
  Download,
  TrendingDown
} from 'lucide-react';

interface RadarModuleProps {
  stores: PartnerStore[];
  selectedStoreId: string;
  onSelectStoreId: (id: string) => void;
  onHomologateScore: (storeId: string, newScore: number, savedPCLD: number, projectedDefault: number) => void;
  isDarkMode?: boolean;
  onExportToast?: (msg: string) => void;
}

export const RadarModule: React.FC<RadarModuleProps> = ({
  stores,
  selectedStoreId,
  onSelectStoreId,
  onHomologateScore,
  isDarkMode = false,
  onExportToast,
}) => {
  // Current store
  const store = useMemo(() => {
    return stores.find((s) => s.id === selectedStoreId) || stores[0];
  }, [stores, selectedStoreId]);

  // Score slider state (default to recommended or current)
  const [sliderScore, setSliderScore] = useState<number>(() => {
    return store.calibratedScore || store.recommendedScoreThreshold || 620;
  });

  // Keep slider in sync when store changes
  useEffect(() => {
    if (store) {
      setSliderScore(store.calibratedScore || store.recommendedScoreThreshold || 620);
    }
  }, [store?.id]);

  // Helper to compute projected default for any score on a store
  const calculateProjectedDefault = (targetStore: PartnerStore, score: number) => {
    const maxScore = 800;
    const initialScore = targetStore.currentScoreThreshold;
    const initialDefault = targetStore.defaultRate;
    const scoreDelta = score - initialScore;

    if (score <= initialScore) {
      const worseFactor = (initialScore - score) / 100;
      return Number(Math.min(18.5, initialDefault + worseFactor * 2.5).toFixed(1));
    } else {
      const improveFactor = scoreDelta / (maxScore - initialScore);
      return Number(Math.max(3.2, initialDefault - (initialDefault - 4.5) * Math.pow(improveFactor, 0.85)).toFixed(1));
    }
  };

  // Dynamic simulation calculations based on score slider position
  const simulation = useMemo(() => {
    const projectedDefault = calculateProjectedDefault(store, sliderScore);
    const filteredPct = Math.max(0, Math.min(65, Math.round(((sliderScore - 400) / 400) * 45)));
    const approvalRate = Math.max(25, 100 - filteredPct - (store.refusalRate * 0.4));

    const initialScore = store.currentScoreThreshold;
    const riskRatio = Math.max(0, Math.min(1.2, (sliderScore - initialScore) / (store.recommendedScoreThreshold - initialScore || 150)));
    const projectedPCLDSaved = Math.round(store.estimatedPCLDRisk * Math.min(1.0, riskRatio));

    return {
      projectedDefault,
      filteredPct,
      projectedPCLDSaved,
      approvalRate: Number(approvalRate.toFixed(1)),
      isAboveRecommended: sliderScore >= store.recommendedScoreThreshold,
    };
  }, [store, sliderScore]);

  // Curve points across score brackets (450 to 750) for visual local default curve
  const scoreCurvePoints = useMemo(() => {
    const brackets = [450, 500, 550, 600, 620, 650, 700, 750];
    return brackets.map((sc) => ({
      score: sc,
      projectedDefault: calculateProjectedDefault(store, sc),
    }));
  }, [store]);

  const handleApplyRecommended = () => {
    setSliderScore(store.recommendedScoreThreshold);
  };

  const handleHomologate = () => {
    onHomologateScore(store.id, sliderScore, simulation.projectedPCLDSaved, simulation.projectedDefault);
  };

  // Exclusive Radar Excel Export: Filial, Promotor, Score Atual, Score Recomendado, Inadimplência Projetada e Status de Homologação
  const handleExportRadarExcel = () => {
    const headers = [
      'Código Filial',
      'Filial Parceira',
      'Região / UF',
      'Promotor Responsável',
      'Score Atual (pts)',
      'Score Recomendado (pts)',
      'Score Calibrado / Simulado (pts)',
      'Inadimplência Atual (%)',
      'Inadimplência Projetada (%)',
      'Status de Homologação',
    ];

    const rows = stores.map((s) => {
      const effectiveScore = s.id === store.id ? sliderScore : s.calibratedScore || s.recommendedScoreThreshold;
      const projDef = calculateProjectedDefault(s, effectiveScore);
      const homologStatus = s.isCalibrated
        ? `HOMOLOGADO (${s.calibratedScore} pts)`
        : s.status === 'HEALTHY'
        ? 'EM CONFORMIDADE PADRÃO'
        : 'PENDENTE DE CALIBRAÇÃO';

      return [
        s.code,
        s.name,
        s.region,
        s.promoterName,
        s.currentScoreThreshold,
        s.recommendedScoreThreshold,
        effectiveScore,
        s.defaultRate.toFixed(1).replace('.', ','),
        projDef.toFixed(1).replace('.', ','),
        homologStatus,
      ];
    });

    exportToExcelCsv('Tribanco_Radar_Calibracao_Política_Credito.csv', headers, rows);
    if (onExportToast) {
      onExportToast('Planilha exclusiva de Calibração de Score (Módulo Radar) exportada para Excel (.csv).');
    }
  };

  const panelBg = isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900';
  const subCardBg = isDarkMode ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-50 border-slate-200';
  const mutedText = isDarkMode ? 'text-slate-400' : 'text-slate-500';

  return (
    <div className="space-y-4">

      {/* Header Row: Purpose + Exclusive Radar Excel Export */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-2">
          <h2 className={`text-sm font-bold flex items-center ${isDarkMode ? 'text-slate-100' : 'text-[#004A75]'}`}>
            Calibração Cirúrgica de Score e Curva de Inadimplência Local (Módulo Radar)
            <HelpTooltip
              position="right"
              text="Isolamento Cirúrgico: A calibragem da régua de score atua exclusivamente sobre a filial selecionada, contendo a inadimplência local sem penalizar os demais parceiros saudáveis da rede."
            />
          </h2>
        </div>

        <button
          onClick={handleExportRadarExcel}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-2xs border ${
            isDarkMode
              ? 'bg-slate-800 hover:bg-slate-700 text-slate-100 border-slate-700'
              : 'bg-white hover:bg-slate-50 text-[#004A75] border-slate-200'
          }`}
          title="Exportar planilha com Filial, Promotor, Score Atual, Score Recomendado, Inadimplência Projetada e Status de Homologação"
        >
          <Download className="w-3.5 h-3.5 text-[#00D2B4]" />
          <span>📥 Exportar Dados do Radar (Excel)</span>
        </button>
      </div>

      {/* Store Selector Bar */}
      <div className={`${panelBg} border rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs transition-colors`}>
        <div className="flex-1 w-full md:max-w-md">
          <label className={`text-xs font-bold mb-1.5 block ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
            Filial Parceira Selecionada para Calibração:
          </label>
          <div className="relative">
            <select
              value={store.id}
              onChange={(e) => onSelectStoreId(e.target.value)}
              className={`w-full border rounded-lg px-3 py-2 text-xs font-semibold focus:outline-none appearance-none pr-8 cursor-pointer transition-colors ${
                isDarkMode
                  ? 'bg-slate-800 border-slate-700 text-slate-100 focus:border-[#00D2B4]'
                  : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-[#004A75] focus:bg-white'
              }`}
            >
              {stores.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.code} - {s.name} ({s.region}) {s.isCalibrated ? `[HOMOLOGADA: ${s.calibratedScore} pts]` : ''}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* Selected Store Policy Parameters */}
        <div className="flex flex-wrap items-center gap-5 text-xs">
          <div>
            <span className={`${mutedText} block text-[11px] font-medium`}>Promotor Vinculado:</span>
            <span className="font-bold text-sm">
              {store.promoterName}
            </span>
          </div>
          <div className={`h-7 w-[1px] hidden sm:block ${isDarkMode ? 'bg-slate-800' : 'bg-slate-200'}`}></div>
          <div>
            <span className={`${mutedText} block text-[11px] font-medium`}>Score Vigente:</span>
            <span className="font-mono tabular-nums font-extrabold text-sm">
              {store.currentScoreThreshold} pts
            </span>
          </div>
          <div className={`h-7 w-[1px] hidden sm:block ${isDarkMode ? 'bg-slate-800' : 'bg-slate-200'}`}></div>
          <div>
            <span className={`${mutedText} block text-[11px] font-medium`}>Score Recomendado:</span>
            <span className={`font-mono tabular-nums font-extrabold text-sm ${isDarkMode ? 'text-[#00D2B4]' : 'text-[#004A75]'}`}>
              {store.recommendedScoreThreshold} pts
            </span>
          </div>
          <div className={`h-7 w-[1px] hidden sm:block ${isDarkMode ? 'bg-slate-800' : 'bg-slate-200'}`}></div>
          <div>
            <span className={`${mutedText} block text-[11px] font-medium`}>Status Homologação:</span>
            <span className={`font-bold text-xs ${isDarkMode ? 'text-[#00D2B4]' : 'text-[#004A75]'}`}>
              {store.isCalibrated ? `Homologado (${store.calibratedScore} pts)` : 'Em Calibração'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Offending Variables & Interactive Score Simulator + Local Default Curve */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

        {/* Column Left: Offending Variables & Diagnosis (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className={`${panelBg} border rounded-xl p-5 shadow-xs transition-colors h-full flex flex-col justify-between`}>
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-[#00D2B4]" />
                  <span>Vetores Ofensores de Risco Local</span>
                  <HelpTooltip
                    position="top"
                    text="Variáveis identificadas na safra da filial que pressionam a inadimplência de primeira fatura (FPD) e justificam o ajuste seletivo do score de corte."
                  />
                </h3>
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                  isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-600'
                }`}>
                  {store.offendingAttributes.length} fatores
                </span>
              </div>

              {store.offendingAttributes.length > 0 ? (
                <div className="space-y-2.5">
                  {store.offendingAttributes.map((attr, idx) => (
                    <div
                      key={idx}
                      className={`p-3.5 rounded-lg border text-xs ${subCardBg}`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="font-bold">{attr.name}</span>
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold border ${
                          isDarkMode ? 'bg-slate-900 text-[#00D2B4] border-slate-700' : 'bg-white text-[#004A75] border-slate-200'
                        }`}>
                          Peso: {attr.impactPct}%
                        </span>
                      </div>
                      <p className={`text-[11px] leading-relaxed ${mutedText}`}>
                        {attr.detail}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={`p-5 rounded-lg border text-center text-xs ${subCardBg}`}>
                  <CheckCircle2 className="w-5 h-5 mx-auto mb-1.5 text-[#00D2B4]" />
                  <p className="font-semibold">Nenhuma anomalia crítica identificada nesta filial. Régua em equilíbrio.</p>
                </div>
              )}
            </div>

            {/* Quick Cutoff Recommendation Action */}
            <div className={`mt-5 p-3.5 rounded-lg border text-xs flex items-center justify-between gap-3 ${
              isDarkMode ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-center gap-1.5">
                <span className="font-semibold">
                  Ponto Ótimo Recomendado: <strong className="font-mono">{store.recommendedScoreThreshold} pts</strong>
                </span>
                <HelpTooltip
                  position="top"
                  text={`Posiciona automaticamente o simulador no score ${store.recommendedScoreThreshold} pts para convergir a inadimplência local em direção à meta (< 5,0%).`}
                />
              </div>
              <button
                onClick={handleApplyRecommended}
                className={`text-[11px] font-bold hover:underline flex items-center gap-1 cursor-pointer shrink-0 ${
                  isDarkMode ? 'text-[#00D2B4]' : 'text-[#004A75]'
                }`}
              >
                <span>Aplicar {store.recommendedScoreThreshold} pts</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        {/* Column Right: Interactive Score Calibrator & Local Default Curve (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className={`${panelBg} border rounded-xl p-5 shadow-xs transition-colors`}>
            
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold flex items-center gap-1.5">
                <SlidersHorizontal className={`w-4 h-4 ${isDarkMode ? 'text-[#00D2B4]' : 'text-[#004A75]'}`} />
                <span>Régua de Calibração de Score (Serasa / Tribanco)</span>
                <HelpTooltip
                  position="top"
                  text="Deslize para definir o novo ponto de corte da filial e acompanhe abaixo a simulação da curva de inadimplência local."
                />
              </h3>
              <span className={`text-xs font-mono tabular-nums font-bold px-2.5 py-0.5 rounded border ${
                isDarkMode ? 'bg-slate-800 text-[#00D2B4] border-slate-700' : 'bg-slate-100 text-[#004A75] border-slate-200'
              }`}>
                Corte Selecionado: {sliderScore} pts
              </span>
            </div>

            {/* Score Range Slider Control */}
            <div className={`p-4 rounded-xl border mb-5 ${subCardBg}`}>
              <div className="flex items-center justify-between text-xs font-mono mb-2">
                <span className={mutedText}>400 pts (Flexível)</span>
                <span className={`font-bold text-sm ${isDarkMode ? 'text-[#00D2B4]' : 'text-[#004A75]'}`}>
                  Score Simulado: {sliderScore} pontos
                </span>
                <span className={mutedText}>800 pts (Rigoroso)</span>
              </div>

              <input
                type="range"
                min={400}
                max={800}
                step={10}
                value={sliderScore}
                onChange={(e) => setSliderScore(Number(e.target.value))}
                className="w-full h-2.5 bg-slate-300 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-[#004A75]"
              />

              <div className={`flex items-center justify-between text-[11px] mt-2 ${mutedText}`}>
                <span>Score Vigente da Filial: <strong>{store.currentScoreThreshold} pts</strong></span>
                <span>Recomendado pelo Motor: <strong>{store.recommendedScoreThreshold} pts</strong></span>
              </div>
            </div>

            {/* Visual Simulation of Local Default Rate Curve across Score Thresholds */}
            <div className={`p-4 rounded-xl border mb-5 ${subCardBg}`}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold flex items-center gap-1.5">
                  <TrendingDown className="w-3.5 h-3.5 text-[#00D2B4]" />
                  Simulação da Curva de Inadimplência Local por Faixa de Score
                </span>
                <span className={`text-[11px] font-mono ${mutedText}`}>
                  Projeção em {sliderScore} pts: <strong className={isDarkMode ? 'text-[#00D2B4]' : 'text-[#004A75]'}>{simulation.projectedDefault.toFixed(1).replace('.', ',')}%</strong>
                </span>
              </div>

              <div className={`grid grid-cols-8 gap-2 h-36 items-end border-b pb-2 pt-4 relative ${
                isDarkMode ? 'border-slate-700' : 'border-slate-200'
              }`}>
                {/* 5.0% Corporate Goal Line */}
                <div
                  className="absolute left-0 right-0 border-t border-dashed border-[#00D2B4] z-10 flex items-center justify-end pr-1 pointer-events-none"
                  style={{ bottom: `${Math.round((5.0 / 16) * 100)}%` }}
                >
                  <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded border font-bold -mt-4 ${
                    isDarkMode ? 'bg-slate-900 text-[#00D2B4] border-slate-700' : 'bg-white text-[#004A75] border-slate-200'
                  }`}>
                    Meta 5,0%
                  </span>
                </div>

                {scoreCurvePoints.map((pt) => {
                  const hPct = Math.min(100, Math.max(12, Math.round((pt.projectedDefault / 16) * 100)));
                  const isActiveBracket = Math.abs(pt.score - sliderScore) <= 25;

                  return (
                    <div
                      key={pt.score}
                      onClick={() => setSliderScore(pt.score)}
                      className="flex flex-col items-center h-full justify-end cursor-pointer group"
                      title={`Clique para simular ${pt.score} pts`}
                    >
                      <span className={`text-[10px] font-mono tabular-nums font-bold mb-1 ${
                        isActiveBracket
                          ? isDarkMode ? 'text-[#00D2B4]' : 'text-[#004A75]'
                          : mutedText
                      }`}>
                        {pt.projectedDefault.toFixed(1).replace('.', ',')}%
                      </span>
                      <div className={`w-full max-w-[32px] rounded-t flex items-end h-full ${
                        isDarkMode ? 'bg-slate-900/60' : 'bg-slate-200/70'
                      }`}>
                        <div
                          className={`w-full rounded-t transition-all duration-300 ${
                            isActiveBracket
                              ? 'bg-[#00D2B4]'
                              : pt.projectedDefault <= 5.0
                              ? 'bg-[#004A75]'
                              : isDarkMode ? 'bg-slate-600' : 'bg-slate-400'
                          }`}
                          style={{ height: `${hPct}%` }}
                        />
                      </div>
                      <span className={`text-[10px] font-mono mt-1.5 ${
                        isActiveBracket ? 'font-bold text-[#00D2B4]' : mutedText
                      }`}>
                        {pt.score}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className={`flex items-center justify-between text-[11px] mt-2.5 ${mutedText}`}>
                <span>Inadimplência local atual: <strong>{store.defaultRate.toFixed(1).replace('.', ',')}%</strong></span>
                <span>Filtro de risco estimado: <strong>-{simulation.filteredPct}% propostas</strong></span>
                <span>Aprovação limpa: <strong>{simulation.approvalRate.toFixed(0)}%</strong></span>
              </div>
            </div>

            {/* Homologate Action Button */}
            <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl border ${subCardBg}`}>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold">
                  Homologar Política de Crédito para {store.code}
                </span>
                <HelpTooltip
                  position="top"
                  text="Aplica imediatamente a nova nota de corte de score na esteira da filial selecionada e registra a homologação."
                />
              </div>

              <button
                onClick={handleHomologate}
                className="w-full sm:w-auto px-6 py-2.5 rounded-lg text-xs font-bold text-white bg-[#004A75] hover:bg-[#003859] shadow-xs flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 text-[#00D2B4]" />
                <span>Homologar Nova Régua ({sliderScore} pts)</span>
              </button>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
};
