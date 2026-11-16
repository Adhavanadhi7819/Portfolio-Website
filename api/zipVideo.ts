/// <reference types="node" />
import fs from 'node:fs';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';
import zlib from 'node:zlib';

export const MAX_VIDEO_ZIP_BYTES = 200 * 1024 * 1024; // 200 MB

interface ZipEntryMeta {
  fileName: string;
  compressionMethod: number;
  compressedSize: number;
  uncompressedSize: number;
  localHeaderOffset: number;
}

const PRIMARY_VIDEO_EXT_TO_MIME: Record<string, string> = {
  '.mp4': 'video/mp4',
  '.m4v': 'video/mp4',
  '.webm': 'video/webm',
  '.mov': 'video/quicktime'
};

const FALLBACK_VIDEO_EXT_TO_MIME: Record<string, string> = {
  '.ogv': 'video/ogg',
  '.mkv': 'video/x-matroska',
  '.avi': 'video/x-msvideo'
};

export function resolveVideoMimeFromFilename(filename: string): string | null {
  const ext = path.extname(filename).toLowerCase();
  return PRIMARY_VIDEO_EXT_TO_MIME[ext] || FALLBACK_VIDEO_EXT_TO_MIME[ext] || null;
}

function readZipCentralDirectoryEntries(zipFilePath: string): ZipEntryMeta[] {
  const fd = fs.openSync(zipFilePath, 'r');
  try {
    const stat = fs.fstatSync(fd);
    const fileSize = stat.size;
    if (fileSize < 22) {
      throw new Error('Uploaded ZIP archive is incomplete or corrupted.');
    }

    const tailSize = Math.min(fileSize, 65557);
    const tailOffset = fileSize - tailSize;
    const tailBuf = Buffer.alloc(tailSize);
    fs.readSync(fd, tailBuf, 0, tailSize, tailOffset);

    let eocdPos = -1;
    for (let i = tailSize - 22; i >= 0; i--) {
      if (
        tailBuf[i] === 0x50 &&
        tailBuf[i + 1] === 0x4b &&
        tailBuf[i + 2] === 0x05 &&
        tailBuf[i + 3] === 0x06
      ) {
        const commentLen = tailBuf.readUInt16LE(i + 20);
        if (i + 22 + commentLen === tailSize) {
          eocdPos = i;
          break;
        }
      }
    }

    if (eocdPos === -1) {
      throw new Error('Invalid ZIP file: missing End of Central Directory record.');
    }

    const cdSize = tailBuf.readUInt32LE(eocdPos + 12);
    const cdOffset = tailBuf.readUInt32LE(eocdPos + 16);

    if (cdOffset + cdSize > fileSize || cdSize === 0) {
      throw new Error('Invalid ZIP file: central directory offsets are out of bounds.');
    }

    const cdBuf = Buffer.alloc(cdSize);
    fs.readSync(fd, cdBuf, 0, cdSize, cdOffset);

    const entries: ZipEntryMeta[] = [];
    let pos = 0;

    while (pos + 46 <= cdBuf.length) {
      const sig = cdBuf.readUInt32LE(pos);
      if (sig !== 0x02014b50) break;

      const compressionMethod = cdBuf.readUInt16LE(pos + 10);
      let compressedSize = cdBuf.readUInt32LE(pos + 20);
      let uncompressedSize = cdBuf.readUInt32LE(pos + 24);
      const fileNameLen = cdBuf.readUInt16LE(pos + 28);
      const extraFieldLen = cdBuf.readUInt16LE(pos + 30);
      const commentLen = cdBuf.readUInt16LE(pos + 32);
      let localHeaderOffset = cdBuf.readUInt32LE(pos + 42);

      const fileNameStart = pos + 46;
      const extraStart = fileNameStart + fileNameLen;
      const nextPos = extraStart + extraFieldLen + commentLen;
      if (nextPos > cdBuf.length) break;

      const fileName = cdBuf.subarray(fileNameStart, extraStart).toString('utf8');

      // Parse ZIP64 Extended Information Extra Field (0x0001) if present
      if (
        extraFieldLen >= 4 &&
        (compressedSize === 0xffffffff ||
          uncompressedSize === 0xffffffff ||
          localHeaderOffset === 0xffffffff)
      ) {
        const extraBuf = cdBuf.subarray(extraStart, extraStart + extraFieldLen);
        let ePos = 0;
        while (ePos + 4 <= extraBuf.length) {
          const headerId = extraBuf.readUInt16LE(ePos);
          const dataSize = extraBuf.readUInt16LE(ePos + 2);
          if (headerId === 0x0001 && ePos + 4 + dataSize <= extraBuf.length) {
            let zPos = ePos + 4;
            if (uncompressedSize === 0xffffffff && zPos + 8 <= ePos + 4 + dataSize) {
              uncompressedSize = Number(extraBuf.readBigUInt64LE(zPos));
              zPos += 8;
            }
            if (compressedSize === 0xffffffff && zPos + 8 <= ePos + 4 + dataSize) {
              compressedSize = Number(extraBuf.readBigUInt64LE(zPos));
              zPos += 8;
            }
            if (localHeaderOffset === 0xffffffff && zPos + 8 <= ePos + 4 + dataSize) {
              localHeaderOffset = Number(extraBuf.readBigUInt64LE(zPos));
            }
            break;
          }
          ePos += 4 + dataSize;
        }
      }

      entries.push({
        fileName,
        compressionMethod,
        compressedSize,
        uncompressedSize,
        localHeaderOffset
      });

      pos = nextPos;
    }

    return entries;
  } finally {
    fs.closeSync(fd);
  }
}

function getLocalFileDataOffset(zipFilePath: string, localHeaderOffset: number): number {
  const fd = fs.openSync(zipFilePath, 'r');
  try {
    const headerBuf = Buffer.alloc(30);
    const bytesRead = fs.readSync(fd, headerBuf, 0, 30, localHeaderOffset);
    if (bytesRead < 30 || headerBuf.readUInt32LE(0) !== 0x04034b50) {
      throw new Error('Corrupted ZIP entry: invalid local file header.');
    }
    const nameLen = headerBuf.readUInt16LE(26);
    const extraLen = headerBuf.readUInt16LE(28);
    return localHeaderOffset + 30 + nameLen + extraLen;
  } finally {
    fs.closeSync(fd);
  }
}

export async function extractLargestVideoFromZip(
  zipFilePath: string,
  destDir: string
): Promise<{
  extractedPath: string;
  originalFilename: string;
  mimeType: string;
  size: number;
}> {
  const zipStat = fs.statSync(zipFilePath);
  if (zipStat.size > MAX_VIDEO_ZIP_BYTES) {
    throw new Error(
      `ZIP archive (${(zipStat.size / (1024 * 1024)).toFixed(1)} MB) exceeds the 200 MB ZIP upload limit.`
    );
  }

  const entries = readZipCentralDirectoryEntries(zipFilePath);
  const videoCandidates = entries
    .map((entry) => {
      const normalizedName = entry.fileName.replace(/\\/g, '/');
      if (normalizedName.endsWith('/')) return null;
      const baseName = path.posix.basename(normalizedName);
      if (
        !baseName ||
        normalizedName.startsWith('__MACOSX/') ||
        baseName.startsWith('._') ||
        baseName.startsWith('.')
      ) {
        return null;
      }
      const ext = path.posix.extname(baseName).toLowerCase();
      const primaryMime = PRIMARY_VIDEO_EXT_TO_MIME[ext];
      const fallbackMime = FALLBACK_VIDEO_EXT_TO_MIME[ext];
      if (!primaryMime && !fallbackMime) return null;
      return {
        entry,
        baseName,
        mimeType: primaryMime || fallbackMime,
        priority: primaryMime ? 2 : 1
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)
    .sort((a, b) => {
      if (b.priority !== a.priority) return b.priority - a.priority;
      return (
        (b.entry.uncompressedSize || b.entry.compressedSize) -
        (a.entry.uncompressedSize || a.entry.compressedSize)
      );
    });

  const best = videoCandidates[0];
  if (!best) {
    throw new Error(
      'No playable video file (.mp4, .webm, .mov, .m4v) was found inside this ZIP archive.'
    );
  }

  if (best.entry.compressedSize <= 0) {
    throw new Error(`Video entry "${best.baseName}" inside ZIP archive is empty.`);
  }

  const dataStart = getLocalFileDataOffset(zipFilePath, best.entry.localHeaderOffset);
  const dataEnd = dataStart + best.entry.compressedSize - 1;
  const ext = path.posix.extname(best.baseName).toLowerCase() || '.mp4';
  const tempOutPath = path.join(
    destDir,
    `.zip-video-${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`
  );

  try {
    const readStream = fs.createReadStream(zipFilePath, { start: dataStart, end: dataEnd });
    const writeStream = fs.createWriteStream(tempOutPath);

    if (best.entry.compressionMethod === 0) {
      await pipeline(readStream, writeStream);
    } else if (best.entry.compressionMethod === 8) {
      await pipeline(readStream, zlib.createInflateRaw(), writeStream);
    } else {
      throw new Error(
        `Unsupported ZIP compression method (${best.entry.compressionMethod}). Re-zip using standard Deflate or Store.`
      );
    }

    const outStat = fs.statSync(tempOutPath);
    if (outStat.size === 0) {
      throw new Error(`Extracted video "${best.baseName}" is empty.`);
    }

    return {
      extractedPath: tempOutPath,
      originalFilename: best.baseName,
      mimeType: best.mimeType,
      size: outStat.size
    };
  } catch (err) {
    try {
      if (fs.existsSync(tempOutPath)) fs.unlinkSync(tempOutPath);
    } catch {}
    throw err;
  }
}
