var express = require('express');
var router = express.Router();
var jwt = require('../common_function/jwt');
var orm = require('../models');
const config = require('../config/config');
var authOper = require('../common_function/AuthCode');
const AppCommonError = require('../error/CommonError');
const uuidv1 = require('uuid/v1');
var requester = require('request-promise-native');
var redis = require('redis');
var sha1 = require('sha1');

// 捕获异步函数中的错误，利用next(err)传给错误处理中间件
function catchAsyncErrors(fn) {
    return (req, res, next) => {
        const routePromise = fn(req, res, next);
        if (routePromise.catch) {
            routePromise.catch(err => {
                next(err);
                console.log(err)
            });
        }
    }
}

//// 发送验证码
router.post('/send_authcode', catchAsyncErrors(async (req, res) => {
    await authOper.getAuthCode(req.body.phone);
    return res.json({
        code: "0000",
        msg: "发送成功"
    });
}));


//登录接口
router.post('/login', catchAsyncErrors(async (req, res) => {
    if (!req.body.phone) {
        throw new AppCommonError("手机号为空", "0001");
    }

    // // 检查验证码正确性(没有阿里短息服务暂时不要)
    //  let isValid = await authOper.valideAuthCode(req.body.phone, req.body.captcha);
    //  if (!isValid)
    //     throw new AppCommonError("验证码错误", "0002");

    let user = await orm.User.findOne({
        where: {
            LXDH: req.body.phone
        }
    });
    let role;

    //如果yhrzxx表中不存在记录，代表此用户为新用户，返回role为0
    if (!user) {
        let token = jwt.encode(jwt.generatePayload(req.body.phone, "", "", ""));
        res.cookie('jwt', token, {
            httpOnly: true
        });
        return res.json({
            role: "0"
        });
    }
    //其它不同角色返回不同role，role为2代表管理员，3位录入人员，4位授权发送人员，1位老用户
    if (user.JSDM.indexOf("1") > -1) {
        role = "2"
    } else if (user.JSDM.indexOf("6") > -1) {
        role = "3"
    } else if (user.JSDM.indexOf("9") > -1) {
        role = "4"
    } else if (user.JSDM.indexOf("7") > -1) {
        role = "5"
    } else {
        role = "1"
    }
    //利用jwt制作token并存入cookie，httpOnly设置为true用来防止XXS攻击
    let token = jwt.encode(jwt.generatePayload(req.body.phone, user.JSDM, "", user.INDEX));
    res.cookie('jwt', token, {
        httpOnly: true
    });
    return res.json({
        role: role,
        jscy: user.JSCY,
        jscy_index: user.INDEX
    });
}));


//除去一些特殊接口，其它接口必须在登录后才能调用
router.use((req, res, next) => {
    if (req.path == '/login' || req.path == '/send_authcode' || req.path == '/get_access_token' || req.path == '/get_wx_openid') {
        next();
    } else {
        if (req.cookies.jwt) {
            let payload = jwt.checkToken(req.cookies.jwt);
            if (payload) {
                let newToken = jwt.encode(jwt.generatePayload(payload.phone, payload.roleID, payload.index, payload.jsIndex));
                res.cookie('jwt', newToken, {
                    httpOnly: true
                });
                next();
            } else {
                throw new AppCommonError("token认证失败", "0005")
            }
        } else {
            throw new AppCommonError("未登录，拒绝访问", "0005")
        }
    }
});

//登出接口
router.get('/logout', (req, res) => {
    res.cookie('jwt', '', {
        expires: new Date(0)
    });
    return res.json({
        code: "0000"
    });
});

//加载下拉框选项接口
router.get('/get_option/:option_name', catchAsyncErrors(async (req, res, next) => {
    var queryOption;
    switch (req.params.option_name) {
        case "xzqdm":
            queryOption = orm.option.DWXX;
            break;
        case "jsxx":
            queryOption = orm.option.JSXX;
            break;
        case "rjcplx":
            queryOption = orm.option.CPLX;
            let rjcplx = await queryOption.findAll();
            let rjcplxDict = rjcplx.map(d => {
                return {
                    mc: d.MC,
                    dm: d.DM,
                    type: d.SFDJ
                }
            });
            return res.json(rjcplxDict);
            break;
        case "xmzxx":
            let users = await orm.User.aggregate("SSXMZ", 'DISTINCT', {
                plain: false
            });
            return res.json(users.map(u => {
                return {
                    mc: u.DISTINCT,
                    dm: 1
                }
            }));
            break;
        default:
            throw new AppCommonError("目标字典不存在", "0002");
            break;
    }

    let dwxxs = await queryOption.findAll();
    let dict = dwxxs.map(d => {
        return {
            mc: d.MC,
            dm: d.DM
        }
    });
    res.json(dict);
}));

//获取行政区代码接口
router.get('/xzqdm', catchAsyncErrors(async (req, res, next) => {
    if (!req.query.xzqjb) {
        throw new AppCommonError("行政区级别为空");
    }

    let xzq;
    if (!req.query.xzqdm && req.query.xzqjb == "1") {
        xzq = await orm.option.DWXX.findAll({
            where: {
                JB: {
                    [orm.Sequelize.Op.like]: req.query.xzqjb + '%'
                }
            }
        });
    } else {
        let jb = 4 - parseInt(req.query.xzqjb);
        let target = req.query.xzqdm.substring(0, req.query.xzqdm.length - 2 * jb);

        xzq = await orm.option.DWXX.findAll({
            where: {
                JB: {
                    [orm.Sequelize.Op.like]: req.query.xzqjb + '%'
                },
                DM: {
                    [orm.Sequelize.Op.like]: target + '%'
                }
            }
        });
    }
    let dict = xzq.map(d => {
        return {
            mc: d.MC,
            dm: d.DM
        }
    });
    return res.json(dict);
}));

//将行政区代码转成行政区名称接口
router.get('/xzqmc', catchAsyncErrors(async (req, res, next) => {
    if (!req.query.xzqdm) {
        throw new AppCommonError("行政区代码为空");
    }

    console.log(req.query.xzqdm);
    let resultxzq = await orm.option.DWXX.findAll({
        attributes: ['MC', 'DM'],
        where: {
            DM: req.query.xzqdm
        }
    });
    if (!resultxzq || resultxzq.length == 0)
        throw new AppCommonError("未查询到行政区信息");

    let dict = resultxzq.map(x => {
        return {
            mc: x.MC,
            dm: x.DM
        }
    });
    return res.json(dict);
}));

//-------------------------获取存在临时表中的openid---------------------------//
router.get('/get_temp_openid', catchAsyncErrors(async (req, res) => {
    let tempOpenid = await orm.TempOpenid.findOne({
        where: {
            LXDH: req.query.lxdh
        }
    })

    let yhrzzOpenid = await orm.CustomerInfo.findOne({
        where: {
            LXDH: req.query.lxdh
        }
    })

    let resObj;

    if (yhrzzOpenid) {
        resObj = {
            LXDH: yhrzzOpenid.LXDH,
            OPENID: yhrzzOpenid.OPENID,
        }
    }

    if (tempOpenid) {
        res.json(tempOpenid)
    } else if (resObj) {
        res.json(resObj)
    } else {
        res.json({
            OPENID: null
        })
    }
}))


//--------------------------微信服务号get access_token并存入redis------------------------------//
router.get('/get_access_token', catchAsyncErrors(async (req, res) => {
    var client = redis.createClient();
    let resObj;
    client.get("access_token", async (err, reply) => {
        console.log(reply);
        let getTokenUrl = config.access_token_url.replace('APPID', config.appid).replace('APPSECRET', config.secret);
        if (reply == null) {
            let reqData = {
                method: 'get',
                body: {},
                json: true,
                url: getTokenUrl
            }
            let body = await requester(reqData);
            let access_token = body.access_token;
            if (access_token != null) {
                client.set("access_token", access_token, 'EX', 6000, redis.print);
                resObj = {
                    code: '0000',
                    access_token: access_token
                }
                res.json(resObj);
                client.quit();
            }
        } else {
            resObj = {
                code: '0000',
                access_token: reply
            }
            res.json(resObj);
            client.quit();
        }
    });
}))

//获取带参数公众号二维码接口
router.post('/get_qrcode_ticket', catchAsyncErrors(async (req, res) => {
    let getTicketUrl = config.qrcode_ticket_url.replace('ACCESS_TOKEN', req.body.access_token);
    let reqTicketData = {
        method: 'post',
        body: {
            "expire_seconds": 604800,
            "action_name": "QR_STR_SCENE",
            "action_info": {
                "scene": {
                    "scene_str": req.body.lxdh
                }
            }
        },
        json: true,
        url: getTicketUrl
    }
    let ticketRes = await requester(reqTicketData);
    res.json(ticketRes);
}))

//获取角色成员的openid
router.get('/get_jscy_openid', catchAsyncErrors(async (req, res) => {
    let jscy = await orm.User.findOne({
        where: {
            LXDH: req.query.lxdh
        }
    });
    res.json({
        code: "0000",
        jscy_openid: jscy.OPENID
    })
}))

//提供wxconfig参数，使微信端可以使用微信jssdk，从而调用扫一扫
router.get('/get_wxconfig', catchAsyncErrors(async (req, res) => {
    let nonceStr, timestamp, signature, jsUrl, string;
    let client = redis.createClient();
    let resObj;
    let jsapiTicket;
    client.get("jsapi_ticket", async (err, reply) => {
        let getJSApiTicketUrl = config.getJSApiTicketUrl.replace('ACCESS_TOKEN', req.query.access_token);
        console.log(reply);
        if (reply == null) {
            let reqTicketData = {
                method: 'get',
                body: {},
                json: true,
                url: getJSApiTicketUrl
            };
            let res = await requester(reqTicketData);
            if (res.ticket && res.errmsg == 'ok') {
                jsapiTicket = res.ticket;
                client.set("jsapi_ticket", jsapiTicket, 'EX', 6000, redis.print);
                client.quit();
            }
        } else {
            jsapiTicket = reply
            client.quit();
        }

        nonceStr = uuidv1();
        timestamp = Date.now();
        jsUrl = req.query.url;
        string = `jsapi_ticket=${jsapiTicket}&noncestr=${nonceStr}&timestamp=${timestamp}&url=${jsUrl}`
        signature = sha1(string);
        resObj = {
            nonceStr: nonceStr,
            timestamp: timestamp,
            signature: signature,
            appID: config.appid
        };
        res.json(resObj);
    });
}));

//微信端通过code获取openid
router.get('/get_wx_openid', catchAsyncErrors(async (req, res) => {
    let reqOpenidData = {
        method: 'get',
        body: {},
        json: true,
        url: ADDRESS_GETOPENID + `?appid=${config.appid}&secret=${config.secret}&code=${req.query.code}&grant_type=authorization_code`
    };
    let result = await requester(reqOpenidData);
    res.json({
        openid: result.openid
    })
}))

// 错误处理中间件
router.use((err, req, res, next) => {
    if (err instanceof AppCommonError) {
        res.json({
            code: err.code,
            msg: err.message
        });
    } else {
        res.json({
            code: "9999",
            msg: err.message
        });
    }
});

module.exports = router;