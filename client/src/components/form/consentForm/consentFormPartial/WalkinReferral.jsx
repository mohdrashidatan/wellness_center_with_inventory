export default function WalkinReferral({ formData, handleChange }) {
  return (
    <div className='mb-4'>
      <label className='inline-flex items-center mr-4'>
        <input type='radio' name='walkin' value='1' checked={formData.walkin == "1"} onChange={handleChange} className='mr-2' />
        Walk-in
      </label>
      <label className='inline-flex items-center'>
        <input type='radio' name='walkin' value='0' checked={formData.walkin === "0"} onChange={handleChange} className='mr-2' />
        Referral / Sponsor Up-line / Associate
        {formData.walkin === "0" && (
          <div className='mt-2 grid grid-cols-2 gap-4'>
            <select name='nonWalkin' value={formData.nonWalkin} onChange={handleChange} className='border rounded px-2 py-1'>
              <option value=''>Chose</option>
              <option value='Walk-in'>Walk-in</option>
              <option value='Referral'>Referral</option>
              <option value='Sponsor'>Sponsor</option>
              <option value='Associate'>Associate</option>
            </select>
            <input type='text' name='nonWalkinName' value={formData.nonWalkinName} onChange={handleChange} placeholder='Name' className='border rounded px-2 py-1' />
            <input type='text' name='nonWalkinContact' value={formData.nonWalkinContact} onChange={handleChange} placeholder='Mobile No.' className='border rounded px-2 py-1' />
          </div>
        )}
      </label>
    </div>
  );
}
