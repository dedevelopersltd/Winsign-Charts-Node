const { nodemailerPlugin } = require("../plugins");
const { sendMail } = nodemailerPlugin;
const moment = require('moment');

const sendOTP = async (to, otp) => {
  const subject = "Forgot Password Requested!";
  const text = "Your OTP for password reset is: " + otp;
  await sendMail(to, subject, text);
};
const sendIssueMail = async (issue, issue_category) => {
  const subject = "Issue Reported: " + issue_category.name;
  const to = issue_category.email;
  const text = ` An issue is reported at [${issue.issueCoordinates}] \n
  reported on: ${moment(issue.createdAt).format('MMMM Do YYYY, h:mm:ss a')} \n
     with the following description: ${issue.description} \n
      Severity: ${issue.severity} \n
       Category: ${issue_category.name}`;
  await sendMail(to, subject, text);
};

module.exports = {
  sendOTP,
  sendIssueMail,
};
