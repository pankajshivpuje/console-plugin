export enum ChainsSigningStatus {
  Signed = 'signed',
  Unsigned = 'unsigned',
  Partial = 'partial',
  Unknown = 'unknown',
}

export interface ChainsTaskRunSigningDetail {
  name: string;
  pipelineTaskName?: string;
  signed: boolean;
  transparencyUrl?: string;
}

export interface ChainsSigningSummary {
  status: ChainsSigningStatus;
  totalTaskRuns: number;
  signedCount: number;
  unsignedCount: number;
  transparencyUrl?: string;
  taskRunDetails: ChainsTaskRunSigningDetail[];
}
