import { Note } from "@react-pdf/renderer";
import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { evaluationService } from "@/services/evaluationService";
import { interestsService } from "@/services/interestsService";
import toast from "react-hot-toast";
import BodyPartSelection from "./evaluationFormPartial/BodyPartSelection";

export default function EvaluationForm({ customerData, consentData, setModal, data = null, setReloadFlag }) {
  const [coordsFront, setCoordsFront] = useState([]);
  const [coordsBack, setCoordsBack] = useState([]);

  const [formData, setFormData] = useState({
    medication: data?.medication || 0,
    medication_detail: data?.medication_detail || "",
    uncomfortable_pain: data?.pain_area || "",
    note_session: data?.therapist_note || "",
    therapist: consentData[0]?.therapistid || "",
    theraphy: consentData[0]?.device_used || "",
    date: consentData[0].consentfrmdate ? new Date(consentData[0].consentfrmdate).toISOString().split("T")[0] : "",
    duration: data?.duration || "",
    front: data?.bodyfrontx_percent || coordsFront, //for the input
    back: data?.bodybacky_percent || coordsBack, //for the input
    backnote: data?.bodybacknotes || "",
    anotate: data?.anotate || "",
    enteredby: data?.enteredby || null,
    entereddate: data?.entereddate || "",
  });

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      front: coordsFront || data?.bodyfrontx_percent,
      back: coordsBack || data?.bodybackx_percent,
    }));
  }, [coordsFront, coordsBack]);

  const handleChangeEvaluations = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async (id = 0, evaluationId = 0) => {
    try {
      let status;
      if (!data) {
        status = await evaluationService.addEvaluation(id, formData);
      } else {
        status = await evaluationService.updateEvaluation(evaluationId, formData);
        console.log(formData);
      }
      if (status.response && status.response.status === 500) {
        toast.error("Someting Is Miss");
      } else {
        toast.success("Data Saved");
        setReloadFlag((prev) => !prev);
        setModal(false);
      }
    } catch (error) {
      toast.error(error.message || "Eror Save Evaluation");
    }
  };

  return (
    <div className='w-full'>
      <div className=' h-full  mx-auto'>
        <div className='grid lg:grid-cols-3 my-5 mx-5 gap-2'>
          <BodyPartSelection setCoordsBack={setCoordsBack} setCoordsFront={setCoordsFront} data={data} coordsFront={coordsFront} coordsBack={coordsBack} />
          <div className='col-span-2 mt-5 lg:mt-0 gap-3'>
            {/* PROFILE ? */}
            <div className='grid grid-cols-2'>
              <div className='flex items-center'>
                <div className='mr-7'>
                  <p>Name</p>
                </div>
                <div className='border-b-2 border-blue-500 w-full'>{customerData[0]?.name}</div>
              </div>

              <div className='flex items-center'>
                <div className='mx-7'>
                  <p>DATE</p>
                </div>
                <div className='border-b-2 border-blue-500 w-full'>{consentData[0].consentfrmdate ? new Date(consentData[0].consentfrmdate).toISOString().split("T")[0] : ""}</div>
              </div>
            </div>
            {/* LINE SEPARATION ? */}
            <div className='bg-prime-color-two w-full h-2 my-2'></div>
            {/* ANY MEDICATION ? */}
            <div className='lg:my-10 my-5'>
              <div className='grid grid-cols-4 '>
                <div className='flex items-center col-span-3'>
                  <div className='mr-7'>
                    <p>Are You In Any Medication ?</p>
                  </div>
                </div>

                <div className='flex items-center'>
                  <div className='flex mx-3'>
                    <input type='checkbox' name='medications' value={1} onChange={(e) => setFormData({ ...formData, medication: e.target.checked ? 1 : 0 })} checked={formData.medication == 1} />
                    <p>Yes</p>
                  </div>
                  <div className='flex mx-3'>
                    <input type='checkbox' name='medications' value={0} onChange={(e) => setFormData({ ...formData, medication: e.target.checked ? 0 : 1 })} checked={formData.medication == 0} />
                    <p>No</p>
                  </div>
                </div>
              </div>

              <div className='my-2'>
                {formData.medication == 1 && (
                  <div className='flex items-center my-5'>
                    <div className='mr-7 w-80'>
                      <p>IF YES WHICH ONES </p>
                    </div>
                    <input type='text' className='border-b-2 border-blue-500 w-full  focus:outline-none' name='medication_detail' placeholder='Medication Detail' value={formData.medication_detail} onChange={handleChangeEvaluations} />
                  </div>
                )}
                <div className='flex items-center my-5'>
                  <div className='mr-7 w-80'>
                    <p>WHERE IS YOUR UNCOMFORTABLE PAIN? </p>
                  </div>
                  <input type='text' className='border-b-2 border-blue-500 w-full  focus:outline-none' name='uncomfortable_pain' placeholder='Unconfortable Pain' value={formData.uncomfortable_pain} onChange={handleChangeEvaluations} />
                </div>
                <div className='flex items-center my-5'>
                  All customer are requested to conduct a brief health assesment before the treatment. Your information will be used to provide you with more customized services, and, we guarantee you the security and confidentiality of the information <br />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className=' mx-5 mb-5'>
          <div className='bg-prime-color-two h-2 my-5'></div>
          <div className='flex my-5 gap-10'>
            <p>Therapy : {consentData[0]?.device_used}</p>
            <div className='flex'>
              <p>Duration 时长 : </p> <input type='number' name='duration' id='' placeholder='Minute' className='mx-2 focus:outline-none border-b-2 border-blue-500' onChange={handleChangeEvaluations} value={formData.duration} />
            </div>
            <p>Therapist : {consentData[0]?.therapistname}</p>
          </div>
          <textarea placeholder='Session' className='w-full h-56 bg-gray-100 rounded-3xl px-4 py-2 focus:outline-none resize-none' name='note_session' value={formData.note_session} onChange={handleChangeEvaluations} />
          <div className='flex my-5 gap-10 justify-between'>
            <div className='flex gap-10'>
              <p>Created At : {data?.entereddate ? new Date(data.entereddate).toLocaleString() : "-"}</p>
              <p>Last Updated : {data?.editeddate ? new Date(data.editeddate).toLocaleString() : "-"}</p>
            </div>
            <Button className='bg-prime-color' onClick={() => handleSave(customerData[0]?.customerid, data?.evaluation_id)}>
              Save
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
