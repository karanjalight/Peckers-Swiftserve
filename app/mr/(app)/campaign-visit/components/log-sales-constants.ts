export const MR_COMMISSION_RATE = 0.025;

export const DRAFT_STORAGE_KEY = (mrId: string) => `mr-log-sales-draft:${mrId}`;

export function newLineId(): string {
  return `line_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}
