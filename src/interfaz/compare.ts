import { renderChart } from '../graficas/charts';
import { MathError } from '../matematicas/errors';
import { vectorText } from '../matematicas/format';
import { solveGauss } from '../metodos/eliminacion-gaussiana/gauss';
import { solveCholesky, solveLu } from '../metodos/otros/sistemas-reservados';
import { solveIterative } from '../metodos/otros/iterative';
import { SystemInput } from '../tipos/numerical';

export function setupCompareNavigation(): void {
    const navCompare = document.getElementById('nav-compare');
    const view = document.getElementById('view-compare');
    navCompare?.addEventListener('click', (event) => {
        event.preventDefault();
        document.getElementById('nav-resolver')?.classList.remove('active');
        document.getElementById('nav-history')?.classList.remove('active');
        navCompare.classList.add('active');
        document.getElementById('view-resolver')?.classList.add('hidden');
        document.getElementById('view-history')?.classList.add('hidden');
        view?.classList.remove('hidden');
    });

    const host = document.getElementById('compare-host');
    if (!host) return;
    host.innerHTML = `
        <form id="compare-form" class="compare-form">
            <div class="compare-section">
                <h3 class="compare-section-title">Mismo sistema, varios métodos</h3>
                <p class="compare-section-desc">Gauss, Gauss-Jordan y LU tienen que dar la misma solución. Cholesky solo si la matriz sirve. Jacobi y Gauss-Seidel se comparan con la misma tolerancia.</p>
                <div class="matrix-grid" style="--cols:3">
                    ${[4, 1, 2, 1, 4, 1, 1, 2, 4].map((value, index) => `<input name="c_${Math.floor(index / 3)}_${index % 3}" type="number" step="any" value="${value}" />`).join('')}
                </div>
                <div class="matrix-grid" style="--cols:3;margin-top:8px">
                    ${[15, 9, 16].map((value, index) => `<input name="cb_${index}" type="number" step="any" value="${value}" />`).join('')}
                </div>
                <div class="form-group-row" style="margin-top:12px">
                    <div class="form-group"><label>Tolerancia</label><input name="tolerance" value="0.001" /></div>
                    <div class="form-group"><label>Iteraciones</label><input name="maxIterations" type="number" value="25" /></div>
                </div>
            </div>
            <button type="submit" class="btn-primary">Comparar</button>
        </form>
        <div id="compare-output"></div>
    `;
    host.querySelector('#compare-form')?.addEventListener('submit', (event) => {
        event.preventDefault();
        const form = event.target as HTMLFormElement;
        const data = new FormData(form);
        const A = [0, 1, 2].map((row) => [0, 1, 2].map((column) => Number(data.get(`c_${row}_${column}`))));
        const b = [0, 1, 2].map((index) => Number(data.get(`cb_${index}`)));
        const system: SystemInput = { A, b, pivot: true };
        const iterative = {
            ...system,
            x0: [0, 0, 0],
            tolerance: Number(data.get('tolerance')),
            maxIterations: Number(data.get('maxIterations')),
            norm: 'inf' as const
        };
        const rows: string[] = [];
        const attempt = (name: string, run: () => { values: number[]; status: string; series?: { iteration: number; error: number | null }[] }) => {
            try {
                const result = run();
                rows.push(`<tr><td>${name}</td><td>${vectorText(result.values)}</td><td>${result.status}</td></tr>`);
                return result;
            } catch (error) {
                const message = error instanceof MathError || error instanceof Error ? error.message : 'Error';
                rows.push(`<tr><td>${name}</td><td>—</td><td>${message}</td></tr>`);
                return null;
            }
        };
        const jacobi = attempt('Jacobi', () => solveIterative(iterative, 'jacobi'));
        const seidel = attempt('Gauss-Seidel', () => solveIterative(iterative, 'seidel'));
        attempt('Gauss', () => solveGauss(system, false));
        attempt('Gauss-Jordan', () => solveGauss(system, true));
        attempt('LU', () => solveLu(system));
        attempt('Cholesky', () => solveCholesky(system));
        const output = document.getElementById('compare-output');
        if (!output) return;
        output.innerHTML = `
            <div class="compare-section">
                <h3 class="compare-section-title">Tabla comparativa</h3>
                <div class="table-responsive"><table><thead><tr><th>Método</th><th>Solución</th><th>Estado</th></tr></thead><tbody>${rows.join('')}</tbody></table></div>
                <div id="compare-canvas" style="min-height:360px"></div>
            </div>
        `;
        const series = [jacobi, seidel].flatMap((result, index) => {
            if (!result?.series) return [];
            return [{
                name: index === 0 ? 'Jacobi' : 'Gauss-Seidel',
                iterations: result.series.map((row) => row.iteration),
                errors: result.series.map((row) => row.error ?? 0).filter((error) => error > 0)
            }];
        }).map((item) => ({
            ...item,
            iterations: item.iterations.slice(0, item.errors.length)
        }));
        renderChart('compare-canvas', { type: 'convergence', title: 'Error de los métodos iterativos', series });
    });
}
