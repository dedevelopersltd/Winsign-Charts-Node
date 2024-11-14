const query = require("../services/snowflake.service");
const moment = require("moment");
const { getDatesInRange } = require("../plugins/date-ranges");

const get_attendances = async (req, res) => {
  try {
    const account_id = req.query.account_id;
    const start_date = moment(req.query.start_date).format("YYYY-MM-DD");
    const end_date = moment(req.query.end_date).format("YYYY-MM-DD");
    const office_location = req.query.office_location;
    const departments = req.query.departments;
    const regions = req.query.regions;
    // const dateSeries = getDatesInRange(start_date, end_date);
    var dateSeries = []
    // Base SQL query
    let sql = `SELECT EMPLOYEE_ID, EMPLOYEE_DEPARTMENT, EVENT_DATE, BUILDING_NAME, REGION, ACCOUNT_ID 
               FROM dev.public.f_attendance 
               WHERE ACCOUNT_ID = '${account_id}'`;

    if (start_date && end_date) {
      sql += ` AND EVENT_DATE BETWEEN '${start_date}' AND '${end_date}'`;
    }

    

    if (office_location && office_location !== "ALL") {
      // if (Array.isArray(office_location)) {
      //   const officeLocationList = office_location
      //     .map((loc) => `'${loc}'`)
      //     .join(", ");
      //   sql += ` AND BUILDING_NAME IN (${officeLocationList})`;
      // } else {
        let officeLocationArray = office_location.split(',');
        // if (Array.isArray(office_location)) {
        if (officeLocationArray.length > 1) {
          console.log("I am inside here");
          var officeLocationList = officeLocationArray
          .map((loc) => `'${loc}'`)  // Wrap each location in single quotes
          .join(", ");
        } else {
          console.log("Inside single quote");
          var officeLocationList = `'${office_location}'`
        }
        // console.log(officeLocationList, "officeLocationList")
        sql += ` AND BUILDING_NAME IN (${officeLocationList})`;
      // }
    }

    if (departments && departments !== "ALL") {
      let DepartmentLocationArray = departments.split(',');
      if (DepartmentLocationArray.length > 1) {
        var depLocationList = DepartmentLocationArray
        .map((loc) => `'${loc}'`)  // Wrap each location in single quotes
        .join(", ");
      } else {
        var depLocationList = `'${departments}'`;
      }
      sql += ` AND EMPLOYEE_DEPARTMENT IN (${depLocationList})`;
    }

    if (regions && regions !== "ALL") {
      const regionList = Array.isArray(regions)
        ? regions.map((region) => `'${region}'`).join(", ")
        : `'${regions}'`;
      sql += ` AND REGION IN (${regionList})`;
    }

    console.log(sql, "ATTENDANCESQL")

    // Fetch the filtered data
    const data = await query(sql);


    const uniqueDates_array = [...new Set(data.map(item => item.EVENT_DATE))];
    const dateTracker = {};
    uniqueDates_array.forEach(date => {
        if (!dateTracker[date]) {
          dateSeries.push(date);
            dateTracker[date] = true;
        }
    });
   
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

    // console.log(minDeptAttendance, "minDeptAttendance")
    // console.log(maxDeptAttendance, "maxDeptAttendance")

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

    // dateSeries = [...new Set(data.map(entry => entry.EVENT_DATE))];
    

    // console.log(dateSeries, "Date Series")

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


module.exports = {
  get_attendances
};
