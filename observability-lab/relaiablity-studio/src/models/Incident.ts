export interface Incident {
  id: string;
  service: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: string;
  status: 'open' | 'investigating' | 'resolved';
}
