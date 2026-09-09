import { BisectionInput, BisectionResult } from '../types/numerical';
import { formatOctaveNumber, formatOctaveExpression } from './common';

export function generateBisectionOctaveCode(input: BisectionInput, result: BisectionResult): string {
    let code = `% Método de Bisección\n`;
    code += `% Generado por IteraMath\n\n`;
    
    code += `format long;\n\n`;
    code += `% Definimos la función\n`;
    code += `f = inline('${formatOctaveExpression(input.expression)}', 'x');\n\n`;
    
    code += `% Valores iniciales\n`;
    code += `a0 = ${formatOctaveNumber(input.a)};\n`;
    code += `b0 = ${formatOctaveNumber(input.b)};\n\n`;
    
    result.iterations.forEach((it) => {
        const k = it.iteration;
        code += `% Iteración ${k}\n`;
        if (k > 0) {
            // Reflejar la actualización a partir del paso anterior
            const prev = result.iterations[k - 1];
            if (it.a === prev.a) {
                code += `a${k} = a${k-1};\n`;
                code += `b${k} = m${k-1};\n`;
            } else {
                code += `a${k} = m${k-1};\n`;
                code += `b${k} = b${k-1};\n`;
            }
        }
        code += `m${k} = (a${k} + b${k}) / 2;\n`;
        code += `fm${k} = feval(f, m${k});\n\n`;
    });
    
    if (result.stopReason === 'MAX_ITERATIONS') {
        code += `% El método alcanzó el máximo de iteraciones.\n`;
    }
    
    code += `raiz = ${formatOctaveNumber(result.root)};\n`;
    code += `disp(['Raíz aproximada: ', num2str(raiz, 16)]);\n`;
    
    return code;
}
