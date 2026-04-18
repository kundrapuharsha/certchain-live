import { useCallback } from "react";
import { useWeb3 } from "./useWeb3";
import toast from "react-hot-toast";

function parseCert(raw) {
  const STATUS = ["NotIssued", "Active", "Revoked"];
  return {
    certId:          raw.certId,
    studentName:     raw.studentName,
    studentId:       raw.studentId,
    studentEmail:    raw.studentEmail,
    courseName:      raw.courseName,
    courseId:        raw.courseId,
    grade:           raw.grade,
    issueDate:       new Date(Number(raw.issueDate) * 1000),
    expiryDate:      raw.expiryDate === 0n ? null : new Date(Number(raw.expiryDate) * 1000),
    institution:     raw.institution,
    institutionName: raw.institutionName,
    metadataURI:     raw.metadataURI,
    status:          STATUS[Number(raw.status)] || "Unknown",
  };
}

export function useCertificate() {
  const { contract, account } = useWeb3();

  const require_contract = () => { if (!contract) throw new Error("Connect wallet first"); };

  // ── Admin ──────────────────────────────────────────────────
  const registerInstitution = useCallback(async (address, name, website, emailDomain) => {
    require_contract();
    const tid = toast.loading("Registering institution…");
    try {
      const tx = await contract.registerInstitution(address, name, website, emailDomain);
      toast.loading("Confirming…", { id: tid });
      await tx.wait();
      toast.success(`"${name}" registered!`, { id: tid });
      return true;
    } catch(e) { toast.error(e.reason || e.message, { id: tid }); return false; }
      // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contract]);

  const updateInstitution = useCallback(async (address, name, website, emailDomain) => {
    require_contract();
    const tid = toast.loading("Updating…");
    try {
      const tx = await contract.updateInstitution(address, name, website, emailDomain);
      await tx.wait();
      toast.success("Updated", { id: tid });
      return true;
    } catch(e) { toast.error(e.reason || e.message, { id: tid }); return false; }
      // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contract]);

  const revokeInstitution = useCallback(async (address) => {
    require_contract();
    const tid = toast.loading("Revoking…");
    try {
      const tx = await contract.revokeInstitution(address);
      await tx.wait();
      toast.success("Institution revoked", { id: tid });
      return true;
    } catch(e) { toast.error(e.reason || e.message, { id: tid }); return false; }
      // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contract]);

  const getAllInstitutions = useCallback(async () => {
    require_contract();
    try {
      const addrs = await contract.getAllInstitutions();
      const list  = await Promise.all(addrs.map(async addr => {
        const inst = await contract.institutions(addr);
        return { address: addr, name: inst.name, website: inst.website,
                 emailDomain: inst.emailDomain, active: inst.active,
                 totalIssued: Number(inst.totalIssued) };
      }));
      return list;
    } catch { return []; }
      // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contract]);

  // ── Issuance ────────────────────────────────────────────────
  const issueCertificate = useCallback(async ({
    studentName, studentId, studentEmail,
    courseName, courseId, grade, expiryDate, metadataURI
  }) => {
    require_contract();
    const tid = toast.loading("Sending to blockchain…");
    try {
      const expiry = expiryDate ? Math.floor(new Date(expiryDate).getTime()/1000) : 0;
      const tx = await contract.issueCertificate(
        studentName, studentId, studentEmail || "",
        courseName, courseId, grade, expiry, metadataURI || ""
      );
      toast.loading("Waiting for confirmation…", { id: tid });
      const receipt = await tx.wait();
      const event   = receipt.logs.find(l => l.fragment?.name === "CertificateIssued");
      const certId  = event?.args?.[0];
      toast.success("Certificate issued on-chain!", { id: tid });
      return { certId, txHash: receipt.hash };
    } catch(e) { toast.error(e.reason || e.message, { id: tid }); return null; }
      // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contract]);

  // ── Revocation ──────────────────────────────────────────────
  const revokeCertificate = useCallback(async (certId) => {
    require_contract();
    const tid = toast.loading("Revoking…");
    try {
      const tx = await contract.revokeCertificate(certId);
      await tx.wait();
      toast.success("Certificate revoked", { id: tid });
      return true;
    } catch(e) { toast.error(e.reason || e.message, { id: tid }); return false; }
      // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contract]);

  // ── Reads ───────────────────────────────────────────────────
  const verifyCertificate = useCallback(async (certId) => {
    require_contract();
    try {
      const [valid, cert] = await contract.verifyCertificate(certId);
      return { valid, cert: parseCert(cert) };
    } catch(e) { toast.error(e.reason || e.message); return null; }
      // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contract]);

  const getCertificate = useCallback(async (certId) => {
    require_contract();
    try { return parseCert(await contract.getCertificate(certId)); } catch { return null; }
      // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contract]);

  const getStudentCertificates = useCallback(async (studentId) => {
    require_contract();
    try { return await contract.getStudentCertificates(studentId); } catch { return []; }
      // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contract]);

  const getInstitutionCertificates = useCallback(async (address) => {
    require_contract();
    try { return await contract.getInstitutionCertificates(address || account); } catch { return []; }
      // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contract, account]);

  return {
    registerInstitution, updateInstitution, revokeInstitution, getAllInstitutions,
    issueCertificate, revokeCertificate,
    verifyCertificate, getCertificate,
    getStudentCertificates, getInstitutionCertificates,
  };
}
