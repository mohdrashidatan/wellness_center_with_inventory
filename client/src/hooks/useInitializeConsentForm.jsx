import { useEffect } from "react";

export default function useInitializeConsentForm(data, setFormData) {
  useEffect(() => {
    if (data && data.length > 0) {
      setFormData((prev) => ({
        ...prev,
        date: data[0].consentfrmdate ? new Date(data[0].consentfrmdate).toISOString().split("T")[0] : "",
        voucherNo: data[0].voucherno || "",
        selectedDevices: data[0].device_used || "",
        gender: data[0].gender || "",
        selectedConditions: "",
        signatureDate: data[0].consentfrmdate ? new Date(data[0].consentfrmdate).toISOString().split("T")[0] : "",
        therapist: "",
        breastImplant: data[0].implantbreast || 0,
        pacemakerImplant: data[0].implantpacemaker || 0,
        electronicMonitorImplant: data[0].implantelecmon || 0,
        metalImplant: data[0].implantmetal || 0,
        eyeLensImplant: data[0].implanteyslens || 0,
        historyOfHeartBypass: data[0].issueheartbypass || 0,
        walkin: data[0].walkin || "",
        referralType: "",
        nonWalkin: "Walk-in",
        nonWalkinName: data[0].nonwalkinname || "",
        nonWalkinContact: data[0].nonwalkincontact || "",
        others: "",
        otherCondition: data[0].issueothers || 0,
        issuecoheartdisease: data[0].issuecoheartdisease || 0,
        issuelungdisease: data[0].issuelungdisease || 0,
        issuediabetes: data[0].issuediabetes || 0,
        issuestrokehistory: data[0].issuestrokehistory || 0,
        issuehypertension: data[0].issuehypertension || 0,
        issuepregnant: data[0].issuepregnant || 0,
        issuecancer: data[0].issuecancer || 0,
        issuemenstruating: data[0].issuemenstruating || 0,
        issuesurgery: data[0].issuesurgery || 0,
        issuehospitalninetydays: data[0].issuehospitalninetydays || 0,
        issueseizure: data[0].issueseizure || 0,
      }));
    }
  }, [data]);
}
