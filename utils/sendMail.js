const nodemailer = require("nodemailer");
require("dotenv").config();

const sendMail = async ( to , subject , html ) => {
    try {
        const transporter = nodemailer.createTransport({
            service : "gmail",
            auth : {
                user : process.env.PASSGO_MAIL,
                pass : process.env.PASSGO_MAIL_PASSWORD
            },
        });

        const mailOptions = {
            from : `"Pass-Go" <${process.env.PASSGO_MAIL}>`,
            to,
            subject,
            html
        };
        const info = await transporter.sendMail(mailOptions);
        console.log("Email sent :",info.response);
        return {success : true};
    } catch ( error ) {
        console.error("Email sending error : " , error.message);
        return { success : false , error : error.message};
    }
};

module.exports = sendMail;