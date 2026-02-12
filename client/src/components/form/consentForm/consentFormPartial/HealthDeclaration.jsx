export default function HealthDeclaration({ formData, handleChange, healthConditions, setFormData }) {
  return (
    <>
      {" "}
      <p className='text-sm mb-2'>Kindly declare if you have any health condition as below (any type of implants):</p>
      <div className='grid grid-cols-2 md:grid-cols-3 gap-2 mb-4'>
        {healthConditions.map((cond) => (
          <label key={cond.key} className='block'>
            <input type='checkbox' value='1' checked={formData[cond.key]} onChange={(e) => setFormData({ ...formData, [cond.key]: e.target.checked ? 1 : 0 })} className='mr-2' />
            {cond.name}
          </label>
        ))}
      </div>
      {formData.others == 1 && (
        <div className='mb-4'>
          <input type='text' name='otherCondition' value={formData.otherCondition} onChange={handleChange} placeholder='Please specify other condition' className='border rounded px-2 py-1 w-full md:w-1/2' />
        </div>
      )}
    </>
  );
}
