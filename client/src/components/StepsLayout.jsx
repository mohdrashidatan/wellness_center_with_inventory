import { Outlet } from "react-router-dom";
import { useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { consentService } from "@/services/consentService";
import Modal from "@/Shared/Modal";
import { useState } from "react";

const StepsLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [selectedDelete, setSelectedDelete] = useState();
  const [OpenModal, setOpenModal] = useState(false);
  if (loading) {
    return <div>Loading...</div>;
  }

  const stepMap = {
    "/steps/personal-data": 1,
    "/steps/consent": 2,
    "/steps/evaluation": 3,
    "/steps/review": 4,
    "/steps/feedback": 5,
  };

  const currentStep = stepMap[location.pathname] || 1;
  const totalSteps = 3;
  const percentage = (currentStep / totalSteps) * 100;

  const handleView = (path) => {
    navigate(path);
  };

  const handleDelete = (del) => {
    setOpenModal(true); // harus dari useState
    setSelectedDelete(del); // juga harus dari useState
  };

  const confirmDelete = async (del) => {
    try {
      const response = await consentService.deleteById(user.customerId);
      navigate("/steps/evaluation");
    } catch (err) {
      console.log("error deleting", err);
    } finally {
    }
  };

  console.log(user.customerId);
  return (
    <div className='min-h-screen w-auto bg-gray-50'>
      <Navbar />
      {OpenModal && (
        <Modal title={"Confirm"} setIsOpen={setOpenModal}>
          {" "}
          <p className='mb-6 text-gray-700'>Confirm Delete?</p>
          <button onClick={confirmDelete} className='px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700 disabled:opacity-50'>
            Delete
          </button>
        </Modal>
      )}
      <main className='max-w-auto m-20 space-y-10'>
        <section className='bg-white p-6 shadow-md rounded-xl'>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            {/* Register */}
            <div className={`bg-gray-50 p-4 rounded-lg border-2 grid grid-cols-3 items-center ${currentStep == 1 && `border-black`}`}>
              <div className='flex col-span-2 flex-col'>
                <h3 className='font-semibold text-gray-700'>Customer Data</h3>
                <p className='text-gray-600'>Status : Save</p>
              </div>

              <div className='flex gap-2 items-center'>
                <Button variant='ghost' onClick={() => handleView("/steps/personal-data")}>
                  View
                </Button>
                <Button variant='ghost'>Delete</Button>
              </div>
            </div>

            {/* Consent */}
            <div className={`bg-gray-50 p-4 rounded-lg border-2 grid grid-cols-3 items-center ${currentStep == 2 && `border-black`}`}>
              <div className='flex col-span-2 flex-col'>
                <h3 className='font-semibold text-gray-700'>Consent</h3>
                <p className='text-gray-600'>Status : Empty</p>
              </div>

              <div className='flex gap-2 items-center'>
                <Button variant='ghost' onClick={() => handleView("/steps/consent")}>
                  View
                </Button>
                <Button variant='ghost' onClick={() => handleDelete("consent")}>
                  Delete
                </Button>
              </div>
            </div>

            {/* Evaluation */}
            <div className={`bg-gray-50 p-4 rounded-lg border-2 grid grid-cols-3 items-center ${currentStep == 3 && `border-black`}`}>
              <div className='flex col-span-2 flex-col'>
                <h3 className='font-semibold text-gray-700'>Evaluation</h3>
                <p className='text-gray-600'>Status : Save</p>
              </div>

              <div className='flex gap-2 items-center'>
                <Button variant='ghost' onClick={() => handleView("/steps/evaluation")}>
                  View
                </Button>
                <Button variant='ghost'>Delete</Button>
              </div>
            </div>
          </div>
        </section>
        <section className='my-10'>
          <div className='flex justify-between mb-1'>
            <span className='text-sm font-medium text-gray-700'>Step {currentStep} of 3</span>
          </div>
          <div className='w-full bg-gray-200 rounded-full h-1.5'>
            <div className='bg-black h-1.5 rounded-full transition-all duration-1000 ease-in-out' style={{ width: `${percentage}%` }}></div>
          </div>
        </section>
        <section className='bg-white p-6 shadow-md rounded-xl'>
          <Outlet />
        </section>
      </main>
    </div>
  );
};

export default StepsLayout;
