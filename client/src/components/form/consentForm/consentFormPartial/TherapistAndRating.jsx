export default function TherapistAndRating({ formData, handleChange, therapistsList }) {
  return (
    <div className='grid grid-cols-2 gap-4'>
      <div>
        <label className='block text-sm font-medium'>Therapist</label>
        <select name='therapist' id='therapist' value={formData.therapist} onChange={handleChange} className='mt-1 block w-full border rounded px-2 py-1'>
          <option value=''>-- Choose Therapist --</option>
          {therapistsList?.map((therapist) => (
            <option key={therapist.therapistsid} value={therapist.therapistsid}>
              {therapist.therapistname}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className='block text-sm font-medium'>Kindly rate our therapist (1 poorest to 5 best)</label>
        <div className='flex space-x-2 mt-1'>
          {[1, 2, 3, 4, 5].map((rating) => (
            <label key={rating} className='inline-flex items-center'>
              <input type='radio' name='rating' value={rating} checked={formData.rating === rating.toString()} onChange={handleChange} className='mr-1' />
              {rating}
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
