import { useState, useRef, useCallback } from "react";

export async function sha256FromBuffer(buffer) {
  const h = await crypto.subtle.digest("SHA-256", buffer);
  return Array.from(new Uint8Array(h)).map(b => b.toString(16).padStart(2,"0")).join("");
}

export function formatBytes(bytes) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1048576) return (bytes/1024).toFixed(1) + " KB";
  return (bytes/1048576).toFixed(2) + " MB";
}

export function extractStoredHash(uri = "") {
  if (!uri.startsWith("sha256:")) return null;
  return uri.split("sha256:")[1].split(" |")[0].trim().toLowerCase();
}

export function buildMetadataURI(pdfHash, ipfsUri = "", externalUri = "") {
  let uri = `sha256:${pdfHash}`;
  const link = ipfsUri || externalUri;
  if (link) uri += ` | ${link}`;
  return uri;
}

export function usePDF() {
  const [file,     setFile]     = useState(null);
  const [hash,     setHash]     = useState("");
  const [hashing,  setHashing]  = useState(false);
  const [progress, setProgress] = useState(0);
  const [error,    setError]    = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef               = useRef();

  const processFile = useCallback(async (f) => {
    if (!f) return;
    if (f.type !== "application/pdf") { setError("PDF files only (.pdf)"); return; }
    if (f.size > 50 * 1024 * 1024)   { setError("Max file size is 50 MB"); return; }

    setFile(f); setHash(""); setError(null); setHashing(true); setProgress(0);
    try {
      const buffer = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onprogress = e => { if (e.lengthComputable) setProgress(Math.round(e.loaded/e.total*60)); };
        reader.onload  = e => resolve(e.target.result);
        reader.onerror = () => reject(new Error("Read failed"));
        reader.readAsArrayBuffer(f);
      });
      setProgress(70);
      const h = await sha256FromBuffer(buffer);
      setProgress(100);
      setHash(h);
    } catch(e) {
      setError("Failed to compute hash: " + e.message);
      setFile(null);
    } finally { setHashing(false); }
  }, []);

  const handleFileInput  = useCallback(e => { const f=e.target.files?.[0]; if(f) processFile(f); }, [processFile]);
  const handleDrop       = useCallback(e => { e.preventDefault(); setDragOver(false); const f=e.dataTransfer.files?.[0]; if(f) processFile(f); }, [processFile]);
  const handleDragOver   = useCallback(e => { e.preventDefault(); setDragOver(true); }, []);
  const handleDragLeave  = useCallback(() => setDragOver(false), []);
  const reset            = useCallback(() => { setFile(null); setHash(""); setError(null); setProgress(0); setHashing(false); setDragOver(false); if(inputRef.current) inputRef.current.value=""; }, []);
  const openPicker       = useCallback(() => inputRef.current?.click(), []);

  return { file, hash, hashing, progress, error, dragOver, inputRef,
           processFile, handleFileInput, handleDrop, handleDragOver, handleDragLeave, reset, openPicker };
}
