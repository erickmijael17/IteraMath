import { MathError } from '../math/errors';
import { formatEs, octaveNum, subscript, vectorText } from '../math/format';
import {
    assertSystem,
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
import { GraphSpec, SolveResult, SystemInput, TableData } from '../types/numerical';

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
    note?: string,
    graph?: GraphSpec
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
        graph: graph ?? {
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

function rowLiteral(row: number[]): string {
    return `[${row.map((value) => octaveNum(value)).join(' ')}]`;
}

function gaussClassProcedure(A: Matrix, b: Vector, pivot: boolean): { solution: Vector; tables: TableData[]; octave: string } {
    const n = A.length;
    const width = n + 1;
    const rows = A.map((row, index) => [...row, b[index]]);
    const name = (index: number) => `f${index + 1}`;
    const lines = [
        '% Eliminación gaussiana',
        '% Cada pivote se vuelve 1 y se anulan las demás casillas de su columna.',
        '',
        ...rows.map((row, index) => `${name(index)} = ${rowLiteral(row)}`)
    ];
    const tables: TableData[] = [matrixTable('Matriz aumentada', rows.map((row) => [...row]), n, headersOf(n))];
    const record = (title: string) => {
        tables.push(matrixTable(title, rows.map((row) => [...row]), n, headersOf(n)));
    };

    for (let k = 0; k < n; k++) {
        if (pivot) {
            let chosen = k;
            for (let row = k + 1; row < n; row++) {
                if (Math.abs(rows[row][k]) > Math.abs(rows[chosen][k])) chosen = row;
            }
            if (chosen !== k) {
                [rows[k], rows[chosen]] = [rows[chosen], rows[k]];
                lines.push(`tmp = ${name(k)}`);
                lines.push(`${name(k)} = ${name(chosen)}`);
                lines.push(`${name(chosen)} = tmp`);
                record(`Se intercambian ${name(k)} y ${name(chosen)}`);
            }
        }
        lines.push(`${name(k)} = ${name(k)}/${name(k)}(${k + 1})`);
        const pivotValue = rows[k][k];
        for (let column = k; column < width; column++) rows[k][column] /= pivotValue;
        record(`${name(k)} = ${name(k)}/${name(k)}(${k + 1})`);
        for (let row = 0; row < n; row++) {
            if (row === k || Math.abs(rows[row][k]) < 1e-15) continue;
            lines.push(`${name(row)} = -${name(row)}(${k + 1})*${name(k)} + ${name(row)}`);
            const factor = rows[row][k];
            for (let column = k; column < width; column++) rows[row][column] -= factor * rows[k][column];
            record(`${name(row)} = -${name(row)}(${k + 1})*${name(k)} + ${name(row)}`);
        }
    }

    const solution = rows.map((row) => row[n]);
    lines.push(`x = [${solution.map((_, index) => `${name(index)}(${n + 1})`).join('; ')}]`);
    return { solution, tables, octave: lines.join('\n') };
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
    if (!jordan) {
        const procedure = gaussClassProcedure(input.A, input.b, input.pivot);
        procedure.tables.push({
            title: 'Solución',
            headers: ['Incógnita', 'Valor'],
            rows: procedure.solution.map((value, index) => [`x${subscript(index + 1)}`, value]),
            markColumn: 1
        });
        return directResult(
            'Eliminación de Gauss',
            procedure.solution,
            procedure.tables,
            procedure.octave,
            input.A,
            'Se divide la fila del pivote y cada otra fila se actualiza con fi = -fi(k)*fk + fi. Al final la solución está en la última columna.',
            { type: 'none' }
        );
    }
    const { solution, snapshots } = solveSystem(input.A, input.b, input.pivot, true);
    return directResult(
        'Gauss-Jordan',
        solution,
        snapshotsToTables(snapshots, n),
        gaussOctave(input.A, input.b, input.pivot, true),
        input.A,
        'La matriz queda reducida a la identidad. La solución es la última columna.'
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
    const replacedMatrices = Array.from({ length: n }, (_, column) =>
        input.A.map((row, index) => row.map((value, j) => (j === column ? input.b[index] : value)))
    );
    const determinants = replacedMatrices.map((matrix) => determinant(matrix));
    determinants.forEach((det) => solution.push(det / detA));
    const tables: TableData[] = [
        matrixTable('A', input.A),
        { title: 'DA = det(A)', headers: ['DA'], rows: [[detA]], markColumn: 0 }
    ];
    replacedMatrices.forEach((matrix, column) => {
        const label = column + 1;
        tables.push(matrixTable(`X${label}`, matrix));
        tables.push({
            title: `x${label} = DX${label}/DA`,
            headers: [`DX${label}`, `x${label}`],
            rows: [[determinants[column], solution[column]]],
            markColumn: 1
        });
    });
    const steps = replacedMatrices.map((matrix, column) => {
        const label = column + 1;
        return `${octaveMatrix(`X${label}`, matrix).replace(/;$/, '')}
DX${label} = det(X${label})`;
    }).join('\n');
    const quotients = solution.map((_, column) => `x${column + 1} = DX${column + 1}/DA`).join('\n');
    const octave = `${octaveHeader('Método de Cramer')}
${octaveMatrix('A', input.A).replace(/;$/, '')}
${octaveVector('B', input.b).replace(/;$/, '')}
${steps}
DA = det(A)
${quotients}
x = [${solution.map((_, index) => `x${index + 1}`).join('; ')}]
`;
    return directResult(
        'Regla de Cramer',
        solution,
        tables,
        octave,
        input.A,
        'Cada incógnita es el determinante de A, con la columna correspondiente reemplazada por b, dividido entre det(A).',
        { type: 'none' }
    );
}
