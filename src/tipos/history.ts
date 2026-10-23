import { MethodId, MethodInput, SolveResult } from './numerical';

export interface HistoryEntry {
    id: string;
    createdAt: string;
    method: MethodId;
    input: MethodInput;
    result: SolveResult;
}
