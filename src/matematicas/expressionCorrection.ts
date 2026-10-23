import { parse } from 'mathjs';

export interface ExpressionCorrection {
    original: string;
    corrected: string;
    fixes: string[];
}

interface Transform {
    fix: string;
    apply: (expression: string) => string;
}

const TRANSFORMS: Transform[] = [
    {
        fix: 'se cambió la coma decimal por punto',
        apply: (s) => s.replace(/(\d),(\d)/g, '$1.$2')
    },
    {
        fix: 'se cambió X mayúscula por x',
        apply: (s) => s.replace(/X/g, 'x')
    },
    {
        fix: 'se cambió ** por ^',
        apply: (s) => s.replace(/\*\*/g, '^')
    },
    {
        fix: 'se reemplazó sen/asen por sin/asin',
        apply: (s) => s.replace(/asen\s*\(/g, 'asin(').replace(/sen\s*\(/g, 'sin(')
    },
    {
        fix: 'se reemplazó ctg por cot',
        apply: (s) => s.replace(/ctg\s*\(/g, 'cot(')
    },
    {
        fix: 'se reemplazó tg por tan',
        apply: (s) => s.replace(/tg\s*\(/g, 'tan(')
    },
    {
        fix: 'se reemplazó raiz por sqrt',
        apply: (s) => s.replace(/raiz\s*\(/g, 'sqrt(')
    },
    {
        fix: 'se reemplazó ln por log',
        apply: (s) => s.replace(/ln\s*\(/g, 'log(')
    },
    {
        fix: 'se reemplazó π por pi',
        apply: (s) => s.replace(/π/g, 'pi')
    },
    {
        fix: 'se agregaron los signos de multiplicación faltantes',
        apply: (s) => s
            .replace(/\)\s*(?=[a-zA-Zπ(])/g, ')*')
            .replace(/(?<![\w.])(\d+(?:\.\d+)?)\s*(?=[a-zA-Zπ])(?![eE][+-]?\d)/g, '$1*')
            .replace(/(?<![\w.])x\s*\(/g, 'x*(')
            .replace(/(?<![\w.])(\d+(?:\.\d+)?)\s*\(/g, '$1*(')
    }
];

const PROBE_POINTS = [0.5, 1, -1, 2, 3];

export function isValidExpression(expression: string): boolean {
    if (!expression || expression.trim() === '') return false;

    let compiled;
    try {
        compiled = parse(expression).compile();
    } catch {
        return false;
    }

    for (const x of PROBE_POINTS) {
        try {
            const value = compiled.evaluate({ x });
            if (value !== undefined) return true;
        } catch {
            continue;
        }
    }

    return false;
}

export function hasBalancedParentheses(expression: string): boolean {
    let depth = 0;
    for (const ch of expression) {
        if (ch === '(') depth++;
        if (ch === ')') depth--;
        if (depth < 0) return false;
    }
    return depth === 0;
}

export function suggestCorrection(expression: string): ExpressionCorrection | null {
    if (!expression || expression.trim() === '') return null;
    if (isValidExpression(expression)) return null;

    let current = expression.trim();
    const fixes: string[] = [];

    for (const transform of TRANSFORMS) {
        const next = transform.apply(current);
        if (next !== current) {
            fixes.push(transform.fix);
            current = next;
        }
        if (isValidExpression(current)) {
            return { original: expression, corrected: current, fixes };
        }
    }

    return null;
}

export function normalizeExpression(expression: string): string {
    return TRANSFORMS.reduce((current, transform) => transform.apply(current), expression.trim());
}
