export interface OwnerAnswer { key: string; owner: string; a?: string }
export function applyOwnerAnswers(answers: OwnerAnswer[], date: string, setDir?: string): Record<string, number>;
export function overrideOwnerAnswers(answers: OwnerAnswer[], date: string, setDir?: string): Record<string, number>;
