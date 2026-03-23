import { Idl } from '@coral-xyz/anchor';
import idlJson from './idl.json';

export const IDL = { 
  ...idlJson, 
  address: "4RfgHgQRwssnJuzShFwmZVEw7DjNJj5TFPLjFJWJ8MT1" 
} as unknown as Idl;

export type CrowdPass = Idl;

export function parseCampaignState(raw: any) {
  return {
    eventId: raw.eventId,
    title: raw.title,
    currentSol: (raw.currentFunding || 0) / 1e9,
    fundingGoalSol: (raw.fundingGoal || 0) / 1e9,
  };
}

export function parseCrowdPassError(err: any): string {
  return err?.message || 'Error desconocido';
}