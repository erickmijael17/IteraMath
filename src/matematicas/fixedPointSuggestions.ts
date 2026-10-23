import { parse, MathNode } from 'mathjs';
import { createExpression } from './expression';
import { createDerivative } from './derivative';
import { normalizeExpression } from './expressionCorrection';
import { findRootCandidates } from './rootCandidates';

export interface FixedPointSuggestion {
    expression: string;
    originLabel: string;
    rootApprox: number;
    slopeMagnitude: number;
    isConvergent?: boolean;
    variationIndex?: number;
}

interface SignedTerm {
    node: MathNode;
    sign: 1 | -1;
}

interface PowerTerm {
    coefficient: number;
    power: number;
}

const MAX_POWER = 3;
const MAX_SUGGESTIONS = 3;

const isParenthesis = (node: MathNode): boolean =>
    Boolean((node as any).isParenthesisNode);

const isOperator = (node: MathNode): boolean =>
    Boolean((node as any).isOperatorNode);

const isVariable = (node: MathNode): boolean =>
    Boolean((node as any).isSymbolNode && (node as any).name === 'x');

const isConstant = (node: MathNode): boolean =>
    Boolean((node as any).isConstantNode);

const flattenTerms = (node: MathNode, sign: 1 | -1 = 1): SignedTerm[] => {
    if (isParenthesis(node)) {
        return flattenTerms((node as any).content, sign);
    }

    if (isOperator(node)) {
        const op = (node as any).op;
        const args = (node as any).args as MathNode[];

        if (args.length === 2 && (op === '+' || op === '-')) {
            const nextSign: 1 | -1 = op === '-' ? (sign === 1 ? -1 : 1) : sign;
            return [...flattenTerms(args[0], sign), ...flattenTerms(args[1], nextSign)];
        }

        if (args.length === 1 && op === '-') {
            return flattenTerms(args[0], sign === 1 ? -1 : 1);
        }
    }

    return [{ node, sign }];
};

const classifyPowerTerm = (node: MathNode): PowerTerm | null => {
    if (isParenthesis(node)) {
        return classifyPowerTerm((node as any).content);
    }

    if (isVariable(node)) {
        return { coefficient: 1, power: 1 };
    }

    if (isOperator(node)) {
        const op = (node as any).op;
        const args = (node as any).args as MathNode[];

        if (op === '^' && args.length === 2 && isVariable(args[0]) && isConstant(args[1])) {
            const power = Number((args[1] as any).value);
            if (Number.isInteger(power) && power >= 1 && power <= MAX_POWER) {
                return { coefficient: 1, power };
            }
            return null;
        }

        if (op === '*' && args.length === 2) {
            const constIndex = isConstant(args[0]) ? 0 : isConstant(args[1]) ? 1 : -1;
            if (constIndex === -1) return null;
            const other = classifyPowerTerm(args[1 - constIndex]);
            if (!other) return null;
            const coefficient = Number((args[constIndex] as any).value) * other.coefficient;
            if (!Number.isFinite(coefficient) || coefficient === 0) return null;
            return { coefficient, power: other.power };
        }
    }

    return null;
};

const buildSignedSum = (terms: SignedTerm[]): string => {
    if (terms.length === 0) return '0';

    return terms
        .map((term, index) => {
            const text = term.node.toString();
            if (index === 0) return term.sign === 1 ? text : `-${text}`;
            return term.sign === 1 ? ` + ${text}` : ` - ${text}`;
        })
        .join('')
        .trim();
};

const wrap = (text: string): string => `(${text})`;

const buildDespeje = (terms: SignedTerm[], index: number): string | null => {
    const chosen = terms[index];
    const classification = classifyPowerTerm(chosen.node);
    if (!classification || classification.coefficient === 0) return null;

    const others = terms
        .filter((_, i) => i !== index)
        .map(term => ({
            node: term.node,
            sign: (chosen.sign === 1 ? -term.sign : term.sign) as 1 | -1
        }));
    const rest = buildSignedSum(others);

    if (rest === '0') return null;

    const base = classification.coefficient === 1
        ? wrap(rest)
        : `(${rest}/${classification.coefficient})`;

    if (classification.power === 1) return base;
    if (classification.power === 2) return `sqrt(${base})`;
    return `${base}^(1/${classification.power})`;
};

const validateSuggestion = (
    expression: string,
    originLabel: string,
    rootApprox: number
): FixedPointSuggestion | null => {
    try {
        const evaluator = createExpression(expression);
        const fixedValue = evaluator.evaluate(rootApprox);
        if (Math.abs(fixedValue - rootApprox) > 1e-3 * Math.max(1, Math.abs(rootApprox))) return null;

        const derivative = createDerivative(expression);
        const slope = derivative.evaluator.evaluate(rootApprox);
        if (!Number.isFinite(slope)) return null;

        const slopeMagnitude = Math.abs(slope);
        if (slopeMagnitude >= 1) return null;

        return {
            expression: normalizeExpression(expression),
            originLabel,
            rootApprox,
            slopeMagnitude,
            isConvergent: true
        };
    } catch {
        return null;
    }
};

export function suggestFixedPointFunctions(
    expression: string,
    rootApprox?: number
): FixedPointSuggestion[] {
    const normalized = normalizeExpression(expression);

    let targetRoot = rootApprox;
    if (targetRoot === undefined || !Number.isFinite(targetRoot)) {
        try {
            targetRoot = findRootCandidates(normalized)[0]?.rootApprox;
        } catch {
            targetRoot = undefined;
        }
    }
    if (targetRoot === undefined || !Number.isFinite(targetRoot)) return [];

    const candidates: FixedPointSuggestion[] = [];

    try {
        const terms = flattenTerms(parse(normalized));
        terms.forEach((_, index) => {
            const despeje = buildDespeje(terms, index);
            if (!despeje) return;
            const suggestion = validateSuggestion(despeje, 'Despeje', targetRoot!);
            if (suggestion) candidates.push(suggestion);
        });
    } catch {
        return [];
    }

    try {
        const derivative = createDerivative(normalized);
        const newtonForm = `x - ${wrap(normalized)}/${wrap(derivative.expressionString)}`;
        const newton = validateSuggestion(newtonForm, 'Newton', targetRoot);
        if (newton) candidates.push(newton);

        const slope = derivative.evaluator.evaluate(targetRoot);
        if (Number.isFinite(slope) && Math.abs(slope) > 1e-12) {
            const chordForm = `x - ${wrap(normalized)}/(${slope})`;
            const chord = validateSuggestion(chordForm, 'Cuerda', targetRoot);
            if (chord) candidates.push(chord);
        }
    } catch {
        return dedupeSuggestions(candidates);
    }

    return dedupeSuggestions(candidates).slice(0, MAX_SUGGESTIONS);
}

export function getFixedPointVariations(
    expression: string,
    initialX?: number
): FixedPointSuggestion[] {
    const suggestions = suggestFixedPointFunctions(expression, initialX);
    if (suggestions.length >= 3) {
        return suggestions.map((s, i) => ({ ...s, variationIndex: i + 1, isConvergent: s.slopeMagnitude < 1 }));
    }

    const seen = new Set(suggestions.map(s => s.expression));
    const result: FixedPointSuggestion[] = suggestions.map((s, i) => ({
        ...s,
        variationIndex: i + 1,
        isConvergent: s.slopeMagnitude < 1
    }));

    const testX = initialX !== undefined && Number.isFinite(initialX) ? initialX : (suggestions[0]?.rootApprox ?? 1);
    const normalized = normalizeExpression(expression);

    const fallbacks = [
        { expr: `x - (${normalized})`, label: 'Canónica Aditiva' },
        { expr: `x + (${normalized})`, label: 'Inversa Aditiva' },
        { expr: `x - (${normalized})/2`, label: 'Relajación (λ=0.5)' }
    ];

    for (const fb of fallbacks) {
        if (result.length >= 3) break;
        const normExpr = normalizeExpression(fb.expr);
        if (seen.has(normExpr)) continue;

        try {
            const evaluator = createExpression(normExpr);
            const val = evaluator.evaluate(testX);
            if (!Number.isFinite(val)) continue;

            let slopeMag = 1.0;
            try {
                const deriv = createDerivative(normExpr);
                const s = deriv.evaluator.evaluate(testX);
                if (Number.isFinite(s)) slopeMag = Math.abs(s);
            } catch {
                slopeMag = 1.0;
            }

            seen.add(normExpr);
            result.push({
                expression: normExpr,
                originLabel: fb.label,
                rootApprox: testX,
                slopeMagnitude: slopeMag,
                isConvergent: slopeMag < 1,
                variationIndex: result.length + 1
            });
        } catch {
            continue;
        }
    }

    return result.slice(0, 3);
}

const dedupeSuggestions = (candidates: FixedPointSuggestion[]): FixedPointSuggestion[] => {
    const seen = new Set<string>();
    return candidates.filter(suggestion => {
        if (seen.has(suggestion.expression)) return false;
        seen.add(suggestion.expression);
        return true;
    });
};
