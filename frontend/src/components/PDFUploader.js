import { FileText, Upload, X, ShieldCheck, AlertCircle, RefreshCw } from "lucide-react";
import { formatBytes } from "../hooks/usePDF";
import "./PDFUploader.css";

export default function PDFUploader({ hook, compact = false, required = false }) {
  const { file, hash, hashing, progress, error, dragOver, inputRef,
          handleFileInput, handleDrop, handleDragOver, handleDragLeave,
          reset, openPicker } = hook;

  return (
    <div className="pdf-uploader">
      {!file && (
        <div className={`pdf-drop-zone ${dragOver?"dragover":""} ${compact?"compact":""}`}
          onClick={openPicker} onDrop={handleDrop}
          onDragOver={handleDragOver} onDragLeave={handleDragLeave}
          role="button" tabIndex={0} onKeyDown={e => e.key==="Enter" && openPicker()}>
          <div className="pdf-drop-icon"><FileText size={compact?26:34}/></div>
          <div className="pdf-drop-title">{dragOver?"Release to upload":"Drop PDF here or click to browse"}</div>
          <div className="pdf-drop-meta">
            {required && <span className="pdf-required-badge">Required</span>}
            <span>PDF only · Max 50 MB · Hashed locally · Never uploaded to server</span>
          </div>
          <input ref={inputRef} type="file" accept="application/pdf,.pdf"
            style={{display:"none"}} onChange={handleFileInput}/>
        </div>
      )}

      {error && (
        <div className="pdf-error">
          <AlertCircle size={14}/><span>{error}</span>
          <button onClick={reset} className="pdf-error-retry"><RefreshCw size={12}/> Retry</button>
        </div>
      )}

      {file && (
        <div className="pdf-file-card">
          <div className="pdf-file-icon"><FileText size={20}/></div>
          <div className="pdf-file-details">
            <div className="pdf-file-name">{file.name}</div>
            <div className="pdf-file-size">{formatBytes(file.size)}</div>
          </div>
          <button className="pdf-remove-btn" onClick={reset} title="Remove"><X size={14}/></button>
        </div>
      )}

      {hashing && (
        <div className="pdf-progress-wrap">
          <div className="pdf-progress-row">
            <span className="pdf-progress-label"><span className="spinner sm-blue"/> Computing SHA-256…</span>
            <span className="pdf-progress-pct">{progress}%</span>
          </div>
          <div className="pdf-progress-track">
            <div className="pdf-progress-bar" style={{width:`${progress}%`}}/>
          </div>
        </div>
      )}

      {hash && !hashing && (
        <div className="pdf-hash-result">
          <div className="pdf-hash-header">
            <ShieldCheck size={13} style={{color:"var(--green)"}}/>
            <span className="pdf-hash-title">SHA-256 Hash — Stored On-Chain</span>
          </div>
          <div className="pdf-hash-value">
            <code>{hash}</code>
            <button className="pdf-copy-btn" onClick={() => navigator.clipboard.writeText(hash)}>Copy</button>
          </div>
          <p className="pdf-hash-hint">Any modification to the file produces a completely different hash.</p>
        </div>
      )}
    </div>
  );
}
