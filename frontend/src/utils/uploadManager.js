/**
 * HelixVault Upload Manager
 * ─────────────────────────
 * Automatically selects the best upload strategy based on file size:
 *
 *   < 10 MB   → Direct upload  (single POST to /api/dna/encode)
 *   10–500 MB → Chunked upload (5 MB chunks through FastAPI server)
 *   > 500 MB  → S3 Multipart   (direct browser→S3, server never sees bytes)
 *               └─ Falls back to Chunked if S3 is not configured
 *
 * Usage:
 *   const result = await uploadFile(file, encodeOptions, onProgress);
 *   // result → { task_id } — poll /api/dna/status/{task_id}
 */

import axios from 'axios';
import { API_BASE_URL } from '../config';

// ── Thresholds & chunk config ─────────────────────────────────────────────────
const DIRECT_THRESHOLD_BYTES  = 10  * 1024 * 1024;  // 10 MB  → direct upload
const S3_THRESHOLD_BYTES      = 500 * 1024 * 1024;  // 500 MB → S3 multipart
const CHUNK_SIZE_BYTES        = 5   * 1024 * 1024;  // 5 MB   (S3 minimum part size)
const MAX_PARALLEL_CHUNKS     = 3;                   // simultaneous chunk uploads

// ── S3 config cache (fetched once per page load) ──────────────────────────────
let _s3Cfg = null;
let _s3CfgFetched = false;

export async function fetchS3Config() {
  if (_s3CfgFetched) return _s3Cfg;
  try {
    const res = await axios.get(`${API_BASE_URL}/api/upload/s3/config`, { withCredentials: true });
    _s3Cfg = res.data;
  } catch {
    _s3Cfg = { s3_enabled: false, direct_threshold_mb: 10, chunked_threshold_mb: 500, chunk_size_mb: 5 };
  }
  _s3CfgFetched = true;
  return _s3Cfg;
}

/**
 * Returns strategy metadata for the given file.
 * @param {number} fileSizeBytes
 * @param {boolean} s3Enabled
 * @returns {{ strategy: string, label: string, icon: string, description: string }}
 */
export function getStrategyInfo(fileSizeBytes, s3Enabled = false) {
  if (fileSizeBytes <= DIRECT_THRESHOLD_BYTES) {
    return {
      strategy: 'direct',
      label: 'Direct Upload',
      icon: '⚡',
      description: 'Single request — fastest for small files',
    };
  }
  if (s3Enabled && fileSizeBytes > S3_THRESHOLD_BYTES) {
    return {
      strategy: 's3',
      label: 'S3 Multipart',
      icon: '☁️',
      description: 'Direct to AWS S3 — server untouched, unlimited size',
    };
  }
  const totalChunks = Math.ceil(fileSizeBytes / CHUNK_SIZE_BYTES);
  return {
    strategy: 'chunked',
    label: 'Chunked Upload',
    icon: '🔪',
    description: `${totalChunks} × 5 MB chunks — resumable, no size limit`,
  };
}

/**
 * Main upload entry point. Picks the right strategy automatically.
 *
 * @param {File}     file           - The File object to upload
 * @param {Object}   encodeOptions  - { password, useErrorCorrection, useSteganography,
 *                                     useFountain, fountainOverhead, carrierAccession }
 * @param {Function} onProgress     - Called with: { percent, stage, strategy,
 *                                     chunksDone, chunksTotal, speedMBs, etaSeconds }
 * @returns {Promise<{ task_id: string, status: string }>}
 */
export async function uploadFile(file, encodeOptions, onProgress) {
  const s3Cfg = await fetchS3Config();
  const info = getStrategyInfo(file.size, s3Cfg.s3_enabled);

  onProgress?.({
    percent: 0, stage: 'upload',
    strategy: info.strategy,
    chunksDone: 0, chunksTotal: 0,
    speedMBs: 0, etaSeconds: null,
  });

  switch (info.strategy) {
    case 'direct':  return _directUpload(file, encodeOptions, onProgress, info.strategy);
    case 's3':      return _s3MultipartUpload(file, encodeOptions, onProgress);
    default:        return _chunkedUpload(file, encodeOptions, onProgress);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Strategy 1 — Direct Upload (< 10 MB, unchanged behaviour)
// ─────────────────────────────────────────────────────────────────────────────
async function _directUpload(file, encodeOptions, onProgress, strategy) {
  const {
    password, useErrorCorrection, useSteganography,
    useFountain, fountainOverhead, carrierAccession,
  } = encodeOptions;

  const fd = new FormData();
  fd.append('file', file);
  if (password) fd.append('password', password);
  fd.append('use_error_correction', useErrorCorrection);
  fd.append('use_steganography', useSteganography);
  if (useSteganography && carrierAccession) fd.append('steganography_carrier', carrierAccession);
  fd.append('use_fountain', useFountain);
  fd.append('fountain_overhead', fountainOverhead);

  const res = await axios.post(`${API_BASE_URL}/api/dna/encode`, fd, {
    withCredentials: true,
    onUploadProgress: (e) => {
      const percent = e.total ? Math.round((e.loaded / e.total) * 90) : 50;
      onProgress?.({ percent, stage: 'upload', strategy, chunksDone: 1, chunksTotal: 1, speedMBs: 0, etaSeconds: null });
    },
  });
  // Fire 'encoding' stage so EncoderView starts the animation and polls task status
  onProgress?.({ percent: 95, stage: 'encoding', strategy, chunksDone: 1, chunksTotal: 1, speedMBs: 0, etaSeconds: null });
  return res.data;
}

// ─────────────────────────────────────────────────────────────────────────────
// Strategy 2 — Chunked Upload (10 MB – 500 MB, or all sizes if S3 off)
// ─────────────────────────────────────────────────────────────────────────────
async function _chunkedUpload(file, encodeOptions, onProgress) {
  const uploadId    = crypto.randomUUID();
  const totalChunks = Math.ceil(file.size / CHUNK_SIZE_BYTES);
  let   chunksDone  = 0;
  const startMs     = Date.now();
  let   bytesUp     = 0;

  // Upload chunks in parallel batches of MAX_PARALLEL_CHUNKS
  for (let batchStart = 0; batchStart < totalChunks; batchStart += MAX_PARALLEL_CHUNKS) {
    const batchEnd = Math.min(batchStart + MAX_PARALLEL_CHUNKS, totalChunks);
    const promises = [];

    for (let i = batchStart; i < batchEnd; i++) {
      const byteStart = i * CHUNK_SIZE_BYTES;
      const byteEnd   = Math.min(byteStart + CHUNK_SIZE_BYTES, file.size);
      const blob      = file.slice(byteStart, byteEnd);

      const fd = new FormData();
      fd.append('upload_id',    uploadId);
      fd.append('chunk_index',  i);
      fd.append('total_chunks', totalChunks);
      fd.append('filename',     file.name);
      fd.append('chunk',        blob, `chunk_${i}`);

      promises.push(
        axios.post(`${API_BASE_URL}/api/upload/chunk`, fd, { withCredentials: true })
          .then(() => {
            chunksDone++;
            bytesUp += (byteEnd - byteStart);
            const elapsed  = (Date.now() - startMs) / 1000 || 0.001;
            const speedMBs = bytesUp / elapsed / (1024 * 1024);
            const remaining = file.size - bytesUp;
            const etaSec   = speedMBs > 0 ? remaining / (speedMBs * 1024 * 1024) : null;
            const percent   = Math.round((chunksDone / totalChunks) * 88);   // 0–88 % for upload phase
            onProgress?.({ percent, stage: 'upload', strategy: 'chunked', chunksDone, chunksTotal: totalChunks, speedMBs: +speedMBs.toFixed(2), etaSeconds: etaSec ? Math.round(etaSec) : null });
          })
      );
    }

    await Promise.all(promises);  // Wait for each batch before starting next
  }

  // Finalize — assemble chunks on the server and start encoding
  onProgress?.({ percent: 91, stage: 'assembling', strategy: 'chunked', chunksDone, chunksTotal: totalChunks, speedMBs: 0, etaSeconds: null });

  const { password, useErrorCorrection, useSteganography, useFountain, fountainOverhead } = encodeOptions;
  const fd = new FormData();
  fd.append('upload_id',            uploadId);
  fd.append('filename',             file.name);
  fd.append('total_chunks',         totalChunks);
  if (password) fd.append('password', password);
  fd.append('use_error_correction', useErrorCorrection);
  fd.append('use_steganography',    useSteganography);
  fd.append('use_fountain',         useFountain);
  fd.append('fountain_overhead',    fountainOverhead);

  const res = await axios.post(`${API_BASE_URL}/api/upload/finalize`, fd, { withCredentials: true });

  onProgress?.({ percent: 95, stage: 'encoding', strategy: 'chunked', chunksDone, chunksTotal: totalChunks, speedMBs: 0, etaSeconds: null });
  return res.data;
}

// ─────────────────────────────────────────────────────────────────────────────
// Strategy 3 — S3 Multipart Presigned URL (> 500 MB, S3 configured)
// ─────────────────────────────────────────────────────────────────────────────
async function _s3MultipartUpload(file, encodeOptions, onProgress) {
  const totalParts = Math.ceil(file.size / CHUNK_SIZE_BYTES);

  // 1. Init — backend creates S3 multipart upload, returns presigned URLs
  const initFd = new FormData();
  initFd.append('filename',     file.name);
  initFd.append('total_parts',  totalParts);
  initFd.append('content_type', file.type || 'application/octet-stream');

  const initRes = await axios.post(`${API_BASE_URL}/api/upload/s3/init`, initFd, { withCredentials: true });
  const { s3_upload_id, object_key, presigned_urls } = initRes.data;

  // 2. Upload each part directly to S3 (browser → S3, no server involved)
  const completedParts = [];
  let partsDone = 0;
  const startMs = Date.now();
  let bytesUp   = 0;

  for (let batchStart = 0; batchStart < totalParts; batchStart += MAX_PARALLEL_CHUNKS) {
    const batchEnd = Math.min(batchStart + MAX_PARALLEL_CHUNKS, totalParts);
    const promises = [];

    for (let i = batchStart; i < batchEnd; i++) {
      const byteStart = i * CHUNK_SIZE_BYTES;
      const byteEnd   = Math.min(byteStart + CHUNK_SIZE_BYTES, file.size);
      const blob      = file.slice(byteStart, byteEnd);
      const { part_number, url } = presigned_urls[i];

      promises.push(
        // ← Direct PUT to S3 — completely bypasses your server
        fetch(url, {
          method: 'PUT',
          body: blob,
          headers: { 'Content-Type': file.type || 'application/octet-stream' },
        }).then(async (res) => {
          if (!res.ok) throw new Error(`S3 part ${part_number} upload failed (HTTP ${res.status})`);
          // ETag is returned by S3 and needed for CompleteMultipartUpload
          const etag = (res.headers.get('ETag') || res.headers.get('etag') || '').replace(/"/g, '');
          completedParts.push({ part_number, etag });

          partsDone++;
          bytesUp += (byteEnd - byteStart);
          const elapsed  = (Date.now() - startMs) / 1000 || 0.001;
          const speedMBs = bytesUp / elapsed / (1024 * 1024);
          const remaining = file.size - bytesUp;
          const etaSec   = speedMBs > 0 ? remaining / (speedMBs * 1024 * 1024) : null;
          const percent   = Math.round((partsDone / totalParts) * 85);

          onProgress?.({ percent, stage: 'upload', strategy: 's3', chunksDone: partsDone, chunksTotal: totalParts, speedMBs: +speedMBs.toFixed(2), etaSeconds: etaSec ? Math.round(etaSec) : null });
        })
      );
    }

    await Promise.all(promises);
  }

  // Sort parts by part_number (S3 requires ascending order)
  completedParts.sort((a, b) => a.part_number - b.part_number);

  // 3. Complete — backend tells S3 to assemble, downloads, triggers encoding
  onProgress?.({ percent: 90, stage: 'assembling', strategy: 's3', chunksDone: totalParts, chunksTotal: totalParts, speedMBs: 0, etaSeconds: null });

  const { password, useErrorCorrection, useSteganography, useFountain, fountainOverhead } = encodeOptions;
  const completeFd = new FormData();
  completeFd.append('s3_upload_id',        s3_upload_id);
  completeFd.append('object_key',          object_key);
  completeFd.append('filename',            file.name);
  completeFd.append('parts_json',          JSON.stringify(completedParts));
  if (password) completeFd.append('password', password);
  completeFd.append('use_error_correction', useErrorCorrection);
  completeFd.append('use_steganography',    useSteganography);
  completeFd.append('use_fountain',         useFountain);
  completeFd.append('fountain_overhead',    fountainOverhead);

  const completeRes = await axios.post(`${API_BASE_URL}/api/upload/s3/complete`, completeFd, { withCredentials: true });

  onProgress?.({ percent: 95, stage: 'encoding', strategy: 's3', chunksDone: totalParts, chunksTotal: totalParts, speedMBs: 0, etaSeconds: null });
  return completeRes.data;
}

/**
 * Formats bytes to a human-readable string.
 * @param {number} bytes
 * @returns {string}
 */
export function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}
