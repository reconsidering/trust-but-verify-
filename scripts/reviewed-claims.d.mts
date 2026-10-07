export type ReviewedClaim = {fic:string;sourceSha:string;paragraph:number;pattern:string;act:string;kind:string;a:string;b:string;role:string};
export function claimOf(hit:{para:number;via?:string;pattern?:string;act:string;kind:string;a?:string;b?:string;role?:string},fic:string,sourceSha:string):ReviewedClaim;
export function sameClaim(reviewed:ReviewedClaim,current:ReviewedClaim):boolean;
export function reviewedClaims(root:string):Map<string,ReviewedClaim|null>;
export function cacheFingerprint(files:string[],features:readonly string[]):string;
export function validRowsCache(cache:unknown,fingerprint:string,featureCount:number):boolean;
