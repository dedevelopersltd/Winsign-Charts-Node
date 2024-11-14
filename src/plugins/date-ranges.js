function getDatesInRange(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const dateArray = [];

  while (start <= end) {
    // Format date as yyyy-mm-dd
    const formattedDate = start.toISOString().split("T")[0];
    dateArray.push(formattedDate);

    // Move to the next day
    start.setDate(start.getDate() + 1);
  }

  return dateArray;
}

module.exports = {
  getDatesInRange,
};
