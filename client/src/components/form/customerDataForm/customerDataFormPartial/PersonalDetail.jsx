export default function PersonalDetail({ handleChange, formData }) {
  return (
    <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mb-4'>
      <input type='text' placeholder='Name / 姓名' className='border rounded px-2 py-1' name='name' onChange={handleChange} value={formData.name} />
      <div>
        <label className='block text-sm font-medium'>Date / 日期</label>

        <input type='date' className='w-full border rounded px-2 py-1' onChange={handleChange} name='dateOfBirth' value={formData.dateOfBirth} />
      </div>
      <input type='text' placeholder='Address / 地址' className='border rounded px-2 py-1' name='address' onChange={handleChange} value={formData.address} />
      <input type='text' placeholder='Contact No. / 联系号码' className='border rounded px-2 py-1' name='contact_no' onChange={handleChange} value={formData.contact_no} />
      <input type='email' placeholder='Email / 电邮' className='border rounded px-2 py-1' name='email' onChange={handleChange} value={formData.email} />
      <input type='text' placeholder='Zip Code / 邮政编码' className='border rounded px-2 py-1' name='postalcode' onChange={handleChange} value={formData.postalcode} />
      <input type='text' placeholder='Country / 国家' className='border rounded px-2 py-1' name='country' onChange={handleChange} value={formData.country} />
    </div>
  );
}
