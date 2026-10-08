import type {DecisionOutcome} from '../src/heuristic';
export const TRIALS:Record<string,string[]>;
export function trialFeatures(name:string|undefined,outcome?:DecisionOutcome):number[];
