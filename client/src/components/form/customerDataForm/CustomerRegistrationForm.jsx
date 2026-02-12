import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { interested } from "@/utils/Hardcodeddata";
import { Input } from "@/components/ui/input";
import { interestsService } from "@/services/interestsService";
import { customerService } from "@/services/customerService";
import toast from "react-hot-toast";
import Referrer from "./customerDataFormPartial/Referrer";
import PersonalDetail from "./customerDataFormPartial/PersonalDetail";
import EmergancyContact from "./customerDataFormPartial/EmergencyContact";
import InterestSelection from "./customerDataFormPartial/InterestSelection";
import { useAuth } from "@/context/AuthContext";
import useInitializeCustomerForm from "@/hooks/useInitializeCustomerForm";

const CustomerRegistrationForm = () => {
  const navigate = useNavigate();
  const [interestsList, setInterestsList] = useState();
  const [interests, setInterests] = useState({});
  // const [loading, setLoading] = useState({});
  const [selectedInterest, setSelectedInterest] = useState([]);
  const [dataExist, setDataExist] = useState();
  const { user, loading } = useAuth();
  if (loading) {
    return <div>Loading...</div>;
  }
  const [formData, setFormData] = useState({
    name: "",
    dateOfBirth: "",
    email: "",
    contact_no: "",
    address: "",
    postalcode: "",
    country: "",
    referred_by: "-",
    referred_other: "-",
    emergency_contact_name: "",
    emergency_contact_no: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  //Next and Prev handle
  const handleNext = async () => {
    const isFormValid = Object.values(formData).every((value) => value.trim() !== "");
    console.log(formData);

    if (!isFormValid) {
      toast.error("All fields are required.");
    } else {
      try {
        const isDataExist = await customerService.getCustomerData();
        console.log(isDataExist);
        if (isDataExist.length > 0) {
          await customerService.updateRegistration(user.customerId, formData, selectedInterest);
        } else {
          await customerService.customerRegistration(user.customerId, formData, selectedInterest);
        }
        toast.success("Data Saved");
        navigate("/steps/consent");
      } catch (error) {
        toast.error(error.message || "Login failed");
      } finally {
        // setLoading(false);
      }
    }
  };

  const handlePrev = () => {
    navigate("/steps/treatment-form");
  };

  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }, []);

  useInitializeCustomerForm(dataExist, setFormData);

  const toggleInterest = (item) => {
    setInterests((prev) => {
      const updated = { ...prev, [item]: !prev[item] };
      const selected = Object.keys(updated).filter((key) => updated[key]);
      setSelectedInterest(selected);

      return updated;
    });
  };

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await interestsService.interestestsList();
        setInterestsList(data);
        const dataEx = await customerService.getCustomerJoinInterestData(user.customerId);
        console.log(dataEx);
        setDataExist(dataEx);

        dataEx.map((item) => {
          setInterests((prev) => {
            const updated = { ...prev, [item.id]: true };
            const selected = Object.keys(updated).filter((key) => updated[key]);
            setSelectedInterest(selected);

            return updated;
          });
        });
      } catch (err) {
        // setError("Fail To gain data");
      } finally {
        // setLoading(false);
      }
    };

    fetch();
  }, []);

  return (
    <div className='p-6'>
      {/* Header */}
      <h1 className='text-2xl font-bold text-blue-900 mb-4'>CUSTOMER REGISTRATION FORM</h1>

      {/* Referrer Section */}
      <Referrer handleChange={handleChange} formData={formData} dataExist={dataExist} />

      {/* Personal Details */}
      <div className='bg-blue-900 text-white px-2 py-1 mb-2 font-semibold'>PERSONAL DETAILS / 个人资料</div>
      <PersonalDetail handleChange={handleChange} formData={formData} dataExist={dataExist} />

      {/* Emergency Contact */}
      <EmergancyContact handleChange={handleChange} formData={formData} dataExist={dataExist} />

      {/* Interest Section */}
      <div className='bg-blue-900 text-white px-2 py-1 mb-2 font-semibold'>MORE INTERESTED ON / 对以下有兴趣</div>
      <InterestSelection toggleInterest={toggleInterest} interestsList={interestsList} interests={interests} dataExist={dataExist} />
      <div className='flex justify-between my-10'>
        <Button variant='secondary' onClick={handlePrev}>
          Prev
        </Button>
        <Button onClick={handleNext}>Save</Button>
      </div>
    </div>
  );
};

export default CustomerRegistrationForm;
