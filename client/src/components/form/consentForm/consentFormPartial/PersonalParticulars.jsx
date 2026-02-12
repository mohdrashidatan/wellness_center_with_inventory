import { calculateAge } from "../../../../utils/calculateAges";
export default function PersonalParticulars({ formData, formPersonalData, handleChange, personalData, handleChangePersonal }) {
  const age = calculateAge(formPersonalData.dateOfBirth);
  return (
    <>
      {" "}
      <div>
        <label className='block text-sm font-medium'>Gender</label>
        <label className='mr-4'>
          <input type='radio' name='gender' value='Male' checked={formData.gender === "Male"} onChange={handleChange} className='mr-1 mb-2' />
          Male
        </label>
        <label>
          <input type='radio' name='gender' value='Female' checked={formData.gender === "Female"} onChange={handleChange} className='mr-1 mb-2' />
          Female
        </label>
      </div>
      <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mb-4'>
        <input type='text' name='name' value={formPersonalData.name} onChange={handleChangePersonal} placeholder='Name as per ID' className='border rounded px-2 py-1' />
        <div className='w-full grid grid-cols-2'>
          <p className='border rounded px-2 py-1 '>{age} Years Old</p>
          <input type='date' name='dateOfBirth' value={formPersonalData.dateOfBirth} onChange={handleChangePersonal} className='border rounded px-2 py-1' />
        </div>
        <input type='text' name='contact_no' value={formPersonalData.contact_no} onChange={handleChangePersonal} placeholder='Mobile No.' className='border rounded px-2 py-1' />
        <input type='email' name='email' value={formPersonalData.email} onChange={handleChangePersonal} placeholder='Email' className='border rounded px-2 py-1' />
      </div>
      {/* Emergency Contact */}
      <div className='mb-4'>
        <label className='font-medium'>Contact in case of emergency</label>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mt-1'>
          <input type='text' name='emergency_contact_name' value={formPersonalData.emergency_contact_name} onChange={handleChangePersonal} placeholder='Name' className='border rounded px-2 py-1' />
          <input type='text' name='emergency_contact_no' value={formPersonalData.emergency_contact_no} onChange={handleChangePersonal} placeholder='Mobile No.' className='border rounded px-2 py-1' />
        </div>
      </div>
    </>
  );
}
