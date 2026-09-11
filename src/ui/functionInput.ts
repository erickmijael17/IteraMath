import { NumericalMethod } from '../types/numerical';
import {
    isValidExpression,
    suggestCorrection,
    hasBalancedParentheses,
    findRootCandidates,
    getFixedPointVariations,
    RootCandidate,
    FixedPointSuggestion
} from '../math';
import { renderPreviewGraph, showPreviewMessage } from '../graph/previewGraph';

const DEBOUNCE_MS = 300;
const PREVIEW_CANVAS_ID = 'preview-canvas';
const FEEDBACK_ID = 'fx-feedback';
const RECOMMENDATIONS_ID = 'point-recommendations';
const PARAM_NAMES = ['a', 'b', 'x0', 'x1', 'x2'];
const WIDE_SEARCH_WINDOW: [number, number] = [-100, 100];

export interface FunctionInputHandle {
    refresh: () => void;
    isValid: () => boolean;
}

export interface FunctionInputConfig {
    getMethod: () => NumericalMethod;
    onExpressionChange?: (expression: string | null) => void;
}

const escapeHtml = (text: string): string =>
    text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const formatValue = (value: number): string => Number(value.toFixed(4)).toString();

function readParam(name: string): HTMLInputElement | null {
    return document.querySelector(`#resolver-form [name="${name}"]`) as HTMLInputElement | null;
}

function setParamValue(name: string, value: number, formatMode: 'decimal' | 'integer' = 'decimal'): void {
    const field = readParam(name);
    if (field) field.value = formatMode === 'integer' ? Math.round(value).toString() : formatValue(value);
}

function getTypedPoints(): number[] {
    return PARAM_NAMES
        .map(name => {
            const field = readParam(name);
            if (!field || field.value.trim() === '') return null;
            const value = Number(field.value);
            return Number.isFinite(value) ? value : null;
        })
        .filter((v): v is number => v !== null);
}

function showPointSelectedToast(x: number, label: string) {
    const parent = document.getElementById('preview-section');
    if (!parent) return;

    let toast = parent.querySelector('.graph-click-toast') as HTMLElement;
    if (!toast) {
        toast = document.createElement('div');
        toast.className = 'graph-click-toast';
        parent.appendChild(toast);
    }

    toast.textContent = `Punto x = ${formatValue(x)} asignado a ${label}`;
    toast.classList.remove('hidden');
    toast.classList.add('visible');

    const prevTimer = (toast as any)._timer;
    if (prevTimer) clearTimeout(prevTimer);

    (toast as any)._timer = setTimeout(() => {
        toast.classList.remove('visible');
        toast.classList.add('hidden');
    }, 2400);
}

function computeSearchWindow(): [number, number] | undefined {
    const points = getTypedPoints();
    if (points.length === 0) return undefined;

    const min = Math.min(...points);
    const max = Math.max(...points);
    const span = Math.max(max - min, 4);
    return [min - span, max + span];
}

function pickPreferredRoot(candidates: RootCandidate[]): number | undefined {
    if (candidates.length === 0) return undefined;

    const x0Field = readParam('x0');
    const typed = x0Field && x0Field.value.trim() !== '' ? Number(x0Field.value) : NaN;
    if (!Number.isFinite(typed)) return candidates[0].rootApprox;

    return candidates.reduce((best, candidate) =>
        Math.abs(candidate.rootApprox - typed) < Math.abs(best.rootApprox - typed)
            ? candidate
            : best
    ).rootApprox;
}

interface RecommendationAction {
    label: string;
    apply: () => void;
}

const G_SUBINDEX = ['₁', '₂', '₃'];
const MAX_CHIP_EXPRESSION_CHARS = 24;

const truncateExpression = (expression: string): string =>
    expression.length > MAX_CHIP_EXPRESSION_CHARS
        ? `${expression.slice(0, MAX_CHIP_EXPRESSION_CHARS - 1)}…`
        : expression;

function renderGxVariations(
    suggestions: FixedPointSuggestion[],
    onSelect: (expression: string) => void
): void {
    const container = document.getElementById('gx-variations');
    if (!container) return;
    container.innerHTML = '';
    if (suggestions.length === 0) return;

    const gxField = readParam('gx');
    const currentVal = gxField?.value.trim() ?? '';

    const header = document.createElement('div');
    header.className = 'gx-variations-header';

    const title = document.createElement('span');
    title.className = 'gx-variations-title';
    title.textContent = 'Variaciones automáticas de g(x)';

    const hint = document.createElement('span');
    hint.className = 'gx-variations-hint';
    hint.textContent = 'Haz clic para seleccionar';

    header.appendChild(title);
    header.appendChild(hint);

    const list = document.createElement('div');
    list.className = 'gx-variations-list';

    suggestions.forEach((suggestion, index) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        const isMatch = currentVal === suggestion.expression || (currentVal === '' && index === 0);
        btn.className = `gx-variation-pill ${isMatch ? 'active' : ''}`;

        const sub = document.createElement('span');
        sub.className = 'gx-subindex';
        sub.textContent = `g${G_SUBINDEX[index] ?? (index + 1)}(x)`;

        const expr = document.createElement('span');
        expr.className = 'gx-expr';
        expr.textContent = truncateExpression(suggestion.expression);

        const badge = document.createElement('span');
        const isConv = suggestion.isConvergent ?? (suggestion.slopeMagnitude < 1);
        badge.className = `gx-badge ${isConv ? 'gx-badge-convergent' : 'gx-badge-divergent'}`;
        badge.textContent = isConv
            ? `|g′| = ${suggestion.slopeMagnitude.toFixed(2)} · Conv.`
            : `|g′| = ${suggestion.slopeMagnitude.toFixed(2)} · Div.`;

        btn.appendChild(sub);
        btn.appendChild(expr);
        btn.appendChild(badge);

        btn.title = `g(x) = ${suggestion.expression} · |g′| ≈ ${suggestion.slopeMagnitude.toFixed(4)} · ${suggestion.originLabel}`;

        btn.addEventListener('click', () => {
            if (gxField) {
                gxField.value = suggestion.expression;
                gxField.dataset.autoFilled = 'true';
            }
            onSelect(suggestion.expression);
        });

        list.appendChild(btn);
    });

    container.appendChild(header);
    container.appendChild(list);
}

let currentPointFormat: 'decimal' | 'integer' = 'decimal';

function buildRecommendation(
    method: NumericalMethod,
    candidate: RootCandidate,
    formatMode: 'decimal' | 'integer' = 'decimal'
): RecommendationAction {
    if (formatMode === 'integer') {
        let intA = Math.floor(candidate.a);
        let intB = Math.ceil(candidate.b);
        if (intA === intB) {
            intB = intA + 1;
        }
        let intRoot = Math.round(candidate.rootApprox);

        switch (method) {
            case 'bisection':
            case 'false-position':
                return {
                    label: `Intervalo [${intA}, ${intB}]`,
                    apply: () => {
                        setParamValue('a', intA, 'integer');
                        setParamValue('b', intB, 'integer');
                    }
                };
            case 'newton-raphson':
            case 'fixed-point':
                return {
                    label: `x0 ≈ ${intRoot}`,
                    apply: () => setParamValue('x0', intRoot, 'integer')
                };
            case 'secant':
                return {
                    label: `x0 = ${intA}, x1 = ${intB}`,
                    apply: () => {
                        setParamValue('x0', intA, 'integer');
                        setParamValue('x1', intB, 'integer');
                    }
                };
            case 'muller': {
                if (intRoot <= intA) {
                    intRoot = intA + 1;
                }
                if (intB <= intRoot) {
                    intB = intRoot + 1;
                }
                return {
                    label: `x0 = ${intA}, x1 = ${intRoot}, x2 = ${intB}`,
                    apply: () => {
                        setParamValue('x0', intA, 'integer');
                        setParamValue('x1', intRoot, 'integer');
                        setParamValue('x2', intB, 'integer');
                    }
                };
            }
        }
    }

    const a = formatValue(candidate.a);
    const b = formatValue(candidate.b);
    const root = formatValue(candidate.rootApprox);

    switch (method) {
        case 'bisection':
        case 'false-position':
            return {
                label: `Intervalo [${a}, ${b}]`,
                apply: () => {
                    setParamValue('a', candidate.a, 'decimal');
                    setParamValue('b', candidate.b, 'decimal');
                }
            };
        case 'newton-raphson':
        case 'fixed-point':
            return {
                label: `x0 ≈ ${root}`,
                apply: () => setParamValue('x0', candidate.rootApprox, 'decimal')
            };
        case 'secant':
            return {
                label: `x0 = ${a}, x1 = ${b}`,
                apply: () => {
                    setParamValue('x0', candidate.a, 'decimal');
                    setParamValue('x1', candidate.b, 'decimal');
                }
            };
        case 'muller':
            return {
                label: `x0 = ${a}, x1 = ${root}, x2 = ${b}`,
                apply: () => {
                    setParamValue('x0', candidate.a, 'decimal');
                    setParamValue('x1', candidate.rootApprox, 'decimal');
                    setParamValue('x2', candidate.b, 'decimal');
                }
            };
    }
}

function renderNoRootsNotice(): HTMLElement {
    const notice = document.createElement('div');
    notice.className = 'recommendations-empty';

    const label = document.createElement('p');
    label.className = 'recommendations-label';
    label.textContent = 'Sin raíces reales detectadas';

    const hint = document.createElement('small');
    hint.className = 'recommendations-hint';
    hint.textContent = 'La función no cambia de signo en el rango de búsqueda: puede no cruzar el eje x, tocarlo sin cruzarlo (raíz doble) o tener sus raíces muy lejos de la zona explorada. Si tu enunciado ya define los parámetros, escríbelos manualmente.';

    notice.appendChild(label);
    notice.appendChild(hint);
    return notice;
}

function renderRecommendations(
    method: NumericalMethod,
    candidates: RootCandidate[],
    onApply: () => void,
    options: { noRootsFound?: boolean } = {}
) {
    const container = document.getElementById(RECOMMENDATIONS_ID);
    if (!container) return;

    container.innerHTML = '';

    if (options.noRootsFound) {
        container.appendChild(renderNoRootsNotice());
        return;
    }

    if (candidates.length === 0) return;

    const group = document.createElement('div');
    group.className = 'recommendations-group';

    const header = document.createElement('div');
    header.className = 'recommendations-header';

    const headerRow = document.createElement('div');
    headerRow.className = 'recommendations-header-row';

    const titleBlock = document.createElement('div');
    const label = document.createElement('p');
    label.className = 'recommendations-label';
    label.textContent = 'Puntos sugeridos por cambio de signo';

    const hint = document.createElement('small');
    hint.className = 'recommendations-hint';
    hint.textContent = 'Haz clic para autocompletar. Si tu ejercicio ya tiene puntos asignados en el enunciado, ignora la sugerencia y escribe los tuyos.';
    titleBlock.appendChild(label);
    titleBlock.appendChild(hint);

    const toggleGroup = document.createElement('div');
    toggleGroup.className = 'point-format-toggle';
    toggleGroup.setAttribute('role', 'group');
    toggleGroup.setAttribute('aria-label', 'Formato de puntos sugeridos');

    const btnDec = document.createElement('button');
    btnDec.type = 'button';
    btnDec.className = `btn-point-format ${currentPointFormat === 'decimal' ? 'active' : ''}`;
    btnDec.textContent = 'Decimal';
    btnDec.addEventListener('click', (e) => {
        e.stopPropagation();
        if (currentPointFormat !== 'decimal') {
            currentPointFormat = 'decimal';
            renderRecommendations(method, candidates, onApply, options);
        }
    });

    const btnInt = document.createElement('button');
    btnInt.type = 'button';
    btnInt.className = `btn-point-format ${currentPointFormat === 'integer' ? 'active' : ''}`;
    btnInt.textContent = 'Enteros';
    btnInt.addEventListener('click', (e) => {
        e.stopPropagation();
        if (currentPointFormat !== 'integer') {
            currentPointFormat = 'integer';
            renderRecommendations(method, candidates, onApply, options);
        }
    });

    toggleGroup.appendChild(btnDec);
    toggleGroup.appendChild(btnInt);

    headerRow.appendChild(titleBlock);
    headerRow.appendChild(toggleGroup);
    header.appendChild(headerRow);

    const chips = document.createElement('div');
    chips.className = 'recommendations-chips';

    candidates.forEach(candidate => {
        const recommendation = buildRecommendation(method, candidate, currentPointFormat);
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'chip chip-recommendation';
        button.textContent = recommendation.label;
        button.title = 'Rellenar los parámetros con este valor';
        button.addEventListener('click', () => {
            recommendation.apply();
            onApply();
        });
        chips.appendChild(button);
    });

    group.appendChild(header);
    group.appendChild(chips);
    container.appendChild(group);
}

export function setupFunctionInput(config: FunctionInputConfig): FunctionInputHandle {
    const input = document.getElementById('input-fx') as HTMLInputElement | null;
    const feedback = document.getElementById(FEEDBACK_ID);
    if (!input || !feedback) {
        return { refresh: () => {}, isValid: () => false };
    }

    let debounceTimer: number | undefined;
    let currentStateValid = false;

    const evaluate = () => {
        const raw = input.value.trim();

        if (raw === '') {
            currentStateValid = false;
            input.classList.remove('input-valid', 'input-error');
            feedback.innerHTML = '';
            renderRecommendations(config.getMethod(), [], evaluate);
            const gxContainer = document.getElementById('gx-variations');
            if (gxContainer) gxContainer.innerHTML = '';
            showPreviewMessage(PREVIEW_CANVAS_ID, 'Escribe una función para verla en vivo.');
            config.onExpressionChange?.(null);
            return;
        }

        if (isValidExpression(raw)) {
            currentStateValid = true;
            input.classList.remove('input-error');
            input.classList.add('input-valid');
            feedback.innerHTML = '';

            let candidates: RootCandidate[] = [];
            try {
                const searchWindow = computeSearchWindow();
                candidates = findRootCandidates(raw, searchWindow);
                if (candidates.length === 0 && searchWindow === undefined) {
                    candidates = findRootCandidates(raw, WIDE_SEARCH_WINDOW);
                }
            } catch {
                candidates = [];
            }

            let gSuggestions: FixedPointSuggestion[] = [];
            if (config.getMethod() === 'fixed-point') {
                const x0Field = readParam('x0');
                const typedX0 = x0Field && x0Field.value.trim() !== '' ? Number(x0Field.value) : NaN;
                const prefRoot = Number.isFinite(typedX0) ? typedX0 : pickPreferredRoot(candidates);
                gSuggestions = getFixedPointVariations(raw, prefRoot);

                const gxField = readParam('gx');
                if (gxField && gSuggestions.length > 0) {
                    if (!gxField.value.trim() || gxField.dataset.autoFilled === 'true') {
                        gxField.value = gSuggestions[0].expression;
                        gxField.dataset.autoFilled = 'true';
                    }
                }

                if (x0Field && !x0Field.value.trim() && candidates.length > 0) {
                    x0Field.value = formatValue(candidates[0].rootApprox);
                }

                renderGxVariations(gSuggestions, () => evaluate());
            } else {
                const gxContainer = document.getElementById('gx-variations');
                if (gxContainer) gxContainer.innerHTML = '';
            }

            const gx = config.getMethod() === 'fixed-point'
                ? (readParam('gx')?.value ?? null)
                : null;

            const typedPoints = getTypedPoints();

            renderPreviewGraph(PREVIEW_CANVAS_ID, raw, candidates, {
                gx,
                typedPoints,
                onPointSelect: (selectedX: number) => {
                    const method = config.getMethod();
                    const formatted = formatValue(selectedX);
                    let targetField: HTMLInputElement | null = null;
                    let label = '';

                    if (method === 'bisection' || method === 'false-position') {
                        const aField = readParam('a');
                        const bField = readParam('b');
                        if (aField && !aField.value.trim()) {
                            targetField = aField;
                            label = 'a';
                        } else if (bField && !bField.value.trim()) {
                            targetField = bField;
                            label = 'b';
                        } else if (aField && bField) {
                            const numA = Number(aField.value);
                            const numB = Number(bField.value);
                            if (Math.abs(selectedX - numA) <= Math.abs(selectedX - numB)) {
                                targetField = aField;
                                label = 'a';
                            } else {
                                targetField = bField;
                                label = 'b';
                            }
                        }
                    } else if (method === 'secant') {
                        const x0Field = readParam('x0');
                        const x1Field = readParam('x1');
                        if (x0Field && !x0Field.value.trim()) {
                            targetField = x0Field;
                            label = 'x₀';
                        } else {
                            targetField = x1Field;
                            label = 'x₁';
                        }
                    } else if (method === 'muller') {
                        const x0Field = readParam('x0');
                        const x1Field = readParam('x1');
                        const x2Field = readParam('x2');
                        if (x0Field && !x0Field.value.trim()) {
                            targetField = x0Field;
                            label = 'x₀';
                        } else if (x1Field && !x1Field.value.trim()) {
                            targetField = x1Field;
                            label = 'x₁';
                        } else if (x2Field && !x2Field.value.trim()) {
                            targetField = x2Field;
                            label = 'x₂';
                        } else {
                            targetField = x0Field;
                            label = 'x₀';
                        }
                    } else {
                        const x0Field = readParam('x0');
                        if (x0Field) {
                            targetField = x0Field;
                            label = 'x₀';
                        }
                    }

                    if (targetField) {
                        targetField.value = formatted;
                        showPointSelectedToast(selectedX, label);
                        evaluate();
                    }
                }
            });
            renderRecommendations(config.getMethod(), candidates, evaluate, {
                noRootsFound: candidates.length === 0
            });
            config.onExpressionChange?.(raw);
            return;
        }

        currentStateValid = false;
        input.classList.remove('input-valid');
        input.classList.add('input-error');

        const correction = suggestCorrection(raw);
        if (correction) {
            feedback.innerHTML = `
                <div class="fx-suggestion">
                    <span>¿Quisiste decir <code>${escapeHtml(correction.corrected)}</code>?</span>
                    <button type="button" class="chip chip-suggestion">Corregir</button>
                </div>
            `;
            feedback.querySelector('.chip-suggestion')?.addEventListener('click', () => {
                input.value = correction.corrected;
                evaluate();
            });
        } else if (!hasBalancedParentheses(raw)) {
            feedback.innerHTML = '<p class="fx-error">Revisa los paréntesis: no están balanceados.</p>';
        } else {
            feedback.innerHTML = '<p class="fx-error">La función no es válida. Usa sintaxis como x^2, sin(x), exp(-x).</p>';
        }

        renderRecommendations(config.getMethod(), [], evaluate);
        const gxContainer = document.getElementById('gx-variations');
        if (gxContainer) gxContainer.innerHTML = '';
        showPreviewMessage(PREVIEW_CANVAS_ID, 'La función aún no es válida.');
        config.onExpressionChange?.(null);
    };

    const scheduleEvaluate = () => {
        window.clearTimeout(debounceTimer);
        debounceTimer = window.setTimeout(evaluate, DEBOUNCE_MS);
    };

    input.addEventListener('input', scheduleEvaluate);

    document.querySelectorAll('.btn-formula-helper').forEach(btn => {
        btn.addEventListener('click', () => {
            const formula = (btn as HTMLElement).getAttribute('data-formula');
            if (!formula) return;
            if (input.value.trim() === '') {
                input.value = formula;
            } else {
                input.value += ` + ${formula}`;
            }
            input.focus();
            scheduleEvaluate();
        });
    });

    document.getElementById('dynamic-parameters')?.addEventListener('input', (event) => {
        if (event.target instanceof HTMLInputElement) {
            if (event.target.name === 'gx') {
                event.target.dataset.autoFilled = 'false';
                const container = document.getElementById('gx-variations');
                if (container) {
                    const val = event.target.value.trim();
                    container.querySelectorAll('.gx-variation-pill').forEach(pill => {
                        const exprSpan = pill.querySelector('.gx-expr');
                        if (exprSpan && exprSpan.textContent === val) {
                            pill.classList.add('active');
                        } else {
                            pill.classList.remove('active');
                        }
                    });
                }
            }
            scheduleEvaluate();
        }
    });

    return {
        refresh: evaluate,
        isValid: () => currentStateValid
    };
}
