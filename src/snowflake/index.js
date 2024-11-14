const config = require("../config");
// Load the Snowflake Node.js driver.
const snowflake = require("snowflake-sdk");

// Create a connection object.
// Create a Connection object that we can use later to connect.
const connection = snowflake.createConnection({
  account: config.snowflakeAccount,
  username: config.snowflakeUser,
  password: config.snowflakePassword,
  application: config.snowflakeDb,
  warehouse: config.snowflakeWarehouse,
  role: config.snowflakeRole,
  // Optional: Specify a database name.
  database: config.snowflakeDb,
  schema: config.snowflakeSchema,
});

// Try to connect to Snowflake, and check whether the connection was successful.
connection.connect(function (err, conn) {
  if (err) {
    console.error("Unable to connect: " + err.message);
  } else {
    console.log("Successfully connected to Snowflake.");
    // Optional: store the connection ID.
    connection_ID = conn.getId();
    // run_query();
  }
});
async function run_query() {
  try {
    const query = `SELECT * FROM dev.public.dim_building_details `;

    // Execute the query and get the result
    const result = await connection.execute({
      sqlText: query,
      complete: function (err, stmt, rows) {
        if (err) {
          console.error(
            "Failed to execute statement due to the following error: " +
              err.message
          );
        } else {
          console.log(rows);
        }
      },
    });
  } catch (error) {
    // Log any error that occurs during query execution
    console.error("Error running query:", error);
  }
}

// Export the connection object.
module.exports = connection;
