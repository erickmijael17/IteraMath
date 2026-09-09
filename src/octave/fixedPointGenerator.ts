import { FixedPointInput, FixedPointResult } from '../types/numerical';
import { formatOctaveNumber, formatOctaveExpression } from './common';

export function generateFixedPointOctaveCode(input: FixedPointInput, result: FixedPointResult): string {
    let code = `% Método de Punto Fijo\n`;
    code += `% Generado por IteraMath\n\n`;
    
    code += `format long;\n\n`;
    code += `% Definimos las funciones\n`;
    code += `f = inline('${formatOctaveExpression(input.expression)}', 'x');\n`;
    code += `g = inline('${formatOctaveExpression(input.iterationExpression)}', 'x');\n\n`;
    
    code += `% Valor inicial\n`;
    code += `x0 = ${formatOctaveNumber(input.x0)};\n\n`;
    
    result.iterations.forEach((it) => {
        const k = it.iteration;
        code += `% Iteración ${k}\n`;
        if (k === 0) {
            code += `x1 = feval(g, x0);\n\n`;
        } else {
            code += `x${k+1} = feval(g, x${k});\n\n`;
        }
    });
    
    if (result.stopReason === 'MAX_ITERATIONS') {
        code += `% El método alcanzó el máximo de iteraciones.\n`;
    }
    
    code += `raiz = ${formatOctaveNumber(result.root)};\n`;
    code += `disp(['Raíz aproximada: ', num2str(raiz, 16)]);\n`;
    
    return code;
}
