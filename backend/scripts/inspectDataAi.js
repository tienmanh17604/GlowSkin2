import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pdfModule = require('pdf-parse');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function inspectDataAi() {
  const filePath = path.join(__dirname, '../data/DATA AI.pdf');
  const dataBuffer = fs.readFileSync(filePath);
  const uint8Array = new Uint8Array(dataBuffer);

  let data;
  if (typeof pdfModule === 'function') {
    data = await pdfModule(dataBuffer);
  } else if (pdfModule.PDFParse) {
    const parser = new pdfModule.PDFParse(uint8Array);
    data = await parser.getText();
  }

  console.log(`Total Pages: ${data.numpages}`);
  console.log(`Total Length: ${data.text.length} chars`);

  // Split pages by `-- X of Y --` pattern
  const pages = data.text.split(/--\s*\d+\s*of\s*\d+\s*--/gi);
  console.log(`Split pages count: ${pages.length}`);

  pages.forEach((p, idx) => {
    console.log(`\n=== PAGE ${idx + 1} ===`);
    console.log(p.trim().substring(0, 400));
  });
}

inspectDataAi().catch(console.error);
