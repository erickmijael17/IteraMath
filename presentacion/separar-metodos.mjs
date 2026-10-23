import fs from 'node:fs';
import path from 'node:path';

const metodos = path.resolve('src/metodos');
const read = (name) => fs.readFileSync(path.join(metodos, name), 'utf8');
const write = (relative, text) => {
    const full = path.join(metodos, relative);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, text);
};

const direct = read('direct.ts');
const between = (source, start, end) => {
    const from = source.indexOf(start);
    const to = end ? source.indexOf(end, from) : source.length;
    return source.slice(from, to).trim() + '\n';
};

const deeper = (text) => text
    .replaceAll("from '../matematicas/", "from '../../matematicas/")
    .replaceAll("from '../codigo-octave/", "from '../../codigo-octave/")
    .replaceAll("from '../tipos/", "from '../../tipos/");

write('comun/resultado-directo.ts', `${deeper(`import { formatEs, subscript, vectorText } from '../matematicas/format';
import { conditionInfinity, Matrix, Snapshot, Vector } from '../matematicas/matrix';
import { GraphSpec, SolveResult, TableData } from '../tipos/numerical';
`)}
/** Arma los títulos x1, x2, ... de una matriz aumentada. */
export ${between(direct, 'const headersOf', 'function matrixTable')}
/** Convierte una matriz en una tabla para la pestaña Tabla. */
export ${between(direct, 'function matrixTable', 'function conditionDetail')}
/** Número de condición en norma infinito. Menor que 10: bien condicionada. */
export ${between(direct, 'function conditionDetail', 'function directResult')}
/** Empaqueta la solución, las tablas y el código Octave en el formato de la pantalla. */
export ${between(direct, 'function directResult', 'function rowLiteral')}
/** Pasa las fotos de la eliminación a tablas. */
export ${between(direct, 'function snapshotsToTables', 'export function solveGauss')}
`);

write('eliminacion-gaussiana/gauss.ts', `/**
 * Eliminación gaussiana.
 * Cada ecuación se guarda como una fila f1, f2, f3...
 * En cada columna:
 * 1. Si hay pivoteo, se sube el valor mayor.
 * 2. Se divide esa fila para que el pivote valga 1.
 * 3. Las demás filas se actualizan con fi = -fi(k)*fk + fi.
 * La solución queda en la última columna. Este método no usa gráfica.
 */
${deeper(`import { subscript } from '../matematicas/format';
import { octaveNum } from '../matematicas/format';
import { assertSystem, solveSystem, Matrix, Vector } from '../matematicas/matrix';
import { octaveHeader, octaveMatrix, octaveVector } from '../codigo-octave/text';
import { SolveResult, SystemInput, TableData } from '../tipos/numerical';
`)}import { directResult, headersOf, matrixTable, snapshotsToTables } from '../comun/resultado-directo';

${between(direct, 'function rowLiteral', 'function gaussClassProcedure')}
${between(direct, 'function gaussClassProcedure', 'function gaussOctave')}
${between(direct, 'function gaussOctave', 'function snapshotsToTables')}
${between(direct, 'export function solveGauss', 'export function solveLu')}
`);

write('cramer/cramer.ts', `/**
 * Regla de Cramer.
 * DA es el determinante de A.
 * Para cada incógnita se arma una matriz Xi cambiando la columna i por el vector b.
 * DXi es el determinante de esa matriz y xi = DXi / DA.
 * Sirve hasta sistemas de 4×4. No tiene gráfica.
 */
${deeper(`import { MathError } from '../matematicas/errors';
import { assertSystem, determinant, Matrix, Vector } from '../matematicas/matrix';
import { octaveHeader, octaveMatrix, octaveVector } from '../codigo-octave/text';
import { SolveResult, SystemInput, TableData } from '../tipos/numerical';
`)}import { directResult, matrixTable } from '../comun/resultado-directo';

${between(direct, 'export function solveCramer', '')}
`);

write('otros/sistemas-reservados.ts', `/** LU, Cholesky e inversa. Quedan guardados, fuera de la lista de la aplicación. */
${deeper(`import { subscript } from '../matematicas/format';
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
} from '../matematicas/matrix';
import { octaveHeader, octaveMatrix, octaveVector } from '../codigo-octave/text';
import { SolveResult, SystemInput } from '../tipos/numerical';
`)}import { directResult, headersOf, matrixTable, snapshotsToTables } from '../comun/resultado-directo';

${between(direct, 'export function solveLu', 'export function solveCramer')}
`);

const interpolation = read('interpolation.ts');
const lagrange = interpolation.slice(0, interpolation.indexOf('function differences'));
write('otros/lagrange.ts', `/** Interpolación de Lagrange. Queda guardada, fuera de la lista de la aplicación. */\n${deeper(lagrange).replace(', NewtonDividedInput', '')}`);

const newtonBody = interpolation.slice(interpolation.indexOf('function differences'));
const assertPoints = between(interpolation, 'function assertPoints', 'function basis');
write('interpolacion-newton/newton.ts', `/**
 * Interpolación de Newton por diferencias divididas.
 * La tabla guarda f[xk], f[xk,xk+1], f[xk,xk+1,xk+2]...
 * Si x está más cerca del primer nodo, el polinomio es progresivo y usa el inicio de la tabla.
 * Si está más cerca del último, es regresivo y usa el final.
 * Se calculan P1, P2, ... hasta el grado pedido. La gráfica muestra los nodos y las curvas.
 */
${deeper(`import { formatEs } from '../matematicas/format';
import { MathError } from '../matematicas/errors';
import { octaveHeader } from '../codigo-octave/text';
import { NewtonDividedInput, Point, SolveResult, TableData } from '../tipos/numerical';
`)}
${assertPoints}
${newtonBody}
`);

const regression = read('regression.ts');
const helpers = regression.slice(regression.indexOf('function evalPoly'), regression.indexOf('export function solvePolyReg'));
const poly = regression.slice(regression.indexOf('export function solvePolyReg'), regression.indexOf('export function solveMultiReg'));
const multi = regression.slice(regression.indexOf('export function solveMultiReg'));
const regImports = deeper(`import { MathError } from '../matematicas/errors';
import { formatEs } from '../matematicas/format';
import { Matrix, Vector, inverse, solveSystem, zeros } from '../matematicas/matrix';
import { octaveHeader } from '../codigo-octave/text';
import { PolyRegInput, SolveResult } from '../tipos/numerical';
`);
write('regresion-polinomial/regresion.ts', `/**
 * Regresión polinomial.
 * No pasa por todos los puntos: busca la curva más cercana.
 * Las ecuaciones normales se arman con las sumas de potencias de x y de x^k*y.
 * r² es el coeficiente de determinación: qué parte de la variación de y explica el modelo.
 * r es el coeficiente de correlación: si la relación es directa o inversa, y si es alta.
 * Q es el error cuadrático, St la variación total y Sy/x el error estándar.
 * Si se pide un x, también devuelve el valor estimado. La gráfica muestra los puntos y la curva.
 */
${regImports}
${helpers}
${poly}
`);
write('otros/regresion-multiple.ts', `/** Regresión con dos variables. Queda guardada, fuera de la lista de la aplicación. */
${regImports.replace('PolyRegInput, SolveResult', 'MultiRegInput, SolveResult')}
${helpers}
${multi}
`);

const stay = new Set(['unidad2.test.ts']);
for (const name of fs.readdirSync(metodos)) {
    const full = path.join(metodos, name);
    if (!fs.statSync(full).isFile() || !name.endsWith('.ts') || stay.has(name)) continue;
    if (['direct.ts', 'interpolation.ts', 'regression.ts'].includes(name)) {
        fs.unlinkSync(full);
        continue;
    }
    let text = fs.readFileSync(full, 'utf8');
    text = deeper(text);
    write(path.join('otros', name), text);
    fs.unlinkSync(full);
}

console.log('metodos separados');
