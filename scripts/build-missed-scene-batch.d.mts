import type {SceneBatch} from '../review/missed-scene-data';
export function buildMissedBatch(stories:{file:string;title:string;meta:{words?:number;characters?:string[];relationships?:string[];freeforms?:string[]};paras:string[];sourceSha:string;paragraphSha:string;html:string}[],options:{seed?:string;referenceCommit:string;width?:number}):SceneBatch;
