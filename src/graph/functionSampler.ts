import { createExpression } from '../math';

export interface SampledFunction {
    x: number[];
    y: (number | null)[];
}

/**
 * Genera puntos de una función para visualización.
 * @param expression Función a evaluar.
 * @param a Límite inferior de interés.
 * @param b Límite superior de interés.
 * @param samples Número de muestras (por defecto 200 para balance entre calidad y rendimiento).
 * @returns Coordenadas x e y. Puntos fuera de dominio retornan y = null.
 */
export function sampleFunction(
    expression: string, 
    a: number, 
    b: number, 
    samples: number = 200
): SampledFunction {
    const evaluator = createExpression(expression);
    
    let xMin = a;
    let xMax = b;
    
    if (a < b) {
        const interval = b - a;
        xMin = a - interval * 0.25;
        xMax = b + interval * 0.25;
    } else {
        // Fallback por si acaso a y b son iguales o están invertidos (no debería pasar por validación previa)
        xMin = Math.min(a, b) - 1;
        xMax = Math.max(a, b) + 1;
    }

    const step = (xMax - xMin) / (samples - 1);
    
    const xValues: number[] = [];
    const yValues: (number | null)[] = [];

    for (let i = 0; i < samples; i++) {
        const currentX = xMin + i * step;
        xValues.push(currentX);
        
        try {
            const currentY = evaluator.evaluate(currentX);
            // Comprobación extra por si acaso
            if (isNaN(currentY) || !isFinite(currentY)) {
                yValues.push(null);
            } else {
                yValues.push(currentY);
            }
        } catch (error) {
            // Fuera de dominio, división por cero, etc.
            yValues.push(null);
        }
    }

    return { x: xValues, y: yValues };
}
