export default function Pagination({ totalPages, HandlepagesChange, currentPage }) {
  return (
    <div className='flex gap-2 mt-4'>
      {[...Array(totalPages)].map((_, i) => (
        <button key={i} onClick={() => HandlepagesChange(i + 1)} className={`w-10 h-10 flex items-center justify-center border rounded ${currentPage === i + 1 ? "bg-gray-500 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`}>
          {i + 1}
        </button>
      ))}
    </div>
  );
}
