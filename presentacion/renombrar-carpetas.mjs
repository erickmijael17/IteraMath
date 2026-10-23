import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve('src');
const pairs = [
    ['math', 'matematicas'],
    ['ui', 'interfaz'],
    ['graph', 'graficas'],
    ['storage', 'almacenamiento'],
    ['types', 'tipos'],
    ['styles', 'estilos'],
    ['comparison', 'comparacion'],
    ['octave', 'codigo-octave'],
    ['methods', 'metodos']
];

for (const [from, to] of pairs) {
    const origin = path.join(root, from);
    const target = path.join(root, to);
    if (fs.existsSync(origin)) fs.renameSync(origin, target);
}

const replacements = [];
for (const [from, to] of pairs) {
    replacements.push([`/${from}/`, `/${to}/`]);
    replacements.push([`/${from}'`, `/${to}'`]);
    replacements.push([`/${from}"`, `/${to}"`]);
}

function walk(target) {
    const stat = fs.statSync(target);
    if (stat.isDirectory()) {
        if (target.includes('node_modules')) return;
        for (const name of fs.readdirSync(target)) walk(path.join(target, name));
        return;
    }
    if (!/\.(ts|css|html|mjs)$/.test(target)) return;
    let text = fs.readFileSync(target, 'utf8');
    let next = text;
    for (const [from, to] of replacements) next = next.split(from).join(to);
    next = next.replaceAll("from './graph'", "from './graficas'");
    next = next.replaceAll("from './types/", "from './tipos/");
    next = next.replaceAll("from './ui/", "from './interfaz/");
    next = next.replaceAll("import './styles/", "import './estilos/");
    if (next !== text) fs.writeFileSync(target, next);
}

walk(root);
const index = path.resolve('index.html');
if (fs.existsSync(index)) walk(index);
console.log('listo');
