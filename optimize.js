import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const inputDir = path.join(process.cwd(), 'public', 'frames');
const outputDir = path.join(process.cwd(), 'public', 'frames_optimized');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

console.log('Iniciando compressão extrema dos frames para WebP...');

async function optimizeFrames() {
  const files = fs.readdirSync(inputDir).filter(f => f.endsWith('.png'));
  let count = 0;
  
  for (const file of files) {
    const inputPath = path.join(inputDir, file);
    const outputPath = path.join(outputDir, file.replace('.png', '.webp'));
    
    // Convert to webp, scale down slightly to 720p for massive performance gain, 
    // and lower quality to 70% which still looks great in a canvas but drops size by 95%
    await sharp(inputPath)
      .resize(1280, 720)
      .webp({ quality: 60 })
      .toFile(outputPath);
      
    count++;
    if (count % 20 === 0) {
      console.log(`Processado ${count}/${files.length} frames...`);
    }
  }
  console.log('Otimização concluída!');
}

optimizeFrames().catch(console.error);
