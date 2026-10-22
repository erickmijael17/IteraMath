import { MethodId } from '../types/numerical';

export interface ExamplePreset {
    name: string;
    fields: Record<string, string>;
}

export const METHOD_HELP: Record<MethodId, string> = {
    gauss: 'Convierte el sistema en una triangular superior y despeja desde la última incógnita.',
    'gauss-jordan': 'Sigue eliminando hasta dejar la identidad. La solución queda en la última columna.',
    lu: 'Factoriza PA = LU con unos en la diagonal de L y resuelve dos sistemas triangulares.',
    cholesky: 'Solo si A es simétrica y definida positiva. Factoriza A = L Lᵀ y resuelve Ly = b, Lᵀx = y.',
    inverse: 'Lleva [A | I] hasta [I | A⁻¹] y multiplica la inversa por b.',
    cramer: 'Cada incógnita es un cociente de determinantes. Sirve hasta sistemas de 4×4.',
    jacobi: 'Cada incógnita nueva usa solo los valores de la iteración anterior.',
    'gauss-seidel': 'Cada incógnita nueva usa enseguida los valores que ya se actualizaron.',
    'newton-system': 'Escribe las ecuaciones igualadas a cero, con variables x, y, z. La app deriva la jacobiana.',
    'fixed-point-system': 'Escribe cada g. La iteración reemplaza el vector por g(x, y, …).',
    lagrange: 'Arma el polinomio con los nodos. Puedes usar los más cercanos a x o todos los datos.',
    'newton-divided': 'Construye las diferencias divididas y elige la forma progresiva o regresiva.',
    'regression-poly': 'Ajusta un polinomio por ecuaciones normales y muestra r² y Sy/x.',
    'regression-multiple': 'Ajusta y = a0 + a1 x1 + a2 x2. La primera casilla de la matriz normal es n.'
};

function system(A: number[][], b: number[], extra: Record<string, string> = {}): Record<string, string> {
    const fields: Record<string, string> = { size: String(A.length), pivot: '1', ...extra };
    A.forEach((row, i) => {
        row.forEach((value, j) => {
            fields[`a_${i}_${j}`] = String(value);
        });
        fields[`b_${i}`] = String(b[i]);
    });
    return fields;
}

function points(data: [number, number][], extra: Record<string, string>): Record<string, string> {
    const fields: Record<string, string> = { rows: String(data.length), ...extra };
    data.forEach(([x, y], index) => {
        fields[`px_${index}`] = String(x);
        fields[`py_${index}`] = String(y);
    });
    return fields;
}

const CLASS_A = [[3, -0.1, -0.2], [0.1, 7, -0.3], [0.3, -0.2, 10]];
const CLASS_B = [7.85, -19.3, 71.4];
const TALLER_A = [[2, 1, 0], [1, -2, 4], [3, 1, -5]];
const TALLER_B = [1, -3, 2];
const JACOBI_A = [[4, 1, 2], [1, 4, 1], [1, 2, 4]];
const JACOBI_B = [15, 9, 16];

const iterativeExtra = {
    tolerance: '0.001',
    maxIterations: '25',
    norm: 'inf',
    x0_0: '0',
    x0_1: '0',
    x0_2: '0'
};

export const EXAMPLES: Record<MethodId, ExamplePreset[]> = {
    gauss: [
        { name: 'Sistema de la clase', fields: system(CLASS_A, CLASS_B) },
        { name: 'Taller', fields: system(TALLER_A, TALLER_B) }
    ],
    'gauss-jordan': [
        { name: 'Sistema de la clase', fields: system(CLASS_A, CLASS_B) }
    ],
    lu: [
        { name: 'Ejemplo de la clase', fields: system([[-1, 1, -3], [3, -3, -1], [1, 1, 0]], [-2, -4, 3]) }
    ],
    cholesky: [
        { name: 'Ejemplo de la clase', fields: system([[8, 20, 15], [20, 80, 50], [15, 50, 60]], [50, 250, 100]) }
    ],
    inverse: [
        { name: 'Taller', fields: system(TALLER_A, TALLER_B) }
    ],
    cramer: [
        { name: 'Taller', fields: system(TALLER_A, TALLER_B) }
    ],
    jacobi: [
        { name: 'Tarea, ya reordenado', fields: system(JACOBI_A, JACOBI_B, iterativeExtra) }
    ],
    'gauss-seidel': [
        { name: 'Tarea, ya reordenado', fields: system(JACOBI_A, JACOBI_B, iterativeExtra) }
    ],
    'newton-system': [
        {
            name: 'Dos ecuaciones',
            fields: {
                eqCount: '2',
                eq_0: 'x^2 + y^2 - y',
                eq_1: 'x^2 - x - y^2',
                x0_0: '0.1',
                x0_1: '0.1',
                tolerance: '1e-6',
                maxIterations: '20'
            }
        }
    ],
    'fixed-point-system': [
        {
            name: 'Ejemplo de la clase',
            fields: {
                eqCount: '2',
                eq_0: '(x^2 + y^2 + 8)/10',
                eq_1: '(x*y^2 + x + 8)/10',
                x0_0: '0',
                x0_1: '0',
                tolerance: '1e-4',
                maxIterations: '30'
            }
        }
    ],
    lagrange: [
        {
            name: 'Aproximar f(0.2)',
            fields: points([[-0.2, -0.163746], [0.1, 0.110517], [0.3, 0.404958], [0.7, 1.40963]], {
                at: '0.2',
                degree: '3',
                mode: 'apropiados',
                expression: ''
            })
        },
        {
            name: 'f(1.25) y cota',
            fields: points([[1, 1], [1.1, 1.23368], [1.2, 1.55271], [1.3, 1.99372], [1.4, 2.6117]], {
                at: '1.25',
                degree: '4',
                mode: 'todos',
                expression: 'exp(x^2-1)'
            })
        }
    ],
    'newton-divided': [
        {
            name: 'sen(0.34)',
            fields: points([[0.3, 0.29552], [0.32, 0.31457], [0.33, 0.32404], [0.35, 0.3429]], {
                at: '0.34',
                degree: '3',
                form: 'auto'
            })
        }
    ],
    'regression-poly': [
        {
            name: 'Pérdida de peso, recta',
            fields: points([[1, 9], [2, 7.5], [3, 4.2], [4, 3], [5, 2.1]], { degree: '1' })
        },
        {
            name: 'Parábola de la sesión',
            fields: points([[0, 2.1], [1, 7.7], [2, 13.6], [3, 27.2], [4, 40.9], [5, 61.1]], { degree: '2' })
        }
    ],
    'regression-multiple': [
        {
            name: 'Ejercicio 17.16',
            fields: {
                rows: '9',
                ...Object.fromEntries([0, 1, 1, 2, 2, 3, 3, 4, 4].flatMap((x1, index) => {
                    const x2 = [0, 1, 2, 1, 2, 1, 2, 1, 2][index];
                    const y = [15.1, 17.9, 12.7, 25.6, 20.5, 35.1, 29.7, 45.4, 40.2][index];
                    return [[`x1_${index}`, String(x1)], [`x2_${index}`, String(x2)], [`y_${index}`, String(y)]];
                }))
            }
        }
    ]
};
