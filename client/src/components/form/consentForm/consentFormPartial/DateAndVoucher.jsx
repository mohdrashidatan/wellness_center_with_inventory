export default function DateAndVoucher({ formData, handleChange }) {
  return (
    <div className='grid grid-cols-2 gap-4 mb-4'>
      <div>
        <label className='block text-sm font-medium'>Date</label>
        <input type='date' name='date' value={formData.date} onChange={handleChange} className='mt-1 block w-full border rounded px-2 py-1' />
      </div>
      <div>
        <label className='block text-sm font-medium'>Voucher No.</label>
        <input type='text' name='voucherNo' value={formData.voucherNo} onChange={handleChange} className='mt-1 block w-full border rounded px-2 py-1' />
      </div>
    </div>
  );
}
