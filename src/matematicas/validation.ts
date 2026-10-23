import { MathError } from './errors';

export function hasReachedTolerance(value: number, tolerance: number): boolean {
    validateTolerance(tolerance);
    
    if (isNaN(value) || !isFinite(value)) {
        return false;
    }

    return value <= tolerance;
}

export function validateTolerance(tolerance: number): void {
    if (isNaN(tolerance) || !isFinite(tolerance)) {
        throw new MathError("INVALID_TOLERANCE", "La tolerancia debe ser un número finito.");
    }
    if (tolerance <= 0) {
        throw new MathError("INVALID_TOLERANCE", "La tolerancia debe ser mayor a 0.");
    }
}

export function validateMaxIterations(maxIter: number): void {
    if (isNaN(maxIter) || !isFinite(maxIter)) {
        throw new MathError("INVALID_MAX_ITERATIONS", "El número máximo de iteraciones debe ser finito.");
    }
    if (!Number.isInteger(maxIter) || maxIter <= 0) {
        throw new MathError("INVALID_MAX_ITERATIONS", "El número máximo de iteraciones debe ser un entero positivo.");
    }
}

export function validateFinite(value: number, paramName: string = "valor"): void {
    if (isNaN(value)) {
        throw new MathError("NON_FINITE_RESULT", `El ${paramName} no es un número (NaN).`);
    }
    if (!isFinite(value)) {
        throw new MathError("NON_FINITE_RESULT", `El ${paramName} es infinito.`);
    }
}
