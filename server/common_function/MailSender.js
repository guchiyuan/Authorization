const nodemailer = require('nodemailer');
const config = require('../config/config');
const AppCommonError = require('../error/CommonError');

var transporter = nodemailer.createTransport({
    host: config.mailHost,
    port: config.mailPort,
    // secure:false,
    auth: {
        user: config.mailUser,
        pass: config.mailPwd,
    },
    tls: { rejectUnauthorized: false },
});

var mailOptions = {
    from: config.mailSender,
    to: '',
    subject: '',
    text: ''
};

module.exports = {
    SendMail: async function (to, title, datauri) {
        try {
            mailOptions.to = to;
            mailOptions.subject = '授权文件';
            mailOptions.text = title;
            mailOptions.attachments = [{ path: datauri }];

            //// modified by xq 需要返回状态
            let result = await transporter.sendMail(mailOptions);
            //console.log(result);
        }
        catch (error) {                     
            console.log(error);
            throw new AppCommonError('发送邮件失败：' + error.message, '0002');
        }
    }
}