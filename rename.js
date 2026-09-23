import fs from 'fs';
import path from 'path';

const dir = path.join(process.cwd(), 'public', 'frames_optimized');

console.log('Iniciando renumeração sequencial...');

try {
  // Ler arquivos e filtrar apenas webp
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.webp'));
  
  // Ordenar numericamente para garantir que a ordem original se mantenha
  files.sort((a, b) => {
    const numA = parseInt(a.replace('.webp', ''), 10);
    const numB = parseInt(b.replace('.webp', ''), 10);
    return numA - numB;
  });

  let newCount = 0;
  
  // Renomear
  files.forEach((file, index) => {
    const oldPath = path.join(dir, file);
    const newFileName = String(index + 1).padStart(3, '0') + '.webp';
    const newPath = path.join(dir, newFileName);
    
    // Se o nome já for o correto, pula
    if (oldPath !== newPath) {
      fs.renameSync(oldPath, newPath);
    }
    newCount++;
  });

  console.log(`Sucesso! ${newCount} frames foram renomeados em sequência contínua (001.webp até ${String(newCount).padStart(3, '0')}.webp).`);
  console.log(`Lembre-se de atualizar a variável frameCount no main.js para ${newCount}!`);
  
} catch (error) {
  console.error("Erro ao renomear arquivos:", error);
}
