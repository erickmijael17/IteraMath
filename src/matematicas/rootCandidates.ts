import { createExpression, Evaluator } from './expression';

export interface RootCandidate {
    a: number;
    b: number;
    rootApprox: number;
}

const DEFAULT_WINDOW: [number, number] = [-10, 10];
const DEFAULT_SAMPLES = 400;
const REFINE_STEPS = 40;
const MIN_SEPARATION = 1e-6;
const MAX_CANDIDATES = 6;

function evaluateSafe(evaluator: Evaluator, x: number): number | null {
    try {
        const value = evaluator.evaluate(x);
        return isFinite(value) ? value : null;
    } catch {
        return null;
    }
}

function refineRoot(evaluator: Evaluator, a: number, b: number): number {
    let lo = a;
    let hi = b;
    let fLo = evaluateSafe(evaluator, lo);

    for (let i = 0; i < REFINE_STEPS; i++) {
        const mid = (lo + hi) / 2;
        const fMid = evaluateSafe(evaluator, mid);
        if (fMid === null || fLo === null) break;
        if (fMid === 0) return mid;
        if (fLo * fMid < 0) {
            hi = mid;
        } else {
            lo = mid;
            fLo = fMid;
        }
    }

    return (lo + hi) / 2;
}

export function findRootCandidates(
    expression: string,
    window: [number, number] = DEFAULT_WINDOW
): RootCandidate[] {
    const evaluator = createExpression(expression);

    const [start, end] = window[0] < window[1] ? window : [window[1], window[0]];
    const step = (end - start) / (DEFAULT_SAMPLES - 1);

    const raw: RootCandidate[] = [];
    let prevX = start;
    let prevY = evaluateSafe(evaluator, prevX);

    for (let i = 1; i < DEFAULT_SAMPLES; i++) {
        const x = start + i * step;
        const y = evaluateSafe(evaluator, x);

        if (prevY !== null && y !== null && prevY * y <= 0 && !(prevY === 0 && y === 0)) {
            raw.push({ a: prevX, b: x, rootApprox: refineRoot(evaluator, prevX, x) });
        }

        prevX = x;
        prevY = y;
    }

    const sorted = raw.sort((c1, c2) => Math.abs(c1.rootApprox) - Math.abs(c2.rootApprox));
    const candidates: RootCandidate[] = [];

    for (const candidate of sorted) {
        const isDuplicate = candidates.some(
            c => Math.abs(c.rootApprox - candidate.rootApprox) < MIN_SEPARATION
        );
        if (!isDuplicate) {
            candidates.push(candidate);
        }
        if (candidates.length >= MAX_CANDIDATES) break;
    }

    return candidates;
}
