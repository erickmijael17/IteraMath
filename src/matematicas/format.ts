const SUB = '₀₁₂₃₄₅₆₇₈₉';

export function formatEs(value: number, digits = 10): string {
    if (!Number.isFinite(value)) return '—';
    if (Math.abs(value) < 5e-13) return '0';
    const abs = Math.abs(value);
    let text: string;
    if (abs >= 1e7 || abs < 1e-6) {
        text = value.toExponential(4);
    } else {
        text = value.toFixed(digits).replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '');
    }
    return text.replace('.', ',');
}

export function octaveNum(value: number): string {
    if (!Number.isFinite(value)) return '0';
    if (Math.abs(value) < 5e-15) return '0';
    const text = value.toPrecision(15);
    return String(Number(text));
}

export function subscript(value: number): string {
    return String(value).split('').map((digit) => SUB[Number(digit)] ?? digit).join('');
}

export function vectorText(values: number[], prefix = 'x'): string {
    return values.map((value, index) => `${prefix}${subscript(index + 1)} = ${formatEs(value)}`).join(', ');
}
