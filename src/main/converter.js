const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const SUPPORTED_INPUT_EXTENSIONS = [
  '.jpg', '.jpeg', '.png', '.webp', '.avif', '.tiff', '.tif', '.gif', '.svg', '.bmp',
];

const OUTPUT_FORMATS = [
  { id: 'jpeg', label: 'JPEG (.jpg)', ext: 'jpg' },
  { id: 'png', label: 'PNG (.png)', ext: 'png' },
  { id: 'webp', label: 'WebP (.webp)', ext: 'webp' },
  { id: 'avif', label: 'AVIF (.avif)', ext: 'avif' },
  { id: 'tiff', label: 'TIFF (.tiff)', ext: 'tiff' },
  { id: 'gif', label: 'GIF (.gif)', ext: 'gif' },
];

async function getImageInfo(filePath) {
  const metadata = await sharp(filePath).metadata();
  const stats = fs.statSync(filePath);

  const thumbnail = await sharp(filePath)
    .resize(180, 180, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 70 })
    .toBuffer();

  return {
    path: filePath,
    name: path.basename(filePath),
    size: stats.size,
    width: metadata.width,
    height: metadata.height,
    format: metadata.format,
    ext: path.extname(filePath).toLowerCase(),
    thumbnail: `data:image/jpeg;base64,${thumbnail.toString('base64')}`,
  };
}

async function convertImage(filePath, outputDir, settings) {
  const { format, quality } = settings;
  const formatInfo = OUTPUT_FORMATS.find((f) => f.id === format);
  if (!formatInfo) throw new Error(`Unsupported output format: ${format}`);

  const baseName = path.basename(filePath, path.extname(filePath));
  let outputPath = path.join(outputDir, `${baseName}.${formatInfo.ext}`);

  // Avoid overwriting: append (1), (2), etc. if file exists
  let counter = 1;
  while (fs.existsSync(outputPath)) {
    outputPath = path.join(outputDir, `${baseName} (${counter}).${formatInfo.ext}`);
    counter++;
  }

  let pipeline = sharp(filePath);

  switch (format) {
    case 'jpeg':
      pipeline = pipeline.jpeg({ quality: quality || 80, mozjpeg: true });
      break;
    case 'png':
      pipeline = pipeline.png({ compressionLevel: Math.round((100 - (quality || 80)) / 11) });
      break;
    case 'webp':
      pipeline = pipeline.webp({ quality: quality || 80 });
      break;
    case 'avif':
      pipeline = pipeline.avif({ quality: quality || 50 });
      break;
    case 'tiff':
      pipeline = pipeline.tiff({ quality: quality || 80 });
      break;
    case 'gif':
      pipeline = pipeline.gif();
      break;
  }

  const result = await pipeline.toFile(outputPath);

  return {
    outputPath,
    outputSize: result.size,
    width: result.width,
    height: result.height,
  };
}

function getInputFileFilters() {
  return [
    {
      name: 'Images',
      extensions: SUPPORTED_INPUT_EXTENSIONS.map((e) => e.slice(1)),
    },
    { name: 'All Files', extensions: ['*'] },
  ];
}

module.exports = {
  getImageInfo,
  convertImage,
  getInputFileFilters,
  OUTPUT_FORMATS,
  SUPPORTED_INPUT_EXTENSIONS,
};
