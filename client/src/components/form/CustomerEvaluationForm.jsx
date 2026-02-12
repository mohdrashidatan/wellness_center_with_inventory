import React from "react";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { attention } from "@/utils/Hardcodeddata";
import SignatureCanvas from "react-signature-canvas";
import { customerService } from "@/services/customerService";
import { consentService } from "@/services/consentService";

const CustomerEvaluationForm = ({ role = "customer", id = 0, setTriggerKey }) => {
  const [MedicationType, setMedicationType] = useState("");
  const [personalData, setPersonalData] = useState({});
  const [consentData, setConsentData] = useState({});
  const navigate = useNavigate();
  const handleNext = () => {
    navigate("/steps/review");
  };
  const handlePrev = () => {
    navigate("/steps/consent");
  };

  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
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

  useEffect(() => {
    const fetch = async () => {
      if (role == "customer") {
      } else {
        const data = await customerService.getCustomerData(id);
        setPersonalData(data);
        const dataex = await consentService.getConsentByid(id);
        setConsentData(dataex);
      }
    };

    fetch();
  }, []);

  const [form, setForm] = useState({
    name: "",
    no_medication: "",
    medication: "",
    medication_name: "",
    pain: "",
  });

  return (
    <div className=' p-6'>
      {/* Header */}
      <h1 className='text-2xl font-bold text-red-700 mb-2'>CUSTOMER EVALUATION FORM</h1>

      {/* Customer Name + Date */}
      <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mb-4'>
        <div>
          <label className='block text-sm font-medium'>Customer Name</label>
          <input type='text' className='mt-1 w-full border rounded px-2 py-1' value={personalData[0]?.name || ""} />
        </div>
        <div>
          <label className='block text-sm font-medium'>Date</label>
          <input type='date' className='mt-1 w-full border rounded px-2 py-1' />
        </div>
      </div>

      {/* On Any Medication?*/}
      <p className='font-semibold text-sm mb-2'>ARE YOU ON ANY MEDICATION?</p>
      <div className='mb-4'>
        <label className='inline-flex items-center mr-4'>
          <input type='radio' name='no_medication' value='no medication' checked={MedicationType === "no medication"} onChange={() => setMedicationType("no medication")} className='mr-2' />
          No Medication
        </label>
        <label className='inline-flex items-center'>
          <input type='radio' name='medication' value='medication' checked={MedicationType === "medication"} onChange={() => setMedicationType("medication")} className='mr-2' />
          Medication
        </label>

        {MedicationType === "medication" && (
          <div className='mt-2 grid grid-cols-2 gap-4'>
            <input type='text' name='medication_name' placeholder='If, yes which one' className='border rounded px-2 py-1' />
          </div>
        )}
      </div>

      <div className='mt-2 grid grid-cols-2 gap-4 mb-2'>
        <input type='text' placeholder='Where is your uncomfortable pain' name='pain' className='border rounded px-2 py-1' />
      </div>

      {/*Parts Need to Give Attention */}
      <p className='font-semibold text-sm mb-2'>PLEASE SELECT 2-3 PARTS NEED TO GIVE ATTENTION:</p>
      <div className='grid grid-cols-2 md:grid-cols-3 gap-2 mb-4'>
        {attention.map((condition) => (
          <label key={condition} className='inline-flex items-center'>
            <input type='checkbox' className='mr-2' /> {condition}
          </label>
        ))}
      </div>

      {/* Therapy / Duration / Therapist */}
      <div className='bg-gray p-4 rounded '>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
          <input type='text' placeholder='Therapy' name='theraphy' className='border rounded px-2 py-1' value={consentData[0]?.device_used || ""} />
          <input type='text' placeholder='Duration' name='duration' className='border rounded px-2 py-1' />
          <input type='text' placeholder='Therapist' name='therapist' className='border rounded px-2 py-1' value={consentData[0]?.therapistid || ""} />
        </div>
      </div>

      {/* Disclaimer*/}

      <p className='text-sm mb-4 text-justify'>
        All customer are requested signing this consent agreement, I ________ acknowledge that I am receiving therapy from Prife International...
        {/* You can paste full disclaimer text here if needed */}
      </p>

      {/* Customer Signature */}
      <div className='grid grid-cols-2 gap-4 mb-4'>
        <div>
          <label className='block text-sm font-medium'>Customer Signature</label>
          <SignatureCanvas ref={sigCanvas} penColor='black' canvasProps={{ className: "w-full h-40 bg-blue-100 rounded" }} />
          <button onClick={clearSignature} className='text-sm px-3 py-1 bg-gray-200 rounded'>
            Clear
          </button>
          <button onClick={saveSignature} className='text-sm px-3 py-1 bg-blue-500 text-white rounded'>
            Save
          </button>
        </div>
      </div>
      <div className='flex justify-between my-10'>
        <Button variant='secondary' onClick={handlePrev}>
          Prev
        </Button>
        <Button onClick={handleNext}>Next</Button>
      </div>
    </div>
  );
};

export default CustomerEvaluationForm;
