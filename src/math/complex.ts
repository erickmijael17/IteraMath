import * as math from 'mathjs';

export interface ComplexValue {
    re: number;
    im: number;
}

/**
 * Convierte un número o un objeto math.Complex en un ComplexValue serializable.
 */
export function toComplexValue(val: number | math.Complex): ComplexValue {
    if (typeof val === 'number') {
        return { re: val, im: 0 };
    }
    return { re: val.re, im: val.im };
}

/**
 * Convierte un ComplexValue al objeto interno de mathjs.
 */
export function fromComplexValue(val: ComplexValue): math.Complex {
    return math.complex(val.re, val.im);
}

/**
 * Formatea un número complejo para la interfaz de usuario.
 * Omite la parte imaginaria si es 0 (dentro de una tolerancia).
 * Muestra "i" o "-i" en vez de "1i" o "-1i".
 */
export function formatComplex(val: ComplexValue, decimals: number = 6): string {
    const TOL = 1e-12;
    const re = Math.abs(val.re) < TOL ? 0 : val.re;
    const im = Math.abs(val.im) < TOL ? 0 : val.im;

    if (im === 0) return re.toFixed(decimals).replace(/\.?0+$/, '');
    
    const reStr = re !== 0 ? re.toFixed(decimals).replace(/\.?0+$/, '') : '';
    const imAbsStr = Math.abs(im) === 1 ? '' : Math.abs(im).toFixed(decimals).replace(/\.?0+$/, '');
    
    let sign = im > 0 ? '+' : '-';
    
    if (re === 0) {
        return `${im < 0 ? '-' : ''}${imAbsStr}i`;
    }
    
    return `${reStr} ${sign} ${imAbsStr}i`;
}

/**
 * Retorna la magnitud (módulo) absoluta del número complejo.
 */
export function complexMagnitude(val: ComplexValue): number {
    return Math.sqrt(val.re * val.re + val.im * val.im);
}
