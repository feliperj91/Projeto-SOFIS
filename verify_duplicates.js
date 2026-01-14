const fs = require('fs');
const path = require('path');

// Configuration
const TARGET_DIR = process.argv[2] || 'C:\\Users\\user\\Desktop\\Nova pasta\\13-01';
const SEARCH_PREFIX = '=B34';

console.log(`Starting verification in: ${TARGET_DIR}`);

// Store occurrences: { "number": ["file1", "file2"] }
const occurrences = new Map();

function scanDirectory(directory) {
    if (!fs.existsSync(directory)) {
        console.error(`Directory not found: ${directory}`);
        return;
    }

    const files = fs.readdirSync(directory);

    for (const file of files) {
        const fullPath = path.join(directory, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            scanDirectory(fullPath);
        } else if (stat.isFile()) {
            checkFile(fullPath);
        }
    }
}

function checkFile(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'latin1'); // Use latin1 or utf8 depending on file encoding likelihood

        // Regex to find =B34 followed by word characters (digits usually)
        // Adjust regex based on strict requirements. checking for digits after B34.
        const regex = /=B34\d+/g;
        const matches = content.match(regex);

        if (matches) {
            matches.forEach(match => {
                if (!occurrences.has(match)) {
                    occurrences.set(match, new Set());
                }
                occurrences.get(match).add(filePath);
            });
        }
    } catch (err) {
        console.error(`Error reading file ${filePath}: ${err.message}`);
    }
}

scanDirectory(TARGET_DIR);




const reportPath = path.join(process.cwd(), 'relatorio_duplicatas.txt');
let reportContent = `--- Relatório de Verificação de Duplicatas ---\n`;
reportContent += `Data/Hora: ${new Date().toLocaleString()}\n`;
reportContent += `Diretório analisado: ${TARGET_DIR}\n\n`;

let duplicatesFound = false;
let totalOccurrences = 0;

occurrences.forEach((files, number) => {
    totalOccurrences++;
    if (files.size > 1) {
        duplicatesFound = true;
        reportContent += `Número Duplicado: ${number}\n`;
        reportContent += `Encontrado nos arquivos:\n`;
        files.forEach(f => reportContent += ` - ${f}\n`);
        reportContent += `-----------------------------------\n`;
    }
});

reportContent += `\n--- Lista Completa de Números Encontrados (${occurrences.size}) ---\n`;
occurrences.forEach((files, number) => {
    const fileNames = Array.from(files).map(f => path.basename(f)).join(', ');
    reportContent += `${number}  ->  ${fileNames}\n`;
});
reportContent += `--------------------------------------------------\n`;

reportContent += `\nResumo:\n`;
reportContent += `Total de números exclusivos (=B34...) encontrados: ${occurrences.size}\n`;

if (!duplicatesFound) {
    reportContent += `Nenhuma duplicata encontrada.\n`;
} else {
    reportContent += `Duplicatas foram listadas acima.\n`;
}

try {
    fs.writeFileSync(reportPath, reportContent);
    console.log(`Relatório gerado com sucesso em: ${reportPath}`);
    console.log(reportContent);
} catch (err) {
    console.error(`Erro ao salvar o relatório: ${err.message}`);
}

