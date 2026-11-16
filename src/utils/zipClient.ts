const MAX_VIDEO_ZIP_BYTES = 200 * 1024 * 1024; // 200 MB

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

interface ZipEntryMeta {
  fileName: string;
  compressionMethod: number;
  compressedSize: number;
  uncompressedSize: number;
  localHeaderOffset: number;
}

function getExtLower(filename: string): string {
  const dot = filename.lastIndexOf('.');
  return dot >= 0 ? filename.slice(dot).toLowerCase() : '';
}

function getBaseName(normalizedPath: string): string {
  const slash = normalizedPath.lastIndexOf('/');
  return slash >= 0 ? normalizedPath.slice(slash + 1) : normalizedPath;
}

export async function extractLargestVideoFromZipBlob(
  zipBlob: Blob,
  onProgress?: (percent: number) => void
): Promise<{
  file: File;
  originalFilename: string;
  mimeType: string;
  size: number;
}> {
  if (zipBlob.size > MAX_VIDEO_ZIP_BYTES) {
    throw new Error(
      `ZIP archive (${(zipBlob.size / (1024 * 1024)).toFixed(1)} MB) exceeds the 200 MB ZIP upload limit.`
    );
  }
  if (zipBlob.size < 22) {
    throw new Error('Uploaded ZIP archive is incomplete or corrupted.');
  }

  onProgress?.(5);

  const tailSize = Math.min(zipBlob.size, 65557);
  const tailOffset = zipBlob.size - tailSize;
  const tailBuf = await zipBlob.slice(tailOffset, zipBlob.size).arrayBuffer();
  const tailBytes = new Uint8Array(tailBuf);
  const tailView = new DataView(tailBuf);

  let eocdPos = -1;
  for (let i = tailBytes.length - 22; i >= 0; i--) {
    if (
      tailBytes[i] === 0x50 &&
      tailBytes[i + 1] === 0x4b &&
      tailBytes[i + 2] === 0x05 &&
      tailBytes[i + 3] === 0x06
    ) {
      const commentLen = tailView.getUint16(i + 20, true);
      if (i + 22 + commentLen === tailBytes.length) {
        eocdPos = i;
        break;
      }
    }
  }

  if (eocdPos === -1) {
    throw new Error('Invalid ZIP file: missing End of Central Directory record.');
  }

  let cdSize = tailView.getUint32(eocdPos + 12, true);
  let cdOffset = tailView.getUint32(eocdPos + 16, true);

  if ((cdSize === 0xffffffff || cdOffset === 0xffffffff) && eocdPos >= 20) {
    if (tailView.getUint32(eocdPos - 20, true) === 0x07064b50) {
      const zip64EocdOffset = Number(tailView.getBigUint64(eocdPos - 12, true));
      if (zip64EocdOffset >= 0 && zip64EocdOffset + 56 <= zipBlob.size) {
        const z64Buf = await zipBlob.slice(zip64EocdOffset, zip64EocdOffset + 56).arrayBuffer();
        const z64View = new DataView(z64Buf);
        if (z64View.getUint32(0, true) === 0x06064b50) {
          cdSize = Number(z64View.getBigUint64(40, true));
          cdOffset = Number(z64View.getBigUint64(48, true));
        }
      }
    }
  }

  if (cdOffset + cdSize > zipBlob.size || cdSize === 0) {
    throw new Error('Invalid ZIP file: central directory offsets are out of bounds.');
  }

  const cdBuf = await zipBlob.slice(cdOffset, cdOffset + cdSize).arrayBuffer();
  const cdView = new DataView(cdBuf);
  const cdBytes = new Uint8Array(cdBuf);
  const decoder = new TextDecoder('utf-8');

  const entries: ZipEntryMeta[] = [];
  let pos = 0;

  while (pos + 46 <= cdBytes.length) {
    const sig = cdView.getUint32(pos, true);
    if (sig !== 0x02014b50) break;

    const compressionMethod = cdView.getUint16(pos + 10, true);
    let compressedSize = cdView.getUint32(pos + 20, true);
    let uncompressedSize = cdView.getUint32(pos + 24, true);
    const fileNameLen = cdView.getUint16(pos + 28, true);
    const extraFieldLen = cdView.getUint16(pos + 30, true);
    const commentLen = cdView.getUint16(pos + 32, true);
    let localHeaderOffset = cdView.getUint32(pos + 42, true);

    const fileNameStart = pos + 46;
    const extraStart = fileNameStart + fileNameLen;
    const nextPos = extraStart + extraFieldLen + commentLen;
    if (nextPos > cdBytes.length) break;

    const fileName = decoder.decode(cdBytes.subarray(fileNameStart, extraStart));

    if (
      extraFieldLen >= 4 &&
      (compressedSize === 0xffffffff ||
        uncompressedSize === 0xffffffff ||
        localHeaderOffset === 0xffffffff)
    ) {
      let ePos = extraStart;
      const extraEnd = extraStart + extraFieldLen;
      while (ePos + 4 <= extraEnd) {
        const headerId = cdView.getUint16(ePos, true);
        const dataSize = cdView.getUint16(ePos + 2, true);
        if (headerId === 0x0001 && ePos + 4 + dataSize <= extraEnd) {
          let zPos = ePos + 4;
          const fieldEnd = zPos + dataSize;
          if (uncompressedSize === 0xffffffff && zPos + 8 <= fieldEnd) {
            uncompressedSize = Number(cdView.getBigUint64(zPos, true));
            zPos += 8;
          }
          if (compressedSize === 0xffffffff && zPos + 8 <= fieldEnd) {
            compressedSize = Number(cdView.getBigUint64(zPos, true));
            zPos += 8;
          }
          if (localHeaderOffset === 0xffffffff && zPos + 8 <= fieldEnd) {
            localHeaderOffset = Number(cdView.getBigUint64(zPos, true));
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

  onProgress?.(12);

  const videoCandidates = entries
    .map((entry) => {
      const normalized = entry.fileName.replace(/\\/g, '/');
      if (normalized.endsWith('/')) return null;
      const baseName = getBaseName(normalized);
      if (
        !baseName ||
        normalized.startsWith('__MACOSX/') ||
        baseName.startsWith('._') ||
        baseName.startsWith('.')
      ) {
        return null;
      }
      const ext = getExtLower(baseName);
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

  const localBuf = await zipBlob
    .slice(best.entry.localHeaderOffset, best.entry.localHeaderOffset + 30)
    .arrayBuffer();
  const localView = new DataView(localBuf);
  if (localBuf.byteLength < 30 || localView.getUint32(0, true) !== 0x04034b50) {
    throw new Error('Corrupted ZIP entry: invalid local file header.');
  }
  const nameLen = localView.getUint16(26, true);
  const extraLen = localView.getUint16(28, true);
  const dataStart = best.entry.localHeaderOffset + 30 + nameLen + extraLen;
  const compressedSlice = zipBlob.slice(dataStart, dataStart + best.entry.compressedSize);

  let videoBlob: Blob;
  if (best.entry.compressionMethod === 0) {
    videoBlob = compressedSlice.slice(0, compressedSlice.size, best.mimeType);
  } else if (best.entry.compressionMethod === 8) {
    if (typeof DecompressionStream === 'undefined') {
      throw new Error(
        'Browser does not support deflate-raw ZIP extraction. Re-zip with Store (uncompressed) or use Chrome/Edge/Safari.'
      );
    }
    const ds = new DecompressionStream('deflate-raw');
    const decompressedStream = compressedSlice.stream().pipeThrough(ds);
    const rawBlob = await new Response(decompressedStream).blob();
    videoBlob = rawBlob.slice(0, rawBlob.size, best.mimeType);
  } else {
    throw new Error(
      `Unsupported ZIP compression method (${best.entry.compressionMethod}). Re-zip using standard Deflate or Store.`
    );
  }

  if (videoBlob.size === 0) {
    throw new Error(`Extracted video "${best.baseName}" is empty.`);
  }

  onProgress?.(25);

  const file = new File([videoBlob], best.baseName, { type: best.mimeType });
  return {
    file,
    originalFilename: best.baseName,
    mimeType: best.mimeType,
    size: file.size
  };
}
