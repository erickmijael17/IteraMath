/**
 * Eliminación gaussiana.
 * Cada ecuación se guarda como una fila f1, f2, f3...
 * En cada columna:
 * 1. Si hay pivoteo, se sube el valor mayor.
 * 2. Se divide esa fila para que el pivote valga 1.
 * 3. Las demás filas se actualizan con fi = -fi(k)*fk + fi.
 * La solución queda en la última columna. Este método no usa gráfica.
 */
import { MathError } from '../../matematicas/errors';
import { subscript } from '../../matematicas/format';
import { octaveNum } from '../../matematicas/format';
import { assertSystem, solveSystem, Matrix, Vector } from '../../matematicas/matrix';
import { octaveHeader, octaveMatrix, octaveVector } from '../../codigo-octave/text';
import { SolveResult, SystemInput, TableData } from '../../tipos/numerical';
import { directResult, headersOf, matrixTable, snapshotsToTables } from '../comun/resultado-directo';

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
        // Columna k: primero el pivote, luego la fila se divide y las demás se anulan.
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
        const pivotValue = rows[k][k];
        if (!Number.isFinite(pivotValue) || Math.abs(pivotValue) < 1e-14) {
            const hayOtro = rows.slice(k + 1).some((row) => Math.abs(row[k]) >= 1e-14);
            throw new MathError(
                'SINGULAR',
                hayOtro
                    ? 'No se puede resolver porque el pivote es cero. Activa el pivoteo parcial o cambia el orden de las ecuaciones.'
                    : 'No se puede resolver porque el pivote es cero. El sistema no tiene solución única.'
            );
        }
        lines.push(`${name(k)} = ${name(k)}/${name(k)}(${k + 1})`);
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

