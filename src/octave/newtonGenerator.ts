import { NewtonRaphsonInput, NewtonRaphsonResult } from '../types/numerical';
import { formatOctaveNumber, formatOctaveExpression } from './common';

export function generateNewtonOctaveCode(input: NewtonRaphsonInput, result: NewtonRaphsonResult): string {
    let code = `% Método de Newton-Raphson\n`;
    code += `% Generado por IteraMath\n\n`;
    
    code += `format long;\n\n`;
    code += `pkg load symbolic\n`;
    code += `syms x\n\n`;
    
    code += `% Definimos la función y su derivada\n`;
    code += `f = ${formatOctaveExpression(input.expression)};\n`;
    code += `df = diff(f, x);\n\n`;
    
    code += `% Valor inicial\n`;
    code += `x0 = ${formatOctaveNumber(input.x0)};\n\n`;
    
    result.iterations.forEach((it) => {
        const k = it.iteration;
        code += `% Iteración ${k}\n`;
        if (k === 0) {
            code += `x1 = double(x0 - subs(f, x, x0) / subs(df, x, x0));\n\n`;
        } else {
            code += `x${k+1} = double(x${k} - subs(f, x, x${k}) / subs(df, x, x${k}));\n\n`;
        }
    });
    
    if (result.stopReason === 'MAX_ITERATIONS') {
        code += `% El método alcanzó el máximo de iteraciones.\n`;
    }
    
    code += `raiz = ${formatOctaveNumber(result.root)};\n`;
    code += `disp(['Raíz aproximada: ', num2str(raiz, 16)]);\n`;
    
    return code;
}
