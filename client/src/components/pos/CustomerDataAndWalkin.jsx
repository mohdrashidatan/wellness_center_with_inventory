import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function CustomerDataAndWalkin({ showWalkinInput, setShowWalkinInput, handleChange, formWalkinData, customerData, id }) {
  return (
    <div className='w-full'>
      {id ? (
        <Card className='lg:flex p-2 bg-white mb-2 col-span-2 flex-col'>
          <div className='flex items-center'>
            <p className='font-semibold pr-2'>Customer Name :</p>
            <p>{customerData?.name || "Walk-in Customer"}</p>
          </div>

          {/* Tombol toggle */}
          <button className='text-xs text-blue-600 underline mt-1 w-fit' onClick={() => setShowWalkinInput(!showWalkinInput)}>
            {showWalkinInput ? "Hide Walkin Input" : "Show Walkin Input"}
          </button>

          {/* Collapse keterangan */}
          {showWalkinInput && (
            <div className='mt-2 text-sm text-gray-600 grid grid-cols-3 gap-1'>
              {" "}
              <div>
                <Input type='name' placeholder='Walkin name' name='walkinName' value={formWalkinData.walkinName} onChange={handleChange} />
              </div>
              <div className='h-full'>
                <Input type='Contact' placeholder='Walkin contact' name='walkinContact' value={formWalkinData.walkinContact} onChange={handleChange} />
              </div>
              <div className='h-full'>
                <Input type='email' placeholder='Walkin email' name='walkinEmail' value={formWalkinData.walkinEmail} onChange={handleChange} />
              </div>
            </div>
          )}
        </Card>
      ) : (
        <Card className='g:flex p-2 bg-white mb-2 col-span-2 flex-col'>
          <button className='text-xs text-blue-600 underline mt-1 w-fit' onClick={() => setShowWalkinInput(!showWalkinInput)}>
            {showWalkinInput ? "Hide Walkin Input" : "Show Walkin Input"}
          </button>

          {/* Collapse keterangan */}
          {showWalkinInput && (
            <div className='mt-2 text-sm text-gray-600 grid grid-cols-3 gap-1'>
              {" "}
              <div>
                <Input type='name' placeholder='Walkin name' name='walkinName' value={formWalkinData.walkinName} onChange={handleChange} />
              </div>
              <div className='h-full'>
                <Input type='Contact' placeholder='Walkin contact' name='walkinContact' value={formWalkinData.walkinContact} onChange={handleChange} />
              </div>
              <div className='h-full'>
                <Input type='email' placeholder='Walkin email' name='walkinEmail' value={formWalkinData.walkinEmail} onChange={handleChange} />
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
