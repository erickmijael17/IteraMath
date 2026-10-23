import { octaveNum } from '../matematicas/format';
import { Matrix, Vector } from '../matematicas/matrix';

export function octaveMatrix(name: string, matrix: Matrix): string {
    const body = matrix.map((row) => row.map((value) => octaveNum(value)).join(' ')).join('; ');
    return `${name} = [${body}];`;
}

export function octaveVector(name: string, vector: Vector, column = true): string {
    const body = vector.map((value) => octaveNum(value)).join(column ? '; ' : ' ');
    return `${name} = [${body}]${column ? '' : ''};`;
}

export function octaveHeader(title: string): string {
    return `% ${title}\n% Generado por IteraMath U2\n\nformat long\n`;
}
