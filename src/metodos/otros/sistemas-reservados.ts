/** LU, Cholesky e inversa. Quedan guardados, fuera de la lista de la aplicación. */
import { subscript } from '../../matematicas/format';
import {
    assertSystem,
    backwardSubstitution,
    choleskyLower,
    forwardSubstitution,
    identity,
    inverse,
    luFactor,
    matVec,
    solveAugmented,
    transpose
} from '../../matematicas/matrix';
import { octaveHeader, octaveMatrix, octaveVector } from '../../codigo-octave/text';
import { SolveResult, SystemInput } from '../../tipos/numerical';
import { directResult, headersOf, matrixTable, snapshotsToTables } from '../comun/resultado-directo';

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

