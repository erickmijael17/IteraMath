/**
 * Regla de Cramer.
 * DA es el determinante de A.
 * Para cada incógnita se arma una matriz Xi cambiando la columna i por el vector b.
 * DXi es el determinante de esa matriz y xi = DXi / DA.
 * Sirve hasta sistemas de 4×4. No tiene gráfica.
 */
import { MathError } from '../../matematicas/errors';
import { assertSystem, determinant, Vector } from '../../matematicas/matrix';
import { octaveHeader, octaveMatrix, octaveVector } from '../../codigo-octave/text';
import { SolveResult, SystemInput, TableData } from '../../tipos/numerical';
import { directResult, matrixTable } from '../comun/resultado-directo';

export function solveCramer(input: SystemInput): SolveResult {
    const n = assertSystem(input.A, input.b, 4);
    const detA = determinant(input.A);
    // Con determinante cero el sistema no tiene solución única.
    if (Math.abs(detA) < 1e-14) {
        throw new MathError('SINGULAR', 'No se puede resolver porque el determinante es 0.');
    }
    const solution: Vector = [];
    // Cada Xi copia A y cambia solo la columna de esa incógnita por b.
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

