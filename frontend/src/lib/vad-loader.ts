import type { MicVAD, RealTimeVADOptions } from "@ricky0123/vad-web";

const ORT_VERSION = "1.22.0";
const VAD_WEB_VERSION = "0.0.30";

const ORT_CDN_BASE = `https://cdn.jsdelivr.net/npm/onnxruntime-web@${ORT_VERSION}/dist/`;
const VAD_CDN_BASE = `https://cdn.jsdelivr.net/npm/@ricky0123/vad-web@${VAD_WEB_VERSION}/dist/`;

type VadBundle = {
  MicVAD: typeof MicVAD;
};

declare global {
  interface Window {
    ort?: unknown;
    vad?: VadBundle;
  }
}

let loadPromise: Promise<VadBundle> | null = null;

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
    document.head.appendChild(script);
  });
}

/** Load MicVAD from CDN (avoids Next.js bundling issues with onnxruntime-web). */
export async function loadMicVad(): Promise<typeof MicVAD> {
  if (!loadPromise) {
    loadPromise = (async () => {
      await loadScript(`${ORT_CDN_BASE}ort.wasm.min.js`);
      await loadScript(`${VAD_CDN_BASE}bundle.min.js`);
      if (!window.vad?.MicVAD) {
        throw new Error("Voice activity detection failed to initialize.");
      }
      return window.vad;
    })();
  }
  const bundle = await loadPromise;
  return bundle.MicVAD;
}

export const VAD_ASSET_PATHS: Pick<RealTimeVADOptions, "baseAssetPath" | "onnxWASMBasePath"> = {
  baseAssetPath: VAD_CDN_BASE,
  onnxWASMBasePath: ORT_CDN_BASE,
};
