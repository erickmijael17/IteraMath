import Plotly from 'plotly.js-dist-min';
import { MullerResult, MullerInput } from '../types/numerical';
import { sampleFunction } from './functionSampler';
import { formatComplex } from '../math/complex';
import {
    getGraphColors,
    computeFocusedRange,
    buildGraphLayout,
    buildCurveTrace,
    buildApproximationsTrace,
    buildRootTrace,
    plotGraph,
    showGraphError
} from './graphTheme';

export function renderMullerGraph(
    containerId: string,
    input: MullerInput,
    result: MullerResult
) {
    const container = document.getElementById(containerId);
    if (!container) return;

    try {
        const isComplexRoot = Math.abs(result.root.im) > 1e-6;

        const realIterationPoints = result.iterations
            .filter(it => Math.abs(it.xNext.im) <= 1e-6)
            .map(it => it.xNext.re);

        const xRange = computeFocusedRange([input.x0, input.x1, input.x2, ...realIterationPoints]);
        const sampledF = sampleFunction(input.expression, xRange[0], xRange[1], 300);
        const colors = getGraphColors();

        const data: Plotly.Data[] = [buildCurveTrace(sampledF, 'f(x)')];

        const realIterX: number[] = [input.x0, input.x1, input.x2, ...realIterationPoints];
        data.push(buildApproximationsTrace(realIterX, realIterX.map(() => 0), 'x', 'Aproximaciones Reales'));

        if (!isComplexRoot) {
            data.push(buildRootTrace(result.root.re, 0));
        }

        const layout = buildGraphLayout({
            title: `Müller: f(x) = ${input.expression}`,
            xAxisTitle: 'Eje Real (x)',
            xRange,
            annotations: isComplexRoot ? [{
                x: 0.5,
                y: 0.5,
                xref: 'paper',
                yref: 'paper',
                text: `La raíz pertenece al plano complejo.<br>(${formatComplex(result.root)})`,
                showarrow: false,
                font: { family: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif', size: 15, color: colors.error },
                bgcolor: colors.errorBg,
                bordercolor: colors.error,
                borderwidth: 1,
                borderpad: 12
            } as Partial<Plotly.Annotations>] : []
        });

        plotGraph(container, data, layout);
    } catch (error: any) {
        showGraphError(container, error.message);
    }
}
