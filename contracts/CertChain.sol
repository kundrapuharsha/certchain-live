// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title  CertChain — Multi-Institution Certificate Registry
 * @notice Production contract for Sepolia testnet deployment.
 */
contract CertChain {

    address public owner;

    struct Institution {
        string  name;
        string  website;
        string  emailDomain;
        bool    active;
        uint256 totalIssued;
    }

    mapping(address => Institution) public institutions;
    address[] private _institutionList;

    enum Status { NotIssued, Active, Revoked }

    struct Certificate {
        bytes32 certId;
        string  studentName;
        string  studentId;
        string  studentEmail;
        string  courseName;
        string  courseId;
        string  grade;
        uint256 issueDate;
        uint256 expiryDate;
        address institution;
        string  institutionName;
        string  metadataURI;
        Status  status;
    }

    mapping(bytes32 => Certificate) private _certs;
    mapping(string  => bytes32[])   private _studentCerts;
    mapping(address => bytes32[])   private _institutionCerts;

    uint256 public totalCertificates;

    event InstitutionRegistered(address indexed institution, string name, string emailDomain);
    event InstitutionUpdated(address indexed institution, string name);
    event InstitutionRevoked(address indexed institution);

    event CertificateIssued(
        bytes32 indexed certId,
        string  indexed studentId,
        address indexed institution,
        string  studentName,
        string  studentEmail,
        string  courseName,
        uint256 issueDate
    );

    event CertificateRevoked(
        bytes32 indexed certId,
        address indexed revokedBy,
        uint256 timestamp
    );

    modifier onlyOwner() {
        require(msg.sender == owner, "CertChain: not owner");
        _;
    }

    modifier onlyInstitution() {
        require(institutions[msg.sender].active, "CertChain: not active institution");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function registerInstitution(
        address institution,
        string calldata name,
        string calldata website,
        string calldata emailDomain
    ) external onlyOwner {
        require(institution != address(0), "CertChain: zero address");
        require(bytes(name).length > 0, "CertChain: name required");

        bool isNew = bytes(institutions[institution].name).length == 0;
        institutions[institution] = Institution({
            name: name, website: website, emailDomain: emailDomain,
            active: true, totalIssued: institutions[institution].totalIssued
        });
        if (isNew) _institutionList.push(institution);
        emit InstitutionRegistered(institution, name, emailDomain);
    }

    function updateInstitution(
        address institution,
        string calldata name,
        string calldata website,
        string calldata emailDomain
    ) external onlyOwner {
        require(institutions[institution].active, "CertChain: not found");
        institutions[institution].name = name;
        institutions[institution].website = website;
        institutions[institution].emailDomain = emailDomain;
        emit InstitutionUpdated(institution, name);
    }

    function revokeInstitution(address institution) external onlyOwner {
        institutions[institution].active = false;
        emit InstitutionRevoked(institution);
    }

    function getAllInstitutions() external view returns (address[] memory) {
        return _institutionList;
    }

    function issueCertificate(
        string calldata studentName,
        string calldata studentId,
        string calldata studentEmail,
        string calldata courseName,
        string calldata courseId,
        string calldata grade,
        uint256         expiryDate,
        string calldata metadataURI
    ) external onlyInstitution returns (bytes32 certId) {
        require(bytes(studentName).length > 0, "CertChain: studentName required");
        require(bytes(studentId).length   > 0, "CertChain: studentId required");
        require(bytes(courseName).length  > 0, "CertChain: courseName required");

        certId = keccak256(abi.encodePacked(
            studentId, courseId, msg.sender, block.timestamp, block.number
        ));
        require(_certs[certId].status == Status.NotIssued, "CertChain: collision");

        Certificate storage c = _certs[certId];
        c.certId          = certId;
        c.studentName     = studentName;
        c.studentId       = studentId;
        c.studentEmail    = studentEmail;
        c.courseName      = courseName;
        c.courseId        = courseId;
        c.grade           = grade;
        c.issueDate       = block.timestamp;
        c.expiryDate      = expiryDate;
        c.institution     = msg.sender;
        c.institutionName = institutions[msg.sender].name;
        c.metadataURI     = metadataURI;
        c.status          = Status.Active;

        _studentCerts[studentId].push(certId);
        _institutionCerts[msg.sender].push(certId);
        institutions[msg.sender].totalIssued++;
        totalCertificates++;

        emit CertificateIssued(
            certId, studentId, msg.sender,
            studentName, studentEmail, courseName, block.timestamp
        );
    }

    function revokeCertificate(bytes32 certId) external {
        Certificate storage c = _certs[certId];
        require(c.status == Status.Active, "CertChain: not active");
        require(msg.sender == c.institution || msg.sender == owner, "CertChain: not authorised");
        c.status = Status.Revoked;
        emit CertificateRevoked(certId, msg.sender, block.timestamp);
    }

    function verifyCertificate(bytes32 certId)
        external view returns (bool valid, Certificate memory cert)
    {
        cert = _certs[certId];
        if (cert.status != Status.Active) return (false, cert);
        if (cert.expiryDate != 0 && block.timestamp > cert.expiryDate) return (false, cert);
        return (true, cert);
    }

    function getCertificate(bytes32 certId) external view returns (Certificate memory) {
        require(_certs[certId].status != Status.NotIssued, "CertChain: not found");
        return _certs[certId];
    }

    function getStudentCertificates(string calldata studentId)
        external view returns (bytes32[] memory) {
        return _studentCerts[studentId];
    }

    function getInstitutionCertificates(address institution)
        external view returns (bytes32[] memory) {
        return _institutionCerts[institution];
    }

    function getCertificateStatus(bytes32 certId) external view returns (Status) {
        return _certs[certId].status;
    }
}
