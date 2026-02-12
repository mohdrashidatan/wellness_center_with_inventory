export default function Referrer({ handleChange, formData }) {
  return (
    <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mb-4'>
      <div>
        <label className='block text-sm font-medium'>Referred by / 介绍人</label>
        <input type='text' name='referred_by' className='mt-1 w-full border rounded px-2 py-1' onChange={handleChange} value={formData.referred_by} />
      </div>
      <div>
        <label className='block text-sm font-medium'>Other / 其他</label>
        <input type='text' className='mt-1 w-full border rounded px-2 py-1' name='referred_other' onChange={handleChange} value={formData.referred_other} />
      </div>
    </div>
  );
}
