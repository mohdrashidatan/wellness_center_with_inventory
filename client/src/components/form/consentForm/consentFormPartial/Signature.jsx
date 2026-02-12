export default function Signature({ sig, formData, handleChange, Button }) {
  const { clearSignature, saveSignature, sigCanvas, SignatureCanvas } = sig;
  return (
    <div className='grid grid-cols-2 gap-4 mb-4'>
      <div>
        <label className='block text-sm font-medium'>Signature of consent</label>
        <div className='mb-4'>
          <div>
            <SignatureCanvas ref={sigCanvas} penColor='black' canvasProps={{ className: "w-full h-40 bg-blue-100 rounded" }} />
            <div className='space-x-2 my-2'>
              <Button onClick={clearSignature} variant='destructive'>
                Clear
              </Button>
              <Button onClick={saveSignature}>Save</Button>
            </div>
          </div>
        </div>{" "}
      </div>
      <div>
        <label className='block text-sm font-medium'>Date</label>
        <input type='date' name='signatureDate' value={formData.signatureDate} onChange={handleChange} className='mt-1 block w-full border rounded px-2 py-1' />
      </div>
    </div>
  );
}
