import { 
    CompareRequest, 
    CompareResult, 
    CompareMethodResult, 
    AnyMethodResult 
} from './types';
import { NumericalMethod } from '../types/numerical';
import { bisection } from '../methods/bisection';
import { falsePosition } from '../methods/falsePosition';
import { fixedPoint } from '../methods/fixedPoint';
import { newtonRaphson } from '../methods/newtonRaphson';
import { secant } from '../methods/secant';
import { muller } from '../methods/muller';

export function runComparison(request: CompareRequest): CompareResult {
    const results: CompareMethodResult[] = [];
    const methods = request.methods;
    const c = request.common;

    const runSolver = (method: NumericalMethod, solverFn: () => AnyMethodResult) => {
        try {
            const res = solverFn();
            results.push({ method, status: 'success', result: res });
        } catch (e: any) {
            results.push({ method, status: 'error', errorMessage: e.message || 'Error desconocido' });
        }
    };

    if (methods['bisection']) {
        runSolver('bisection', () => bisection({
            expression: c.expression,
            a: methods['bisection']!.a,
            b: methods['bisection']!.b,
            errorCriterion: c.errorCriterion,
            tolerance: c.tolerance,
            maxIterations: c.maxIterations
        }));
    }

    if (methods['false-position']) {
        runSolver('false-position', () => falsePosition({
            expression: c.expression,
            a: methods['false-position']!.a,
            b: methods['false-position']!.b,
            errorCriterion: c.errorCriterion,
            tolerance: c.tolerance,
            maxIterations: c.maxIterations
        }));
    }

    if (methods['fixed-point']) {
        runSolver('fixed-point', () => fixedPoint({
            expression: c.expression,
            iterationExpression: methods['fixed-point']!.iterationExpression,
            x0: methods['fixed-point']!.x0,
            errorCriterion: c.errorCriterion,
            tolerance: c.tolerance,
            maxIterations: c.maxIterations
        }));
    }

    if (methods['newton-raphson']) {
        runSolver('newton-raphson', () => newtonRaphson({
            expression: c.expression,
            x0: methods['newton-raphson']!.x0,
            errorCriterion: c.errorCriterion,
            tolerance: c.tolerance,
            maxIterations: c.maxIterations
        }));
    }

    if (methods['secant']) {
        runSolver('secant', () => secant({
            expression: c.expression,
            x0: methods['secant']!.x0,
            x1: methods['secant']!.x1,
            errorCriterion: c.errorCriterion,
            tolerance: c.tolerance,
            maxIterations: c.maxIterations
        }));
    }

    if (methods['muller']) {
        runSolver('muller', () => muller({
            expression: c.expression,
            x0: methods['muller']!.x0,
            x1: methods['muller']!.x1,
            x2: methods['muller']!.x2,
            errorCriterion: c.errorCriterion,
            tolerance: c.tolerance,
            maxIterations: c.maxIterations
        }));
    }

    return {
        results,
        metrics: calculateMetrics(results)
    };
}

function calculateMetrics(results: CompareMethodResult[]) {
    // Solo consideramos métodos que convergieron para las métricas
    const valid = results.filter(r => r.status === 'success' && r.result?.converged);

    if (valid.length === 0) {
        return {
            leastIterationsMethod: null,
            lowestErrorMethod: null,
            lowestResidualMethod: null
        };
    }

    let leastIterations = valid[0];
    let lowestError = valid[0];
    let lowestResidual = valid[0];

    for (let i = 1; i < valid.length; i++) {
        const current = valid[i];
        
        if (current.result!.iterations.length < leastIterations.result!.iterations.length) {
            leastIterations = current;
        }

        const currentError = current.result!.finalError ?? Infinity;
        const lowestErrVal = lowestError.result!.finalError ?? Infinity;
        if (currentError < lowestErrVal) {
            lowestError = current;
        }

        if (current.result!.residual < lowestResidual.result!.residual) {
            lowestResidual = current;
        }
    }

    return {
        leastIterationsMethod: leastIterations.method,
        lowestErrorMethod: lowestError.method,
        lowestResidualMethod: lowestResidual.method
    };
}
