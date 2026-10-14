import React from 'react';
import { PartnerStore, StoreCalibrationAuditEntry } from '../types';
import { exportToExcelCsv } from '../utils/exportExcel';
import { 
  X, 
  Download, 
  History, 
  ShieldCheck, 
  User, 
  Calendar, 
  ArrowRight,
  TrendingDown,
  FileCheck
} from 'lucide-react';

interface StoreAuditModalProps {
  store: PartnerStore;
  isOpen: boolean;
  onClose: () => void;
  isDarkMode?: boolean;
  onExportToast?: (msg: string) => void;
}

export const StoreAuditModal: React.FC<StoreAuditModalProps> = ({
  store,
  isOpen,
  onClose,
  isDarkMode = false,
  onExportToast,
}) => {
  if (!isOpen) return null;

  const history: StoreCalibrationAuditEntry[] = store.calibrationHistory || [];

  // Export Audit Trail to CSV
  const handleExportCSV = () => {
    const headers = [
      'Data/Hora',
      'Filial Parceira',
      'Código Filial',
      'Responsável (Operador SSO)',
      'Score Anterior (pts)',
      'Score Novo (pts)',
      'Variação Score (pts)',
      'Inadimplência Anterior (%)',
      'Inadimplência Projetada (%)',
      'Motivo da Calibração',
      'Status de Governança',
    ];

    const rows = history.map((entry) => [
      entry.timestamp,
      store.name,
      store.code,
      entry.operator,
      entry.previousScore,
      entry.newScore,
      `${entry.scoreDelta > 0 ? '+' : ''}${entry.scoreDelta}`,
      entry.previousDefaultRate.toFixed(1).replace('.', ','),
      entry.projectedDefaultRate.toFixed(1).replace('.', ','),
      entry.calibrationReason,
      entry.governanceStatus,
    ]);

    exportToExcelCsv(
      `Trilha_Auditoria_Calibracoes_${store.code}.csv`,
      headers,
      rows
    );

    if (onExportToast) {
      onExportToast(`Log de auditoria da filial ${store.code} exportado com sucesso em CSV.`);
    }
  };

  const modalBg = isDarkMode ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-900';
  const cardBg = isDarkMode ? 'bg-slate-800/90 border-slate-700/80' : 'bg-slate-50 border-slate-200';
  const mutedText = isDarkMode ? 'text-slate-400' : 'text-slate-500';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className={`relative w-full max-w-3xl rounded-2xl border shadow-2xl overflow-hidden z-10 transition-colors ${modalBg}`}>
        
        {/* Modal Header */}
        <div className="px-6 py-4.5 border-b border-[#003859] bg-[#004A75] text-white flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-[#00D2B4] shrink-0">
              <History className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-white/15 text-[#00D2B4] border border-white/20">
                  {store.code}
                </span>
                <span className="text-xs text-white/80">CNPJ: {store.cnpjFicticio}</span>
                <span aria-hidden="true" className="text-white/40">·</span>
                <span className="text-xs text-white/80">{store.region}</span>
              </div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Trilha de Auditoria: Histórico de Calibrações da Filial {store.name}
              </h2>
            </div>
          </div>

          {/* Close button at the top */}
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Fechar Modal de Auditoria"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Timeline of Calibration Audit Entries */}
        <div className="p-6 max-h-[65vh] overflow-y-auto space-y-4">
          
          <div className="flex items-center justify-between text-xs pb-1 border-b border-slate-200 dark:border-slate-800">
            <span className={`font-semibold flex items-center gap-1.5 ${mutedText}`}>
              <FileCheck className="w-4 h-4 text-[#00D2B4]" />
              <span>Registros cronológicos de calibração de score e alçadas homologadas</span>
            </span>
            <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-[#004A75]/10 text-[#004A75] dark:bg-[#00D2B4]/10 dark:text-[#00D2B4]">
              {history.length} {history.length === 1 ? 'registro' : 'registros'}
            </span>
          </div>

          {history.length === 0 ? (
            <div className={`p-8 text-center rounded-xl border ${cardBg}`}>
              <History className="w-8 h-8 mx-auto mb-2 text-slate-400" />
              <p className="text-sm font-semibold">Nenhuma calibração anterior registrada para esta filial.</p>
              <p className={`text-xs mt-1 ${mutedText}`}>Novas homologações realizadas no Radar serão automaticamente indexadas nesta trilha.</p>
            </div>
          ) : (
            <div className="relative pl-6 space-y-5 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-700">
              {history.map((entry, index) => {
                const isMostRecent = index === 0;

                return (
                  <div key={entry.id} className="relative group">
                    {/* Timeline Node Point */}
                    <div className={`absolute -left-6 top-3 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                      isMostRecent
                        ? 'bg-[#00D2B4] border-white dark:border-slate-900 shadow-sm'
                        : 'bg-[#004A75] border-white dark:border-slate-900'
                    }`}>
                      <div className="w-1.5 h-1.5 rounded-full bg-white" />
                    </div>

                    {/* Entry Card */}
                    <div className={`rounded-xl border p-4.5 shadow-2xs transition-all ${cardBg}`}>
                      
                      {/* Top Row: Timestamp & Governance Status Tag */}
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2 text-xs font-mono">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            {entry.timestamp}
                          </span>
                          {isMostRecent && (
                            <span className="text-[10px] font-sans font-bold px-1.5 py-0.2 rounded bg-[#00D2B4]/20 text-[#003859] dark:text-[#00D2B4] border border-[#00D2B4]/30">
                              Mais Recente
                            </span>
                          )}
                        </div>

                        {/* Status de Governança: Tag verde suave "Homologado (Alçada Gerencial)" */}
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.8 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <span>{entry.governanceStatus}</span>
                        </span>
                      </div>

                      {/* Responsável (Operador SSO) */}
                      <div className="flex items-center gap-2 mb-3 text-xs">
                        <div className="w-6 h-6 rounded-md bg-[#004A75]/10 dark:bg-white/10 flex items-center justify-center text-[#004A75] dark:text-[#00D2B4] shrink-0">
                          <User className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={mutedText}>Responsável:</span>
                          <strong className="font-semibold text-slate-900 dark:text-slate-100">
                            {entry.operator}
                          </strong>
                        </div>
                      </div>

                      {/* Variação de Score & Inadimplência Projetada */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-3">
                        
                        {/* Variação de Score: Badge visual mostrando "Score De [X] ➔ Para [Y]" (+pts) */}
                        <div className="p-2.5 rounded-lg border bg-white dark:bg-slate-900/80 border-slate-200 dark:border-slate-700/80">
                          <span className={`text-[11px] block font-medium mb-1 ${mutedText}`}>
                            Variação de Score:
                          </span>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-[#004A75]/10 dark:bg-[#004A75]/40 text-[#004A75] dark:text-[#00D2B4] border border-[#004A75]/20">
                              <span>Score De {entry.previousScore}</span>
                              <ArrowRight className="w-3.5 h-3.5 text-[#00D2B4]" />
                              <span>Para {entry.newScore} pts</span>
                            </span>
                            <span className={`text-xs font-mono font-extrabold ${
                              entry.scoreDelta > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500'
                            }`}>
                              ({entry.scoreDelta > 0 ? `+${entry.scoreDelta}` : entry.scoreDelta} pts)
                            </span>
                          </div>
                        </div>

                        {/* Inadimplência Projetada: "Taxa local De [X%] ➔ Para [Y%]" */}
                        <div className="p-2.5 rounded-lg border bg-white dark:bg-slate-900/80 border-slate-200 dark:border-slate-700/80">
                          <span className={`text-[11px] block font-medium mb-1 ${mutedText}`}>
                            Inadimplência Projetada:
                          </span>
                          <div className="flex items-center gap-1.5 text-xs font-mono">
                            <TrendingDown className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                            <span className="font-semibold text-slate-800 dark:text-slate-200">
                              Taxa local De {entry.previousDefaultRate.toFixed(1).replace('.', ',')}%
                            </span>
                            <ArrowRight className="w-3 h-3 text-emerald-500" />
                            <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                              Para {entry.projectedDefaultRate.toFixed(1).replace('.', ',')}%
                            </span>
                          </div>
                        </div>

                      </div>

                      {/* Motivo da Calibração */}
                      <div className="text-xs pt-1 border-t border-slate-200 dark:border-slate-700/70">
                        <span className={`text-[11px] font-semibold block mb-0.5 ${mutedText}`}>
                          Motivo da Calibração:
                        </span>
                        <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-[11px] italic">
                          "{entry.calibrationReason}"
                        </p>
                      </div>

                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className={`px-6 py-4 border-t flex flex-wrap items-center justify-between gap-3 ${
          isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className={`text-xs ${mutedText} flex items-center gap-1.5`}>
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>Trilha imutável em conformidade com as diretrizes Bacen e governança de crédito Tribanco.</span>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Export Log CSV Button */}
            <button
              type="button"
              onClick={handleExportCSV}
              className="px-4 py-2 rounded-lg text-xs font-bold text-white bg-[#004A75] hover:bg-[#003859] shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-[#00D2B4]" />
              <span>📥 Exportar Log (CSV)</span>
            </button>

            {/* Fechar Button */}
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                isDarkMode 
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700' 
                  : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
              }`}
            >
              Fechar
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
