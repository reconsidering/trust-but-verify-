export type InventoryEvent={act:string;performer:string;receiver:string;from:number;to:number;scored?:boolean;ownerActId?:string;provenance?:string};
export type Inventory={schema?:string;batchId:string;windows:{id:string;fic:string;from:number;to:number;sourceSha:string;coverage?:string;events:InventoryEvent[]}[]};
export type ReplayHit={para:number;kind:string;act:string;a:string;b?:string;role?:string;via?:string};
export function actParticipants(hit:ReplayHit):string[];
export function replayInventories(inventories:Inventory[],snapshots:Map<string,{sourceSha:string;hits:ReplayHit[]}>,excluded?:Map<string,string>):{scope:string;totals:Record<string,number>;results:({id:string;status:string;act:string;[key:string]:unknown})[]};
