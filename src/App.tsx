import React, { useState, useEffect, useMemo } from 'react';
import { PartnerStore, ActiveTab, DateRangeFilter, UserRole } from './types';
import { INITIAL_STORES, HISTORICAL_COHORTS } from './data/mockStores';
import { Header } from './components/Header';
import { KPIBanner } from './components/KPIBanner';
import { FarolModule } from './components/FarolModule';
import { RadarModule } from './components/RadarModule';
import { HistoricalViewModule } from './components/HistoricalViewModule';
import { StoreDrawer } from './components/StoreDrawer';
import { Toast, ToastMessage } from './components/Toast';

const DEFAULT_DATE_RANGE: DateRangeFilter = {
  presetLabel: 'Este Mês',
  startDate: '2026-10-01',
  endDate: '2026-10-31',
  daysMultiplier: 1.0,
};

export default function App() {
  // Navigation: 'farol' | 'radar' | 'historico'
  const [activeTab, setActiveTab] = useState<ActiveTab>('farol');
  
  // RBAC User Role State: Default 'MANAGER' ("Mariana Souza • Gerente de Área" authenticated via corporate SSO)
  const [userRole, setUserRole] = useState<UserRole>('MANAGER');

  // Calendar Date Range Filter (for Farol Module)
  const [dateRange, setDateRange] = useState<DateRangeFilter>(DEFAULT_DATE_RANGE);

  // Theme State (Light / Dark Mode)
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('tribanco_dark_mode') === 'true';
    }
    return false;
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('tribanco_dark_mode', String(isDarkMode));
      document.documentElement.classList.toggle('dark', isDarkMode);
    }
  }, [isDarkMode]);

  // Stores Data State
  const [stores, setStores] = useState<PartnerStore[]>(() => {
    return JSON.parse(JSON.stringify(INITIAL_STORES));
  });

  // Selected Store for Inspection / Radar
  const [inspectedStore, setInspectedStore] = useState<PartnerStore | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [radarSelectedStoreId, setRadarSelectedStoreId] = useState<string>('store-recife');

  // Executive KPIs
  const [currentDefaultRate, setCurrentDefaultRate] = useState(7.2);
  const [preservedPCLD, setPreservedPCLD] = useState(420000);
  const initialDefaultRate = 7.2;

  // Toast Notifications
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (type: ToastMessage['type'], title: string, description: string) => {
    const id = 'toast-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
    setToasts((prev) => [...prev, { id, type, title, description }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Handler: Change RBAC Profile (discreet demo toggle on SSO identity)
  const handleChangeUserRole = (newRole: UserRole) => {
    setUserRole(newRole);
    if (newRole === 'MANAGER') {
      addToast(
        'success',
        'SSO Corporativo: Mariana Souza • Gerente de Área',
        'Alçada gerencial reconhecida automaticamente. Bloqueio de promotores e congelamento de lotes habilitados.'
      );
    } else {
      addToast(
        'warning',
        'Simulação SSO: Analista de Crédito (Sem Alçada)',
        'Visualizando esteira com perfil operacional. Ações de bloqueio permanecem travadas por governança.'
      );
    }
  };

  // Handler: Restricted Action Attempt by Analyst
  const handleRestrictedAttempt = () => {
    addToast(
      'warning',
      '🔒 Ação restrita a Gerentes de Área',
      'Permissão insuficiente: seu perfil atual (Analista de Crédito) não possui alçada decisória para suspender promotores e congelar lotes.'
    );
  };

  // Critical alerts count
  const criticalAlertsCount = useMemo(() => {
    return stores.filter((s) => s.status === 'CRITICAL' && !s.isBlocked).length;
  }, [stores]);

  // Scaled total proposals for Farol KPI banner based on calendar period
  const scaledTotalProposals = useMemo(() => {
    return Math.max(100, Math.round(31550 * (dateRange.daysMultiplier || 1)));
  }, [dateRange.daysMultiplier]);

  // Handler: Inspect Store (Open Drawer)
  const handleInspectStore = (store: PartnerStore) => {
    setInspectedStore(store);
    setIsDrawerOpen(true);
  };

  // Handler: Toggle Block / Unblock Store (Liga / Desliga) - Requires MANAGER role
  const handleToggleBlockStore = (storeToToggle: PartnerStore) => {
    if (userRole !== 'MANAGER') {
      handleRestrictedAttempt();
      return;
    }

    const isCurrentlyBlocked = !!storeToToggle.isBlocked;
    const now = new Date();
    const timestamp = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const riskAmount = storeToToggle.estimatedPCLDRisk;

    if (!isCurrentlyBlocked) {
      // 1. AÇÃO: BLOQUEAR PROMOTOR & CONGELAR LOTE
      setStores((prev) =>
        prev.map((s) =>
          s.id === storeToToggle.id
            ? {
                ...s,
                isBlocked: true,
                blockedAt: timestamp,
                auditNotes: `Ação executada com alçada de Gerente de Área (Mariana Souza) às ${timestamp}. Lote de ${s.monthlyProposals.toLocaleString('pt-BR')} propostas congelado cautelarmente.`,
              }
            : s
        )
      );

      setInspectedStore((prev) =>
        prev && prev.id === storeToToggle.id
          ? {
              ...prev,
              isBlocked: true,
              blockedAt: timestamp,
              auditNotes: `Ação executada com alçada de Gerente de Área (Mariana Souza) às ${timestamp}.`,
            }
          : prev
      );

      setPreservedPCLD((prev) => prev + riskAmount);
      setCurrentDefaultRate((prev) => Math.max(4.8, Number((prev - 1.1).toFixed(1))));

      addToast(
        'success',
        `Ação executada com alçada de Gerente de Área (Mariana Souza)`,
        `Promotor bloqueado cautelarmente (${storeToToggle.code}). R$ ${riskAmount.toLocaleString('pt-BR')} protegidos em PCLD.`
      );
    } else {
      // 2. AÇÃO: DESBLOQUEAR PROMOTOR & LIBERAR LOTE
      setStores((prev) =>
        prev.map((s) =>
          s.id === storeToToggle.id
            ? {
                ...s,
                isBlocked: false,
                blockedAt: undefined,
                auditNotes: undefined,
              }
            : s
        )
      );

      setInspectedStore((prev) =>
        prev && prev.id === storeToToggle.id
          ? { ...prev, isBlocked: false, blockedAt: undefined, auditNotes: undefined }
          : prev
      );

      setPreservedPCLD((prev) => Math.max(0, prev - riskAmount));
      setCurrentDefaultRate((prev) => Math.min(7.2, Number((prev + 1.1).toFixed(1))));

      addToast(
        'alert',
        `Ação executada com alçada de Gerente de Área (Mariana Souza)`,
        `Promotor e lote liberados da quarentena (${storeToToggle.code}).`
      );
    }
  };

  // Handler: Navigate to Radar from Drawer or Farol
  const handleNavigateToRadar = (storeToCalibrate: PartnerStore) => {
    setRadarSelectedStoreId(storeToCalibrate.id);
    setIsDrawerOpen(false);
    setActiveTab('radar');
  };

  // Handler: Homologate Score Threshold in Radar
  const handleHomologateScore = (
    storeId: string,
    newScore: number,
    savedPCLD: number,
    projectedDefault: number
  ) => {
    const targetStore = stores.find((s) => s.id === storeId);
    if (!targetStore) return;

    setStores((prev) =>
      prev.map((s) =>
        s.id === storeId
          ? {
              ...s,
              calibratedScore: newScore,
              isCalibrated: true,
              defaultRate: projectedDefault,
              status: projectedDefault <= 5.0 ? 'HEALTHY' : 'WARNING',
            }
          : s
      )
    );

    setPreservedPCLD((prev) => prev + savedPCLD);
    setCurrentDefaultRate((prev) => {
      const newRate = Math.max(4.8, Number((prev - 0.9).toFixed(1)));
      return newRate;
    });

    addToast(
      'success',
      `Nova Régua Homologada: ${targetStore.code}`,
      `Score de corte fixado em ${newScore} pontos. Inadimplência reduzida para ${projectedDefault.toFixed(1).replace('.', ',')}% e economia de R$ ${savedPCLD.toLocaleString('pt-BR')} em PCLD.`
    );
  };

  // Reset demo data to initial state
  const handleResetData = () => {
    setStores(JSON.parse(JSON.stringify(INITIAL_STORES)));
    setCurrentDefaultRate(7.2);
    setPreservedPCLD(420000);
    setRadarSelectedStoreId('store-recife');
    setIsDrawerOpen(false);
    setDateRange(DEFAULT_DATE_RANGE);
    setUserRole('MANAGER');
    addToast('alert', 'Dados Restaurados', 'O painel foi reinicializado para o estado original.');
  };

  const handleExportNotification = (msg: string) => {
    addToast('success', 'Exportação Concluída', msg);
  };

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors ${
      isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
    }`}>
      
      {/* Header with Navigation (Farol, Radar, Visão Histórica), RBAC Profile Selector & Theme Toggle */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onResetData={handleResetData}
        criticalAlertCount={criticalAlertsCount}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
        userRole={userRole}
        onChangeUserRole={handleChangeUserRole}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-[1560px] w-full mx-auto px-4 lg:px-8 py-6">
        
        {/* Tab 1: Módulo Farol (KPIBanner exclusively inside Farol to eliminate duplication in Radar) */}
        {activeTab === 'farol' && (
          <>
            <KPIBanner
              currentDefaultRate={currentDefaultRate}
              preservedPCLD={preservedPCLD}
              totalStores={2000}
              criticalAlertsCount={criticalAlertsCount}
              initialDefaultRate={initialDefaultRate}
              totalProposals={scaledTotalProposals}
              periodLabel={dateRange.presetLabel}
              isDarkMode={isDarkMode}
            />
            <FarolModule
              stores={stores}
              onInspectStore={handleInspectStore}
              onCalibrateStore={handleNavigateToRadar}
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
              isDarkMode={isDarkMode}
              onExportToast={handleExportNotification}
            />
          </>
        )}

        {/* Tab 2: Módulo Radar */}
        {activeTab === 'radar' && (
          <RadarModule
            stores={stores}
            selectedStoreId={radarSelectedStoreId}
            onSelectStoreId={setRadarSelectedStoreId}
            onHomologateScore={handleHomologateScore}
            isDarkMode={isDarkMode}
            onExportToast={handleExportNotification}
          />
        )}

        {/* Tab 3: Visão Histórica & Painel de Controle 360° */}
        {activeTab === 'historico' && (
          <HistoricalViewModule
            stores={stores}
            cohorts={HISTORICAL_COHORTS}
            preservedPCLD={preservedPCLD}
            currentDefaultRate={currentDefaultRate}
            onInspectStore={handleInspectStore}
            onNavigateToRadar={handleNavigateToRadar}
            isDarkMode={isDarkMode}
            onExportToast={handleExportNotification}
          />
        )}

      </main>

      {/* Slide-over Drawer for Store Raio-X (Forensic Indicators, Daily Volume & RBAC Block Button) */}
      <StoreDrawer
        store={inspectedStore}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onToggleBlockStore={handleToggleBlockStore}
        onNavigateToRadar={handleNavigateToRadar}
        userRole={userRole}
        onRestrictedAttempt={handleRestrictedAttempt}
        isDarkMode={isDarkMode}
      />

      {/* Action Toast Notifications */}
      <Toast toasts={toasts} onDismiss={removeToast} />

      {/* Institutional Footer */}
      <footer className={`border-t py-4 text-center text-xs transition-colors ${
        isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-white border-slate-200 text-slate-500'
      }`}>
        <div className="max-w-[1560px] mx-auto px-4 lg:px-8 flex flex-wrap items-center justify-between gap-2">
          <span className={`font-semibold ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>
            Tribanco · O banco do varejista.
          </span>
          <span>
            Farol &amp; Radar · Esteira Preditiva de Cartões Parceiros
          </span>
        </div>
      </footer>

    </div>
  );
}
