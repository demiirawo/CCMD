export interface AuditEntry {
  timestamp: string;
  change: string;
  user?: string;
}

export interface ActionLogEntry {
  id: string;
  timestamp: string;
  itemTitle: string;
  mentionedAttendee: string;
  comment: string;
  action: string;
  dueDate: string;
  status?: "green" | "amber" | "red";
  closed?: boolean;
  closedDate?: string;
  sourceType?: "document" | "manual";
  sourceId?: string;
  auditTrail?: AuditEntry[];
}