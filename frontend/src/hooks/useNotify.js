import { useState, useCallback } from "react";

const API_URL = process.env.REACT_APP_NOTIFY_API_URL || "/api/notify";

/**
 * useNotify — calls the serverless /api/notify endpoint
 * to send a certificate-issued email to the student.
 */
export function useNotify() {
  const [sending, setSending] = useState(false);
  const [sent,    setSent]    = useState(false);
  const [error,   setError]   = useState(null);

  const sendNotification = useCallback(async (payload) => {
    if (!payload.studentEmail) return false;

    setSending(true);
    setSent(false);
    setError(null);

    try {
      const res = await fetch(API_URL, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || `Server error ${res.status}`);
      }

      setSent(true);
      return true;
    } catch (e) {
      // Non-critical — email failure shouldn't block the certificate
      console.warn("Email notification failed:", e.message);
      setError(e.message);
      return false;
    } finally {
      setSending(false);
    }
  }, []);

  const reset = useCallback(() => {
    setSending(false); setSent(false); setError(null);
  }, []);

  return { sendNotification, sending, sent, error, reset };
}
