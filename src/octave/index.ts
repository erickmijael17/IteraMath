import { generateBisectionOctaveCode } from './bisectionGenerator';
import { generateFalsePositionOctaveCode } from './falsePositionGenerator';
import { generateFixedPointOctaveCode } from './fixedPointGenerator';
import { generateNewtonOctaveCode } from './newtonGenerator';
import { generateSecantOctaveCode } from './secantGenerator';
import { generateMullerOctaveCode } from './mullerGenerator';
import { 
    BisectionInput, BisectionResult, 
    FalsePositionInput, FalsePositionResult, 
    FixedPointInput, FixedPointResult, 
    NewtonRaphsonInput, NewtonRaphsonResult, 
    SecantInput, SecantResult, 
    MullerInput, MullerResult 
} from '../types/numerical';

export type OctaveGenerationRequest =
    | { method: 'bisection'; input: BisectionInput; result: BisectionResult }
    | { method: 'false-position'; input: FalsePositionInput; result: FalsePositionResult }
    | { method: 'fixed-point'; input: FixedPointInput; result: FixedPointResult }
    | { method: 'newton-raphson'; input: NewtonRaphsonInput; result: NewtonRaphsonResult }
    | { method: 'secant'; input: SecantInput; result: SecantResult }
    | { method: 'muller'; input: MullerInput; result: MullerResult };

export function generateOctaveCode(request: OctaveGenerationRequest): string {
    switch (request.method) {
        case 'bisection':
            return generateBisectionOctaveCode(request.input, request.result);
        case 'false-position':
            return generateFalsePositionOctaveCode(request.input, request.result);
        case 'fixed-point':
            return generateFixedPointOctaveCode(request.input, request.result);
        case 'newton-raphson':
            return generateNewtonOctaveCode(request.input, request.result);
        case 'secant':
            return generateSecantOctaveCode(request.input, request.result);
        case 'muller':
            return generateMullerOctaveCode(request.input, request.result);
        default:
            const _exhaustiveCheck: never = request;
            return _exhaustiveCheck;
    }
}
