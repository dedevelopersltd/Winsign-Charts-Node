const query = require("../services/snowflake.service");
const moment = require("moment");
const { getDatesInRange } = require("../plugins/date-ranges");

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

const get_buildings = async (req, res) => {
    const account_id = req.query.account_id;
    try {
      const sql = `SELECT  BUILDING_NAME, REGION FROM dev.public.BUILDINGS WHERE account_id = ${account_id}`;
      const result = await query(sql);
  
      // Map the result to the desired format
      const formattedResult = [
        { value: 'ALL', label: 'ALL' }, // Include the 'ALL' option
        ...result.map(item => ({
          value: item.BUILDING_NAME,
          label: item.BUILDING_NAME,
          region: item.REGION
        }))
      ];

      // GET REGIONS
      const sqlregion = `SELECT DISTINCT REGION FROM dev.public.BUILDINGS WHERE account_id = ${account_id}`;
      const resultregion = await query(sqlregion);


      // Map the result to the desired format
      const formattedResultRegion = [
        { value: 'ALL', label: 'ALL' }, // Include the 'ALL' option
        ...resultregion.map(item => ({
          value: item.REGION,
          label: item.REGION
        }))
      ];
       // GET LEASES
       const sqlLease = `SELECT DISTINCT LEASE_NAME FROM dev.public.DIM_LEASE_RESOURCE WHERE account_id = ${account_id}`;
       const resultLease = await query(sqlLease);
  
      // Map the result to the desired format
      const formattedResultLease = [
        { value: 'ALL', label: 'ALL' }, // Include the 'ALL' option
        ...resultLease.map(item => ({
          value: item.LEASE_NAME,
          label: item.LEASE_NAME
        }))
      ];


      // GET DEPARTMENTS
      const sqlDepartments = `SELECT DISTINCT EMPLOYEE_DEPARTMENT FROM dev.public.f_attendance WHERE ACCOUNT_ID = ${account_id}`;
      const resultDepartments = await query(sqlDepartments);
  
      // Map the result to the desired format
      const formattedResultDepartments = [
        { value: 'ALL', label: 'ALL' }, // Include the 'ALL' option
        ...resultDepartments.map(item => ({
          value: item.EMPLOYEE_DEPARTMENT,
          label: item.EMPLOYEE_DEPARTMENT,
        }))
      ];
  
      res.json({ building: formattedResult, region: formattedResultRegion, lease: formattedResultLease, department: formattedResultDepartments }); // Send the formattedResult);
    } catch (error) {
      console.error(error);
      res.status(500).send({ error: "An error occurred while fetching building data." });
    }
  };

  const get_departments = async (req, res) => {
    const account_id = req.query.account_id;
    const building = req.query.building;
    const region = req.query.region;

    try {
      
      if(building){
        if(building == "ALL" || building == ""){
          var sql_join_building = '';
        } else {
          const buildingList = building.split(',').map(b => `'${b.trim()}'`).join(',');
          var sql_join_building = ` AND BUILDING_NAME IN (${buildingList})`;
        }
        
      } else {
        var sql_join_building = '';
      }

      const sql = `SELECT DISTINCT EMPLOYEE_DEPARTMENT FROM dev.public.f_attendance WHERE ACCOUNT_ID = ${account_id} ${sql_join_building}`;
      // console.log(sql, "DEP QUERY")
      const result = await query(sql);
  
      // Map the result to the desired format
      if(sql_join_building == ''){
        var formattedResult = [
          { value: 'ALL', label: 'ALL' },
          ...result.map(item => ({
            value: item.EMPLOYEE_DEPARTMENT,
            label: item.EMPLOYEE_DEPARTMENT,
          }))
        ];
      } else {
        // console.log("I am calling other")
        var formattedResult = [
          ...result.map(item => ({
            value: item.EMPLOYEE_DEPARTMENT,
            label: item.EMPLOYEE_DEPARTMENT,
          }))
        ];
      }
  
      res.json({ department: formattedResult });
      
    } catch (error) {
      console.error(error);
      res.status(500).send({ error: "An error occurred while fetching department data." });
    }

  }
  const get_map = async (req, res) => {
    const account_id = req.query.account_id;
    const building = req.query.building;
    const region = req.query.region;
    const lease = req.query.lease;
    try {

        if(region && region !== "ALL"){
            var sql_join_region = ` AND REGION = '${region}'`;
        } else {
            var sql_join_region = ' ';
        }

        if(building && building !== "ALL"){
            var sql_join_building = ` AND NAME = '${building}'`;
            var sql_join_building_lease = ` AND BUILDING_NAME = '${building}'`;
        } else {
            var sql_join_building = ' ';
            var sql_join_building_lease =  ' ';
        }

        if(lease && lease !== "ALL"){
          var sql_join_lease = ` AND LEASE_NAME = '${lease}'`;
        } else {
            var sql_join_lease = ' ';
        }
        
        const sql = `SELECT * FROM dev.public.dim_building_details WHERE ACCOUNT_ID = ${account_id} ${sql_join_building} ${sql_join_region}`;
        // console.log(sql);
        const result = await query(sql);
        const formattedResult = [];

        // const sqllease = `SELECT * FROM dev.public.DIM_LEASE_RESOURCE WHERE ACCOUNT_ID = ${account_id} ${sql_join_building} ${sql_join_region}`;
        // const resultlease = await query(sqllease);

        // MONTHLY OBLIGATION STATS
        const sqlobli = `SELECT 
                                SUM(MONTHLY_RENT) AS TOTAL_SUM
                                FROM dev.public.F_LEASE_OBLIGATION_MONTHLY 
                                WHERE ACCOUNT_ID = ${account_id}
                                AND EXTRACT(YEAR FROM MONTH) = EXTRACT(YEAR FROM CURRENT_DATE)`;
        const resultobli = await query(sqlobli);

        const sqlLease = `SELECT * FROM dev.public.DIM_LEASE_RESOURCE WHERE ACCOUNT_ID = ${account_id} ${sql_join_building_lease} ${sql_join_region} ${sql_join_lease}`;
        // console.log(sqlLease)
        const resultLease = await query(sqlLease);
        const annual_rent = resultLease.reduce((acc, item) => acc + item.SIGNED_ANNUAL_RENT, 0);
        const total_seats = result.reduce((acc, item) => acc + item.WORKSTATION_COUNT, 0);
        const total_headcount = result.reduce((acc, item) => acc + item.TOTAL_HEADCOUNT, 0);
        const total_area = resultLease.reduce((acc, item) => acc + item.RENTABLE_AREA_CONVERTED, 0);

        const StatsData = [
            resultobli.reduce((acc, item) => acc + item.TOTAL_SUM, 0),
            annual_rent,
            result.reduce((acc, item) => acc + item.CURRENT_YEAR_OPEX, 0),
            result.length,
            resultLease.length,
            "",
            total_seats,
            total_headcount,
            total_area,
            (annual_rent / total_seats),
            (annual_rent / total_headcount),
            (annual_rent / total_area),
        ]

        console.log(StatsData, "STATS DATA")
        res.json({ maps: result, current: result[0], Stats: StatsData }); // Send the formattedResult);
    } catch (error) {
      console.error(error);
      res.status(500).send({ error: "An error occurred while fetching building data." });
    }
  };
  
  const monthly_obligation = async (req, res) => {
    const account_id = req.query.account_id;
    const building = req.query.building;
    const region = req.query.region;
    const filter = req.query.filter;
    // console.log(req.query)
    try {

        if(region && region !== "ALL"){
            var sql_join_region = ` AND REGION = '${region}'`;
        } else {
            var sql_join_region = ' ';
        }

        if(building && building !== "ALL"){
            var sql_join_building = ` AND NAME = '${building}'`;
        } else {
            var sql_join_building = ' ';
        }

        let dateFilter = '';
        switch (filter) {
            case 'Monthly':
                // dateFilter = `SELECT * FROM dev.public.F_LEASE_OBLIGATION_MONTHLY WHERE ACCOUNT_ID = ${account_id} AND DATE_TRUNC('year', MONTH) = DATE_TRUNC('year', CURRENT_DATE) ORDER BY MONTH ASC`;
                dateFilter = `SELECT * 
                              FROM dev.public.F_LEASE_OBLIGATION_MONTHLY 
                              WHERE ACCOUNT_ID = ${account_id} 
                                AND DATE_TRUNC('year', MONTH) = DATE_TRUNC('year', CURRENT_DATE)
                                AND MONTH >= DATE_TRUNC('month', CURRENT_DATE)  -- Include the current month as well
                              ORDER BY MONTH ASC`;
                break;
            case 'Quartarly':
                // dateFilter = `SELECT 
                //             TO_CHAR(MONTH, 'YYYY') || ' Q' || EXTRACT(QUARTER FROM MONTH) AS quarter_name,
                //             SUM(TOTAL) AS TOTAL_VAL
                //         FROM dev.public.F_LEASE_OBLIGATION_MONTHLY 
                //         WHERE ACCOUNT_ID = ${account_id} 
                //         AND EXTRACT(YEAR FROM MONTH) = EXTRACT(YEAR FROM CURRENT_DATE)
                //         GROUP BY TO_CHAR(MONTH, 'YYYY'), EXTRACT(QUARTER FROM MONTH)
                //         ORDER BY MIN(MONTH) ASC;
                // `;
                dateFilter = `SELECT 
                            TO_CHAR(MONTH, 'YYYY') || ' Q' || EXTRACT(QUARTER FROM MONTH) AS quarter_name,
                            SUM(TOTAL) AS TOTAL_VAL
                        FROM dev.public.F_LEASE_OBLIGATION_MONTHLY 
                        WHERE ACCOUNT_ID = ${account_id} 
                          AND EXTRACT(YEAR FROM MONTH) = EXTRACT(YEAR FROM CURRENT_DATE)
                          AND EXTRACT(QUARTER FROM MONTH) = EXTRACT(QUARTER FROM CURRENT_DATE)
                          AND EXTRACT(MONTH FROM MONTH) >= EXTRACT(MONTH FROM CURRENT_DATE)
                        GROUP BY TO_CHAR(MONTH, 'YYYY'), EXTRACT(QUARTER FROM MONTH)
                        ORDER BY MIN(MONTH) ASC;`
                break;
            case 'Annualy':
                // dateFilter = `SELECT 
                //                 SUM(TOTAL) AS TOTAL_SUM
                //                 FROM dev.public.F_LEASE_OBLIGATION_MONTHLY 
                //                 WHERE ACCOUNT_ID = ${account_id}
                //                 AND EXTRACT(YEAR FROM MONTH) = EXTRACT(YEAR FROM CURRENT_DATE)
                //             `;

                dateFilter = `SELECT 
                              SUM(TOTAL) AS TOTAL_SUM
                          FROM dev.public.F_LEASE_OBLIGATION_MONTHLY 
                          WHERE ACCOUNT_ID = ${account_id}
                            AND EXTRACT(YEAR FROM MONTH) = EXTRACT(YEAR FROM CURRENT_DATE)  -- Filter by current year
                            AND EXTRACT(MONTH FROM MONTH) >= EXTRACT(MONTH FROM CURRENT_DATE)  -- Filter to include only remaining months of the current year
                          `;
                break;
            default:
                throw new Error('Invalid filter option');
        }

        const sql = dateFilter;
        // console.log(sql);
        const data = await query(sql);
        if(filter == "Monthly"){
            var months = data.map(entry => entry.MONTH);
            var months_data = data.map(entry => entry.TOTAL);
        } else if(filter == "Quartarly"){
            var months = data.map(entry => entry.QUARTER_NAME);
            var months_data = data.map(entry => entry.TOTAL_VAL);
        } else if(filter == "Annualy"){
            var months = [new Date().getFullYear()];
            var months_data = [data[0].TOTAL_SUM];
        }


        // LEASE EXPIRATION
        const queryleasess = `
            SELECT 
                TIME_TO_EXPIRY_BUCKET,
                LEASE_EXPIRATION_DATE,
                ANNUAL_RENT AS ANNUAL, 
                RENTABLE_AREA_CONVERTED AS AREA 
            FROM dev.public.DIM_LEASE_RESOURCE
            WHERE Account_Id = ${account_id}
            ORDER BY DATE(LEASE_EXPIRATION_DATE) ASC
        `;
        const rows = await query(queryleasess);
        const bubbleData = [];
        const rentableAreaData = []; 

        rows.forEach(row => {
          const { TIME_TO_EXPIRY_BUCKET, LEASE_EXPIRATION_DATE } = row;
          
          const y = parseFloat(row.ANNUAL);
          const z = parseFloat(row.AREA);
          rentableAreaData.push(z);
          rentableAreaData.sort((a, b) => b - a);
      
          const expirationDate = new Date(LEASE_EXPIRATION_DATE).getTime();
      
          let color;
          switch (TIME_TO_EXPIRY_BUCKET) {
              case 'Expired':
                  color = '#f00abb';
                  break;
              case 'Expiring in 0-24 months':
                  color = '#f00';
                  break;
              case 'Expiring in 25-36 months':
                  color = '#ff0';
                  break;
              case 'Expiring in 37 to 60 months':
                  color = '#008000';
                  break;
              case 'Expiring in 60+ months':
                  color = '#ccc';
                  break;
              default:
                  color = '#000';
                  break;
          }
      
          // Find or create series for the bucket
          let series = bubbleData.find(series => series.name === TIME_TO_EXPIRY_BUCKET);
          if (!series) {
              series = {
                  name: TIME_TO_EXPIRY_BUCKET,
                  color: color,
                  data: []
              };
              bubbleData.push(series);
          }
      
          series.data.push({ x: expirationDate, y: y, z: z });
      });
      
      // console.log(JSON.stringify(bubbleData, null, 2));


        res.json({ months: months, totaldata: months_data, expirationstats: bubbleData, rentablearea: rentableAreaData}); // Send the formattedResult);
    } catch (error) {
      console.error(error);
      res.status(500).send({ error: "An error occurred while fetching building data." });
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
        var sql_join_spacetype = ` AND EMPLOYEE_DEPARTMENT IN (${spacetypedata})`;
      } else {
        var sql_join_spacetype = " ";
      }
  
      const sql = `SELECT DISTINCT BUILDING_NAME FROM dev.public.f_attendance WHERE account_id = ${account_id} ${sql_join_spacetype}`;
      // console.log(sql, "SQL ATTENDANCE")
      const result = await query(sql);
  
      // Map the result to the desired format
      const formattedResult = [
        { value: "ALL", label: "ALL" }, // Include the 'ALL' option
        ...result.map((item) => ({
          value: item.BUILDING_NAME,
          label: item.BUILDING_NAME,
        })),
      ];
      res.json({building: formattedResult});
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
    get_map,
    monthly_obligation,
    get_departments,
    get_buildings_based_on_space_types
};
