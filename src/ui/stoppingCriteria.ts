import { ErrorCriterion } from '../types/numerical';
import { ToleranceUnit } from '../math/tolerance';

interface CriterionInfo {
    name: string;
    badge: string;
    math: string;
    desc: string;
}

const term = (html: string) => `<span class="math-term">${html}</span>`;
const op = (symbol: string) => `<span class="math-op">${symbol}</span>`;
const frac = (num: string, den: string) => `<span class="math-fraction"><span class="math-num">${num}</span><span class="math-den">${den}</span></span>`;

const STOP_CONDITION = `${op('<')}${term('Tol')}`;
const DIFF_TERM = '|x<sub>k+1</sub> − x<sub>k</sub>|';
const CURRENT_TERM = '|x<sub>k+1</sub>|';

const CRITERION_INFO: Record<ErrorCriterion, CriterionInfo> = {
    absolute: {
        name: 'Absoluto',
        badge: '|Δx|',
        math: `${term('E<sub>k</sub>')}${op('=')}${term(DIFF_TERM)}${STOP_CONDITION}`,
        desc: 'Distancia entre iteraciones consecutivas, en las mismas unidades que x.'
    },
    relative: {
        name: 'Relativo',
        badge: '|Δx| / |x|',
        math: `${term('E<sub>k</sub>')}${op('=')}${frac(DIFF_TERM, CURRENT_TERM)}${STOP_CONDITION}`,
        desc: 'Adimensional: no depende de la escala de x.'
    },
    percentage: {
        name: 'Porcentual',
        badge: '|Δx| / |x| × 100%',
        math: `${term('E<sub>k</sub>')}${op('=')}${frac(DIFF_TERM, CURRENT_TERM)}${op('×')}${term('100%')}${op('<')}${term('Tol%')}`,
        desc: 'Error relativo expresado en porcentaje. La tolerancia se ingresa en %.'
    },
    residual: {
        name: 'Residuo',
        badge: '|f(x)|',
        math: `${term('E<sub>k</sub>')}${op('=')}${term('|f(x<sub>k+1</sub>)|')}${STOP_CONDITION}`,
        desc: 'Qué tan cerca está f de cero, en las unidades de f(x).'
    }
};

const DEFAULT_VALUE_BY_UNIT: Record<ToleranceUnit, string> = {
    val: '1e-6',
    pct: '0.01'
};

const PLACEHOLDER_BY_UNIT: Record<ToleranceUnit, string> = {
    val: '1e-6',
    pct: 'p. ej. 0.01'
};

export function setupStoppingCriteria(): void {
    const form = document.getElementById('resolver-form') as HTMLFormElement | null;
    const select = document.getElementById('error-criterion') as HTMLSelectElement | null;
    const formulaCard = document.getElementById('criterion-formula-card');
    const toleranceInput = document.getElementById('input-tolerance') as HTMLInputElement | null;
    const unitHidden = document.querySelector('#resolver-form [name="toleranceUnit"]') as HTMLInputElement | null;
    const unitBadge = document.getElementById('tolerance-unit-badge');
    const toggleVal = document.getElementById('unit-toggle-val');
    const togglePct = document.getElementById('unit-toggle-pct');

    if (!form || !select || !formulaCard || !toleranceInput || !unitHidden || !unitBadge || !toggleVal || !togglePct) {
        return;
    }

    const renderFormula = () => {
        const info = CRITERION_INFO[select.value as ErrorCriterion];
        if (!info) return;
        formulaCard.innerHTML = `
            <div class="criterion-formula-header">
                <span class="criterion-formula-name">${info.name}</span>
                <span class="criterion-formula-badge">${info.badge}</span>
            </div>
            <div class="criterion-formula-math">${info.math}</div>
            <p class="criterion-formula-desc">${info.desc}</p>
        `;
    };

    const setUnit = (unit: ToleranceUnit) => {
        unitHidden.value = unit;
        toleranceInput.placeholder = PLACEHOLDER_BY_UNIT[unit];
        toggleVal.classList.toggle('active', unit === 'val');
        togglePct.classList.toggle('active', unit === 'pct');
        unitBadge.classList.toggle('hidden', unit !== 'pct');

        const opposite = unit === 'pct' ? 'val' : 'pct';
        if (toleranceInput.value === DEFAULT_VALUE_BY_UNIT[opposite]) {
            toleranceInput.value = DEFAULT_VALUE_BY_UNIT[unit];
        }
    };

    const currentUnit = (): ToleranceUnit => (unitHidden.value === 'pct' ? 'pct' : 'val');

    toggleVal.addEventListener('click', () => setUnit('val'));
    togglePct.addEventListener('click', () => setUnit('pct'));

    toleranceInput.addEventListener('input', () => {
        if (toleranceInput.value.includes('%')) {
            toleranceInput.value = toleranceInput.value.replace(/%/g, '').trim();
            setUnit('pct');
        }
    });

    select.addEventListener('change', () => {
        renderFormula();
        if (select.value === 'percentage' && currentUnit() !== 'pct') {
            setUnit('pct');
        }
    });

    form.addEventListener('reset', () => {
        window.setTimeout(() => setUnit('val'), 0);
    });

    document.querySelectorAll('.btn-tolerance-preset').forEach((button) => {
        button.addEventListener('click', () => {
            const value = button.getAttribute('data-val');
            if (value === null) return;
            toleranceInput.value = value;
            setUnit(button.getAttribute('data-pct') === 'true' ? 'pct' : 'val');
        });
    });

    document.querySelectorAll('.btn-stepper').forEach((btn) => {
        btn.addEventListener('click', () => {
            const step = Number(btn.getAttribute('data-step') || 0);
            const input = document.getElementById('input-max-iter') as HTMLInputElement | null;
            if (!input) return;
            const current = Number(input.value) || 100;
            const min = Number(input.min) || 5;
            const max = Number(input.max) || 1000;
            const next = Math.min(max, Math.max(min, current + step));
            input.value = next.toString();
            input.dispatchEvent(new Event('input', { bubbles: true }));
        });
    });

    document.querySelectorAll('.btn-iter-preset').forEach((btn) => {
        btn.addEventListener('click', () => {
            const iter = btn.getAttribute('data-iter');
            const input = document.getElementById('input-max-iter') as HTMLInputElement | null;
            if (!input || !iter) return;
            input.value = iter;
            input.dispatchEvent(new Event('input', { bubbles: true }));
        });
    });

    renderFormula();
}
