const connection = require("../snowflake");

async function executeQuery(query) {
  return new Promise((resolve, reject) => {
    connection.execute({
      sqlText: query,
      complete: function (err, stmt, rows) {
        if (err) {
          reject(err); // If there is an error, reject the promise
        } else {
          resolve(rows); // Resolve the promise with the result rows
        }
      },
    });
  });
}

module.exports = executeQuery;
