/** Utilidades de cámara: selfie comprimida y lectura de QR. */

export const MAX_SELFIE_BYTES = 400 * 1024;

/** Bytes aproximados de un data URL base64. */
export function dataUrlBytes(dataUrl: string): number {
  const base64 = dataUrl.slice(dataUrl.indexOf(',') + 1);
  const padding = base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0;
  return Math.floor((base64.length * 3) / 4) - padding;
}

export async function openCamera(facingMode: 'user' | 'environment'): Promise<MediaStream> {
  if (!navigator.mediaDevices?.getUserMedia) throw new Error('Este navegador no permite usar la cámara');
  return navigator.mediaDevices.getUserMedia({ video: { facingMode, width: { ideal: 960 }, height: { ideal: 960 } }, audio: false });
}

export function stopStream(stream: MediaStream | null | undefined): void {
  stream?.getTracks().forEach((t) => t.stop());
}

/**
 * Foto del video → JPEG ≤ 400 KB: baja la calidad y luego el tamaño hasta
 * que quepa (lo que acepta POST /me/punches).
 */
export function captureJpeg(video: HTMLVideoElement, maxBytes = MAX_SELFIE_BYTES): string {
  const vw = video.videoWidth || 640;
  const vh = video.videoHeight || 480;
  let scale = Math.min(1, 720 / Math.max(vw, vh));
  const canvas = document.createElement('canvas');
  for (let attempt = 0; attempt < 6; attempt++) {
    canvas.width = Math.round(vw * scale);
    canvas.height = Math.round(vh * scale);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('No se pudo procesar la foto');
    // Espejo: la selfie se ve como en la vista previa.
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    for (const q of [0.8, 0.65, 0.5]) {
      const url = canvas.toDataURL('image/jpeg', q);
      if (dataUrlBytes(url) <= maxBytes) return url;
    }
    scale *= 0.7;
  }
  throw new Error('La foto es demasiado grande');
}

interface DetectedBarcode {
  rawValue: string;
}
interface BarcodeDetectorLike {
  detect(source: CanvasImageSource): Promise<DetectedBarcode[]>;
}
type BarcodeDetectorCtor = new (opts: { formats: string[] }) => BarcodeDetectorLike;

/**
 * Lector de QR: `BarcodeDetector` nativo (Chrome/Android) y, si no existe
 * (Safari/iOS, Firefox), `jsqr` cargado bajo demanda en su propio chunk.
 */
export async function createQrReader(): Promise<(video: HTMLVideoElement) => Promise<string | null>> {
  const Native = (globalThis as { BarcodeDetector?: BarcodeDetectorCtor }).BarcodeDetector;
  if (Native) {
    try {
      const detector = new Native({ formats: ['qr_code'] });
      return async (video) => {
        const codes = await detector.detect(video);
        return codes[0]?.rawValue ?? null;
      };
    } catch {
      /* formato no soportado: cae a jsqr */
    }
  }
  const jsQR = (await import('jsqr')).default;
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  return async (video) => {
    if (!ctx || !video.videoWidth) return null;
    const scale = Math.min(1, 640 / video.videoWidth);
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
    return jsQR(img.data, img.width, img.height, { inversionAttempts: 'dontInvert' })?.data ?? null;
  };
}

/** El QR del kiosco tiene la forma `att1.<deviceId>.<totp>`. */
export function isKioskQr(value: string | null | undefined): value is string {
  return Boolean(value && /^att1\.[0-9a-f-]{36}\.\d{6,8}$/i.test(value) && value.length <= 120);
}
