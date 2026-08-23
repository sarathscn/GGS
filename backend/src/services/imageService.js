const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Preset configurations for different image categories
const PRESETS = {
  avatar: {
    maxWidth: 800,
    maxHeight: 800,
    quality: 85,
    alphaQuality: 90,
    thumbWidth: 256,
    thumbHeight: 256,
    thumbQuality: 80,
    effort: 4
  },
  profile: {
    maxWidth: 800,
    maxHeight: 800,
    quality: 85,
    alphaQuality: 90,
    thumbWidth: 256,
    thumbHeight: 256,
    thumbQuality: 80,
    effort: 4
  },
  post: {
    maxWidth: 2048,
    maxHeight: 2048,
    quality: 84,
    alphaQuality: 90,
    thumbWidth: 600,
    thumbHeight: 600,
    thumbQuality: 80,
    effort: 4
  },
  listing: {
    maxWidth: 2048,
    maxHeight: 2048,
    quality: 84,
    alphaQuality: 90,
    thumbWidth: 600,
    thumbHeight: 600,
    thumbQuality: 80,
    effort: 4
  },
  message: {
    maxWidth: 1920,
    maxHeight: 1920,
    quality: 85,
    alphaQuality: 90,
    thumbWidth: 400,
    thumbHeight: 400,
    thumbQuality: 80,
    effort: 4
  },
  chat: {
    maxWidth: 1920,
    maxHeight: 1920,
    quality: 85,
    alphaQuality: 90,
    thumbWidth: 400,
    thumbHeight: 400,
    thumbQuality: 80,
    effort: 4
  },
  kyc: {
    maxWidth: 2048,
    maxHeight: 2048,
    quality: 88,
    alphaQuality: 95,
    thumbWidth: 600,
    thumbHeight: 600,
    thumbQuality: 85,
    effort: 4
  },
  category: {
    maxWidth: 1200,
    maxHeight: 1200,
    quality: 85,
    alphaQuality: 90,
    thumbWidth: 400,
    thumbHeight: 400,
    thumbQuality: 80,
    effort: 4
  },
  default: {
    maxWidth: 2048,
    maxHeight: 2048,
    quality: 84,
    alphaQuality: 90,
    thumbWidth: 600,
    thumbHeight: 600,
    thumbQuality: 80,
    effort: 4
  }
};

const ALLOWED_FORMATS = new Set(['jpeg', 'jpg', 'png', 'webp', 'gif', 'avif', 'heif', 'tiff', 'svg']);

// Maximum input pixels limit to protect against decompression bomb attacks (~30 Megapixels)
const MAX_INPUT_PIXELS = 30000000;

/**
 * Validates image buffer, checks magic bytes and extracts metadata.
 * @param {Buffer} buffer 
 * @returns {Promise<sharp.Metadata>}
 */
async function validateImageBuffer(buffer) {
  if (!buffer || !Buffer.isBuffer(buffer) || buffer.length === 0) {
    throw new Error('Invalid or empty image file buffer');
  }

  try {
    const sharpInstance = sharp(buffer, {
      failOnError: true,
      limitInputPixels: MAX_INPUT_PIXELS
    });

    const metadata = await sharpInstance.metadata();

    if (!metadata || !metadata.format) {
      throw new Error('Unsupported or unrecognized image format');
    }

    const format = metadata.format.toLowerCase();
    if (!ALLOWED_FORMATS.has(format)) {
      throw new Error(`Unsupported image format: ${format}. Allowed formats: JPG, PNG, WebP, GIF, AVIF, HEIF`);
    }

    if (!metadata.width || !metadata.height || metadata.width <= 0 || metadata.height <= 0) {
      throw new Error('Invalid image dimensions');
    }

    return metadata;
  } catch (err) {
    if (err.message && err.message.includes('Input image exceeds pixel limit')) {
      throw new Error('Image dimensions exceed the safety limit (maximum 30 megapixels).');
    }
    throw new Error(`Image validation failed: ${err.message}`);
  }
}

/**
 * Optimizes an image buffer according to preset and writes it atomically to disk.
 * @param {Buffer} buffer - Original image buffer
 * @param {Object} options - Options { type: 'avatar'|'post'|'message'|'kyc'|'category'|'default', originalname: string }
 * @returns {Promise<Object>} Resulting URLs and image metadata
 */
async function optimizeAndSaveImage(buffer, options = {}) {
  const { type = 'default', originalname = 'image.jpg' } = options;
  const presetKey = (type && PRESETS[type.toLowerCase()]) ? type.toLowerCase() : 'default';
  const preset = PRESETS[presetKey];

  // 1. Validate buffer and get metadata
  const originalMeta = await validateImageBuffer(buffer);
  const originalSize = buffer.length;

  // 2. Determine target dimensions preserving aspect ratio
  const { width: origWidth, height: origHeight } = originalMeta;
  const needsResize = origWidth > preset.maxWidth || origHeight > preset.maxHeight;

  // Adaptive quality tuning: If original image is already small (< 50KB) and within bounds, use high quality
  let targetQuality = preset.quality;
  if (!needsResize && originalSize < 50 * 1024) {
    targetQuality = Math.min(92, preset.quality + 5);
  }

  const fileId = uuidv4();
  const mainFilename = `${fileId}.webp`;
  const thumbFilename = `${fileId}-thumb.webp`;
  const mainFilePath = path.join(uploadDir, mainFilename);
  const thumbFilePath = path.join(uploadDir, thumbFilename);

  // 3. Process main optimized image
  // .rotate() automatically handles EXIF orientation and normalizes it
  // Strips unnecessary GPS/camera EXIF metadata for privacy and file size savings
  let mainPipeline = sharp(buffer, { failOnError: false, limitInputPixels: MAX_INPUT_PIXELS })
    .rotate();

  if (needsResize) {
    mainPipeline = mainPipeline.resize({
      width: preset.maxWidth,
      height: preset.maxHeight,
      fit: 'inside',
      withoutEnlargement: true
    });
  }

  // Encode to WebP with adaptive quality, effort, and alpha transparency preserved
  const optimizedBuffer = await mainPipeline
    .webp({
      quality: targetQuality,
      alphaQuality: preset.alphaQuality || 90,
      effort: preset.effort || 4,
      smartSubsample: true
    })
    .toBuffer();

  // Get processed image dimensions
  const processedMeta = await sharp(optimizedBuffer).metadata();

  // 4. Generate optimized thumbnail
  const thumbBuffer = await sharp(buffer, { failOnError: false, limitInputPixels: MAX_INPUT_PIXELS })
    .rotate()
    .resize({
      width: preset.thumbWidth,
      height: preset.thumbHeight,
      fit: 'inside',
      withoutEnlargement: true
    })
    .webp({
      quality: preset.thumbQuality || 80,
      alphaQuality: preset.alphaQuality || 90,
      effort: 4,
      smartSubsample: true
    })
    .toBuffer();

  // 5. Write files to disk atomically
  await fs.promises.writeFile(mainFilePath, optimizedBuffer);
  await fs.promises.writeFile(thumbFilePath, thumbBuffer);

  const optimizedSize = optimizedBuffer.length;
  const savedBytes = Math.max(0, originalSize - optimizedSize);
  const compressionRatio = originalSize > 0 
    ? `${((savedBytes / originalSize) * 100).toFixed(1)}%` 
    : '0.0%';

  return {
    filename: mainFilename,
    thumbnail_filename: thumbFilename,
    url: `/api/uploads/${mainFilename}`,
    thumbnail_url: `/api/uploads/${thumbFilename}`,
    width: processedMeta.width,
    height: processedMeta.height,
    original_width: origWidth,
    original_height: origHeight,
    format: 'webp',
    original_format: originalMeta.format,
    size: optimizedSize,
    original_size: originalSize,
    saved_bytes: savedBytes,
    compression_ratio: compressionRatio,
    type: presetKey
  };
}

module.exports = {
  PRESETS,
  validateImageBuffer,
  optimizeAndSaveImage
};
