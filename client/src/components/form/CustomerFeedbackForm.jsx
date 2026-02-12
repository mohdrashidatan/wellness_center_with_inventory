import { Button } from "@/components/ui/button";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

function CustomerFeedbackForm() {
  const navigate = useNavigate();

  //Next and Prev handle
  const handleNext = () => {
    navigate("/steps/review");
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

  return (
    <div>
      <form className='space-y-6'>
        <h2 className='text-2xl font-bold text-blue-900'>CUSTOMER FEEDBACK</h2>
        <p className='text-gray-700'>Your feedback really helps us to improve the quality of good services.</p>

        {/* Name */}
        <div>
          <label className='block font-semibold text-gray-800'>NAME</label>
          <input type='text' className='w-full border p-2 rounded mt-1' name='name' />
        </div>

        {/* Mobile No */}
        <div>
          <label className='block font-semibold text-gray-800'>MOBILE NO.</label>
          <input type='text' className='w-full border p-2 rounded mt-1' name='mobile' />
        </div>

        {/* Rating Section */}
        {[
          {
            question: "HOW SATISFIED ARE YOU WITH OUR SERVICE?",
            cn: "您对我们的服务满意吗？",
            name: "satisfaction",
          },
          {
            question: "HOW LIKELY ARE YOU TO RECOMMEND OUR SERVICES TO OTHERS?",
            cn: "您向其他人推荐我们的服务的可能性有多大？",
            name: "recommendation",
          },
          {
            question: "HOW WOULD YOU RATE OVERALL EXPERIENCE WITH OUR PWG?",
            cn: "您对我们PWG的整体体验有何评价？",
            name: "overall",
          },
        ].map(({ question, cn, name }) => (
          <div key={name}>
            <p className='font-semibold text-gray-800'>{question}</p>
            <p className='text-sm text-gray-500 mb-2'>{cn}</p>
            <div className='flex justify-between max-w-2xl'>
              {[1, 2, 3, 4, 5].map((val) => (
                <label key={val} className='flex flex-col items-center'>
                  <input type='radio' name={name} value={val} />
                  <span className='text-xs mt-1'>{val}</span>
                </label>
              ))}
            </div>
          </div>
        ))}

        {/* What makes you satisfied */}
        <div>
          <label className='block font-semibold text-gray-800'>WHAT MAKES YOU SATISFIED WITH OUR SERVICE?</label>
          <p className='text-sm text-gray-500 mb-1'>是什么让您对我们的服务感到满意？</p>
          <textarea className='w-full border rounded p-2' rows='3' name='satisfactionReason' />
        </div>

        {/* Suggestions */}
        <div>
          <label className='block font-semibold text-gray-800'>TELL US ABOUT WHAT YOU THINK WE SHOULD IMPROVE?</label>
          <p className='text-sm text-gray-500 mb-1'>告诉我们您期望我们可以在哪方面进步？</p>
          <textarea className='w-full border rounded p-2' rows='3' name='improvementSuggestion' />
        </div>

        <p className='text-sm text-gray-500 mt-6'>
          Thank You For Your Feedback
          <br />
          感谢您的反馈意见
        </p>
      </form>
      <div className='flex justify-between my-10'>
        <Button variant='secondary' onClick={handlePrev}>
          Prev
        </Button>
        <Button onClick={handleNext}>Next</Button>
      </div>
    </div>
  );
}

export default CustomerFeedbackForm;
