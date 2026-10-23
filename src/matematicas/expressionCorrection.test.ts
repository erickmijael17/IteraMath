import { describe, it, expect } from 'vitest';
import {
    isValidExpression,
    hasBalancedParentheses,
    suggestCorrection,
    normalizeExpression
} from './expressionCorrection';

describe('isValidExpression', () => {
    it('acepta expresiones válidas', () => {
        expect(isValidExpression('x^2 + 3*x - 5')).toBe(true);
        expect(isValidExpression('sin(x)')).toBe(true);
        expect(isValidExpression('exp(-x) - 3')).toBe(true);
        expect(isValidExpression('2x')).toBe(true);
    });

    it('rechaza expresiones inválidas', () => {
        expect(isValidExpression('sen(x)')).toBe(false);
        expect(isValidExpression('')).toBe(false);
        expect(isValidExpression('   ')).toBe(false);
        expect(isValidExpression('2**3')).toBe(false);
        expect(isValidExpression('sin(x')).toBe(false);
        expect(isValidExpression('raiz(x)')).toBe(false);
    });
});

describe('hasBalancedParentheses', () => {
    it('acepta paréntesis balanceados', () => {
        expect(hasBalancedParentheses('sin(x)')).toBe(true);
        expect(hasBalancedParentheses('')).toBe(true);
        expect(hasBalancedParentheses('(x+1)*(x-1)')).toBe(true);
    });

    it('rechaza paréntesis desbalanceados', () => {
        expect(hasBalancedParentheses('sin(x')).toBe(false);
        expect(hasBalancedParentheses('(x))')).toBe(false);
        expect(hasBalancedParentheses(')(')).toBe(false);
    });
});

describe('suggestCorrection', () => {
    it('corrige funciones en español', () => {
        expect(suggestCorrection('sen(x)')?.corrected).toBe('sin(x)');
        expect(suggestCorrection('raiz(x+1)')?.corrected).toBe('sqrt(x+1)');
        expect(suggestCorrection('ln(x)')?.corrected).toBe('log(x)');
        expect(suggestCorrection('tg(x)')?.corrected).toBe('tan(x)');
        expect(suggestCorrection('asen(x)')?.corrected).toBe('asin(x)');
    });

    it('corrige X mayúscula', () => {
        expect(suggestCorrection('X^2 + 1')?.corrected).toBe('x^2 + 1');
    });

    it('corrige potencia estilo Python', () => {
        expect(suggestCorrection('2**3 - x')?.corrected).toBe('2^3 - x');
    });

    it('corrige coma decimal', () => {
        expect(suggestCorrection('2,5*x')?.corrected).toBe('2.5*x');
    });

    it('corrige el símbolo pi', () => {
        expect(suggestCorrection('x^2 + π')?.corrected).toBe('x^2 + pi');
    });

    it('acumula varias correcciones', () => {
        const result = suggestCorrection('sen(2,5X)');
        expect(result?.corrected).toBe('sin(2.5x)');
        expect(result?.fixes.length).toBeGreaterThanOrEqual(2);
    });

    it('produce una corrección evaluable para funciones mal escritas con coeficiente', () => {
        const result = suggestCorrection('2sen(x)');
        expect(result).not.toBeNull();
        expect(isValidExpression(result!.corrected)).toBe(true);
        expect(result!.corrected).toContain('sin');
    });

    it('no sugiere nada para expresiones válidas', () => {
        expect(suggestCorrection('x^2 + 3*x - 5')).toBeNull();
        expect(suggestCorrection('2x')).toBeNull();
    });

    it('no sugiere nada cuando el error no es corregible', () => {
        expect(suggestCorrection('sen(x')).toBeNull();
        expect(suggestCorrection('+++')).toBeNull();
        expect(suggestCorrection('')).toBeNull();
    });
});

describe('normalizeExpression', () => {
    it('hace explícita la multiplicación implícita', () => {
        expect(normalizeExpression('2x + x(x+1)')).toBe('2*x + x*(x+1)');
        expect(normalizeExpression('(x+1)(x-1)')).toBe('(x+1)*(x-1)');
        expect(normalizeExpression('2(x+1)')).toBe('2*(x+1)');
        expect(normalizeExpression('sin(x)cos(x)')).toBe('sin(x)*cos(x)');
        expect(normalizeExpression('2 pi')).toBe('2*pi');
    });

    it('normaliza nombres de funciones junto con la multiplicación', () => {
        expect(normalizeExpression('sen(2x)')).toBe('sin(2*x)');
    });

    it('no altera notación científica', () => {
        expect(normalizeExpression('2e-3*x')).toBe('2e-3*x');
        expect(normalizeExpression('1e6 + x')).toBe('1e6 + x');
    });

    it('no altera llamadas con nombre terminado en dígito como log10', () => {
        expect(normalizeExpression('log10(x)')).toBe('log10(x)');
    });

    it('no altera expresiones ya normalizadas', () => {
        expect(normalizeExpression('x^2 + 3*x - 5')).toBe('x^2 + 3*x - 5');
        expect(normalizeExpression('2*sin(x)')).toBe('2*sin(x)');
    });
});
