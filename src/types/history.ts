import { 
    BisectionInput, BisectionResult, 
    FalsePositionInput, FalsePositionResult, 
    FixedPointInput, FixedPointResult, 
    NewtonRaphsonInput, NewtonRaphsonResult, 
    SecantInput, SecantResult, 
    MullerInput, MullerResult 
} from './numerical';

export interface BaseHistoryEntry {
    id: string;
    createdAt: string; // ISO 8601
}

export interface BisectionHistoryEntry extends BaseHistoryEntry {
    method: 'bisection';
    input: BisectionInput;
    result: BisectionResult;
}

export interface FalsePositionHistoryEntry extends BaseHistoryEntry {
    method: 'false-position';
    input: FalsePositionInput;
    result: FalsePositionResult;
}

export interface FixedPointHistoryEntry extends BaseHistoryEntry {
    method: 'fixed-point';
    input: FixedPointInput;
    result: FixedPointResult;
}

export interface NewtonRaphsonHistoryEntry extends BaseHistoryEntry {
    method: 'newton-raphson';
    input: NewtonRaphsonInput;
    result: NewtonRaphsonResult;
}

export interface SecantHistoryEntry extends BaseHistoryEntry {
    method: 'secant';
    input: SecantInput;
    result: SecantResult;
}

export interface MullerHistoryEntry extends BaseHistoryEntry {
    method: 'muller';
    input: MullerInput;
    result: MullerResult;
}

export type HistoryEntry =
    | BisectionHistoryEntry
    | FalsePositionHistoryEntry
    | FixedPointHistoryEntry
    | NewtonRaphsonHistoryEntry
    | SecantHistoryEntry
    | MullerHistoryEntry;
