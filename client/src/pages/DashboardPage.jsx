import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import React from "react";

const DashboardPage = () => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate("/steps/personal-data");
  };

  return (
    <div className=' bg-gray-100 p-6'>
      {/* Grid Section */}
      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        {/* Left Section */}
        <div className='space-y-4 col-span-1'>
          {/* Last Visit Card */}
          <div className='bg-gray-300 rounded-xl p-4'>
            <p className='text-sm mb-1'>Your Last Visit</p>
            <p className='text-md font-semibold'>24-JULY-2025</p>
            <p className='text-sm mt-2'>
              How is is
              <br />
              GIVE US Feed Back
            </p>
            <button className='mt-4 bg-white px-4 py-1 rounded-full text-sm font-medium'>Feedback</button>
          </div>

          {/* Therapy History Card */}
          <div className='bg-gray-300 rounded-xl p-4'>
            <p className='font-semibold mb-2'>Your Therapy History</p>
            <ul className='space-y-1 text-sm bg-white p-2 rounded'>
              <li className='border-b'>Session 1</li>
              <li className='border-b'>Session 2</li>
              <li className=''>Session 3</li>
            </ul>
            <p className='text-right text-xs mt-2 text-gray-600'>See More &gt;</p>
          </div>
        </div>

        {/* Right Section */}
        <div className='col-span-1'>
          <div className='bg-gray-300 rounded-xl p-8 h-full flex flex-col justify-between items-center'>
            <div className='text-center'>
              <h2 className='text-2xl font-bold'>WELCOME</h2>
              <p className='text-lg'>Steve Jobs</p>
            </div>
            <button className='mt-6 bg-white px-6 py-2 rounded-full font-semibold' onClick={handleClick}>
              Registration
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
