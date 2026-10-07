export interface MaintenanceState {
  isActive: boolean;
  reason: string;
  scheduledEnd?: string;
  activatedAt?: string;
  activatedBy?: string;
}

const MAINTENANCE_KEY = 'xentro_maintenance_state';

export const DEFAULT_MAINTENANCE_STATE: MaintenanceState = {
  isActive: false,
  reason: 'Scheduled infrastructure upgrade and core performance optimization. Service will resume shortly.',
  scheduledEnd: 'Approximately 30-45 minutes',
};

export function getMaintenanceState(): MaintenanceState {
  if (typeof window === 'undefined') return DEFAULT_MAINTENANCE_STATE;
  try {
    const stored = localStorage.getItem(MAINTENANCE_KEY);
    if (!stored) return DEFAULT_MAINTENANCE_STATE;
    return JSON.parse(stored) as MaintenanceState;
  } catch {
    return DEFAULT_MAINTENANCE_STATE;
  }
}

export function setMaintenanceState(state: MaintenanceState): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(MAINTENANCE_KEY, JSON.stringify(state));
    window.dispatchEvent(new CustomEvent('xentro-maintenance-changed', { detail: state }));
  } catch (err) {
    console.error('Failed to persist maintenance state', err);
  }
}

export function clearMaintenanceState(): void {
  setMaintenanceState({
    isActive: false,
    reason: '',
    scheduledEnd: '',
  });
}
