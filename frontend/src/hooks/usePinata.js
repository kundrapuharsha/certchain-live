import { useState, useCallback } from "react";

const PINATA_JWT     = process.env.REACT_APP_PINATA_JWT     || "";
const PINATA_GATEWAY = process.env.REACT_APP_PINATA_GATEWAY || "https://gateway.pinata.cloud";

/**
 * usePinata — uploads a PDF File to IPFS via Pinata.
 * Returns the IPFS hash (CID) and a public gateway URL.
 */
export function usePinata() {
  const [uploading, setUploading] = useState(false);
  const [uploaded,  setUploaded]  = useState(null);  // { cid, url }
  const [error,     setError]     = useState(null);
  const [progress,  setProgress]  = useState(0);

  const upload = useCallback(async (file, metadata = {}) => {
    if (!PINATA_JWT) {
      setError("Pinata JWT not configured. Add REACT_APP_PINATA_JWT to .env");
      return null;
    }
    if (!file) return null;

    setUploading(true);
    setError(null);
    setProgress(0);
    setUploaded(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      // Pinata metadata — name visible in Pinata dashboard
      formData.append("pinataMetadata", JSON.stringify({
        name: metadata.name || file.name,
        keyvalues: {
          studentId:       metadata.studentId       || "",
          studentName:     metadata.studentName     || "",
          courseName:      metadata.courseName      || "",
          institutionName: metadata.institutionName || "",
          issuedAt:        new Date().toISOString(),
        }
      }));

      formData.append("pinataOptions", JSON.stringify({ cidVersion: 1 }));

      // Use XMLHttpRequest so we can track upload progress
      const cid = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", "https://api.pinata.cloud/pinning/pinFileToIPFS");
        xhr.setRequestHeader("Authorization", `Bearer ${PINATA_JWT}`);

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 90));
        };

        xhr.onload = () => {
          if (xhr.status === 200) {
            const data = JSON.parse(xhr.responseText);
            resolve(data.IpfsHash);
          } else {
            reject(new Error(`Pinata error ${xhr.status}: ${xhr.responseText}`));
          }
        };

        xhr.onerror  = () => reject(new Error("Network error uploading to Pinata"));
        xhr.ontimeout = () => reject(new Error("Upload timed out"));
        xhr.timeout  = 120000; // 2 min
        xhr.send(formData);
      });

      setProgress(100);
      const url = `${PINATA_GATEWAY}/ipfs/${cid}`;
      const result = { cid, url, ipfsUri: `ipfs://${cid}` };
      setUploaded(result);
      return result;

    } catch (e) {
      setError(e.message || "Upload failed");
      return null;
    } finally {
      setUploading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setUploading(false);
    setUploaded(null);
    setError(null);
    setProgress(0);
  }, []);

  return { upload, uploading, uploaded, error, progress, reset };
}

// ── Public IPFS gateway URL from CID or ipfs:// URI ─────────
export function ipfsToHttp(uri) {
  if (!uri) return null;
  if (uri.startsWith("ipfs://")) {
    return `${PINATA_GATEWAY}/ipfs/${uri.slice(7)}`;
  }
  return uri;
}
