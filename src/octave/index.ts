import { generateBisectionOctaveCode } from './bisectionGenerator';
import { generateFalsePositionOctaveCode } from './falsePositionGenerator';
import { generateFixedPointOctaveCode } from './fixedPointGenerator';
import { generateNewtonOctaveCode } from './newtonGenerator';
import { generateSecantOctaveCode } from './secantGenerator';
import { generateMullerOctaveCode } from './mullerGenerator';

export function generateOctaveCode(method: string, input: any, result: any): string {
    switch (method) {
        case 'bisection':
            return generateBisectionOctaveCode(input, result);
        case 'false-position':
            return generateFalsePositionOctaveCode(input, result);
        case 'fixed-point':
            return generateFixedPointOctaveCode(input, result);
        case 'newton-raphson':
            return generateNewtonOctaveCode(input, result);
        case 'secant':
            return generateSecantOctaveCode(input, result);
        case 'muller':
            return generateMullerOctaveCode(input, result);
        default:
            return `% Método no soportado para generación de código.`;
    }
}
