// lib/proof.ts
// Client-side image compression, IndexedDB retry queue, and Supabase Storage integration for mission proofs

import { createBrowserClient } from './supabase';

const MAX_INPUT_BYTES = 10 * 1024 * 1024; // 10 MB
const MAX_OUTPUT_BYTES = 1024 * 1024;      // 1 MB
const MAX_DIMENSION = 1280;
const DB_NAME = 'gate_proofs_db';
const STORE_NAME = 'pending_proofs';
const DB_VERSION = 1;
const MAX_PENDING_QUEUE = 10;

export interface ProcessedPhoto {
  blob: Blob;
  previewUrl: string;
  width: number;
  height: number;
  sizeBytes: number;
}

export interface PendingProofRecord {
  logId: string;
  userId: string;
  layoverId: string;
  path: string;
  blob: Blob;
  createdAt: number;
}

// In-memory cache for 60-minute signed URLs
const signedUrlCache = new Map<string, { url: string; expiresAt: number }>();

/**
 * Validates, decodes, resizes to <= 1280px on longest side, and re-encodes as JPEG 0.7.
 * Canvas redraw guarantees stripping of all EXIF metadata and GPS tags.
 */
export async function processProofImage(file: File): Promise<ProcessedPhoto> {
  if (file.size > MAX_INPUT_BYTES) {
    throw new Error('PHOTO TOO LARGE (MAX 10 MB)');
  }

  const supportedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  const isHeic = file.type === 'image/heic' || file.type === 'image/heif' || file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif');

  if (!supportedTypes.includes(file.type.toLowerCase()) && !isHeic) {
    throw new Error('PHOTO FORMAT NOT SUPPORTED, TRY AGAIN');
  }

  // Attempt to decode via HTMLImageElement
  const tempObjectUrl = URL.createObjectURL(file);
  const img = new Image();

  try {
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('PHOTO FORMAT NOT SUPPORTED, TRY AGAIN'));
      img.src = tempObjectUrl;
    });
  } finally {
    URL.revokeObjectURL(tempObjectUrl);
  }

  let { width, height } = img;
  if (width <= 0 || height <= 0) {
    throw new Error('INVALID IMAGE DIMENSIONS');
  }

  // Calculate scaled dimensions (longest side <= 1280px)
  if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
    if (width >= height) {
      height = Math.round((height * MAX_DIMENSION) / width);
      width = MAX_DIMENSION;
    } else {
      width = Math.round((width * MAX_DIMENSION) / height);
      height = MAX_DIMENSION;
    }
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    canvas.width = 0;
    canvas.height = 0;
    throw new Error('CANVAS RENDERING FAILED');
  }

  // Draw image to strip EXIF and apply scaling
  ctx.drawImage(img, 0, 0, width, height);

  const compressedBlob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, 'image/jpeg', 0.7);
  });

  // Explicitly free canvas memory
  canvas.width = 0;
  canvas.height = 0;

  if (!compressedBlob) {
    throw new Error('PHOTO COMPRESSION FAILED');
  }

  if (compressedBlob.size > MAX_OUTPUT_BYTES) {
    throw new Error('COMPRESSED PHOTO OVER 1 MB, TRY AGAIN');
  }

  const previewUrl = URL.createObjectURL(compressedBlob);

  return {
    blob: compressedBlob,
    previewUrl,
    width,
    height,
    sizeBytes: compressedBlob.size,
  };
}

// -----------------------------------------------------------------------------
// IndexedDB Native Helper (Zero external dependencies)
// -----------------------------------------------------------------------------

function openProofsDB(): Promise<IDBDatabase | null> {
  if (typeof window === 'undefined' || !window.indexedDB) {
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'logId' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => {
      console.warn('Could not open IndexedDB for proofs');
      resolve(null);
    };
  });
}

export async function savePendingProof(record: PendingProofRecord): Promise<void> {
  try {
    const db = await openProofsDB();
    if (!db) return;

    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    // Enforce max 10 queue limit
    const allReq = store.getAll();
    allReq.onsuccess = () => {
      const all: PendingProofRecord[] = allReq.result || [];
      if (all.length >= MAX_PENDING_QUEUE) {
        // Discard oldest records to keep room
        all.sort((a, b) => a.createdAt - b.createdAt);
        const toRemove = all.slice(0, all.length - MAX_PENDING_QUEUE + 1);
        for (const item of toRemove) {
          store.delete(item.logId);
        }
      }
      store.put(record);
    };
  } catch (err) {
    console.warn('Failed to queue proof in IndexedDB', err);
  }
}

export async function getPendingProofs(): Promise<PendingProofRecord[]> {
  try {
    const db = await openProofsDB();
    if (!db) return [];

    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve([]);
    });
  } catch {
    return [];
  }
}

export async function removePendingProof(logId: string): Promise<void> {
  try {
    const db = await openProofsDB();
    if (!db) return;

    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(logId);
  } catch (err) {
    console.warn('Failed to remove pending proof', err);
  }
}

export async function clearPendingProofs(): Promise<void> {
  try {
    const db = await openProofsDB();
    if (!db) return;

    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).clear();
  } catch (err) {
    console.warn('Failed to clear pending proofs', err);
  }
}

// -----------------------------------------------------------------------------
// Storage Upload and Retry Logic
// -----------------------------------------------------------------------------

/**
 * Uploads a proof blob to Supabase Storage path: {user_id}/{layover_id}/{log_id}.jpg
 * If offline or upload fails, stores in IndexedDB retry queue without blocking the caller.
 */
export async function uploadProofBlob({
  userId,
  layoverId,
  logId,
  blob,
}: {
  userId: string;
  layoverId: string;
  logId: string;
  blob: Blob;
}): Promise<{ path: string; success: boolean; error?: string }> {
  const path = `${userId}/${layoverId}/${logId}.jpg`;

  const supabase = createBrowserClient();
  if (!supabase || (typeof navigator !== 'undefined' && !navigator.onLine)) {
    // Queue offline for later retry
    await savePendingProof({
      logId,
      userId,
      layoverId,
      path,
      blob,
      createdAt: Date.now(),
    });
    return { path, success: false, error: 'OFFLINE_QUEUED' };
  }

  try {
    const { error } = await supabase.storage.from('proofs').upload(path, blob, {
      contentType: 'image/jpeg',
      upsert: true,
    });

    if (error) {
      console.warn('Storage upload error, queueing in IndexedDB:', error.message);
      await savePendingProof({
        logId,
        userId,
        layoverId,
        path,
        blob,
        createdAt: Date.now(),
      });
      return { path, success: false, error: error.message };
    }

    // Success: remove any existing pending retry
    await removePendingProof(logId);
    return { path, success: true };
  } catch (err: any) {
    console.warn('Storage upload network failure, queueing in IndexedDB:', err);
    await savePendingProof({
      logId,
      userId,
      layoverId,
      path,
      blob,
      createdAt: Date.now(),
    });
    return { path, success: false, error: err?.message || 'NETWORK_FAILURE' };
  }
}

/**
 * Retries all pending IndexedDB proofs. Called on mount and window 'online' event.
 */
export async function retryPendingProofUploads(): Promise<void> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) return;

  const supabase = createBrowserClient();
  if (!supabase) return;

  const { data: session } = await supabase.auth.getSession();
  if (!session?.session?.user) return;

  const pending = await getPendingProofs();
  if (pending.length === 0) return;

  for (const item of pending) {
    if (item.userId !== session.session.user.id) continue;

    try {
      const { error } = await supabase.storage.from('proofs').upload(item.path, item.blob, {
        contentType: 'image/jpeg',
        upsert: true,
      });

      if (!error) {
        // Update mission_log row if exists
        await supabase
          .from('mission_log')
          .update({ proof_path: item.path, proof_status: 'unverified' })
          .eq('id', item.logId);

        await removePendingProof(item.logId);
      }
    } catch (e) {
      console.warn('Proof retry upload error for', item.logId, e);
    }
  }
}

// -----------------------------------------------------------------------------
// Signed URLs and Deletion
// -----------------------------------------------------------------------------

/**
 * Retrieves a 60-minute signed URL for displaying a private proof photo.
 * Caches in memory to avoid repeated roundtrips.
 */
export async function getSignedProofUrl(path: string): Promise<string | null> {
  if (!path) return null;
  if (path.startsWith('data:') || path.startsWith('blob:') || path.startsWith('http:') || path.startsWith('https:')) {
    return path;
  }

  const cached = signedUrlCache.get(path);
  if (cached && cached.expiresAt > Date.now() + 60000) {
    return cached.url;
  }

  const supabase = createBrowserClient();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase.storage.from('proofs').createSignedUrl(path, 3600);
    if (error || !data?.signedUrl) {
      return null;
    }

    signedUrlCache.set(path, {
      url: data.signedUrl,
      expiresAt: Date.now() + 3500 * 1000,
    });

    return data.signedUrl;
  } catch {
    return null;
  }
}

/**
 * Deletes a proof file from storage and clears proof fields from mission_log.
 */
export async function deleteProof({
  logId,
  path,
}: {
  logId: string;
  path: string;
}): Promise<boolean> {
  const supabase = createBrowserClient();
  signedUrlCache.delete(path);
  await removePendingProof(logId);

  if (!supabase) return true;

  try {
    // 1. Remove from storage
    if (path) {
      await supabase.storage.from('proofs').remove([path]);
    }

    // 2. Clear mission_log columns
    if (logId) {
      await supabase
        .from('mission_log')
        .update({
          proof_path: null,
          proof_status: 'none',
          proof_checked_at: null,
          proof_note: null,
          proof_xp: 0,
        })
        .eq('id', logId);
    }

    return true;
  } catch (err) {
    console.error('Delete proof error:', err);
    return false;
  }
}

/**
 * Deletes all proofs under a given layover path: {userId}/{layoverId}
 * Storage limitation: PostgreSQL foreign key cascades cannot automatically delete Supabase Storage objects,
 * so this helper performs programmatic cleanup when layovers are deleted.
 */
export async function deleteLayoverProofs(userId: string, layoverId: string): Promise<void> {
  const supabase = createBrowserClient();
  if (!supabase || !userId || !layoverId) return;

  try {
    const folder = `${userId}/${layoverId}`;
    const { data: files } = await supabase.storage.from('proofs').list(folder);
    if (files && files.length > 0) {
      const paths = files.map((f) => `${folder}/${f.name}`);
      await supabase.storage.from('proofs').remove(paths);
      for (const p of paths) {
        signedUrlCache.delete(p);
      }
    }
  } catch (err) {
    console.warn('Failed to delete layover proofs folder:', err);
  }
}
