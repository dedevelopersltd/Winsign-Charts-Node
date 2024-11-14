const nodemailer = require('nodemailer');
const {mailHost,mailPassword,mailUser} = require('../config');
// Create a transporter object using the default SMTP transport
let transporter = nodemailer.createTransport({
    service: mailHost,
    secure: true, // true for 465, false for other ports
    auth: {
        user:mailUser,
        pass: mailPassword
    }
});


const sendMail = (to,subject,text) => {
    // Setup email data
    let mailOptions = {
        from: mailUser,
        to: to,
        subject: subject,
        text: text
    };
    // Send mail with defined transport object
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return console.log(error);
        }
        console.log('Message sent: %s', info.messageId);
    });
    
}
module.exports = {
    sendMail
};
