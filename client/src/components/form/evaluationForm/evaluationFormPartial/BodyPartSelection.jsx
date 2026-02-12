import { set } from "date-fns";
import { useEffect, useState, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Dot, Eraser, X } from "lucide-react";
import BodyPartCanvas from "./BodyPartCanvas";

export default function BodyPartSelection({ setCoordsBack, setCoordsFront, coordsFront, coordsBack, data }) {
  const [frontModal, setFrontModal] = useState([]);
  const [backModal, setBackModal] = useState([]);

  const canvasRefFront = useRef(null);
  const canvasRefBack = useRef(null);

  useEffect(() => {
    setFrontModal([]);
    setBackModal([]);

    const frontData = [];
    const backData = [];

    data?.anotate.forEach((item) => {
      const newCoords = { x: item.x_percent, y: item.y_percent, ket: item.bodyimagenotes };
      if (item.bodyimageid == 1) {
        frontData.push(newCoords);
      } else if (item.bodyimageid == 0) {
        backData.push(newCoords);
      }
    });

    setCoordsFront(frontData);
    setCoordsBack(backData);
  }, []);

  return (
    <div className='flex justify-center gap-2 border border-bg-prime-color'>
      <BodyPartCanvas coords={coordsFront} setCoords={setCoordsFront} modal={frontModal} setModal={setFrontModal} canvasRef={canvasRefFront} pic={"front2"} />
      <BodyPartCanvas coords={coordsBack} setCoords={setCoordsBack} modal={backModal} setModal={setBackModal} canvasRef={canvasRefBack} pic={"back2"} />
    </div>
  );
}
