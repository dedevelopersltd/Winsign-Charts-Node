const query = require("../services/snowflake.service");
const moment = require("moment");
const { getDatesInRange } = require("../plugins/date-ranges");
const e = require("express");

const get_overview = async (req, res) => {
  try {
    const account_id = req.query.account_id;
    const start_date = moment(req.query.start_date).format("YYYY-MM-DD");
    const end_date = moment(req.query.end_date).format("YYYY-MM-DD");
    const office_location = req.query.office_location;
    const departments = req.query.departments;
    const regions = req.query.regions;
    const dateSeries = getDatesInRange(start_date, end_date);

    // Base SQL query
    let sql = `SELECT EMPLOYEE_ID, EMPLOYEE_DEPARTMENT, EVENT_DATE, BUILDING_NAME, REGION, ACCOUNT_ID 
               FROM dev.public.f_attendance 
               WHERE ACCOUNT_ID = '${account_id}'`;

    if (start_date && end_date) {
      sql += ` AND EVENT_DATE BETWEEN '${start_date}' AND '${end_date}'`;
    }

    if (office_location && office_location !== "ALL") {
      if (Array.isArray(office_location)) {
        const officeLocationList = office_location
          .map((loc) => `'${loc}'`)
          .join(", ");
        sql += ` AND BUILDING_NAME IN (${officeLocationList})`;
      } else {
        sql += ` AND BUILDING_NAME = '${office_location}'`;
      }
    }

    if (departments && departments !== "ALL") {
      const departmentList = Array.isArray(departments)
        ? departments.map((dept) => `'${dept}'`).join(", ")
        : `'${departments}'`;
      sql += ` AND EMPLOYEE_DEPARTMENT IN (${departmentList})`;
    }

    if (regions && regions !== "ALL") {
      const regionList = Array.isArray(regions)
        ? regions.map((region) => `'${region}'`).join(", ")
        : `'${regions}'`;
      sql += ` AND REGION IN (${regionList})`;
    }

    // Fetch the filtered data
    const data = await query(sql);

    if (data.length === 0) {
      const mockResponse = {
        totalAttendance: 0,
        maxDailyAttendance: 0,
        minDailyAttendance: 0,
        averageDailyAttendance: 0,
        maxDeptAttendance: "N/A",
        minDeptAttendance: "N/A",
        dateSeries,
        chartData: [
          { name: "N/A", data: Array(12).fill(0) },
          { name: "N/A", data: Array(12).fill(0) },
        ],
        deptChartData: [{ name: "N/A", data: Array(12).fill(0) }],
      };
      return res.json(mockResponse);
    }

    const attendanceMap = {};
    const departmentAttendance = {};
    const buildingChartData = {};
    const departmentChartData = {};

    data.forEach((row) => {
      const eventDate = row.EVENT_DATE;
      const department = row.EMPLOYEE_DEPARTMENT;
      const building = row.BUILDING_NAME;

      if (!attendanceMap[eventDate]) {
        attendanceMap[eventDate] = 0;
      }
      attendanceMap[eventDate]++;

      if (!departmentAttendance[department]) {
        departmentAttendance[department] = 0;
      }
      departmentAttendance[department]++;

      if (!buildingChartData[building]) {
        buildingChartData[building] = {};
      }
      if (!buildingChartData[building][eventDate]) {
        buildingChartData[building][eventDate] = 0;
      }
      buildingChartData[building][eventDate]++;

      if (!departmentChartData[department]) {
        departmentChartData[department] = {};
      }
      if (!departmentChartData[department][eventDate]) {
        departmentChartData[department][eventDate] = 0;
      }
      departmentChartData[department][eventDate]++;
    });

    const dailyAttendance = Object.values(attendanceMap);
    const totalAttendance = dailyAttendance.reduce(
      (acc, count) => acc + count,
      0
    );
    const maxDailyAttendance = Math.max(...dailyAttendance);
    const minDailyAttendance = Math.min(...dailyAttendance);
    const averageDailyAttendance = totalAttendance / dailyAttendance.length;

    const maxDeptAttendance = Object.keys(departmentAttendance).reduce(
      (maxDept, dept) =>
        departmentAttendance[dept] > departmentAttendance[maxDept]
          ? dept
          : maxDept
    );
    const minDeptAttendance = Object.keys(departmentAttendance).reduce(
      (minDept, dept) =>
        departmentAttendance[dept] < departmentAttendance[minDept]
          ? dept
          : minDept
    );

    const chartData = Object.keys(buildingChartData).map((building) => {
      const buildingData = buildingChartData[building];
      const dates = Object.keys(attendanceMap);
      const dataPoints = dates.map((date) => buildingData[date] || 0);

      return {
        name: building,
        data: dataPoints,
      };
    });

    const deptChartData = Object.keys(departmentChartData).map((department) => {
      const departmentData = departmentChartData[department];
      const dates = Object.keys(attendanceMap);
      const dataPoints = dates.map((date) => departmentData[date] || 0);

      return {
        name: department,
        data: dataPoints,
      };
    });

    const result = {
      totalAttendance,
      maxDailyAttendance,
      minDailyAttendance,
      averageDailyAttendance,
      maxDeptAttendance,
      minDeptAttendance,
      chartData,
      deptChartData,
      dateSeries,
    };

    res.json(result);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .send({ error: "An error occurred while fetching attendance data." });
  }
};


const get_buildings_based_on_space_types = async (req, res) => {
  const account_id = req.query.account_id;
  const spacetype = req.query.spacetype;

  try {

    if (spacetype && spacetype !== "ALL") {

      let spacetypearray = spacetype.split(',');
      if (spacetypearray.length > 1) {
        var spacetypedata = spacetypearray
        .map((loc) => `'${loc}'`)  // Wrap each location in single quotes
        .join(", ");
      } else {
        var spacetypedata = `'${spacename}'`
      }
      var sql_join_spacetype = ` AND SPACE_TYPE IN (${spacetypedata})`;
    } else {
      var sql_join_spacetype = " ";
    }

    const sql = `SELECT DISTINCT BUILDING_NAME FROM dev.public.F_SPACE_UTILIZATION WHERE account_id = ${account_id} ${sql_join_spacetype}`;
    // console.log(sql, "SQL")
    const result = await query(sql);

    // Map the result to the desired format
    const formattedResult = [
      { value: "ALL", label: "ALL" }, // Include the 'ALL' option
      ...result.map((item) => ({
        value: item.BUILDING_NAME,
        label: item.BUILDING_NAME,
      })),
    ];

    const sqlfloor = `SELECT DISTINCT FLOOR_NAME FROM dev.public.F_SPACE_UTILIZATION WHERE account_id = ${account_id} ${sql_join_spacetype}`;
    // console.log(sql, "SQL")
    const resultfloor = await query(sqlfloor);

    // Map the result to the desired format
    const formattedResultFloor = [
      { value: "ALL", label: "ALL" }, // Include the 'ALL' option
      ...resultfloor.map((item) => ({
        value: item.FLOOR_NAME,
        label: item.FLOOR_NAME,
      })),
    ];

    res.json({building: formattedResult, floorres: formattedResultFloor});
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .send({ error: "An error occurred while fetching building data." });
  }
}

const get_buildings = async (req, res) => {
  const account_id = req.query.account_id;
  try {
    const sql = "SELECT DISTINCT BUILDING_NAME FROM dev.public.BUILDINGS WHERE account_id = "+ account_id;
    const result = await query(sql);

    // Map the result to the desired format
    const formattedResult = [
      { value: "ALL", label: "ALL" }, // Include the 'ALL' option
      ...result.map((item) => ({
        value: item.BUILDING_NAME,
        label: item.BUILDING_NAME,
      })),
    ];

    // GET REGIONS
    const sqlregion = `SELECT FLOOR_ID, FLOOR_NAME, BUILDING_NAME
                            FROM dev.public.F_SPACE_UTILIZATION
                            WHERE account_id = ${account_id}
                            GROUP BY FLOOR_ID, FLOOR_NAME, BUILDING_NAME`;
    const resultregion = await query(sqlregion);

    // Map the result to the desired format
    const formattedResultRegion = [
      { value: "ALL", label: "ALL" }, // Include the 'ALL' option
      ...resultregion.map((item) => ({
        value: item.FLOOR_NAME,
        label: item.FLOOR_NAME,
        building: item.BUILDING_NAME,
      })),
    ];

    const sqlspace =
      `SELECT DISTINCT SPACE_TYPE FROM dev.public.F_SPACE_UTILIZATION  WHERE account_id = ${account_id}`;
    const resultspace = await query(sqlspace);
    const formattedResultSpace = [
      { value: "ALL", label: "ALL" }, // Include the 'ALL' option
      ...resultspace.map((item) => ({
        value: item.SPACE_TYPE,
        label: item.SPACE_TYPE,
        // building: item.BUILDING_NAME,
      })),
    ];

    const sqlspacename = `SELECT SPACE_ID, SPACE_NAME, SPACE_TYPE
        FROM dev.public.F_SPACE_UTILIZATION WHERE account_id = ${account_id}  GROUP BY SPACE_NAME, SPACE_TYPE, SPACE_ID`;
    const resultspacename = await query(sqlspacename);

    // Map the result to the desired format
    const formatSpaceName = [
      { value: "ALL", label: "ALL" }, // Include the 'ALL' option
      ...resultspacename.map((item) => ({
        value: item.SPACE_NAME,
        label: item.SPACE_NAME,
        space_type: item.SPACE_TYPE,
      })),
    ];

    res.json({
      building: formattedResult,
      floor: formattedResultRegion,
      spaces: formattedResultSpace,
      space_name: formatSpaceName,
    }); // Send the formattedResult);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .send({ error: "An error occurred while fetching building data." });
  }
};

const get_occupancy_graph = async (req, res) => {
  const account_id = req.query.account_id;
  const building = req.query.building;
  const floor = req.query.floor;
  const spacename = req.query.spacename;
  const spacetype = req.query.spacetype;
  const stardate = req.query.stardate;
  const enddate = req.query.enddate;

  try {
    if (building && building !== "ALL") {
      let officeLocationArray = building.split(',');
      if (officeLocationArray.length > 1) {
        var officeLocationList = officeLocationArray
        .map((loc) => `'${loc}'`)  // Wrap each location in single quotes
        .join(", ");
      } else {
        var officeLocationList = `'${building}'`
      }
      var sql_join_building = ` AND BUILDING_NAME IN (${officeLocationList})`;
    } else {
      var sql_join_building = " ";
    }

    if (floor && floor !== "ALL") {
      let floorlocationarray = floor.split(',');
      if (floorlocationarray.length > 1) {
        var floorlist = floorlocationarray
        .map((loc) => `'${loc}'`)  // Wrap each location in single quotes
        .join(", ");
      } else {
        var floorlist = `'${floor}'`
      }
      var sql_join_floor = ` AND FLOOR_NAME IN (${floorlist})`;
    } else {
      var sql_join_floor = " ";
    }

    if (spacename && spacename !== "ALL") {

      let spacenamearray = spacename.split(',');
      if (spacenamearray.length > 1) {
        var spacenamedata = spacenamearray
        .map((loc) => `'${loc}'`)  // Wrap each location in single quotes
        .join(", ");
      } else {
        var spacenamedata = `'${spacename}'`
      }

      var sql_join_spacename = ` AND SPACE_NAME IN (${spacenamedata})`;
    } else {
      var sql_join_spacename = " ";
    }

    if (spacetype && spacetype !== "ALL") {

      let spacetypearray = spacetype.split(',');
      if (spacetypearray.length > 1) {
        var spacetypedata = spacetypearray
        .map((loc) => `'${loc}'`)  // Wrap each location in single quotes
        .join(", ");
      } else {
        var spacetypedata = `'${spacename}'`
      }


      var sql_join_spacetype = ` AND SPACE_TYPE IN (${spacetypedata})`;
    } else {
      var sql_join_spacetype = " ";
    }

    // const sql = `SELECT * FROM dev.public.F_SPACE_UTILIZATION WHERE ACCOUNT_ID = ${account_id} ${sql_join_building} ${sql_join_floor} ${sql_join_spacename} ${sql_join_spacetype} AND START_TIME >= '${stardate}' AND START_TIME <= '${enddate}'`;

    const sql = `
            WITH filtered_data AS (
                SELECT *
                FROM dev.public.F_SPACE_UTILIZATION
                WHERE ACCOUNT_ID = ${account_id}
                ${sql_join_building} ${sql_join_floor} ${sql_join_spacename} ${sql_join_spacetype}
                AND START_TIME BETWEEN '${stardate}'
                AND '${enddate}'
            )
            SELECT 
                DATE(START_TIME) AS date,
                MAX(max_occupancy) AS max_occupancy,
                AVG(avg_occupancy) AS avg_occupancy
            FROM 
                filtered_data
            GROUP BY 
                DATE(START_TIME)
            ORDER BY 
                date; 
        `;
    console.log(sql);
    const results = await query(sql);

    const maxOccupancyArray = results.map((item) => ({
      x: item.DATE,
      y: item.MAX_OCCUPANCY?.toFixed(2),
    }));

    // Create the avg_occupancy array
    const avgOccupancyArray = results.map((item) => ({
      x: item.DATE,
      y: item.AVG_OCCUPANCY?.toFixed(2),
    }));

    // UTILIZATION

    const sqlutiliztion = `
        WITH filtered_data AS (
            SELECT *,
            (MAX_OCCUPANCY / CAPACITY) * 100 AS peak_utilization,
            (AVG_OCCUPANCY / CAPACITY) * 100 AS avg_utilization
            FROM dev.public.F_SPACE_UTILIZATION
            WHERE ACCOUNT_ID = ${account_id}
            ${sql_join_building} ${sql_join_floor} ${sql_join_spacename} ${sql_join_spacetype}
            AND START_TIME BETWEEN '${stardate}'
            AND '${enddate}'
        )
        SELECT 
            DATE(START_TIME) AS date,
            MAX(peak_utilization) AS max_occupancy,
            AVG(avg_utilization) AS avg_occupancy
        FROM 
            filtered_data
        GROUP BY 
            DATE(START_TIME)
        ORDER BY 
            date; 
    `;
    // console.log(sqlutiliztion);
    const resultsutilization = await query(sqlutiliztion);

    const maxUtilizationArray = resultsutilization.map((item) => ({
      x: item.DATE,
      y: item.MAX_OCCUPANCY?.toFixed(2),
    }));

    // Create the avg_occupancy array
    const avgUtilizationArray = resultsutilization.map((item) => ({
      x: item.DATE,
      y: item.AVG_OCCUPANCY?.toFixed(2),
    }));

    // DOW OCCUPANCY

    const sqlDow = `
            WITH filtered_data AS (
                SELECT *
                FROM dev.public.F_SPACE_UTILIZATION
                WHERE ACCOUNT_ID = ${account_id}
                ${sql_join_building} ${sql_join_floor} ${sql_join_spacename} ${sql_join_spacetype}
                AND START_TIME BETWEEN '${stardate}'
                AND '${enddate}'
            )
            SELECT 
                DOW_NAME AS DOW,
                MAX(max_occupancy) AS max_occupancy,
                AVG(avg_occupancy) AS avg_occupancy
            FROM 
                filtered_data
            GROUP BY 
                DOW_NAME
            ORDER BY 
                CASE CAST(DOW_NAME AS TEXT)
                    WHEN 'Mon' THEN 1
                    WHEN 'Tue' THEN 2
                    WHEN 'Wed' THEN 3
                    WHEN 'Thu' THEN 4
                    WHEN 'Fri' THEN 5
                    WHEN 'Sat' THEN 6
                    WHEN 'Sun' THEN 7
                END
        `;
    // console.log(sqlDow);
    const resultsdow = await query(sqlDow);

    const maxDowArray = resultsdow.map((item) => ({
      x: item.DOW,
      y: item.MAX_OCCUPANCY?.toFixed(2),
    }));

    // Create the avg_occupancy array
    const avgDowArray = resultsdow.map((item) => ({
      x: item.DOW,
      y: item.AVG_OCCUPANCY?.toFixed(2),
    }));

    // DOW OCCUPANCY

    const sqlHour = `
     WITH filtered_data AS (
            SELECT *
            FROM dev.public.F_SPACE_UTILIZATION
            WHERE ACCOUNT_ID = ${account_id}
            ${sql_join_building} ${sql_join_floor} ${sql_join_spacename} ${sql_join_spacetype}
            AND START_TIME BETWEEN '${stardate}'
            AND '${enddate}'
        )
        SELECT 
            HOD AS DOW,
            MAX(max_occupancy) AS max_occupancy,
            AVG(avg_occupancy) AS avg_occupancy
        FROM 
            filtered_data
        GROUP BY 
            HOD
        ORDER BY 
            HOD
    `;
    // console.log(sqlDow);
    const resultHour = await query(sqlHour);

    const maxHourArray = resultHour.map((item) => ({
      x: item.DOW,
      y: item.MAX_OCCUPANCY?.toFixed(2),
    }));

    // Create the avg_occupancy array
    const avgHourArray = resultHour.map((item) => ({
      x: item.DOW,
      y: item.AVG_OCCUPANCY?.toFixed(2),
    }));

    //STATS DATA
    const sql_stats = `SELECT 
            MAX(max_occupancy) AS max_occupancy,
            AVG(avg_occupancy) AS avg_occupancy,
            MAX((MAX_OCCUPANCY / CAPACITY) * 100) AS peak_utilization,
            AVG((AVG_OCCUPANCY / CAPACITY) * 100) AS avg_utilization,
            FROM dev.public.F_SPACE_UTILIZATION
            WHERE ACCOUNT_ID = ${account_id}
            ${sql_join_building} ${sql_join_floor} ${sql_join_spacename} ${sql_join_spacetype}
            AND START_TIME BETWEEN '${stardate}'
            AND '${enddate}'`;
    const result_stats = await query(sql_stats);
    
    // console.log(result_stats)
    const Stats_Data = [
      max_occ = (result_stats[0].MAX_OCCUPANCY? result_stats[0].MAX_OCCUPANCY : 0),
      avg_occ = (result_stats[0].AVG_OCCUPANCY ? result_stats[0].AVG_OCCUPANCY : 0).toFixed(2),
      max_util = Math.round(result_stats[0].PEAK_UTILIZATION)+"%",
      avg_util = Math.round(result_stats[0].AVG_UTILIZATION)+"%",
    ];

    // console.log("STATS", Stats_Data)

    // console.log(StatsData, "STATS DATA")
    res.json({
      max_occupancy: maxOccupancyArray,
      avg_occupancy: avgOccupancyArray,
      max_utilization: maxUtilizationArray,
      avg_utilization: avgUtilizationArray,
      dow_occupancy: maxDowArray,
      dow_avg_occupancy: avgDowArray,
      hour_max_occupancy: maxHourArray,
      hour_avg_occupancy: avgHourArray,
      Stats: Stats_Data
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .send({ error: "An error occurred while fetching building data." });
  }
};

const monthly_obligation = async (req, res) => {
  const account_id = req.query.account_id;
  const building = req.query.building;
  const region = req.query.region;
  const filter = req.query.filter;
  // console.log(req.query)
  try {
    if (region && region !== "ALL") {
      var sql_join_region = ` AND REGION = '${region}'`;
    } else {
      var sql_join_region = " ";
    }

    if (building && building !== "ALL") {
      var sql_join_building = ` AND NAME = '${building}'`;
    } else {
      var sql_join_building = " ";
    }

    let dateFilter = "";
    switch (filter) {
      case "Monthly":
        dateFilter = `SELECT * FROM dev.public.F_LEASE_OBLIGATION_MONTHLY WHERE ACCOUNT_ID = ${account_id} AND DATE_TRUNC('year', MONTH) = DATE_TRUNC('year', CURRENT_DATE) ORDER BY MONTH ASC`;
        break;
      case "Quartarly":
        dateFilter = `SELECT 
                            TO_CHAR(MONTH, 'YYYY') || ' Q' || EXTRACT(QUARTER FROM MONTH) AS quarter_name,
                            SUM(TOTAL) AS TOTAL_VAL
                        FROM dev.public.F_LEASE_OBLIGATION_MONTHLY 
                        WHERE ACCOUNT_ID = ${account_id} 
                        AND EXTRACT(YEAR FROM MONTH) = EXTRACT(YEAR FROM CURRENT_DATE)
                        GROUP BY TO_CHAR(MONTH, 'YYYY'), EXTRACT(QUARTER FROM MONTH)
                        ORDER BY MIN(MONTH) ASC;
                `;
        break;
      case "Annualy":
        dateFilter = `SELECT 
                                SUM(TOTAL) AS TOTAL_SUM
                                FROM dev.public.F_LEASE_OBLIGATION_MONTHLY 
                                WHERE ACCOUNT_ID = ${account_id}
                                AND EXTRACT(YEAR FROM MONTH) = EXTRACT(YEAR FROM CURRENT_DATE)
                            `;
        break;
      default:
        throw new Error("Invalid filter option");
    }

    const sql = dateFilter;
    // console.log(sql);
    const data = await query(sql);
    if (filter == "Monthly") {
      var months = data.map((entry) => entry.MONTH);
      var months_data = data.map((entry) => entry.TOTAL);
    } else if (filter == "Quartarly") {
      var months = data.map((entry) => entry.QUARTER_NAME);
      var months_data = data.map((entry) => entry.TOTAL_VAL);
    } else if (filter == "Annualy") {
      var months = [new Date().getFullYear()];
      var months_data = [data[0].TOTAL_SUM];
    }
    res.json({ months: months, totaldata: months_data }); // Send the formattedResult);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .send({ error: "An error occurred while fetching building data." });
  }
};

const get_department_headcounts = async (req, res) => {
  const account_id = req.query.account_id;
  const building = req.query.building;
  const region = req.query.region;
  const filter = req.query.filter;
  // console.log(req.query)
  try {
   
    if (building && building !== "ALL") {
      var show_query = 11;
      var sql_join_building = ` AND b.BUILDING_NAME = '${building}'`;
    } else {
      var sql_join_building = " ";
      var show_query = 0;
    }
    // SUM(b.WORKSTATION_COUNT) AS seats
    // const sql = `
    //               SELECT 
    //                   h.DEPARTMENT AS building,
    //                   SUM(h.HEADCOUNT) AS headcount,
    //               FROM 
    //                   dev.public.headcount AS h
    //               JOIN 
    //                   dev.public.buildings AS b ON h.BUILDING_ID = b.BUILDING_ID
    //               WHERE 
    //               h.ACCOUNT_ID = ${account_id}
    //               AND EXTRACT(YEAR FROM h.DATE) = EXTRACT(YEAR FROM CURRENT_DATE)
    //               GROUP BY 
    //                   h.DEPARTMENT;
    // `;

    const sql = `
              select
                    h.department AS building,
                    sum(h.headcount) as HEADCOUNT,
                    sum(COALESCE(w.workstation_count, 0)) as SEATS
                from dev.public.headcount as h
                left join dev.public.buildings as b
                    on h.account_id = b.account_id
                    and h.building_id = b.building_id
                left join (
                    select
                        account_id,
                        building_id,
                        space_group,
                        sum(capacity) as workstation_count
                    from spaces
                    where space_type = 'Conference Room'
                    group by 1,2,3
                ) as w
                    on h.account_id = w.account_id
                    and h.building_id = w.building_id
                    and h.department = w.space_group
                where h.account_id = ${account_id}
                AND EXTRACT(YEAR FROM h.DATE) = EXTRACT(YEAR FROM CURRENT_DATE)
                group by h.department
    `;
    const data = await query(sql);


    // const account_id = 1; // Replace with the actual account ID

        // const inputQuery = `
        //   SELECT 
        //     EXTRACT(YEAR FROM h.DATE) AS year,
        //     SUM(h.HEADCOUNT) AS Adjusted_Headcount,
        //     SUM(b.WORKSTATION_COUNT) AS Workstation_Count
        //   FROM 
        //     dev.public.headcount AS h
        //   JOIN 
        //     dev.public.buildings AS b ON h.BUILDING_ID = b.BUILDING_ID
        //   WHERE 
        //     h.ACCOUNT_ID = ${account_id}
        //     AND EXTRACT(YEAR FROM h.DATE) BETWEEN EXTRACT(YEAR FROM CURRENT_DATE) AND EXTRACT(YEAR FROM CURRENT_DATE) + 9
        //   GROUP BY 
        //     year
        //   ORDER BY 
        //     year;
        // `

        const inputQuery = `select
                                EXTRACT(YEAR FROM h.DATE) AS year,
                                h.building_id,
                                b.building_name,
                                w.workstation_count,
                                sum(h.headcount) as headcount,
                            from headcount as h
                            left join dev.public.buildings as b
                                on h.account_id = b.account_id
                                and h.building_id = b.building_id
                            left join (
                                select
                                    account_id,
                                    building_id,
                                    sum(capacity) as workstation_count
                                from spaces
                                where space_type = 'Conference Room'
                                group by 1,2
                            ) as w
                                on h.account_id = w.account_id
                                and h.building_id = w.building_id
                            where h.account_id = ${account_id}
                            ${sql_join_building}
                            group by 1,2,3,4`;
        const result = await query(inputQuery);

        // console.log(result,"RESULTS")
        // return
        // Run the query and ensure 'result' has a 'rows' array
        // console.log("RESULTS", result)
        // const rows = result && result.rows ? result.rows : []; // Default to an empty array if 'rows' is undefined
        // console.log(rows);
        // Generate an array of the next 10 years, starting from the current year

        // const yearsArray = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() + i);
        // const datainput = yearsArray.reduce((acc, year) => {
        //   const yearData = result.find(row => row.YEAR == year) || {}; // Use 'rows' instead of 'result.rows'
        //   acc[year] = {
        //     Adjusted_Headcount: yearData?.ADJUSTED_HEADCOUNT || 0,
        //     Adjusted_Attendance: 0, // Placeholder, can be calculated if needed
        //     Workstation_Count: yearData.workstation_count || 0,
        //     Workstations_Needed: 0, // Placeholder, add logic as required
        //     Workstation_Shortfall: 0, // Placeholder, add logic as required
        //     Adjusted_per_station: 0, // Placeholder, add logic as required
        //     SF_needed: 0, // Placeholder, add logic as required
        //   };
        //   return acc;
        // }, {});

        const yearsArray = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() + i);
        const datainput = yearsArray.reduce((acc, year) => {
          const yearRows = result.filter(row => row.YEAR === year);
          const totalHeadcount = yearRows.reduce((sum, row) => sum + (row.HEADCOUNT || 0), 0);
          const totalWorkstationCount = yearRows.reduce((sum, row) => sum + (row.WORKSTATION_COUNT || 0), 0);

          // Populate data for the specific year
          acc[year] = {
            Adjusted_Headcount: totalHeadcount,
            Adjusted_Attendance: 0, // Placeholder, can be calculated if needed
            Workstation_Count: totalWorkstationCount,
            Workstations_Needed: 0, // Placeholder, add logic as required
            Workstation_Shortfall: 0, // Placeholder, add logic as required
            Adjusted_per_station: 0, // Placeholder, add logic as required
            SF_needed: 0, // Placeholder, add logic as required
          };

          return acc;
        }, {});
    
        res.json({ table: data, YearData: datainput, years: yearsArray, show_query: show_query }); // Send the formattedResult);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .send({ error: "An error occurred while fetching building data." });
  }
};


const get_space_types_names_based_on_buildings = async (req, res) => {
  const account_id = req.query.account_id;
  const spacetype = req.query.building;

  try {

    if (spacetype && spacetype !== "ALL") {
      let spacetypearray = spacetype.split(',');
      if (spacetypearray.length > 1) {
        var spacetypedata = spacetypearray
        .map((loc) => `'${loc}'`)  // Wrap each location in single quotes
        .join(", ");
      } else {
        var spacetypedata = `'${spacename}'`
      }
      var sql_join_spacetype = ` AND BUILDING_NAME IN (${spacetypedata})`;
    } else {
      var sql_join_spacetype = " ";
    }

    const sql = `SELECT DISTINCT SPACE_TYPE FROM dev.public.F_SPACE_UTILIZATION WHERE account_id = ${account_id} ${sql_join_spacetype}`;
    // console.log(sql, "SQL")
    const result = await query(sql);

    // Map the result to the desired format
    const formattedResult = [
      { value: "ALL", label: "ALL" }, // Include the 'ALL' option
      ...result.map((item) => ({
        value: item.SPACE_TYPE,
        label: item.SPACE_TYPE,
      })),
    ];

    const new_qru = result.reduce((acc, item) => {
      if (!acc.includes(item.SPACE_TYPE)) {
        acc.push(item.SPACE_TYPE);
      }
      return acc;
    }, []);

    const formattedString = new_qru.map(type => `'${type}'`).join(', ');
    // console.log("formattedString",formattedString)
      var new_query = '';
    if(formattedString){
       new_query = ` AND SPACE_TYPE IN (${formattedString})`;
    }
    

    const sqlfloor__ = `SELECT DISTINCT SPACE_NAME FROM dev.public.F_SPACE_UTILIZATION WHERE account_id = ${account_id} ${new_query}`;
    // console.log(sqlfloor__, "SQL QYERY AAABB")
    const resultfloor = await query(sqlfloor__);

    // Map the result to the desired format
    const formattedResultFloor = [
      { value: "ALL", label: "ALL" }, // Include the 'ALL' option
      ...resultfloor.map((item) => ({
        value: item.SPACE_NAME,
        label: item.SPACE_NAME,
      })),
    ];

    res.json({building: formattedResult,floor: formattedResultFloor});
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .send({ error: "An error occurred while fetching building data." });
  }
}


module.exports = {
  get_overview,
  get_buildings,
  get_occupancy_graph,
  monthly_obligation,
  get_department_headcounts,
  get_buildings_based_on_space_types,
  get_space_types_names_based_on_buildings
};
