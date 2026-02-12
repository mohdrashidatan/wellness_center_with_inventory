export function paginate(list, currentPage, itemsPerPage = 10) {
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = list.slice(indexOfFirstItem, indexOfLastItem);

  const totalPages = Math.ceil(list.length / itemsPerPage);

  return {
    currentItems,
    totalPages,
  };
}
