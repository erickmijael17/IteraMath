import { formatEs, subscript, vectorText } from '../../matematicas/format';
import { conditionInfinity, Matrix, Snapshot, Vector } from '../../matematicas/matrix';
import { GraphSpec, SolveResult, TableData } from '../../tipos/numerical';

/** Arma los títulos x1, x2, ... de una matriz aumentada. */
export const headersOf = (size: number, extra: string[] = ['b']): string[] => [
    ...Array.from({ length: size }, (_, index) => `x${subscript(index + 1)}`),
    ...extra
];

/** Convierte una matriz en una tabla para la pestaña Tabla. */
export function matrixTable(title: string, matrix: Matrix, markColumn?: number, headers?: string[]): TableData {
    const width = matrix[0].length;
    return {
        title,
        headers: headers ?? Array.from({ length: width }, (_, index) => String(index + 1)),
        rows: matrix,
        markColumn
    };
}

/** Número de condición en norma infinito. Menor que 10: bien condicionada. */
export function conditionDetail(A: Matrix): { label: string; value: string } | null {
    try {
        const value = conditionInfinity(A);
        const label = value < 10 ? 'bien condicionada' : value > 10000 ? 'mal condicionada' : 'revisar el condicionamiento';
        return { label: 'Cond(A)', value: `${formatEs(value, 7)} · ${label}` };
    } catch {
        return null;
    }
}

/** Empaqueta la solución, las tablas y el código Octave en el formato de la pantalla. */
export function directResult(
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

/** Pasa las fotos de la eliminación a tablas. */
export function snapshotsToTables(snapshots: Snapshot[], size: number): TableData[] {
    return snapshots.map((snapshot) =>
        matrixTable(snapshot.title, snapshot.matrix, size, headersOf(size))
    );
}

