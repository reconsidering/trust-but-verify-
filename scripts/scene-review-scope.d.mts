import type {AuditHit} from '../src/heuristic';
import type {SceneBatch} from '../review/missed-scene-data';
export const SCORED_ACTS: string[];
export type ActWindow = {id:string;fic:string;from:number;to:number;windowSha:string;lane:string;sourceSha:string;updatedAt:string;events:{act:string;performer:string;receiver:string;from:number;to:number}[]};
export type ActInventory = {schema:'engine-sex-act-inventory/v1';batchId:string;referenceCommit:string;scope:{occurrence:string;acts:string[];hints:string;otherActivity:string;confidenceTraining:string};skippedUnfinished:string[];excludedContextEvents:number;sources:{file:string;title:string;sourceSha:string;paragraphSha:string;paragraphCount:number}[];windows:ActWindow[]};
export function actualActOf(hit:Pick<AuditHit,'kind'|'act'>):string|undefined;
export function actHitsForWindow<T extends Pick<AuditHit,'kind'|'act'|'para'>>(hits:T[],window:Pick<ActWindow,'from'|'to'>):T[];
export function buildActInventory(batch:SceneBatch,feedback:unknown):ActInventory;
