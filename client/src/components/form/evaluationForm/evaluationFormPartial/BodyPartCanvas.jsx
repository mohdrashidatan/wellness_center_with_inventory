import { useEffect } from "react";
import { Eraser, X } from "lucide-react";

export default function BodyPartCanvas({ coords, setCoords, modal, setModal, canvasRef, pic }) {
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    const img = new Image();
    img.src = `/body/${pic}.jpg`;

    const imgWidth = 150;
    const imgHeight = 350;

    img.onload = () => {
      const centerX = (canvas.width - imgWidth) / 2;
      const centerY = (canvas.height - imgHeight) / 2;
      ctx.drawImage(img, centerX, centerY, imgWidth, imgHeight);
    };
  }, []);

  const handleChangeKet = (index, newKet) => {
    setCoords((prev) => prev.map((coord, i) => (i === index ? { ...coord, ket: newKet } : coord)));
  };

  const handleClick = async (e) => {
    const canvas = canvasRef.current;

    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const rect = canvas.getBoundingClientRect();

    const x = Math.floor(e.clientX - rect.left);
    const y = Math.floor(e.clientY - rect.top);

    const newCoords = { x: x, y: y };
    setCoords((prev) => [...prev, newCoords]);
  };

  return (
    <div className='flex'>
      <div className='relative transform -translate-x-1/2 z-20'>
        {coords.map((coord, index) => (
          <div key={index}>
            <button
              style={{ left: `${coord.x}px`, top: `${coord.y}px` }}
              className={`bg-slate-600 h-3 w-3 border-2 border-red-700 rounded-full absolute z-10 hover:bg-purple-600`}
              onClick={() =>
                setModal((prev) => {
                  const updated = [...prev];
                  updated[index] = !updated[index];
                  return updated;
                })
              }></button>

            {modal[index] && (
              <div style={{ left: `${coord.x + 5}px`, top: `${coord.y + 5}px` }} className={`absolute  bg-gray-500/90 px-2 rounded-md text-xs z-20 text-white shadow-xl`}>
                <div className='flex justify-between items-center'>
                  <p className=''>Note</p>
                  <X
                    className='w-[15px]'
                    onClick={() =>
                      setModal((prev) => {
                        const updated = [...prev];
                        updated[index] = !updated[index];
                        return updated;
                      })
                    }
                  />
                </div>
                <input type='text' className='border-b-2 outline-none bg-purple-500/10  text-white' placeholder='Type the note' onChange={(e) => handleChangeKet(index, e.target.value)} value={coords[index].ket || ""} />

                <div className='flex justify-end'>
                  <Eraser className='w-[15px]' onClick={() => setCoords((prev) => prev.filter((_, i) => i !== index))} />
                  {/* setFrontModal((prev) => prev.map(() => false)); */}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      <canvas ref={canvasRef} width={160} height={360} className='border border-gray-400 w-[160px] h-[360px] border-none' onClick={(e) => handleClick(e)} />
    </div>
  );
}
