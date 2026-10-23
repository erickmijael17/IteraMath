import * as math from 'mathjs';
import { MathError } from './errors';
import { Evaluator } from './expression';

export interface DerivativeResult {
    expressionString: string;
    evaluator: Evaluator;
}

export function createDerivative(expression: string, variable: string = 'x'): DerivativeResult {
    try {
        math.compile(expression); // Validate original
        const derivNode = math.derivative(expression, variable);
        const derivString = derivNode.toString();
        const compiledDeriv = derivNode.compile();

        return {
            expressionString: derivString,
            evaluator: {
                evaluate: (val: number) => {
                    const scope = { [variable]: val };
                    return compiledDeriv.evaluate(scope);
                }
            }
        };
    } catch (error: any) {
        throw new MathError('INVALID_EXPRESSION', `No se pudo derivar la expresión simbólicamente: ${error.message}`);
    }
}
