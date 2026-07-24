export type MemoryType =
  | 'insight'
  | 'project'
  | 'book'
  | 'preference'
  | 'conversation'
  | 'idea_capture'
  | 'capture_3am';

export type MemoryOrigin = 'conversation' | 'live' | 'upload' | 'auto';

export interface MemoryMetadata {
  request_id?: string;
  context?: {
    source?: string;
    related_memories?: string[];
    confidence?: number;
  };
  custom_data?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface MemoryRecord {
  id: string;
  owner_id: string;
  project_id: string | null;
  type: MemoryType;
  title: string | null;
  content: string;
  tags: string[];
  origin: MemoryOrigin;
  created_at: string;
  updated_at: string;
  metadata: MemoryMetadata;
}

export interface MemoryQuery {
  type?: MemoryType;
  search?: string;
  limit?: number;
}

export interface MemoryAuditLog {
  id: string;
  owner_id: string;
  memory_id: string;
  action: 'create' | 'update' | 'delete';
  changes: Record<string, unknown>;
  performed_at: string;
}
