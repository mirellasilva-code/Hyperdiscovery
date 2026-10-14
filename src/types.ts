export type StoreStatus = 'CRITICAL' | 'WARNING' | 'HEALTHY';
export type Timeframe = '1D' | '7D' | '30D';
export type ActiveTab = 'farol' | 'radar' | 'historico';

export interface DateRangeFilter {
  presetLabel: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  daysMultiplier: number; // ratio relative to 30-day month (e.g. 1.0 for 30 days, 0.5 for 15 days)
}

export interface WeeklyVolume {
  week: string;
  actual: number;
  threshold: number;
}

export interface DailyVolumePoint {
  day: string;
  actual: number;
  threshold: number;
}

export interface StoreMonthlyHistoryPoint {
  month: string;      // 'Mai/26' ... 'Out/26'
  proposals: number;
  defaultRate: number;
}

export interface OffendingAttribute {
  name: string;
  detail: string;
  riskLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  impactPct: number;
}

export interface PartnerStore {
  id: string;
  code: string;
  name: string;
  region: string;
  macroRegion: 'Sudeste' | 'Nordeste' | 'Sul';
  uf: string;
  monthlyProposals: number;
  expectedProposals: number;
  promoterName: string;
  refusalRate: number; // in percentage (e.g. 68)
  defaultRate: number; // in percentage (e.g. 14.2)
  currentScoreThreshold: number; // score threshold (e.g. 470)
  recommendedScoreThreshold: number; // suggested threshold (e.g. 620)
  status: StoreStatus;
  alertReason: string;
  estimatedPCLDRisk: number; // in R$
  isBlocked: boolean;
  blockedAt?: string;
  auditNotes?: string;
  weeklyVolume: WeeklyVolume[];
  dailyVolume: DailyVolumePoint[];
  monthlyHistory: StoreMonthlyHistoryPoint[];
  offendingAttributes: OffendingAttribute[];
  cnpjFicticio: string;
  calibratedScore?: number;
  isCalibrated?: boolean;
  calibrationHistory?: StoreCalibrationAuditEntry[];
}

export interface StoreCalibrationAuditEntry {
  id: string;
  timestamp: string; // "DD/MM/AAAA - HH:mm:ss"
  operator: string;  // e.g. "Mariana Souza • Gerente de Área • SSO: MSO-8492"
  previousScore: number;
  newScore: number;
  scoreDelta: number; // e.g. +150
  previousDefaultRate: number; // e.g. 10.4
  projectedDefaultRate: number; // e.g. 4.8
  calibrationReason: string;
  governanceStatus: string; // e.g. "Homologado (Alçada Gerencial)"
}

export interface HistoricalCohort {
  month: string;
  shortMonth: string;
  totalProposals: number;
  convertedProposals: number;
  conversionRate: number; // ~8.0%
  defaultRate: number; // 7.2% -> <5.0%
  monitoredStoresWithAlert: number;
  preservedPCLD: number;
  statusNote: string;
}

export type UserRole = 'ANALYST' | 'MANAGER';

export interface AuditAction {
  id: string;
  timestamp: string;
  userRole: UserRole;
  userName: string;
  actionType: 'BLOCK_STORE' | 'CALIBRATE_SCORE' | 'UNBLOCK_STORE' | 'AUDIT_REVIEW';
  storeCode: string;
  storeName: string;
  pcldDelta: number;
  description: string;
}
