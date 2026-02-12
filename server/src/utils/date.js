function convertToSqlDate(dateInput) {
  const dateObj = new Date(dateInput); // pastikan jadi Date object
  return dateObj.toISOString().slice(0, 19).replace("T", " ");
}
