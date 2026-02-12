export default function EmergancyContact({ handleChange, formData }) {
  return (
    <div className='bg-gray-100 p-4 rounded border mb-4'>
      <div className='text-blue-900 font-semibold mb-2'>EMERGENCY CONTACT DETAILS</div>
      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        <input type='text' placeholder='Emergency Contact Person / 紧急联系人' className='border rounded px-2 py-1' name='emergency_contact_name' onChange={handleChange} value={formData.emergency_contact_name} />
        <input type='text' placeholder='Emergency Contact No. / 紧急联系人号码' className='border rounded px-2 py-1' name='emergency_contact_no' onChange={handleChange} value={formData.emergency_contact_no} />
      </div>
    </div>
  );
}
