import { SecantInput, SecantResult } from '../types/numerical';
import { formatOctaveNumber, formatOctaveExpression } from './common';

export function generateSecantOctaveCode(input: SecantInput, result: SecantResult): string {
    let code = `% Método de la Secante\n`;
    code += `% Generado por IteraMath\n\n`;
    
    code += `format long;\n\n`;
    code += `% Definimos la función\n`;
    code += `f = inline('${formatOctaveExpression(input.expression)}', 'x');\n\n`;
    
    code += `% Valores iniciales\n`;
    code += `x0 = ${formatOctaveNumber(input.x0)};\n`;
    code += `x1 = ${formatOctaveNumber(input.x1)};\n\n`;
    
    result.iterations.forEach((it) => {
        const k = it.iteration;
        code += `% Iteración ${k}\n`;
        code += `x${k+2} = x${k+1} - feval(f, x${k+1}) * (x${k+1} - x${k}) / (feval(f, x${k+1}) - feval(f, x${k}));\n\n`;
    });
    
    if (result.stopReason === 'MAX_ITERATIONS') {
        code += `% El método alcanzó el máximo de iteraciones.\n`;
    }
    
    code += `raiz = ${formatOctaveNumber(result.root)};\n`;
    code += `disp(['Raíz aproximada: ', num2str(raiz, 16)]);\n`;
    
    return code;
}
