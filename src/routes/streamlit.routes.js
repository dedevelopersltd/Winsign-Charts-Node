// index.js
const express = require("express");
const app = express.Router();
const fs = require("fs");
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

async function init_data(account_id) {
  try {
    // Execute queries using async/await with the executeQuery helper function

    const buildings_df = await executeQuery(
      `SELECT * FROM dev.public.dim_building_details WHERE account_id = '${account_id}'`
    );

    // const leases_rent_df = await executeQuery(
    //   `SELECT * FROM dev.public.dim_lease_resource WHERE account_id = '${account_id}'`
    // );

    const attendance_df = await executeQuery(
      `SELECT * FROM dev.public.f_attendance WHERE account_id = '${account_id}'`
    );

    const spaces_df = await executeQuery(
      `SELECT * FROM dev.public.spaces WHERE account_id = '${account_id}'`
    );

    const spaces_utilization_df = await executeQuery(
      `SELECT * FROM dev.public.f_space_utilization WHERE account_id = '${account_id}'`
    );

    const monthly_obligations_df = await executeQuery(
      `SELECT MONTH, MONTHLY_RENT, OPEX FROM dev.public.F_LEASE_OBLIGATION_MONTHLY WHERE account_id = '${account_id}'`
    );

    // Return the result sets in an object
    return {
      buildings_df,
      // leases_rent_df,
      attendance_df,
      spaces_df,
      spaces_utilization_df,
      monthly_obligations_df,
    };
  } catch (error) {
    console.error("Error fetching data from Snowflake:", error);
    throw error;
  }
}

// Helper functions
function _int(i, f) {
  if (isNaN(i)) {
    return "nan";
  }
  return f.format(int(i));
}

// Initialize data from Snowflake

// Get data from a DataFrame
function get(df, column) {
  return df.map((row) => row[column]);
}

// Get data as a string
function getStr(df, column) {
  return get(df, column).join("");
}

// Prepare accounts data
async function prep_accounts(username) {
  try {
    await connection.connect();
    const accounts = await connection.execute({
      sqlText: `
        select
            a.*
        from dev.public.users u
        left join dev.public.account_users au
            on au.user_id = u.user_id
        left join dev.public.accounts a
            on au.account_id = a.account_id
        where u.email = '${username}'
      `,
    });

    const accountMap = {};
    for (const row of accounts.rows) {
      accountMap[row.account_id] = {
        account_name: row.account_name,
        account_logo_url: row.account_logo_url,
      };
    }

    return accountMap;
  } catch (error) {
    console.error("Error fetching accounts data:", error);
    throw error;
  }
}

// Main function to handle application logic
async function main(req, res) {
  try {
    const account_id = 1;
    const response = await init_data(account_id);
    // const {
    //   buildings_df,
    //   leases_rent_df,
    //   attendance_df,
    //   spaces_df,
    //   spaces_utilization_df,
    //   regions,
    //   names,
    //   monthly_obligations_df,
    // } = await init_data(account_id);

    // Handle navigation tabs

    res.send(response);
  } catch (error) {
    console.log(error);
    res.send({
      message: "Error getting data",
      error,
    });
  }
}

// Logout handler
app.get("/logout", (req, res) => {
  // TODO: Implement logout logic, e.g., clear session, redirect
  res.send("Logout successful!");
});

// Handle requests
app.get("/", main);

module.exports = app;
