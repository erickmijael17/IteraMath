import { MullerInput, MullerResult } from '../types/numerical';
import { formatOctaveNumber, formatOctaveComplex, formatOctaveExpression } from './common';

export function generateMullerOctaveCode(input: MullerInput, result: MullerResult): string {
    let code = `% Método de Müller\n`;
    code += `% Generado por IteraMath\n\n`;
    
    code += `format long;\n\n`;
    code += `% Definimos la función\n`;
    code += `f = inline('${formatOctaveExpression(input.expression)}', 'x');\n\n`;
    
    code += `% Valores iniciales\n`;
    code += `x0 = ${formatOctaveNumber(input.x0)};\n`;
    code += `x1 = ${formatOctaveNumber(input.x1)};\n`;
    code += `x2 = ${formatOctaveNumber(input.x2)};\n\n`;
    
    result.iterations.forEach((it) => {
        const k = it.iteration;
        code += `% Iteración ${k}\n`;
        code += `a = ((x1-x2)*(feval(f,x0)-feval(f,x2)) - (x0-x2)*(feval(f,x1)-feval(f,x2))) / ((x0-x2)*(x1-x2)*(x0-x1));\n`;
        code += `b = ((x0-x2)^2*(feval(f,x1)-feval(f,x2)) - (x1-x2)^2*(feval(f,x0)-feval(f,x2))) / ((x0-x2)*(x1-x2)*(x0-x1));\n`;
        code += `c = feval(f, x2);\n`;
        code += `D = sqrt(b^2 - 4*a*c);\n`;
        code += `E1 = b + D;\n`;
        code += `E2 = b - D;\n`;
        code += `if abs(E1) >= abs(E2)\n`;
        code += `    E = E1;\n`;
        code += `else\n`;
        code += `    E = E2;\n`;
        code += `end\n`;
        code += `h = -2*c / E;\n`;
        code += `x_new = x2 + h;\n`;
        code += `% Actualizar puntos\n`;
        code += `x0 = x1;\n`;
        code += `x1 = x2;\n`;
        code += `x2 = x_new;\n\n`;
    });
    
    if (result.stopReason === 'MAX_ITERATIONS') {
        code += `% El método alcanzó el máximo de iteraciones.\n`;
    }
    
    code += `raiz = ${formatOctaveComplex(result.root)};\n`;
    code += `disp(['Raíz aproximada: ', num2str(raiz, 16)]);\n`;
    
    return code;
}
