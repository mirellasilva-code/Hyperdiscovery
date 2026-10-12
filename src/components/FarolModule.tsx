import React, { useState, useMemo, useRef, useEffect } from 'react';
import { PartnerStore, DateRangeFilter } from '../types';
import { HelpTooltip } from './HelpTooltip';
import { exportToExcelCsv } from '../utils/exportExcel';
import { 
  Search, 
  AlertCircle, 
  Lock, 
  User, 
  ArrowUpDown,
  FileSearch,
  Download,
  ChevronDown,
  RotateCcw,
  Calendar
} from 'lucide-react';

interface FarolModuleProps {
  stores: PartnerStore[];
  onInspectStore: (store: PartnerStore) => void;
  onCalibrateStore: (store: PartnerStore) => void;
  dateRange: DateRangeFilter;
  onDateRangeChange: (range: DateRangeFilter) => void;
  isDarkMode?: boolean;
  onExportToast?: (msg: string) => void;
}

type FilterOption = 'ALL' | 'CRITICAL' | 'WARNING' | 'HEALTHY' | 'BLOCKED';

export const FarolModule: React.FC<FarolModuleProps> = ({
  stores,
  onInspectStore,
  dateRange,
  onDateRangeChange,
  isDarkMode = false,
  onExportToast,
}) => {
  // Search and status filter
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterOption>('ALL');

  // Cascading Filters: 1. Região -> 2. UF / Estado -> 3. Filial / Loja
  const [selectedRegion, setSelectedRegion] = useState<string>('ALL');
  const [selectedUf, setSelectedUf] = useState<string>('ALL');
  const [selectedStoreFilterId, setSelectedStoreFilterId] = useState<string>('ALL');

  // Calendar Popover State
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [tempStartDate, setTempStartDate] = useState(dateRange.startDate);
  const [tempEndDate, setTempEndDate] = useState(dateRange.endDate);
  const calendarRef = useRef<HTMLDivElement>(null);

  // Close calendar popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(e.target as Node)) {
        setIsCalendarOpen(false);
      }
    };
    if (isCalendarOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isCalendarOpen]);

  // Sorting
  const [sortField, setSortField] = useState<keyof PartnerStore>('estimatedPCLDRisk');
  const [sortAsc, setSortAsc] = useState(false);

  // Quick preset handlers for the Calendar Popover
  const handleSelectPreset = (label: string, start: string, end: string, multiplier: number) => {
    setTempStartDate(start);
    setTempEndDate(end);
    onDateRangeChange({
      presetLabel: label,
      startDate: start,
      endDate: end,
      daysMultiplier: multiplier,
    });
    setIsCalendarOpen(false);
  };

  const handleApplyCustomDates = () => {
    if (!tempStartDate || !tempEndDate) return;
    const d1 = new Date(tempStartDate);
    const d2 = new Date(tempEndDate);
    const diffTime = Math.abs(d2.getTime() - d1.getTime());
    const diffDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1);
    const multiplier = Math.max(0.05, Number((diffDays / 30).toFixed(2)));

    const formatBr = (iso: string) => {
      const [y, m, d] = iso.split('-');
      return `${d}/${m}`;
    };

    onDateRangeChange({
      presetLabel: `${formatBr(tempStartDate)} a ${formatBr(tempEndDate)} (${diffDays}d)`,
      startDate: tempStartDate,
      endDate: tempEndDate,
      daysMultiplier: multiplier,
    });
    setIsCalendarOpen(false);
  };

  // Scale store volumes dynamically based on selected calendar period
  const storesInPeriod = useMemo(() => {
    const mult = dateRange.daysMultiplier || 1;
    return stores.map((s) => {
      const scaledProposals = Math.max(1, Math.round(s.monthlyProposals * mult));
      const scaledExpected = Math.max(1, Math.round(s.expectedProposals * mult));
      return {
        ...s,
        monthlyProposals: scaledProposals,
        expectedProposals: scaledExpected,
      };
    });
  }, [stores, dateRange.daysMultiplier]);

  // Cascading Options Logic
  const availableUfs = useMemo(() => {
    const filteredByRegion =
      selectedRegion === 'ALL'
        ? storesInPeriod
        : storesInPeriod.filter((s) => s.macroRegion === selectedRegion);
    return Array.from(new Set(filteredByRegion.map((s) => s.uf))).sort();
  }, [storesInPeriod, selectedRegion]);

  const availableStoresForSelect = useMemo(() => {
    return storesInPeriod.filter((s) => {
      if (selectedRegion !== 'ALL' && s.macroRegion !== selectedRegion) return false;
      if (selectedUf !== 'ALL' && s.uf !== selectedUf) return false;
      return true;
    });
  }, [storesInPeriod, selectedRegion, selectedUf]);

  const handleRegionChange = (region: string) => {
    setSelectedRegion(region);
    setSelectedUf('ALL');
    setSelectedStoreFilterId('ALL');
  };

  const handleUfChange = (uf: string) => {
    setSelectedUf(uf);
    setSelectedStoreFilterId('ALL');
  };

  const hasActiveCascadeFilters =
    selectedRegion !== 'ALL' || selectedUf !== 'ALL' || selectedStoreFilterId !== 'ALL' || searchTerm !== '';

  const handleClearFilters = () => {
    setSelectedRegion('ALL');
    setSelectedUf('ALL');
    setSelectedStoreFilterId('ALL');
    setSearchTerm('');
    setStatusFilter('ALL');
  };

  // Filter and search logic
  const filteredStores = useMemo(() => {
    return storesInPeriod.filter((store) => {
      if (selectedRegion !== 'ALL' && store.macroRegion !== selectedRegion) return false;
      if (selectedUf !== 'ALL' && store.uf !== selectedUf) return false;
      if (selectedStoreFilterId !== 'ALL' && store.id !== selectedStoreFilterId) return false;

      const matchesSearch =
        store.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        store.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        store.promoterName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        store.region.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchesSearch) return false;

      if (statusFilter === 'ALL') return true;
      if (statusFilter === 'BLOCKED') return store.isBlocked;
      if (statusFilter === 'CRITICAL') return store.status === 'CRITICAL' && !store.isBlocked;
      if (statusFilter === 'WARNING') return store.status === 'WARNING' && !store.isBlocked;
      if (statusFilter === 'HEALTHY') return store.status === 'HEALTHY' && !store.isBlocked;

      return true;
    }).sort((a, b) => {
      const valA = a[sortField];
      const valB = b[sortField];

      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortAsc ? valA - valB : valB - valA;
      }
      return sortAsc
        ? String(valA).localeCompare(String(valB))
        : String(valB).localeCompare(String(valA));
    });
  }, [storesInPeriod, selectedRegion, selectedUf, selectedStoreFilterId, searchTerm, statusFilter, sortField, sortAsc]);

  // Counts for tabs
  const criticalCount = storesInPeriod.filter((s) => s.status === 'CRITICAL' && !s.isBlocked).length;
  const warningCount = storesInPeriod.filter((s) => s.status === 'WARNING' && !s.isBlocked).length;
  const healthyCount = storesInPeriod.filter((s) => s.status === 'HEALTHY' && !s.isBlocked).length;
  const blockedCount = storesInPeriod.filter((s) => s.isBlocked).length;

  const handleSort = (field: keyof PartnerStore) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  // Export filtered stores to Excel CSV
  const handleExportExcel = () => {
    const headers = [
      'Código Filial',
      'Nome da Filial Parceira',
      'Região',
      'UF',
      'Promotor Responsável',
      `Volume Real (${dateRange.presetLabel})`,
      `Volume Base Esperado (${dateRange.presetLabel})`,
      'Desvio Volumétrico (%)',
      'Taxa de Recusa (%)',
      'Inadimplência FPD (%)',
      'Risco PCLD Estimado (R$)',
      'Status Operacional',
    ];

    const rows = filteredStores.map((s) => {
      const dev = Math.round(((s.monthlyProposals - s.expectedProposals) / s.expectedProposals) * 100);
      const statusText = s.isBlocked
        ? 'BLOQUEADA / EM AUDITORIA'
        : s.status === 'CRITICAL'
        ? 'CRÍTICA'
        : s.status === 'WARNING'
        ? 'ATENÇÃO'
        : 'SAUDÁVEL';
      return [
        s.code,
        s.name,
        s.macroRegion,
        s.uf,
        s.promoterName,
        s.monthlyProposals,
        s.expectedProposals,
        `${dev > 0 ? '+' : ''}${dev}%`,
        s.refusalRate.toFixed(1).replace('.', ','),
        s.defaultRate.toFixed(1).replace('.', ','),
        s.estimatedPCLDRisk,
        statusText,
      ];
    });

    exportToExcelCsv(`Tribanco_Farol_Filiais_${dateRange.startDate}_a_${dateRange.endDate}.csv`, headers, rows);
    if (onExportToast) {
      onExportToast(`Planilha com ${filteredStores.length} filiais exportada para Excel (.csv).`);
    }
  };

  const panelBg = isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900';
  const inputBg = isDarkMode
    ? 'bg-slate-800/90 border-slate-700 text-slate-100 placeholder:text-slate-400 focus:border-[#00D2B4] focus:bg-slate-800'
    : 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-[#004A75] focus:bg-white';
  const mutedText = isDarkMode ? 'text-slate-400' : 'text-slate-500';
  const institutionalTag = isDarkMode
    ? 'bg-slate-800 text-slate-200 border border-slate-700'
    : 'bg-slate-100 text-[#004A75] border border-slate-200';

  return (
    <div className="space-y-4">
      
      {/* Compact Header Row with Tooltips (?) and Export Button */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-3 flex-wrap">
          <h2 className={`text-sm font-bold flex items-center ${isDarkMode ? 'text-slate-100' : 'text-[#004A75]'}`}>
            Monitoramento Preventivo da Rede Parceira (Módulo Farol)
            <HelpTooltip
              position="right"
              text="Critério de Gatilho Farol: Alerta crítico automático quando o volume de propostas supera +150% da média histórica ou a taxa de recusa cadastral ultrapassa 50%."
            />
          </h2>
          <span className={`text-xs ${mutedText} flex items-center`}>
            · Recuperação de Leads: <strong className={`ml-1 font-mono ${isDarkMode ? 'text-[#00D2B4]' : 'text-[#004A75]'}`}>1.056 aprovados</strong>
            <HelpTooltip
              position="bottom"
              text="Clientes aprovados na esteira sem 1ª compra realizada. Representam potencial de R$ 500.000 em crédito ativo pronto para ativação via WhatsApp/PDV."
            />
          </span>
        </div>

        {/* Export to Excel Action Button */}
        <button
          onClick={handleExportExcel}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-2xs border ${
            isDarkMode
              ? 'bg-slate-800 hover:bg-slate-700 text-slate-100 border-slate-700'
              : 'bg-white hover:bg-slate-50 text-[#004A75] border-slate-200'
          }`}
          title="Baixar dados da tabela em formato compatível com Microsoft Excel (.csv)"
        >
          <Download className="w-3.5 h-3.5 text-[#00D2B4]" />
          <span>📥 Exportar Excel</span>
        </button>
      </div>

      {/* Control Bar: Cascading Filters + Search + Calendar Date Picker + Status Filter */}
      <div className={`${panelBg} border rounded-xl p-3.5 space-y-3 shadow-xs transition-colors`}>
        
        {/* Row 1: Cascading Filters (Região -> UF -> Filial) & Search Input */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-2.5 items-center">
          
          {/* 1. Região Filter */}
          <div className="lg:col-span-2 relative">
            <label className={`block text-[10px] font-semibold mb-1 ${mutedText}`}>
              1. Região
            </label>
            <div className="relative">
              <select
                value={selectedRegion}
                onChange={(e) => handleRegionChange(e.target.value)}
                className={`w-full border rounded-lg px-2.5 py-1.5 text-xs font-medium appearance-none pr-7 cursor-pointer focus:outline-none transition-colors ${inputBg}`}
              >
                <option value="ALL">Todas as Regiões</option>
                <option value="Sudeste">Sudeste</option>
                <option value="Nordeste">Nordeste</option>
                <option value="Sul">Sul</option>
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* 2. UF / Estado Filter */}
          <div className="lg:col-span-2 relative">
            <label className={`block text-[10px] font-semibold mb-1 ${mutedText}`}>
              2. UF / Estado
            </label>
            <div className="relative">
              <select
                value={selectedUf}
                onChange={(e) => handleUfChange(e.target.value)}
                className={`w-full border rounded-lg px-2.5 py-1.5 text-xs font-medium appearance-none pr-7 cursor-pointer focus:outline-none transition-colors ${inputBg}`}
              >
                <option value="ALL">
                  {selectedRegion === 'ALL' ? 'Todos os Estados' : `Todos (${selectedRegion})`}
                </option>
                {availableUfs.map((uf) => (
                  <option key={uf} value={uf}>
                    {uf}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* 3. Filial / Loja Filter */}
          <div className="lg:col-span-4 relative">
            <label className={`block text-[10px] font-semibold mb-1 ${mutedText}`}>
              3. Filial / Loja Parceira
            </label>
            <div className="relative">
              <select
                value={selectedStoreFilterId}
                onChange={(e) => setSelectedStoreFilterId(e.target.value)}
                className={`w-full border rounded-lg px-2.5 py-1.5 text-xs font-medium appearance-none pr-7 cursor-pointer focus:outline-none transition-colors ${inputBg}`}
              >
                <option value="ALL">
                  Todas as Filiais ({availableStoresForSelect.length})
                </option>
                {availableStoresForSelect.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.code} - {s.name} ({s.uf})
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* 4. Text Search Input */}
          <div className="lg:col-span-4">
            <label className={`block text-[10px] font-semibold mb-1 ${mutedText}`}>
              Busca Rápida (Código, Promotor ou Nome)
            </label>
            <div className="relative flex items-center gap-1.5">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar filial ou promotor..."
                  className={`w-full border rounded-lg pl-8 pr-7 py-1.5 text-xs focus:outline-none transition-colors ${inputBg}`}
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
                  >
                    ×
                  </button>
                )}
              </div>
              {hasActiveCascadeFilters && (
                <button
                  onClick={handleClearFilters}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors shrink-0 flex items-center gap-1 cursor-pointer ${
                    isDarkMode
                      ? 'border-slate-700 text-slate-300 hover:bg-slate-800'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                  title="Limpar todos os filtros"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Limpar</span>
                </button>
              )}
            </div>
          </div>

        </div>

        {/* Divider */}
        <div className={`border-t ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`} />

        {/* Row 2: Calendar Date Picker Popover & Institutional Category Filter Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          
          {/* Calendar Date Picker Trigger & Popover */}
          <div className="relative" ref={calendarRef}>
            <button
              onClick={() => setIsCalendarOpen(!isCalendarOpen)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer shadow-2xs ${
                isCalendarOpen
                  ? 'bg-[#004A75] text-white border-[#004A75]'
                  : isDarkMode
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-100 border-slate-700'
                  : 'bg-slate-50 hover:bg-slate-100 text-[#004A75] border-slate-200'
              }`}
            >
              <Calendar className={`w-3.5 h-3.5 ${isCalendarOpen ? 'text-[#00D2B4]' : 'text-[#00D2B4]'}`} />
              <span>📅 Selecionar Período: <strong>{dateRange.presetLabel}</strong></span>
              <ChevronDown className="w-3.5 h-3.5 opacity-80" />
            </button>

            {/* Compact Calendar Popover */}
            {isCalendarOpen && (
              <div className={`absolute left-0 mt-2 w-80 rounded-xl border shadow-xl p-4 z-50 space-y-3.5 ${
                isDarkMode ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
              }`}>
                <div className="flex items-center justify-between border-b pb-2 border-slate-200 dark:border-slate-800">
                  <span className="text-xs font-bold">Intervalo de Monitoramento</span>
                  <span className={`text-[10px] font-mono ${mutedText}`}>Safra 2026</span>
                </div>

                {/* Quick Range Presets */}
                <div>
                  <span className={`block text-[10px] font-semibold mb-1.5 ${mutedText}`}>
                    Intervalos Rápidos:
                  </span>
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleSelectPreset('Últimos 15 dias', '2026-09-24', '2026-10-08', 0.5)}
                      className={`px-2 py-1.5 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer text-center ${
                        dateRange.presetLabel === 'Últimos 15 dias'
                          ? 'bg-[#004A75] text-white border-[#004A75]'
                          : isDarkMode
                          ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      Últimos 15 dias
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectPreset('Este Mês', '2026-10-01', '2026-10-31', 1.0)}
                      className={`px-2 py-1.5 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer text-center ${
                        dateRange.presetLabel === 'Este Mês'
                          ? 'bg-[#004A75] text-white border-[#004A75]'
                          : isDarkMode
                          ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      Este Mês
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectPreset('Mês Anterior', '2026-09-01', '2026-09-30', 0.94)}
                      className={`px-2 py-1.5 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer text-center ${
                        dateRange.presetLabel === 'Mês Anterior'
                          ? 'bg-[#004A75] text-white border-[#004A75]'
                          : isDarkMode
                          ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      Mês Anterior
                    </button>
                  </div>
                </div>

                {/* Custom Start & End Date Inputs */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className={`block text-[10px] font-semibold mb-1 ${mutedText}`}>
                      Data de Início
                    </label>
                    <input
                      type="date"
                      value={tempStartDate}
                      onChange={(e) => setTempStartDate(e.target.value)}
                      className={`w-full border rounded-lg px-2 py-1.5 text-xs font-mono focus:outline-none ${inputBg}`}
                    />
                  </div>
                  <div>
                    <label className={`block text-[10px] font-semibold mb-1 ${mutedText}`}>
                      Data de Fim
                    </label>
                    <input
                      type="date"
                      value={tempEndDate}
                      onChange={(e) => setTempEndDate(e.target.value)}
                      className={`w-full border rounded-lg px-2 py-1.5 text-xs font-mono focus:outline-none ${inputBg}`}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsCalendarOpen(false)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer ${mutedText} hover:underline`}
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleApplyCustomDates}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-[#004A75] hover:bg-[#003859] text-white cursor-pointer transition-colors"
                  >
                    Aplicar Período
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Institutional Segmented Filter Buttons (No Rainbow Badges) */}
          <div className={`flex flex-wrap items-center gap-1 p-1 rounded-lg border shrink-0 ${
            isDarkMode ? 'bg-slate-800/90 border-slate-700' : 'bg-slate-100 border-slate-200'
          }`}>
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors cursor-pointer ${
                statusFilter === 'ALL'
                  ? 'bg-[#004A75] text-white shadow-xs font-bold'
                  : isDarkMode ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Todas ({storesInPeriod.length})
            </button>

            <button
              onClick={() => setStatusFilter('CRITICAL')}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors cursor-pointer ${
                statusFilter === 'CRITICAL'
                  ? 'bg-[#004A75] text-white shadow-xs font-bold'
                  : isDarkMode ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Críticas ({criticalCount})
            </button>

            <button
              onClick={() => setStatusFilter('WARNING')}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors cursor-pointer ${
                statusFilter === 'WARNING'
                  ? 'bg-[#004A75] text-white shadow-xs font-bold'
                  : isDarkMode ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Atenção ({warningCount})
            </button>

            <button
              onClick={() => setStatusFilter('HEALTHY')}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors cursor-pointer ${
                statusFilter === 'HEALTHY'
                  ? 'bg-[#004A75] text-white shadow-xs font-bold'
                  : isDarkMode ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Saudáveis ({healthyCount})
            </button>

            {blockedCount > 0 && (
              <button
                onClick={() => setStatusFilter('BLOCKED')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold transition-colors cursor-pointer ${
                  statusFilter === 'BLOCKED'
                    ? 'bg-[#004A75] text-white shadow-xs font-bold'
                    : isDarkMode ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Lock className="w-3 h-3" />
                <span>Congeladas ({blockedCount})</span>
              </button>
            )}
          </div>

        </div>

      </div>

      {/* Main Stores Table in Strictly Institutional Palette (Semaphore ONLY in Volume progress bars) */}
      <div className={`${panelBg} border rounded-xl overflow-hidden shadow-xs transition-colors`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[#004A75] text-white font-semibold border-b border-[#003B5C]">
                <th className="py-3.5 px-4 w-32">Classificação</th>
                <th className="py-3.5 px-3">
                  <button
                    onClick={() => handleSort('name')}
                    className="flex items-center gap-1 hover:text-[#00D2B4] transition-colors text-left cursor-pointer"
                  >
                    <span>Filial / Código</span>
                    <ArrowUpDown className="w-3 h-3 opacity-80" />
                  </button>
                </th>
                <th className="py-3.5 px-3">
                  <button
                    onClick={() => handleSort('region')}
                    className="flex items-center gap-1 hover:text-[#00D2B4] transition-colors cursor-pointer"
                  >
                    <span>Região / UF</span>
                    <ArrowUpDown className="w-3 h-3 opacity-80" />
                  </button>
                </th>
                <th className="py-3.5 px-3">
                  <button
                    onClick={() => handleSort('monthlyProposals')}
                    className="flex items-center gap-1 hover:text-[#00D2B4] transition-colors cursor-pointer"
                  >
                    <span>Volume Mês (Real vs Base)</span>
                    <ArrowUpDown className="w-3 h-3 opacity-80" />
                  </button>
                </th>
                <th className="py-3.5 px-3 text-right">
                  <button
                    onClick={() => handleSort('refusalRate')}
                    className="flex items-center gap-1 hover:text-[#00D2B4] transition-colors ml-auto cursor-pointer"
                  >
                    <span>Taxa Recusa</span>
                    <ArrowUpDown className="w-3 h-3 opacity-80" />
                  </button>
                </th>
                <th className="py-3.5 px-3 text-right">
                  <button
                    onClick={() => handleSort('defaultRate')}
                    className="flex items-center gap-1 hover:text-[#00D2B4] transition-colors ml-auto cursor-pointer"
                  >
                    <span>Inadimp. FPD</span>
                    <ArrowUpDown className="w-3 h-3 opacity-80" />
                  </button>
                </th>
                <th className="py-3.5 px-3 text-right">
                  <button
                    onClick={() => handleSort('estimatedPCLDRisk')}
                    className="flex items-center gap-1 hover:text-[#00D2B4] transition-colors ml-auto cursor-pointer"
                  >
                    <span>Risco PCLD</span>
                    <ArrowUpDown className="w-3 h-3 opacity-80" />
                  </button>
                </th>
                <th className="py-3.5 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className={`divide-y font-sans ${isDarkMode ? 'divide-slate-800' : 'divide-slate-100'}`}>
              {filteredStores.length === 0 ? (
                <tr>
                  <td colSpan={8} className={`py-12 text-center ${mutedText}`}>
                    <AlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <p className={`text-sm font-semibold ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                      Nenhuma filial encontrada com os filtros selecionados.
                    </p>
                    <p className="text-xs mt-1">Experimente limpar os filtros de cascata ou a busca.</p>
                  </td>
                </tr>
              ) : (
                filteredStores.map((store) => {
                  const deviation = Math.round(
                    ((store.monthlyProposals - store.expectedProposals) / store.expectedProposals) * 100
                  );
                  const isSevereDeviation = deviation > 150 || store.status === 'CRITICAL';

                  return (
                    <tr
                      key={store.id}
                      className={`group transition-colors ${
                        isDarkMode ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50/90'
                      }`}
                    >
                      {/* Institutional Status Column (Neutral/Petrol Blue palette only) */}
                      <td className="py-3.5 px-4">
                        {store.isBlocked ? (
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold ${institutionalTag}`}>
                            <Lock className="w-3 h-3 text-[#00D2B4] shrink-0" />
                            <span>Em Auditoria</span>
                          </span>
                        ) : store.status === 'CRITICAL' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold bg-[#004A75] text-white">
                            <span>Desvio Severo</span>
                          </span>
                        ) : store.status === 'WARNING' ? (
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold ${institutionalTag}`}>
                            <span>Monitoramento</span>
                          </span>
                        ) : (
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium ${
                            isDarkMode ? 'text-slate-400' : 'text-slate-600'
                          }`}>
                            <span>Regular</span>
                          </span>
                        )}
                      </td>

                      {/* Store name and code */}
                      <td className="py-3.5 px-3">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className={`font-bold ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                              {store.name}
                            </span>
                            {store.isCalibrated && (
                              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${institutionalTag}`}>
                                Score {store.calibratedScore} pts
                              </span>
                            )}
                          </div>
                          <div className={`flex items-center gap-2 text-[11px] mt-0.5 ${mutedText}`}>
                            <span className="font-mono font-semibold">{store.code}</span>
                            <span aria-hidden="true">·</span>
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3 opacity-70" />
                              {store.promoterName}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Region / UF */}
                      <td className={`py-3.5 px-3 whitespace-nowrap font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                        {store.macroRegion} / <strong className={isDarkMode ? 'text-white' : 'text-[#004A75]'}>{store.uf}</strong>
                      </td>

                      {/* Volume Mês (Real vs Base) -> THE ONLY ELEMENT WITH SEMAPHORIC PROGRESS BAR COLORS */}
                      <td className="py-3.5 px-3">
                        <div className="flex flex-col">
                          <div className="flex items-center justify-between text-xs max-w-[175px]">
                            <span className={`font-mono tabular-nums font-bold ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                              {store.monthlyProposals.toLocaleString('pt-BR')}
                            </span>
                            <span className={`font-mono tabular-nums text-[11px] ${mutedText}`}>
                              / {store.expectedProposals.toLocaleString('pt-BR')} base
                            </span>
                          </div>

                          {/* EXCLUSIVE SEMAPHORIC PROGRESS BAR (Red / Amber / Green) */}
                          <div className={`w-40 h-2 rounded-full mt-1.5 overflow-hidden flex ${
                            isDarkMode ? 'bg-slate-800' : 'bg-slate-100'
                          }`}>
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                isSevereDeviation
                                  ? 'bg-rose-500'
                                  : store.status === 'WARNING' || store.monthlyProposals > store.expectedProposals
                                  ? 'bg-amber-500'
                                  : 'bg-emerald-500'
                              }`}
                              style={{
                                width: `${Math.min(
                                  100,
                                  Math.max(
                                    18,
                                    Math.round((store.monthlyProposals / (store.expectedProposals * 2)) * 100)
                                  )
                                )}%`,
                              }}
                            />
                          </div>

                          <span className={`text-[10px] font-mono tabular-nums mt-0.5 ${mutedText}`}>
                            {deviation > 0 ? `+${deviation}% vs base histórica` : `Estável (${deviation}%)`}
                          </span>
                        </div>
                      </td>

                      {/* Refusal Rate (Neutral Institutional Typography) */}
                      <td className="py-3.5 px-3 text-right">
                        <span className={`font-mono tabular-nums font-bold text-xs ${
                          isDarkMode ? 'text-slate-200' : 'text-slate-800'
                        }`}>
                          {store.refusalRate.toFixed(1).replace('.', ',')}%
                        </span>
                      </td>

                      {/* Local Default (FPD) (Neutral Institutional Typography) */}
                      <td className="py-3.5 px-3 text-right">
                        <span className={`font-mono tabular-nums font-bold text-xs ${
                          isDarkMode ? 'text-slate-200' : 'text-[#004A75]'
                        }`}>
                          {store.defaultRate.toFixed(1).replace('.', ',')}%
                        </span>
                      </td>

                      {/* Estimated PCLD Risk */}
                      <td className="py-3.5 px-3 text-right">
                        <div className="flex flex-col items-end">
                          <span className={`font-mono tabular-nums font-bold text-xs ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                            R$ {store.estimatedPCLDRisk.toLocaleString('pt-BR')}
                          </span>
                          <span className={`text-[10px] ${mutedText}`}>
                            {store.isBlocked ? 'Protegido' : 'Exposto'}
                          </span>
                        </div>
                      </td>

                      {/* Action buttons (Institutional Petrol Blue & Cyan Accent) */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onInspectStore(store)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                              store.status === 'CRITICAL' && !store.isBlocked
                                ? 'bg-[#004A75] hover:bg-[#003859] text-white shadow-2xs'
                                : isDarkMode
                                ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                                : 'bg-slate-100 hover:bg-slate-200 text-[#004A75] border border-slate-200'
                            }`}
                          >
                            <FileSearch className="w-3.5 h-3.5 text-[#00D2B4]" />
                            <span>Raio-X Forense</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer Summary */}
        <div className={`p-3 border-t text-xs flex flex-wrap items-center justify-between gap-2 ${
          isDarkMode ? 'bg-slate-900/60 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
        }`}>
          <div>
            Exibindo <strong>{filteredStores.length}</strong> de <strong>{stores.length}</strong> filiais representativas · Período: <strong>{dateRange.presetLabel}</strong>
          </div>
          <div className="flex items-center gap-4 text-[11px] font-medium">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-1.5 rounded-full bg-rose-500"></span> Barra Vermelha: Desvio Grave (&gt;150%)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-1.5 rounded-full bg-amber-500"></span> Barra Âmbar: Atenção
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-1.5 rounded-full bg-emerald-500"></span> Barra Verde: Saudável
            </span>
          </div>
        </div>

      </div>

    </div>
  );
};
