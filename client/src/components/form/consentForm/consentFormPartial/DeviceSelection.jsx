export default function DeviceSelection({ formData, handleChange, interestsList }) {
  return (
    <div className='mb-4'>
      <p className='font-medium mb-1'>Kindly tick (✔) which device</p>
      <div className='grid grid-cols-2 md:grid-cols-5 gap-2'>
        {/* {interestsList?.map((item) => (
          <label key={item.id} className='inline-flex items-center'>
            <input type='checkbox' className='mr-2' name='selectedDevices' value={item.name} checked={formData.selectedDevices == item.name} onChange={handleChange} />
            {item.name}
          </label>
        ))} */}

        <label className='inline-flex items-center'>
          <input type='checkbox' className='mr-2' name='selectedDevices' value={"iTera-Classic"} checked={formData.selectedDevices == "iTera-Classic"} onChange={handleChange} />
          iTera-Classic
        </label>
        <label className='inline-flex items-center'>
          <input type='checkbox' className='mr-2' name='selectedDevices' value={"iTera-Premium"} checked={formData.selectedDevices == "iTera-Premium"} onChange={handleChange} />
          iTera-Premium
        </label>
        <label className='inline-flex items-center'>
          <input type='checkbox' className='mr-2' name='selectedDevices' value={"iTera-Pro"} checked={formData.selectedDevices == "iTera-Pro"} onChange={handleChange} />
          iTera-Pro
        </label>
        <label className='inline-flex items-center'>
          <input type='checkbox' className='mr-2' name='selectedDevices' value={"iTera-Bio"} checked={formData.selectedDevices == "iTera-Bio"} onChange={handleChange} />
          iTera-Bio
        </label>
        <label className='inline-flex items-center'>
          <input type='checkbox' className='mr-2' name='selectedDevices' value={"Others"} checked={formData.selectedDevices == "Others"} onChange={handleChange} />
          Others
        </label>
      </div>

      {formData.selectedDevices.includes("Others") && (
        <div className='mt-2'>
          <input type='text' name='otherDevice' value={formData.otherDevice} onChange={handleChange} placeholder='Please specify other device' className='border rounded px-2 py-1 w-full md:w-1/2' />
        </div>
      )}
    </div>
  );
}
