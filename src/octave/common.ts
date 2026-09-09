import { ComplexValue } from '../math/complex';

/**
 * Formatea un número real a su representación en string para GNU Octave.
 * Preserva toda la precisión posible de JavaScript.
 */
export function formatOctaveNumber(num: number): string {
    return num.toString();
}

/**
 * Formatea un valor complejo de IteraMath a la sintaxis de GNU Octave.
 * Soporta representaciones puramente reales, imaginarias o complejas.
 */
export function formatOctaveComplex(val: ComplexValue): string {
    const TOL = 1e-12;
    const re = Math.abs(val.re) < TOL ? 0 : val.re;
    const im = Math.abs(val.im) < TOL ? 0 : val.im;

    if (im === 0) return re.toString();
    
    const reStr = re !== 0 ? re.toString() : '';
    // Octave soporta 1i y -1i. Según la instrucción, 0 + 1i -> 1i
    const imAbsStr = Math.abs(im).toString();
    
    let sign = im > 0 ? '+' : '-';
    
    if (re === 0) {
        return `${im < 0 ? '-' : ''}${imAbsStr}i`;
    }
    
    return `${reStr} ${sign} ${imAbsStr}i`;
}

/**
 * Normaliza la sintaxis de la expresión matemática de IteraMath a GNU Octave.
 * Quita espacios innecesarios y valida operaciones básicas.
 */
export function formatOctaveExpression(expr: string): string {
    // Por ahora, las expresiones de mathjs utilizadas en IteraMath 
    // son ampliamente compatibles con Octave (sin, cos, exp, sqrt, ^).
    return expr.replace(/\s+/g, '');
}
