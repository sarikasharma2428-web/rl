export interface SLO {
  serviceName: string;
  objective: number;
  errorBudget: number;
  burnRate: number;
  status: string;
}
