import fs from 'node:fs';
import path from 'node:path';
import PptxGenJS from 'pptxgenjs';

const root = path.resolve('src/img');
const shots = 'C:/Users/YEFRIL~1/AppData/Local/Temp/cursor/screenshots';
const newest = (folder) => {
    const files = fs.readdirSync(path.join(root, folder))
        .filter((name) => /\.(jpe?g|png)$/i.test(name))
        .map((name) => path.join(root, folder, name));
    return files.sort((a, b) => fs.statSync(b).size - fs.statSync(a).size)[0];
};

const manual = {
    cramer: path.join(root, 'cramer', 'WhatsApp Image 2026-10-23 at 11.54.18 AM.jpeg'),
    gauss: newest('eliminacion de gaus'),
    newton: newest('interpolacion de nwton'),
    regresion: newest('regresion polinomial')
};
const app = {
    cramer: path.join(shots, 'cramer-iteramath.png'),
    gauss: path.join(shots, 'gauss-iteramath.png'),
    newton: path.join(shots, 'newton-iteramath.png'),
    regresion: path.join(shots, 'regresion-iteramath.png')
};

const navy = '071E36';
const blue = '0E4C92';
const indigo = '4F46E5';
const ink = '0F172A';
const muted = '475569';
const line = 'E2E8F0';
const card = 'F8FAFC';
const white = 'FFFFFF';
const names = [
    'Erick Mijael Delgado Lima',
    'Fernando Andre Huanca Huallpa',
    'Yefri Ronalddiño Lerma Pacompia',
    'Walter David Quispesayhua Quispe'
];

const pres = new PptxGenJS();
pres.defineLayout({ name: 'WIDE', width: 13.333, height: 7.5 });
pres.layout = 'WIDE';
pres.title = 'IteraMath 2.0';
pres.author = names.join(', ');
pres.subject = 'Métodos numéricos de la unidad 2';

function logo(slide, x, y, size = 0.92) {
    slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
        x, y, w: size, h: size,
        fill: { color: indigo },
        rectRadius: 0.16,
        shadow: { type: 'outer', color: '000000', blur: 10, opacity: 0.18, offset: 3 }
    });
    slide.addShape(pres.shapes.OVAL, {
        x: x + size * 0.62, y: y + size * 0.12, w: size * 0.18, h: size * 0.18,
        fill: { color: '38BDF8' }
    });
    slide.addText('IM', {
        x, y: y + size * 0.22, w: size, h: size * 0.48,
        align: 'center', fontFace: 'Calibri', fontSize: Math.round(size * 22), bold: true, color: white, margin: 0
    });
}

function footer(slide, page) {
    slide.addShape(pres.shapes.RECTANGLE, { x: 0, y: 7.22, w: 13.333, h: 0.28, fill: { color: navy } });
    slide.addText('IteraMath 2.0  ·  Unidad 2', {
        x: 0.35, y: 7.22, w: 4, h: 0.28, fontFace: 'Calibri', fontSize: 10, color: 'CBD5E1', margin: 0, valign: 'middle'
    });
    slide.addText(String(page), {
        x: 12.4, y: 7.22, w: 0.6, h: 0.28, fontFace: 'Calibri', fontSize: 10, color: white, align: 'right', margin: 0, valign: 'middle'
    });
}

function cover() {
    const slide = pres.addSlide();
    slide.background = { color: navy };
    slide.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 0.18, h: 7.5, fill: { color: indigo } });
    slide.addShape(pres.shapes.OVAL, { x: 10.4, y: -1.4, w: 4.2, h: 4.2, fill: { color: '0E3A66' } });
    slide.addShape(pres.shapes.OVAL, { x: 11.3, y: 5.2, w: 2.6, h: 2.6, fill: { color: '0C335C' } });
    logo(slide, 0.7, 0.55, 1.05);
    slide.addText('UNIDAD 2', {
        x: 1.95, y: 0.7, w: 3, h: 0.28,
        fontFace: 'Calibri', fontSize: 13, bold: true, color: '7DD3FC', margin: 0, charSpacing: 1.5
    });
    slide.addText('IteraMath 2.0', {
        x: 0.7, y: 1.9, w: 8, h: 0.9,
        fontFace: 'Calibri', fontSize: 54, bold: true, color: white, margin: 0
    });
    slide.addText('Aplicación web para resolver métodos numéricos.\nLos ejercicios de clase y la aplicación dan el mismo resultado.', {
        x: 0.7, y: 2.9, w: 7.4, h: 0.85,
        fontFace: 'Calibri', fontSize: 18, color: 'D6E4F0', margin: 0
    });
    names.forEach((name, index) => {
        const column = index % 2;
        const row = Math.floor(index / 2);
        slide.addText(name, {
            x: 0.7 + column * 4.3, y: 4.35 + row * 0.48, w: 4, h: 0.4,
            fontFace: 'Calibri', fontSize: 15, color: white, margin: 0
        });
    });
    slide.addText('Cramer   ·   Eliminación gaussiana   ·   Newton   ·   Regresión polinomial', {
        x: 0.7, y: 6.45, w: 10, h: 0.35,
        fontFace: 'Calibri', fontSize: 14, color: '7DD3FC', margin: 0
    });
}

function methodSlide(page, data) {
    const slide = pres.addSlide();
    slide.background = { color: white };
    slide.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 13.333, h: 1.15, fill: { color: navy } });
    slide.addText(data.kicker, {
        x: 0.4, y: 0.12, w: 6, h: 0.28,
        fontFace: 'Calibri', fontSize: 12, bold: true, color: '7DD3FC', margin: 0
    });
    slide.addText(data.title, {
        x: 0.4, y: 0.4, w: 8, h: 0.55,
        fontFace: 'Calibri', fontSize: 28, bold: true, color: white, margin: 0
    });
    slide.addText(data.life, {
        x: 8.3, y: 0.28, w: 4.6, h: 0.7,
        fontFace: 'Calibri', fontSize: 13, color: 'E2E8F0', margin: 0, align: 'right'
    });

    slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
        x: 0.35, y: 1.4, w: 5.55, h: 1.55, fill: { color: card }, rectRadius: 0.1, line: { color: line }
    });
    slide.addText('Qué es', {
        x: 0.55, y: 1.5, w: 5.1, h: 0.28,
        fontFace: 'Calibri', fontSize: 12, bold: true, color: indigo, margin: 0
    });
    slide.addText(data.what, {
        x: 0.55, y: 1.82, w: 5.1, h: 0.95,
        fontFace: 'Calibri', fontSize: 14, color: ink, margin: 0
    });

    slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
        x: 0.35, y: 3.1, w: 5.55, h: 1.85, fill: { color: card }, rectRadius: 0.1, line: { color: line }
    });
    slide.addText('Ejercicio', {
        x: 0.55, y: 3.2, w: 5.1, h: 0.26,
        fontFace: 'Calibri', fontSize: 12, bold: true, color: indigo, margin: 0
    });
    slide.addText(data.exercise, {
        x: 0.55, y: 3.5, w: 5.1, h: 1.3,
        fontFace: 'Calibri', fontSize: 13, color: ink, margin: 0
    });

    slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
        x: 0.35, y: 5.1, w: 5.55, h: 1.9, fill: { color: 'EEF2FF' }, rectRadius: 0.1
    });
    slide.addText('Resultado en IteraMath 2.0', {
        x: 0.55, y: 5.22, w: 5.1, h: 0.28,
        fontFace: 'Calibri', fontSize: 12, bold: true, color: indigo, margin: 0
    });
    slide.addText(data.result, {
        x: 0.55, y: 5.55, w: 5.1, h: 1.25,
        fontFace: 'Calibri', fontSize: 15, bold: true, color: ink, margin: 0
    });

    slide.addText('Desarrollo en clase', {
        x: 6.15, y: 1.32, w: 3.3, h: 0.24,
        fontFace: 'Calibri', fontSize: 11, bold: true, color: muted, margin: 0
    });
    slide.addText('IteraMath 2.0', {
        x: 9.7, y: 1.32, w: 3.2, h: 0.24,
        fontFace: 'Calibri', fontSize: 11, bold: true, color: muted, margin: 0
    });
    slide.addImage({
        path: data.manual,
        x: 6.15, y: 1.62, w: 3.35, h: 5.2,
        sizing: { type: 'contain', x: 6.15, y: 1.62, w: 3.35, h: 5.2 }
    });
    slide.addImage({
        path: data.app,
        x: 9.65, y: 1.62, w: 3.3, h: 5.2,
        sizing: { type: 'contain', x: 9.65, y: 1.62, w: 3.3, h: 5.2 }
    });
    footer(slide, page);
}

function close() {
    const slide = pres.addSlide();
    slide.background = { color: navy };
    logo(slide, 0.7, 0.6, 1);
    slide.addText('Los cuatro ejercicios coinciden', {
        x: 0.7, y: 1.9, w: 11, h: 0.7,
        fontFace: 'Calibri', fontSize: 36, bold: true, color: white, margin: 0
    });
    slide.addText('Cramer, eliminación gaussiana, Newton y la regresión polinomial\ndieron en IteraMath 2.0 el mismo resultado que en clase.', {
        x: 0.7, y: 2.75, w: 10, h: 0.8,
        fontFace: 'Calibri', fontSize: 18, color: 'D6E4F0', margin: 0
    });
    const checks = [
        'Cramer:  x1 = -14,9    x2 = -29,5    x3 = 19,8',
        'Gauss:  x1 = 3    x2 = -2,5    x3 = 7',
        'Newton:  P4(2,1) = 0,518293745',
        'Regresión:  r² = 0,9985    P(7) = 110,1686'
    ];
    checks.forEach((lineText, index) => {
        slide.addText(lineText, {
            x: 0.7, y: 3.8 + index * 0.42, w: 11, h: 0.38,
            fontFace: 'Calibri', fontSize: 16, color: white, margin: 0
        });
    });
    slide.addText(names.join('   ·   '), {
        x: 0.7, y: 6.55, w: 12, h: 0.4,
        fontFace: 'Calibri', fontSize: 13, color: '7DD3FC', margin: 0
    });
}

cover();
methodSlide(2, {
    kicker: 'SISTEMAS DE ECUACIONES',
    title: 'Método de Cramer',
    life: 'Sirve en circuitos, mezclas y balances pequeños, cuando conviene ver cada incógnita por separado.',
    what: 'Cada incógnita es un cociente de determinantes. Se cambia una columna de A por el vector b y se divide ese determinante entre det(A).',
    exercise: '0,3 x1 + 0,52 x2 + x3 = -0,01\n0,5 x1 + x2 + 1,9 x3 = 0,67\n0,1 x1 + 0,3 x2 + 0,5 x3 = -0,44\n\nxi = DXi / DA',
    result: 'x1 = -14,9\nx2 = -29,5\nx3 = 19,8',
    manual: manual.cramer,
    app: app.cramer
});
methodSlide(3, {
    kicker: 'SISTEMAS DE ECUACIONES',
    title: 'Eliminación gaussiana',
    life: 'Es la base para resolver sistemas grandes en estructuras, redes y modelos lineales.',
    what: 'El pivote se vuelve 1. Cada otra fila se actualiza con fi = -fi(k)·fk + fi. La solución queda en la última columna.',
    exercise: '3 x1 - 0,1 x2 - 0,2 x3 = 7,85\n0,1 x1 + 7 x2 - 0,3 x3 = -19,3\n0,3 x1 - 0,2 x2 + 10 x3 = 71,4',
    result: 'x1 = 3\nx2 = -2,5\nx3 = 7\n\nLa matriz está bien condicionada.',
    manual: manual.gauss,
    app: app.gauss
});
methodSlide(4, {
    kicker: 'INTERPOLACIÓN',
    title: 'Interpolación de Newton',
    life: 'Estima un valor entre mediciones: temperatura, sensores o una tabla experimental.',
    what: 'Construye las diferencias divididas. Como 2,1 está más cerca de 2 que de 2,8, se usa la forma progresiva.',
    exercise: 'Tabla 4.2\nx = 2    2,2    2,4    2,6    2,8\nf(x) = 0,5103757   0,5207843   0,5104147   0,4813306   0,4359160\nAproximar f(2,1)',
    result: 'P1(2,1) = 0,51558\nP2(2,1) = 0,51817728\nP3(2,1) = 0,51830626\nP4(2,1) = 0,518293745',
    manual: manual.newton,
    app: app.newton
});
methodSlide(5, {
    kicker: 'AJUSTE DE CURVAS',
    title: 'Regresión polinomial',
    life: 'Describe una tendencia y permite estimar un valor nuevo: crecimiento, consumo o producción.',
    what: 'Ajusta una curva cercana a todos los puntos. r² es el coeficiente de determinación: la parte de la variación de y que el modelo explica. r es el coeficiente de correlación: la fuerza y el sentido de esa relación.',
    exercise: 'x = 0, 1, 2, 3, 4, 5\ny = 2,1  7,7  13,6  27,2  40,9  61,1\nGrado 2. Estimar y cuando x = 7.',
    result: 'P(x) = 2,4786 + 2,3593 x + 1,8607 x²\nP(7) = 110,1686\nr² = 0,9985   ·   explica el 99,85 %\nr = 0,9993   ·   relación directa y alta',
    manual: manual.regresion,
    app: app.regresion
});
close();

const out = path.resolve('presentacion/IteraMath-2.0.pptx');
await pres.writeFile({ fileName: out });
console.log(out);
