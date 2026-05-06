export type SyncOperation = 'create' | 'update' | 'delete';
export type SyncEntityType = 'notiz' | 'termin' | 'kontakt' | 'angebot' | 'bautagebuch';
export type SyncQueueStatus = 'pending' | 'processing' | 'failed' | 'completed';

export interface SyncQueueItem {
  id?: number;
  entity_type: SyncEntityType;
  entity_id: string;
  operation: SyncOperation;
  payload: Record<string, unknown>;
  created_at: number;
  attempts: number;
  last_attempt_at?: number;
  error_message?: string;
  status: SyncQueueStatus;
  priority: number;
}

export interface SyncResult {
  success: boolean;
  synced_count: number;
  failed_count: number;
  conflicts: SyncConflict[];
}

export interface SyncConflict {
  entity_type: SyncEntityType;
  entity_id: string;
  local_version: number;
  server_version: number;
  resolution: 'server_wins' | 'local_wins' | 'manual';
}
