import { MathError } from './errors';

export type Matrix = number[][];
export type Vector = number[];

export function cloneMatrix(source: Matrix): Matrix {
    return source.map((row) => row.slice());
}

export function zeros(rows: number, cols = rows): Matrix {
    return Array.from({ length: rows }, () => Array(cols).fill(0));
}

export function identity(size: number): Matrix {
    const matrix = zeros(size);
    for (let i = 0; i < size; i++) matrix[i][i] = 1;
    return matrix;
}

export function assertSystem(A: Matrix, b?: Vector, maxSize = 6): number {
    const n = A.length;
    if (n < 2 || n > maxSize) {
        throw new MathError('INVALID_MATRIX', `El sistema debe tener entre 2 y ${maxSize} ecuaciones.`);
    }
    for (const row of A) {
        if (row.length !== n) {
            throw new MathError('INVALID_MATRIX', 'La matriz debe ser cuadrada.');
        }
        for (const value of row) {
            if (!Number.isFinite(value)) {
                throw new MathError('NON_FINITE_RESULT', 'La matriz contiene un valor que no es finito.');
            }
        }
    }
    if (b) {
        if (b.length !== n) {
            throw new MathError('INVALID_MATRIX', 'El vector b debe tener una entrada por cada ecuación.');
        }
        for (const value of b) {
            if (!Number.isFinite(value)) {
                throw new MathError('NON_FINITE_RESULT', 'El vector b contiene un valor que no es finito.');
            }
        }
    }
    return n;
}

export function matVec(A: Matrix, x: Vector): Vector {
    return A.map((row) => row.reduce((sum, value, index) => sum + value * x[index], 0));
}

export function multiply(A: Matrix, B: Matrix): Matrix {
    const n = A.length;
    const m = B[0].length;
    const p = B.length;
    const out = zeros(n, m);
    for (let i = 0; i < n; i++) {
        for (let k = 0; k < p; k++) {
            for (let j = 0; j < m; j++) out[i][j] += A[i][k] * B[k][j];
        }
    }
    return out;
}

export function transpose(A: Matrix): Matrix {
    return A[0].map((_, column) => A.map((row) => row[column]));
}

export function infNorm(A: Matrix): number {
    return Math.max(...A.map((row) => row.reduce((sum, value) => sum + Math.abs(value), 0)));
}

export function vectorNorm(x: Vector, kind: 'inf' | '1' | '2'): number {
    if (kind === 'inf') return Math.max(...x.map((value) => Math.abs(value)));
    if (kind === '1') return x.reduce((sum, value) => sum + Math.abs(value), 0);
    return Math.hypot(...x);
}

export function isStrictlyDiagonalDominant(A: Matrix): boolean {
    return A.every((row, i) => {
        const others = row.reduce((sum, value, j) => sum + (i === j ? 0 : Math.abs(value)), 0);
        return Math.abs(row[i]) > others;
    });
}

export interface Snapshot {
    title: string;
    matrix: Matrix;
}

function pivotRow(matrix: Matrix, column: number, from: number): number {
    let pivot = from;
    for (let row = from + 1; row < matrix.length; row++) {
        if (Math.abs(matrix[row][column]) > Math.abs(matrix[pivot][column])) pivot = row;
    }
    return pivot;
}

export function eliminate(
    source: Matrix,
    pivot: boolean,
    jordan: boolean
): { matrix: Matrix; snapshots: Snapshot[] } {
    const n = source.length;
    const width = source[0].length;
    const matrix = cloneMatrix(source);
    const snapshots: Snapshot[] = [{ title: 'Matriz aumentada', matrix: cloneMatrix(matrix) }];

    for (let k = 0; k < n; k++) {
        if (pivot) {
            const row = pivotRow(matrix, k, k);
            if (row !== k) {
                [matrix[k], matrix[row]] = [matrix[row], matrix[k]];
                snapshots.push({
                    title: `Se intercambian las filas ${k + 1} y ${row + 1}`,
                    matrix: cloneMatrix(matrix)
                });
            }
        }

        const pivotValue = matrix[k][k];
        if (!Number.isFinite(pivotValue) || Math.abs(pivotValue) < 1e-14) {
            throw new MathError('SINGULAR', 'Apareció un pivote nulo. El sistema no tiene solución única.');
        }

        if (Math.abs(pivotValue - 1) > 1e-12) {
            for (let column = k; column < width; column++) matrix[k][column] /= pivotValue;
            snapshots.push({
                title: `La fila ${k + 1} se divide entre el pivote`,
                matrix: cloneMatrix(matrix)
            });
        }

        let changed = false;
        for (let row = 0; row < n; row++) {
            if (jordan ? row === k : row <= k) continue;
            const factor = matrix[row][k];
            if (Math.abs(factor) < 1e-15) continue;
            for (let column = k; column < width; column++) {
                matrix[row][column] -= factor * matrix[k][column];
            }
            changed = true;
        }
        if (changed) {
            snapshots.push({
                title: jordan
                    ? `Se anulan los demás valores de la columna ${k + 1}`
                    : `Se anulan los valores debajo del pivote ${k + 1}`,
                matrix: cloneMatrix(matrix)
            });
        }
    }

    return { matrix, snapshots };
}

export function backSubstitute(upper: Matrix): Vector {
    const n = upper.length;
    const solution = Array(n).fill(0);
    for (let row = n - 1; row >= 0; row--) {
        let value = upper[row][n];
        for (let column = row + 1; column < n; column++) value -= upper[row][column] * solution[column];
        solution[row] = value;
    }
    return solution;
}

export function solveAugmented(A: Matrix, right: Matrix, pivot: boolean, jordan: boolean): {
    solution: Matrix;
    snapshots: Snapshot[];
} {
    const n = A.length;
    const augmented = A.map((row, index) => [...row, ...right[index]]);
    const { matrix, snapshots } = eliminate(augmented, pivot, jordan);
    if (jordan) {
        const solution = matrix.map((row) => row.slice(n));
        return { solution, snapshots };
    }
    const columns = right[0].length;
    const solution = zeros(n, columns);
    for (let column = 0; column < columns; column++) {
        const one = matrix.map((row) => [...row.slice(0, n), row[n + column]]);
        const solved = backSubstitute(one);
        solved.forEach((value, row) => {
            solution[row][column] = value;
        });
    }
    return { solution, snapshots };
}

export function solveSystem(A: Matrix, b: Vector, pivot: boolean, jordan: boolean): {
    solution: Vector;
    snapshots: Snapshot[];
} {
    const solved = solveAugmented(A, b.map((value) => [value]), pivot, jordan);
    return {
        solution: solved.solution.map((row) => row[0]),
        snapshots: solved.snapshots
    };
}

export function determinant(source: Matrix): number {
    const n = source.length;
    const matrix = cloneMatrix(source);
    let det = 1;
    for (let k = 0; k < n; k++) {
        const row = pivotRow(matrix, k, k);
        if (row !== k) {
            [matrix[k], matrix[row]] = [matrix[row], matrix[k]];
            det = -det;
        }
        if (Math.abs(matrix[k][k]) < 1e-14) return 0;
        det *= matrix[k][k];
        for (let i = k + 1; i < n; i++) {
            const factor = matrix[i][k] / matrix[k][k];
            for (let j = k; j < n; j++) matrix[i][j] -= factor * matrix[k][j];
        }
    }
    return det;
}

export function inverse(A: Matrix): Matrix {
    const n = assertSystem(A);
    return solveAugmented(A, identity(n), true, true).solution;
}

export function conditionInfinity(A: Matrix): number {
    return infNorm(A) * infNorm(inverse(A));
}

export interface LuFactor {
    L: Matrix;
    U: Matrix;
    P: Matrix;
    perm: number[];
    pivoted: boolean;
}

export function luFactor(source: Matrix, pivot: boolean): LuFactor {
    const n = source.length;
    const U = cloneMatrix(source);
    const L = identity(n);
    const perm = Array.from({ length: n }, (_, index) => index);
    let pivoted = false;

    for (let k = 0; k < n; k++) {
        if (pivot) {
            let row = k;
            for (let i = k + 1; i < n; i++) {
                if (Math.abs(U[i][k]) > Math.abs(U[row][k])) row = i;
            }
            if (row !== k) {
                [U[k], U[row]] = [U[row], U[k]];
                [perm[k], perm[row]] = [perm[row], perm[k]];
                for (let j = 0; j < k; j++) {
                    [L[k][j], L[row][j]] = [L[row][j], L[k][j]];
                }
                pivoted = true;
            }
        }
        if (Math.abs(U[k][k]) < 1e-14) {
            throw new MathError('SINGULAR', 'La factorización LU encontró un pivote nulo.');
        }
        for (let i = k + 1; i < n; i++) {
            L[i][k] = U[i][k] / U[k][k];
            for (let j = k; j < n; j++) U[i][j] -= L[i][k] * U[k][j];
        }
    }

    const P = zeros(n);
    perm.forEach((origin, row) => {
        P[row][origin] = 1;
    });
    return { L, U, P, perm, pivoted };
}

export function forwardSubstitution(L: Matrix, b: Vector): Vector {
    const n = L.length;
    const y = Array(n).fill(0);
    for (let i = 0; i < n; i++) {
        let sum = b[i];
        for (let j = 0; j < i; j++) sum -= L[i][j] * y[j];
        y[i] = sum / L[i][i];
    }
    return y;
}

export function backwardSubstitution(U: Matrix, y: Vector): Vector {
    const n = U.length;
    const x = Array(n).fill(0);
    for (let i = n - 1; i >= 0; i--) {
        let sum = y[i];
        for (let j = i + 1; j < n; j++) sum -= U[i][j] * x[j];
        x[i] = sum / U[i][i];
    }
    return x;
}

export function choleskyLower(source: Matrix): Matrix {
    const n = source.length;
    for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
            if (Math.abs(source[i][j] - source[j][i]) > 1e-8) {
                throw new MathError('NOT_SPD', 'Cholesky pide una matriz simétrica.');
            }
        }
    }
    const L = zeros(n);
    for (let i = 0; i < n; i++) {
        let diagonal = source[i][i];
        for (let k = 0; k < i; k++) diagonal -= L[i][k] * L[i][k];
        if (diagonal <= 1e-12) {
            throw new MathError('NOT_SPD', 'La matriz no es definida positiva. Cholesky no aplica.');
        }
        L[i][i] = Math.sqrt(diagonal);
        for (let j = i + 1; j < n; j++) {
            let value = source[j][i];
            for (let k = 0; k < i; k++) value -= L[j][k] * L[i][k];
            L[j][i] = value / L[i][i];
        }
    }
    return L;
}

function permutations(size: number): number[][] {
    const all: number[][] = [];
    const used = Array(size).fill(false);
    const current: number[] = [];
    const walk = () => {
        if (current.length === size) {
            all.push(current.slice());
            return;
        }
        for (let index = 0; index < size; index++) {
            if (used[index]) continue;
            used[index] = true;
            current.push(index);
            walk();
            current.pop();
            used[index] = false;
        }
    };
    walk();
    return all;
}

export interface Arrangement {
    rows: number[];
    cols: number[];
    changed: boolean;
}

export function arrangeDiagonalDominance(A: Matrix, b: Vector): { A: Matrix; b: Vector; arrangement: Arrangement } | null {
    const n = A.length;
    if (isStrictlyDiagonalDominant(A)) {
        const order = Array.from({ length: n }, (_, index) => index);
        return { A, b, arrangement: { rows: order, cols: order, changed: false } };
    }
    if (n > 6) return null;
    const orders = permutations(n);
    for (const cols of orders) {
        for (const rows of orders) {
            const nextA = rows.map((row) => cols.map((column) => A[row][column]));
            if (!isStrictlyDiagonalDominant(nextA)) continue;
            return {
                A: nextA,
                b: rows.map((row) => b[row]),
                arrangement: { rows, cols, changed: true }
            };
        }
    }
    return null;
}
