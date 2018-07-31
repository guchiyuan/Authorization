
var MyAppError = require('../Error/CommonError');
const SMSClient = require('@alicloud/sms-sdk')
// ACCESS_KEY_ID/ACCESS_KEY_SECRET 根据实际申请的账号信息进行替换
const accessKeyId = 'LTAIcoPoD2ooW6dB'
const secretAccessKey = 'gt8K7cHt6J7GDK4wZk1D5q92NGgCcj'
//初始化sms_client
let smsClient = new SMSClient({ accessKeyId, secretAccessKey })

var authCodeArray = new Array();      // 存放验证码的容器
setInterval(ClearDirty, 1000 * 60 * 60 * 5);        // 每5个小时清理下无效的验证码信息
function ClearDirty() {
    try {
        let arrayRemove = new Array();
        authCodeArray.forEach(element => {
            if (element.endtime < Date.now)
                arrayRemove.push(element);
        });

        arrayRemove.forEach(item => {
            authCodeArray.pop(item);
        });
    }
    catch (err) {
        console.log('清理验证码信息失败：' + err.message);
    }
}

var funcGetAnthObj = (phone, code) => {
    let objAuth = authCodeArray.find((item) => item.phone == phone);
    if (!objAuth){
        objAuth = new Object();
        objAuth.phone = phone;
        objAuth.code = code;
        objAuth.endtime = Date.now() + 5 * 60 * 1000;       // 验证码5分钟后过期
        authCodeArray.push(objAuth);
    } else {
        objAuth.code = code;
        objAuth.endtime = Date.now() + 5 * 60 * 1000;       // 验证码5分钟后过期        
    }
}

module.exports = {
    getAuthCode: async (phonecode) => {
        if (!phonecode){
            throw new MyAppError('手机号为空', '0001');
        }

        try {
            var num = Math.floor(Math.random() * 1000000);
            let status = await smsClient.sendSMS({
                PhoneNumbers: phonecode,
                SignName: '国图调查软件',
                TemplateCode: 'SMS_136871663',
                TemplateParam: '{"code":"' + num + '"}'
            })
            
            funcGetAnthObj(phonecode, num);
            
            if (status.Code == 'isv.MOBILE_NUMBER_ILLEGAL')
                throw new MyAppError('无效的手机号', '0003')

            if (status.Code != 'OK')
                throw new MyAppError('发送短信验证码失败', '0002')
        }
        catch (error) {
            console.log(error.message);
            throw new MyAppError('发送短信验证码失败', '0002')
        }
    },
    valideAuthCode: async (phonecode, authcode) => {
        let objAuth = authCodeArray.find((item) => item.phone === phonecode);
        console.log(objAuth.code,authcode);
        console.log(Date.now(),objAuth.endtime);

        if (!objAuth)
            throw new MyAppError('验证码错误', '0002');

        if (objAuth.code != authcode)
            throw new MyAppError('验证码错误', '0002');

        if (Date.now() > objAuth.endtime)
            throw new MyAppError('验证码过期，请重新获取', '0003');

        

        return true;
    },
    sendMessage: async (phonecode, message) => {
        // try
        // {
            let status = await smsClient.sendSMS({
                PhoneNumbers: phonecode,
                SignName: '国图调查软件',
                TemplateCode: 'SMS_136871662',
                TemplateParam: '{"message":"' + message + '"}'
            }).then(function (res) {
                let {Code}=res
                if (Code === 'OK') {
                    //处理返回参数
                    console.log(res)
                }
            }, function (err) {
                console.log(err)
                
            })

            // console.log(status.RequestId);
        // }
        // catch(err)
        // {
        //     console.log(err);
        // }
    }
}