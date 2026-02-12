import React, { useState, useEffect, useRef, useImperativeHandle, forwardRef } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { devices, healthConditions } from "@/utils/Hardcodeddata";
import SignatureCanvas from "react-signature-canvas";
import toast from "react-hot-toast";

//service
import { consentService } from "@/services/consentService";
import { therapistsService } from "@/services/therapistsService";
import { customerService } from "@/services/customerService";
import { interestsService } from "@/services/interestsService";

//hook
import useInitializeConsentForm from "@/hooks/useInitializeConsentForm";
import useInitializeCustomerForm from "@/hooks/useInitializeCustomerForm";

//partial
import DateAndVoucher from "./consentFormPartial/DateAndVoucher";
import DeviceSelection from "./consentFormPartial/DeviceSelection";
import WalkinReferral from "./consentFormPartial/WalkinReferral";
import PersonalParticulars from "./consentFormPartial/PersonalParticulars";
import HealthDeclaration from "./consentFormPartial/HealthDeclaration";
import Disclaimer from "./consentFormPartial/Disclaimer";
import Signature from "./consentFormPartial/Signature";
import TherapistAndRating from "./consentFormPartial/TherapistAndRating";
import { useAuth } from "@/context/AuthContext";

const CustomerConsentForm = forwardRef((props, ref) => {
  const { role = "customer", idCustomer = 0, outsave = false } = props;
  const [extended, setExtended] = useState(false);
  const [loadings, setLoadings] = useState(false);
  const [therapistsList, setTherapistsList] = useState([]);
  const [interestsList, setInterestsList] = useState();
  const [personalData, setPersonalData] = useState([]);
  const [dataExist, setDataExist] = useState();
  const { user, loading } = useAuth();
  if (loading) {
    return <div>Loading...</div>;
  }

  const navigate = useNavigate();
  //Next and Prev handle
  const handleNext = async () => {
    if (role == "customer") {
      //change this ----------------------------------------------------------------------------------------

      try {
        const check = await consentService.getConsentByid(user.customerId);

        const isDataExist = await customerService.getCustomerData(user.customerId);

        if (isDataExist.length > 0) {
          await customerService.updateRegistration(user.customerId, formPersonalData);
        } else {
          await customerService.customerRegistration(user.customerId, formPersonalData);
        }
        let status;
        if (check.length > 0) {
          status = await consentService.consentUpdate(user.customerId, formData);
        } else {
          status = await consentService.consentRegistration(user.customerId, formData);
        }
        if (status.response && status.response.status === 500) {
          toast.error("Someting Is Miss");
          navigate("/steps/consent");
        } else {
          toast.success("Data Saved");
          navigate("/steps/evaluation");
        }
      } catch (error) {
        console.log(error);
      } finally {
        setLoadings(false);
      }
    } else {
      try {
        console.log("we are here");
        const isDataExist = await customerService.getCustomerData(idCustomer);
        let status;
        let id;
        if (isDataExist.length > 0) {
          await customerService.updateRegistration(idCustomer, formPersonalData);
          status = await consentService.consentUpdate(idCustomer, formData);
          id = idCustomer;
        } else {
          const resp = await customerService.customerRegistration(0, formPersonalData);
          status = await consentService.consentRegistration(resp.data.data, formData);
          id = resp.data.data;
        }
        if (status.response && status.response.status === 500) {
          toast.error("Someting Is Miss");
          navigate("/therapist");
        } else {
          toast.success("Data Saved");
          navigate(`/therapist/evaluation/${id}`);
        }
      } catch (error) {
        console.log(error);
      } finally {
        setLoadings(false);
      }
    }
  };
  const handlePrev = () => {
    navigate("/steps/personal-data");
  };

  const [formData, setFormData] = useState({
    date: "",
    voucherNo: "",
    selectedDevices: "",
    gender: "",
    selectedConditions: "",
    otherCondition: "",
    signatureDate: "",
    therapist: "",
    breastImplant: 0,
    pacemakerImplant: 0,
    electronicMonitorImplant: 0,
    metalImplant: 0,
    eyeLensImplant: 0,
    historyOfHeartBypass: 0,
    walkin: 1,
    referralType: "",
    nonWalkin: "Walk-in",
    nonWalkinName: "",
    nonWalkinContact: "",
    others: "",
    issuecoheartdisease: 0,
    issuelungdisease: 0,
    issuediabetes: 0,
    issuestrokehistory: 0,
    issuehypertension: 0,
    issuepregnant: 0,
    issuecancer: 0,
    issuemenstruating: 0,
    issuesurgery: 0,
    issuehospitalninetydays: 0,
    issueseizure: 0,
  });

  const [formPersonalData, setFormPersonalData] = useState({
    name: "",
    age: "",
    contact_no: "",
    email: "",
    dateOfBirth: "",
    emergency_contact_name: "",
    emergency_contact_no: "",
    address: "",
    country: "",
    postalcode: "",
    referred_by: "",
    referred_other: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleChangePersonal = (e) => {
    const { name, value } = e.target;
    setFormPersonalData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // ------USE EFFECT----------
  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }, []);

  useEffect(() => {
    const fetch = async () => {
      try {
        const dataTherapist = await therapistsService.therapistsList();
        setTherapistsList(dataTherapist);
        const dataDevice = await interestsService.interestestsList();

        setInterestsList(dataDevice);
        if (idCustomer == 0) {
          const data = await customerService.getCustomerData(user.customerId);
          setPersonalData(data);
          const dataex = await consentService.getConsentByid(user.customerId);
          setDataExist(dataex);
        } else {
          const data = await customerService.getCustomerData(idCustomer);
          setPersonalData(data);
          const dataex = await consentService.getConsentByid(idCustomer);
          setDataExist(dataex);
        }
      } catch (err) {
        // setError("Fail To gain data");
      } finally {
        // setLoadings(false);
      }
    };

    fetch();
  }, []);

  //--------------------------- Signature Set Up Start
  const sigCanvas = useRef();

  const clearSignature = () => {
    sigCanvas.current.clear();
  };

  const saveSignature = () => {
    const dataUrl = sigCanvas.current.toDataURL();
    console.log("Tanda tangan base64:", dataUrl);
  };
  //---------------------------- Signature Set Up End

  useInitializeConsentForm(dataExist, setFormData);

  useInitializeCustomerForm(personalData, setFormPersonalData);

  useImperativeHandle(ref, () => ({
    triggerClick: handleNext,
  }));

  return (
    <div className='p-6 space-y-3'>
      {/* Header */}
      <h1 className='text-2xl font-bold text-red-700 mb-2'>CUSTOMER CONSENT FORM</h1>
      <p className='text-sm text-gray-500 mb-4'>客户同意书 BORANG KEBENARAN PELANGGAN</p>
      {/* Date and Voucher No */}
      <DateAndVoucher formData={formData} handleChange={handleChange} />
      {/* Device Selection */}
      <DeviceSelection formData={formData} handleChange={handleChange} interestsList={interestsList} />
      {/* Walk-in / Referral */}
      <WalkinReferral formData={formData} handleChange={handleChange} />
      {/* Personal Particulars */}
      <div className='bg-blue-900 text-white px-2 py-1 mb-2 font-semibold'>PERSONAL PARTICULARS 客户信息 BUTIRAN PELANGGAN</div>
      <PersonalParticulars formData={formData} formPersonalData={formPersonalData} handleChange={handleChange} personalData={personalData} handleChangePersonal={handleChangePersonal} />
      {/* Health Declaration */}
      <div className='bg-blue-900 text-white px-2 py-1 mb-2 font-semibold'>HEALTH DECLARATION 健康声明 PENGISYTIHARAN KESIHATAN</div>
      <HealthDeclaration formData={formData} handleChange={handleChange} healthConditions={healthConditions} setFormData={setFormData} />
      {/* Disclaimer */}
      <div className='bg-blue-900 text-white px-2 py-1 mb-2 font-semibold'>DISCLAIMER 客户免责声明 PENAFIAN</div>
      <Disclaimer formData={formData} handleChange={handleChange} personalData={personalData} extended={extended} setExtended={setExtended} Button={Button} />
      {/* Signature & Rating */}
      <Signature formData={formData} handleChange={handleChange} sig={{ saveSignature, clearSignature, sigCanvas, SignatureCanvas }} Button={Button} />
      <TherapistAndRating formData={formData} handleChange={handleChange} therapistsList={therapistsList} />
      <div className='flex justify-between my-10'>
        {!outsave && (
          <>
            {" "}
            <Button variant='secondary' onClick={handlePrev}>
              Prev
            </Button>
            <Button onClick={handleNext}>Save</Button>
          </>
        )}
      </div>
    </div>
  );
});

export default CustomerConsentForm;
