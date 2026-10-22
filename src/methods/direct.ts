import { MathError } from '../math/errors';
import { formatEs, subscript, vectorText } from '../math/format';
import {
    assertSystem,
    backSubstitute,
    backwardSubstitution,
    choleskyLower,
    conditionInfinity,
    determinant,
    forwardSubstitution,
    identity,
    inverse,
    luFactor,
    matVec,
    solveAugmented,
    solveSystem,
    transpose,
    Snapshot,
    Matrix,
    Vector
} from '../math/matrix';
import { octaveHeader, octaveMatrix, octaveVector } from '../octave/text';
import { SolveResult, SystemInput, TableData } from '../types/numerical';

const headersOf = (size: number, extra: string[] = ['b']): string[] => [
    ...Array.from({ length: size }, (_, index) => `x${subscript(index + 1)}`),
    ...extra
];

function matrixTable(title: string, matrix: Matrix, markColumn?: number, headers?: string[]): TableData {
    const width = matrix[0].length;
    return {
        title,
        headers: headers ?? Array.from({ length: width }, (_, index) => String(index + 1)),
        rows: matrix,
        markColumn
    };
}

function conditionDetail(A: Matrix): { label: string; value: string } | null {
    try {
        const value = conditionInfinity(A);
        const label = value < 10 ? 'bien condicionada' : value > 10000 ? 'mal condicionada' : 'revisar el condicionamiento';
        return { label: 'Cond(A)', value: `${formatEs(value, 7)} · ${label}` };
    } catch {
        return null;
    }
}

function directResult(
    title: string,
    solution: Vector,
    tables: TableData[],
    octave: string,
    A: Matrix,
    note?: string
): SolveResult {
    const condition = conditionDetail(A);
    return {
        converged: true,
        status: 'Solución única',
        headlineLabel: 'Solución',
        headline: vectorText(solution),
        secondaryLabel: condition ? 'Condicionamiento' : undefined,
        secondary: condition?.value,
        details: [
            { label: 'Método', value: title },
            ...(condition ? [condition] : [])
        ],
        tables,
        octave,
        graph: {
            type: 'bars',
            title: 'Solución',
            labels: solution.map((_, index) => `x${subscript(index + 1)}`),
            values: solution
        },
        note,
        values: solution,
        extra: {}
    };
}

function gaussOctave(A: Matrix, b: Vector, pivot: boolean, jordan: boolean): string {
    const loop = jordan
        ? `for i = 1:n\n    if i == k, continue; end\n    Ab(i, k:end) = Ab(i, k:end) - Ab(i, k) * Ab(k, k:end);\n  end`
        : `for i = k+1:n\n    Ab(i, k:end) = Ab(i, k:end) - Ab(i, k) * Ab(k, k:end);\n  end`;
    const finish = jordan
        ? 'x = Ab(:, n + 1);'
        : `x = zeros(n, 1);\nx(n) = Ab(n, n + 1);\nfor i = n-1:-1:1\n  x(i) = Ab(i, n + 1) - Ab(i, i+1:n) * x(i+1:n);\nend`;
    const pivotCode = pivot
        ? `  [~, piv] = max(abs(Ab(k:n, k)));\n  piv = piv + k - 1;\n  if piv ~= k\n    Ab([k piv], :) = Ab([piv k], :);\n  end\n`
        : '';
    return `${octaveHeader(jordan ? 'Gauss-Jordan' : 'Eliminación de Gauss')}
${octaveMatrix('A', A)}
${octaveVector('b', b)}
n = size(A, 1);
Ab = [A b];
disp(Ab);

for k = 1:n
${pivotCode}  Ab(k, k:end) = Ab(k, k:end) / Ab(k, k);
  ${loop}
  disp(Ab);
end

${finish}
disp('Solución');
disp(x);
`;
}

function snapshotsToTables(snapshots: Snapshot[], size: number): TableData[] {
    return snapshots.map((snapshot) =>
        matrixTable(snapshot.title, snapshot.matrix, size, headersOf(size))
    );
}

export function solveGauss(input: SystemInput, jordan = false): SolveResult {
    const n = assertSystem(input.A, input.b);
    const { solution, snapshots } = solveSystem(input.A, input.b, input.pivot, jordan);
    const tables = snapshotsToTables(snapshots, n);
    if (!jordan) {
        const upper = snapshots[snapshots.length - 1].matrix;
        const check = backSubstitute(upper);
        tables.push({
            title: 'Sustitución regresiva',
            headers: ['Incógnita', 'Valor'],
            rows: check.map((value, index) => [`x${subscript(index + 1)}`, value]),
            markColumn: 1
        });
    }
    return directResult(
        jordan ? 'Gauss-Jordan' : 'Eliminación de Gauss',
        solution,
        tables,
        gaussOctave(input.A, input.b, input.pivot, jordan),
        input.A,
        jordan
            ? 'La matriz queda reducida a la identidad. La solución es la última columna.'
            : 'La matriz queda triangular. La solución sale por sustitución regresiva.'
    );
}

export function solveLu(input: SystemInput): SolveResult {
    assertSystem(input.A, input.b);
    const factor = luFactor(input.A, input.pivot);
    const pb = factor.perm.map((index) => input.b[index]);
    const y = forwardSubstitution(factor.L, pb);
    const x = backwardSubstitution(factor.U, y);
    const note = factor.pivoted
        ? 'Hizo falta pivoteo parcial. Se resolvió Ly = Pb y después Ux = y. La diagonal de L vale 1.'
        : 'No hizo falta intercambiar filas. Se resolvió Ly = b y después Ux = y. La diagonal de L vale 1.';
    const octave = `${octaveHeader('Factorización LU, Doolittle')}
${octaveMatrix('A', input.A)}
${octaveVector('b', input.b)}
[L, U, P] = lu(A);
y = L \\ (P * b);
x = U \\ y;
disp('L'); disp(L);
disp('U'); disp(U);
disp('P'); disp(P);
disp('Solución'); disp(x);
`;
    return directResult('LU con pivoteo parcial', x, [
        matrixTable('P', factor.P),
        matrixTable('L', factor.L),
        matrixTable('U', factor.U),
        { title: 'Sustitución', headers: ['y', 'x'], rows: y.map((value, index) => [value, x[index]]), markColumn: 1 }
    ], octave, input.A, note);
}

export function solveCholesky(input: SystemInput): SolveResult {
    assertSystem(input.A, input.b);
    const L = choleskyLower(input.A);
    const y = forwardSubstitution(L, input.b);
    const x = backwardSubstitution(transpose(L), y);
    const octave = `${octaveHeader('Cholesky, A = L L transpuesta')}
${octaveMatrix('A', input.A)}
${octaveVector('b', input.b)}
L = chol(A)';
y = L \\ b;
x = L' \\ y;
disp('L inferior'); disp(L);
disp('Solución'); disp(x);
`;
    return directResult('Cholesky', x, [
        matrixTable('L inferior', L),
        { title: 'Sustitución', headers: ['y', 'x'], rows: y.map((value, index) => [value, x[index]]), markColumn: 1 }
    ], octave, input.A, 'Se usa la L inferior de clase. En Octave, chol devuelve la triangular superior, por eso el script la transpone.');
}

export function solveInverse(input: SystemInput): SolveResult {
    const n = assertSystem(input.A, input.b);
    const inv = inverse(input.A);
    const x = matVec(inv, input.b);
    const solved = solveAugmented(input.A, identity(n), true, true);
    const labels = inv.flatMap((row, i) => row.map((_, j) => `a${subscript(i + 1)}${subscript(j + 1)}`));
    const octave = `${octaveHeader('Inversa por Gauss-Jordan')}
${octaveMatrix('A', input.A)}
${octaveVector('b', input.b)}
Inv = inv(A);
x = Inv * b;
disp(Inv);
disp(x);
`;
    const result = directResult('Inversa por Gauss-Jordan', x, [
        ...snapshotsToTables(solved.snapshots, n).map((table) => ({
            ...table,
            headers: [...headersOf(n, []).slice(0, n), ...Array.from({ length: n }, (_, index) => `e${subscript(index + 1)}`)]
        })),
        matrixTable('Inversa', inv)
    ], octave, input.A, 'La inversa se obtiene al llevar [A | I] hasta [I | A⁻¹]. La solución del sistema es A⁻¹b.');
    result.graph = {
        type: 'bars',
        title: 'Entradas de la inversa',
        labels,
        values: inv.flat()
    };
    result.extra = { entries: inv.length };
    return result;
}

export function solveCramer(input: SystemInput): SolveResult {
    const n = assertSystem(input.A, input.b, 4);
    const detA = determinant(input.A);
    if (Math.abs(detA) < 1e-14) {
        throw new MathError('SINGULAR', 'El determinante es cero. Cramer no aplica.');
    }
    const solution: Vector = [];
    const tables: TableData[] = [{
        title: 'Determinante de A',
        headers: ['det(A)'],
        rows: [[detA]],
        markColumn: 0
    }];
    for (let column = 0; column < n; column++) {
        const replaced = input.A.map((row, index) => row.map((value, j) => (j === column ? input.b[index] : value)));
        const det = determinant(replaced);
        solution.push(det / detA);
        tables.push(matrixTable(`Matriz de x${subscript(column + 1)}`, replaced));
        tables.push({
            title: `x${subscript(column + 1)}`,
            headers: ['det', 'valor'],
            rows: [[det, det / detA]],
            markColumn: 1
        });
    }
    const octave = `${octaveHeader('Regla de Cramer')}
${octaveMatrix('A', input.A)}
${octaveVector('b', input.b)}
n = size(A, 1);
detA = det(A);
x = zeros(n, 1);
for k = 1:n
  Ak = A;
  Ak(:, k) = b;
  x(k) = det(Ak) / detA;
end
disp(x);
`;
    return directResult('Regla de Cramer', solution, tables, octave, input.A, 'Cada incógnita es el determinante de A, con la columna correspondiente reemplazada por b, dividido entre det(A).');
}
