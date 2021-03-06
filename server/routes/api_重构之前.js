﻿var express = require('express');
var router = express.Router();
var jwt = require('../CommonFunction/jwt');
var common = require('../CommonFunction/CustomFunc');
var orm = require('../models');
const config = require('../config/config')
const MyAppError = require('./../Error/MyAppError');
const AppCommonError = require('./../Error/CommonError');
const uuidv1 = require('uuid/v1');
const optionConverter = require('../CommonFunction/OptionConverter')
const mailerSender = require('../CommonFunction/MailSender');
var authOper = require('../CommonFunction/AuthCode');
var requester = require('request-promise-native');
var postOption = {
    method: 'post',
    body: {},
    json: true,
    url: config.authorityAddress
};

var redis = require('redis');
var request = require('request');

var wechatOper = require('../CommonFunction/WechatOperation')

var ADDRESS_ACCESSTOKEN = config.getAccessTokenAddress;
var ADDRESS_SAVEPOSTINFO = config.savePostInfoAddress;
var ADDRESS_SAVEINVOICEINFO = config.saveInvoiceAddress;
var ADDRESS_GETOPENID = config.getWechatOpenidAddress;

// var getJSApiTicketUrl = 'https://api.weixin.qq.com/cgi-bin/ticket/getticket?access_token=ACCESS_TOKEN&type=jsapi';
var sha1 = require('sha1');

//用于时间格式的补位
function twoDigits(d) {
    if (0 <= d && d < 10) return "0" + d.toString();
    if (-10 < d && d < 0) return "-0" + (-1 * d).toString();
    return d.toString();
}

Date.prototype.toMysqlFormat = function () {
    // return this.getUTCFullYear() + "-" + twoDigits(1 + this.getUTCMonth()) + "-" + twoDigits(this.getUTCDate()) + " " + twoDigits(this.getHours()) + ":" + twoDigits(this.getUTCMinutes()) + ":" + twoDigits(this.getUTCSeconds());
    // return this.getUTCFullYear() + "-" + twoDigits(1 + this.getUTCMonth()) + "-" + twoDigits(this.getUTCDate());
    return this.getFullYear() + "-" + twoDigits(1 + this.getMonth()) + "-" + twoDigits(this.getDate());
};


Date.prototype.toMysqlFormatTime = function () {
    return this.getFullYear() + "-" + twoDigits(1 + this.getMonth()) + "-" + twoDigits(this.getDate()) + " " + twoDigits(this.getHours()) + ":" + twoDigits(this.getMinutes()) + ":" + twoDigits(this.getSeconds());
};


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

    if (!user) {
        let token = jwt.encode(jwt.generatePayload(req.body.phone, "", "", ""));
        res.cookie('jwt', token, {
            httpOnly: true
        });
        return res.json({
            role: "0"
        });
    }
    // else {
    if (user.JSDM.indexOf("1") > -1) {
        role = "2"
    } else if (user.JSDM.indexOf("6") > -1) {
        role = "3"
    } else if (user.JSDM.indexOf("9") > -1) {
        role = "4"
    } else {
        role = "1"
    }
    // let role = user.JSDM.indexOf("1") > -1 ? "2" : "1";
    let token = jwt.encode(jwt.generatePayload(req.body.phone, user.JSDM, "", user.INDEX));
    res.cookie('jwt', token, {
        httpOnly: true
    });
    return res.json({
        role: role,
        jscy: user.JSCY,
        jscy_index: user.INDEX
    });
    // }
}));

router.get('/application_reject_reason', (req, res) => {
    if (config.rejectReasons_Application) {
        return res.json(config.rejectReasons_Application);
    } else {
        return res.json([]);
    }
});

router.get('/user_reject_reason', (req, res) => {
    if (config.rejectReasons_User) {
        return res.json(config.rejectReasons_User);
    } else {
        return res.json([]);
    }
});

//// 获取用户信息
router.get('/get_userInfo', catchAsyncErrors(async (req, res) => {
    let payload = jwt.decode(req.cookies.jwt);
    if (!payload || !payload.phone) {
        throw new AppCommonError("无法获取已登陆信息，请重新登陆", "0005");
    }

    let jscy = await orm.User.findOne({
        where: {
            LXDH: payload.phone
        }
    });

    if (jscy && !jscy.OPENID && req.query.openid) {
        jscy.OPENID = req.query.openid;
        await jscy.save();
    }

    let rzxx = await orm.CustomerInfo.findOne({
        where: {
            LXDH: payload.phone
        }
    });
    if (!rzxx) {
        return res.json({
            newUser: "1",
            code: "0000"
        });
    } else {
        let token = jwt.encode(jwt.generatePayload(payload.phone, payload.roleID, rzxx.INDEX, payload.jsIndex));
        res.cookie('jwt', token, {
            httpOnly: true
        });

        if (!rzxx.OPENID && req.query.openid) {
            rzxx.OPENID = req.query.openid;
            await rzxx.save();
        }

        return res.json({
            sqr: rzxx.YHM,
            sqrlx: rzxx.SFNBCY == "0" ? "甲方用户" : "内部用户",
            sqrdw: rzxx.YHDW,
            lxdh: rzxx.LXDH,
            wechat: rzxx.WECHAT,
            jsyx: rzxx.YXDZ,
            newUser: "0",
            ssqy: rzxx.XMDDM,
            zt: rzxx.ZT,
            openid: rzxx.OPENID,
            code: "0000",
        });
    }
}));

//// 提交用户信息
router.post('/submit_userInfo', catchAsyncErrors(async (req, res) => {
    let payload = jwt.decode(req.cookies.jwt);
    if (payload.phone != req.body.lxdh) {
        throw new AppCommonError("提交电话与当前已登陆用户不符", "20021");
    }

    let yhxx = await orm.CustomerInfo.findOne({
        where: {
            LXDH: req.body.lxdh
        }
    });
    if (!yhxx) {
        let newYh = await orm.CustomerInfo.create({
            ZDSM: 10,
            YSQSM: 0,
            ZT: "1",
            INDEX: uuidv1(),
            YHM: req.body.sqr,
            SFNBCY: req.body.sqrlx,
            YHDW: req.body.sqrdw,
            LXDH: req.body.lxdh,
            WECHAT: req.body.wechat,
            YXDZ: req.body.jsyx,
            XMDDM: req.body.ssqy,
            XZQDM: req.body.ssqy,
            OPENID: req.body.openid
        });

        let token = jwt.encode(jwt.generatePayload(payload.phone, payload.roleID, newYh.INDEX, payload.jsIndex));
        res.cookie('jwt', token, {
            httpOnly: true
        });

    }

    if (req.body.updateUser == "1") {
        yhxx.YHM = req.body.sqr || yhxx.YHM;
        yhxx.SFNBCY = req.body.sqrlx || yhxx.SFNBCY;
        yhxx.YHDW = req.body.sqrdw || yhxx.YHDW;
        yhxx.WECHAT = req.body.wechat || yhxx.WECHAT;
        yhxx.YXDZ = req.body.jsyx || yhxx.YXDZ;
        yhxx.XMDDM = req.body.ssqy || yhxx.XMDDM;
        yhxx.XZQDM = req.body.ssqy || yhxx.XZQDM;
        yhxx.ZT = "1";
    } else if (req.body.updateUser == "0") {
        yhxx.WECHAT = req.body.wechat || yhxx.WECHAT;
        yhxx.YXDZ = req.body.jsyx || yhxx.YXDZ;
    }


    let openid_jscy;

    if (req.body.sqrlx == '0') {
        let djxx = await orm.ApplicationRecord.findOne({
            where: {
                XMDDM: req.body.ssqy,
                CPDM: {
                    [orm.Sequelize.Op.ne]: '0'
                }
            },
            include: [{
                model: orm.User,
                as: 'Csr'
            }]
        });

        if (djxx.Csr.OPENID) {
            openid_jscy = djxx.Csr.OPENID;
        }

    } else {
        // let djxx = await orm.ApplicationRecord.findOne({
        //     where: {
        //         XMDDM: req.body.ssqy,
        //         CPDM: '0'
        //     },
        //     include: [{
        //         model: orm.User,
        //         as: 'Csr'
        //     }]
        // });

        // openid_jscy = djxx.Csr.OPENID;

        let jscy = await orm.User.findOne({
            where: {
                SSXMZ: req.body.sqrdw,
                JSDM: {
                    [orm.Sequelize.Op.like]: '%7%'
                }
            },
            attributes: ['OPENID']
        });

        if (jscy.OPENID) {
            openid_jscy = jscy.OPENID;
        }
    }

    if (openid_jscy) {

        let reqTokenData = {
            method: 'get',
            body: {},
            json: true,
            url: ADDRESS_ACCESSTOKEN
        };
        let body = await requester(reqTokenData);

        await wechatOper.remindCheckMessage(openid_jscy, body.access_token);
    }

    if (yhxx) {
        await yhxx.save();
    }

    return res.json({
        code: "0000"
    });

}));

//// 用户获取历史申请信息
router.get('/user_history', catchAsyncErrors(async (req, res) => {
    let index = "";
    let payload = jwt.decode(req.cookies.jwt);
    if (!payload || !payload.phone) {
        throw new AppCommonError("无法获取已登陆信息，请重新登陆", "0005");
    }

    if (!payload.index) {
        let yhxx = await orm.CustomerInfo.findOne({
            where: {
                LXDH: payload.phone
            }
        });
        if (!yhxx || !yhxx.INDEX) {
            throw new AppCommonError("无申请记录", "10022");
        }
        index = yhxx.INDEX;
    } else {
        index = payload.index;
    }

    let searchBody = {
        YHRZXX_INDEX: index
    };
    if (req.query.shzt) {
        searchBody.BLZT = req.query.shzt;
    }

    let page = 1,
        pageSize = 5;
    if (req.query.page && !isNaN(req.query.pageSize)) {
        page = parseInt(req.query.page);
    }

    if (req.query.pageSize && !isNaN(req.query.pageSize)) {
        pageSize = parseInt(req.query.pageSize);
    }

    let records = await orm.ApplicationInfo.findAll({
        where: searchBody,
        include: [{
            model: orm.LogRecord,
            as: "Rzjl"
        }],
        limit: pageSize,
        offset: pageSize * (page - 1),
        order: [
            ['SQSJ', 'desc']
        ]
    });
    console.log(records);

    if (!records || records.length == 0) {
        throw new AppCommonError("无申请记录", "10022");
    } else {
        let result = records.map(r => {
            let sqxlmArr = [];
            let sqxlmStr;
            if (r.SQXLM.slice(0, 1) == '[') {
                let sqxlmObjArr = JSON.parse(r.SQXLM);
                for (let i = 0; i < sqxlmObjArr.length; i++) {
                    sqxlmArr.push(sqxlmObjArr[i].value);
                }
                sqxlmStr = sqxlmArr.join(',');
            } else {
                sqxlmStr = r.SQXLM
            }
            return {
                index: r.INDEX,
                sqlx: r.SQLX,
                cpdm: r.CPDM,
                cpmc: r.CPMC,
                jmg: r.SFJMG,
                xzqdm: r.SQXZDM,
                sqsl: r.SQSL,
                jzsj: r.JZSJ,
                sqxlm: sqxlmStr,
                swhtmc: r.SWHTMC,
                swlxr: r.SWLXR,
                xmddm: r.XMDDM,
                sqxks: r.SQXKS,
                jfsy: r.JFSY,
                shzt: optionConverter.ConvertApplicationStatus(r.BLZT),
                user_index: r.YHRZXX_INDEX,
                bz: r.BZ,
                sqsj: r.SQSJ,
                bljssj: r.Rzjl ? r.Rzjl.BLJSSJ : '-'
            }
        });
        return res.json(result);
    }
}));

//// 撤销申请
router.post('/revokeApplication', catchAsyncErrors(async (req, res, next) => {
    let reqParams = req.body;
    if (!reqParams.index)
        throw new AppCommonError("申请信息主键为空", "0001");

    let destroyResult = await orm.ApplicationInfo.destroy({
        where: {
            INDEX: reqParams.index
        }
    });

    if (reqParams.shzt !== '待审核') {
        let destroyRzjl = await orm.LogRecord.destroy({
            where: {
                SQXX_INDEX: reqParams.index
            }
        });
        if (destroyRzjl == 0)
            throw new AppCommonError("撤销申请失败", "0001");
        else
            return res.json({
                code: '0000'
            });
    }

    if (destroyResult == 0)
        throw new AppCommonError("撤销申请失败", "0001");
    else
        return res.json({
            code: '0000'
        });

}));

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

//// 提交申请
router.post('/submitApplication', catchAsyncErrors(async (req, res, next) => {
    let reqParams = req.body;
    let xmXzq;
    let payload = jwt.decode(req.cookies.jwt);

    let openid_jscy;
    let bodyToken;
    let reqTokenData = {
        method: 'get',
        body: {},
        json: true,
        url: ADDRESS_ACCESSTOKEN
    };
    if (!payload || !payload.index) {
        throw new AppCommonError("无法获取已登陆信息，请重新登陆", "0005");
    }

    if (!reqParams.sqlx)
        throw new AppCommonError("授权类型为空", "0001");
    if (!reqParams.cpdm)
        throw new AppCommonError("软件产品为空", "0001");
    if (!reqParams.xzqdm)
        throw new AppCommonError("行政区代码为空", "0001");
    if (!reqParams.sqsl)
        throw new AppCommonError("申请数量为空", "0001");
    if (!reqParams.jzsjlx)
        throw new AppCommonError("授权时间类型为空", "0001");

    if (reqParams.jzsjlx == "3") {
        let t = parseInt(reqParams.jzsj);
        if (!reqParams.jzsj || t < Date.now()) {
            throw new AppCommonError("所输入时间无效", "0001");
        }
    }

    if (reqParams.sqlx == "1") {
        if (!reqParams.jmg) {
            throw new AppCommonError("加密狗选项为空", "0001");
        }
        if (reqParams.jmg == '0') {
            if (!reqParams.sqxlm) {
                throw new AppCommonError("授权序列码为空", "0001");
            }
        }
    }
    if (reqParams.sqlx == "2") {
        if (!reqParams.sqxks) {
            throw new AppCommonError("授权许可数为空", "0001");
        }
        if (reqParams.sqxks < 2) {
            throw new AppCommonError("授权许可数至少为2", "0001");
        }
        if (!reqParams.sqxlm) {
            throw new AppCommonError("授权序列码为空", "0001");
        }
    }

    //cpdm在cplx表中有重，直接传cpmc过来
    // let cp = await orm.option.CPLX.findAll();
    // let cpmc = "";
    // if (!cp) {
    //     console.warn("产品代码表查询失败，请联系管理员");
    //     throw new AppCommonError("软件产品无效", "0002");
    // } else {
    //     let selectedCP = cp.find(c => c.DM == reqParams.cpdm);
    //     if (!selectedCP) {
    //         throw new AppCommonError("软件产品无效", "0002");
    //     } else {
    //         cpmc = selectedCP.MC;
    //     }
    // }

    let userInfo = await orm.CustomerInfo.findOne({
        where: {
            INDEX: payload.index
        }
    });
    if (!userInfo)
        throw new AppCommonError("当前用户不存在", "0001");
    if (userInfo.ZT == "9")
        throw new AppCommonError("当前用户认证被拒绝，请联系项目负责人", "0001");
    if (userInfo.SFNBCY == "0") { // 甲方用户必须填写合同和联系人
        if (!reqParams.swhtmc)
            throw new AppCommonError("商务合同名称为空", "0001");
        if (!reqParams.swlxr)
            throw new AppCommonError("商务联系人为空", "0001");
    }

    let sxmddm = ''; // 行政单位代码组
    if (userInfo.SFNBCY == "1" && reqParams.jfsy == '0') {
        //// 内部用户逻辑（内部 不是给甲方使用的转给部门主任）
        // 查找项目经理
        let userManager = await orm.User.findOne({
            where: {
                SSXMZ: userInfo.YHDW,
                JSDM: 7
            }
        });
        if (!userManager)
            throw new AppCommonError("未找到项目组负责人", "0001");
        // 项目经理是否负责该项目
        let djxxInfo = await orm.ApplicationRecord.findOne({
            where: {
                CPDM: [reqParams.cpdm, '0'],
                CSR: userManager.INDEX
            }
        });
        if (!djxxInfo) {
            throw new AppCommonError("项目组经理不负责审核该软件产品", "0001");
        } else {
            let jscy = await orm.User.findOne({
                where: {
                    INDEX: userManager.INDEX
                }
            })
            if (jscy) {
                openid_jscy = jscy.OPENID;
            }

        }


    } else {
        //// 外部用户逻辑（内部帮甲方申请或者甲方自己申请转给商务人员）


        //--------------------------v2中xmddm到区县-------------------------------//
        // let targetXzqs = reqParams.xzqdm.split(',');

        // if (targetXzqs.length > 1) {
        //     xmXzq = common.GetXZQArray(targetXzqs[0]);
        //     xmXzq.splice(0, 1);
        // } else {
        //     xmXzq = common.GetXZQArray(targetXzqs[0]);
        // }

        //-----------------------v3直接按市来-----------------------------------//
        let targetXzqs = reqParams.xzqdm.split(',');

        // if (targetXzqs.length > 1) {
        xmXzq = common.GetXZQArray(targetXzqs[0]);
        xmXzq.splice(0, 1);
        console.log(xmXzq);
        // } else {
        //     // xmXzq = common.GetXZQArray(targetXzqs[0]);
        //     xmXzq = targetXzqs[0];
        //     console.log(xmXzq);
        // }


        let appRecord = await orm.ApplicationRecord.findAll({
            where: {
                XMDDM: xmXzq,
                CPDM: reqParams.cpdm
            }
        });

        if (appRecord.length === 0)
            throw new AppCommonError("用户所属区域没有对应的项目", "0001");

        let xmddmArray = [];
        appRecord.map(item => {
            xmddmArray.push(item.XMDDM)
        });

        let countArray = [];
        if (xmddmArray.length === 1) {
            sxmddm = xmddmArray[0];
        } else {
            for (let i = 0; i < xmddmArray.length; i++) {
                let regex = new RegExp('0', 'g');
                let result = xmddmArray[i].match(regex);
                let count = !result ? 0 : result.length;
                countArray.push(count);
            }
            let index = countArray.indexOf(Math.min(...countArray));
            sxmddm = xmddmArray[index];
        }

        console.log(sxmddm);


        let jscy = await orm.User.findOne({
            where: {
                INDEX: appRecord[0].CSR
            }
        })

        if (jscy) {
            openid_jscy = jscy.OPENID;
        }

        // sxmddm = appRecord.XMDDM; // 获取项目点代码
    }

    let jmg = reqParams.sqlx == "1" ? reqParams.jmg : "0"; // 授权类型（临时、长期、自定义）
    let jzsj = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toMysqlFormat();
    if (reqParams.jzsjlx == "2") {
        jzsj = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toMysqlFormat();
    }
    if (reqParams.jzsjlx == "3") {
        jzsj = new Date(parseInt(reqParams.jzsj)).toMysqlFormat();
    }

    console.log(jzsj);

    // let post_index;
    // let invoice_index;

    // if (reqParams.post_index == '0') {
    //     post_index = uuidv1();
    // } else {
    //     post_index = reqParams.post_index;
    // }


    // if (reqParams.invoice_index == '0') {
    //     invoice_index = uuidv1();
    // } else {
    //     invoice_index = reqParams.invoice_index;
    // }

    // let reqDataPostInfo = {
    //     method: 'post',
    //     body: {
    //         "post_index": post_index,
    //         "yhrzxx_index": userInfo.INDEX,
    //         "sjr": reqParams.sjr,
    //         "sjrdz": reqParams.sjrdz,
    //         "sjrlxdh": reqParams.sjrlxdh
    //     },
    //     json: true,
    //     url: ADDRESS_SAVEPOSTINFO
    // };

    // let reqDataInvoice = {
    //     method: 'post',
    //     body: {
    //         invoice_index: invoice_index,
    //         yhrzxx_index: userInfo.INDEX,
    //         company_name: reqParams.company_name,
    //         company_address: reqParams.company_address,
    //         company_tel: reqParams.company_tel,
    //         tax_objectid: reqParams.tax_objectid,
    //         account: reqParams.account,
    //         bank: reqParams.bank
    //     },
    //     json: true,
    //     url: ADDRESS_SAVEINVOICEINFO
    // };

    // let postIndex = await requester(reqDataPostInfo);
    // let invoiceIndex = await requester(reqDataInvoice);

    // console.log(post_index);
    // console.log(invoice_index);

    let blzt = userInfo.ZT == "4" ? "2" : "1";
    let newApplication = await orm.ApplicationInfo.create({
        YHRZXX_INDEX: userInfo.INDEX,
        SQLX: reqParams.sqlx,
        SQXZDM: reqParams.xzqdm,
        CPDM: reqParams.cpdm,
        // CPMC: cpmc,
        CPMC: reqParams.cpmc,
        SQXLM: reqParams.sqxlm,
        BLZT: blzt,
        SFJMG: jmg,
        SQSJ: new Date(Date.now()).toMysqlFormat(),
        JZSJ: jzsj,
        XMDDM: sxmddm,
        SQSL: reqParams.sqsl,
        SWHTMC: reqParams.swhtmc,
        SWLXR: reqParams.swlxr,
        SQXKS: reqParams.sqxks,
        JZSJLX: reqParams.jzsjlx,
        JFSY: reqParams.jfsy,
        INDEX: uuidv1(),
        POST_INDEX: reqParams.post_index,
        INVOICE_INDEX: reqParams.invoice_index
    });


    if (!newApplication) {
        throw new AppCommonError("无法创建新申请", "0006");
    } else {

        // let targetXzqs = reqParams.xzqdm.split(',');

        // // if (targetXzqs.length > 1) {
        //     xmXzq = common.GetXZQArray(targetXzqs[0]);
        //     xmXzq.splice(0, 1);
        // // } else {
        // //     // xmXzq = common.GetXZQArray(targetXzqs[0]);
        // //     xmXzq = targetXzqs[0];
        // // }
        // console.log(xmXzq, reqParams.cpdm);

        // let appRecord = await orm.ApplicationRecord.findAll({
        //     where: {
        //         XMDDM: xmXzq,
        //         CPDM: [reqParams.cpdm, '0']
        //     }
        // });


        // if (appRecord.length === 0) {
        //     throw new AppCommonError("用户所属区域没有对应的项目", "0001");
        // }


        if (openid_jscy) {
            bodyToken = await requester(reqTokenData);
            await wechatOper.remindCheckMessage(openid_jscy, bodyToken.access_token);
        }

        return res.json({
            code: "0000"
        });
    }
}));

//// 管理人员获取用户认证信息
router.get('/unchecked_users', catchAsyncErrors(async (req, res, next) => {
    let payload = jwt.decode(req.cookies.jwt);
    if (!payload || !payload.jsIndex || !payload.roleID) {
        throw new AppCommonError("无法获取已登陆信息，请重新登陆", "0005");
    }

    let recordSearchCondition = [];
    let customerSearchCondition = [];
    let userQx = payload.roleID.split(',');

    if (userQx.indexOf('7') > -1) {
        let jsUser = await orm.User.findOne({
            where: {
                INDEX: payload.jsIndex
            },
            attributes: ['SSXMZ']
        });
        if (!jsUser.SSXMZ) {
            throw new AppCommonError("当前用户项目组为空");
        }
        let yhrzUSer = await orm.CustomerInfo.findAll({
            where: {
                YHDW: jsUser.SSXMZ,
                SFNBCY: "1"
            }
        });
        if (!yhrzUSer || yhrzUSer.length == 0) {
            throw new AppCommonError("当前用户项目组没有用户提交申请");
        }

        let uncheckedUsers = yhrzUSer.filter(item => (item.ZT !== '4') && (item.ZT !== '9'));
        let responseObjects = uncheckedUsers.map(u => {
            return {
                yhm: u.YHM,
                xzqdm: u.XZQDM,
                dwmc: u.YHDW,
                lxdh: u.LXDH,
                rzzt: u.ZT,
                wechat: u.WECHAT,
                index: u.INDEX,
                sfgzgzh: u.OPENID ? "是" : "否"
            }
        });
        if (!responseObjects || responseObjects.length == 0) {
            throw new AppCommonError("当前用户无待审用户", "20022");
        }
        res.json(responseObjects);
    } else {
        if (userQx.indexOf("3") > -1) {
            recordSearchCondition.push({
                CSR: payload.jsIndex
            });
            customerSearchCondition.push("1");
        }
        if (userQx.indexOf("4") > -1) {
            recordSearchCondition.push({
                FSR: payload.jsIndex
            });
            customerSearchCondition.push("2");
        }
        // if (userQx.indexOf("5") > -1) {
        //     recordSearchCondition.push({
        //         SQSHR: payload.jsIndex
        //     });
        //     customerSearchCondition.push("3");
        // }

        if (recordSearchCondition.length == 0) {
            throw new AppCommonError("当前用户无审核权限", "20021");
        }

        let userApplication = await orm.ApplicationRecord.findAll({
            where: {
                [orm.Sequelize.Op.or]: recordSearchCondition
            },
            attributes: ['XMDDM']
        });
        if (!userApplication || userApplication.length == 0)
            throw new AppCommonError("当前用户无待审用户", "20022");
        let xmddms = userApplication.map(app => app.XMDDM);

        // let uncheckedUsers = await orm.CustomerInfo.findAll({ where: { ZT: { [orm.Sequelize.Op.in]: customerSearchCondition }, XMDDM: { [orm.Sequelize.Op.in]: xmddms } } });
        // let responseObjects = uncheckedUsers.map(u => { return { yhm: u.YHM, xzqdm: u.XZQDM, dwmc: u.YHDW, lxdh: u.LXDH, rzzt: u.ZT, wechat: u.WECHAT, index: u.INDEX } });
        // if (!responseObjects || responseObjects.length == 0) {
        //     throw new AppCommonError("当前用户无待审用户", "20022");
        // }


        let userApplication1 = await orm.ApplicationRecord.findAll({
            where: {
                CSR: payload.jsIndex
            },
            attributes: ['XMDDM']
        });
        let xmddms1 = userApplication1.map(app => app.XMDDM);
        let uncheckedUsers1 = await orm.CustomerInfo.findAll({
            where: {
                ZT: '1',
                XMDDM: {
                    [orm.Sequelize.Op.in]: xmddms1
                },
                SFNBCY: '0'
            }
        });

        let userApplication2 = await orm.ApplicationRecord.findAll({
            where: {
                FSR: payload.jsIndex
            },
            attributes: ['XMDDM']
        });
        let xmddms2 = userApplication2.map(app => app.XMDDM);
        let uncheckedUsers2 = await orm.CustomerInfo.findAll({
            where: {
                ZT: '2',
                XMDDM: {
                    [orm.Sequelize.Op.in]: xmddms2
                },
                SFNBCY: '0'
            }
        });

        // let userApplication3 = await orm.ApplicationRecord.findAll({
        //     where: {
        //         SQSHR: payload.jsIndex
        //     },
        //     attributes: ['XMDDM']
        // });
        // let xmddms3 = userApplication3.map(app => app.XMDDM);
        // let uncheckedUsers3 = await orm.CustomerInfo.findAll({
        //     where: {
        //         ZT: '3',
        //         XMDDM: {
        //             [orm.Sequelize.Op.in]: xmddms3
        //         }
        //     }
        // });

        // let uncheckedUsers = uncheckedUsers1.concat(uncheckedUsers2).concat(uncheckedUsers3);
        let uncheckedUsers = uncheckedUsers1.concat(uncheckedUsers2);

        let responseObjects = uncheckedUsers.map(u => {
            return {
                yhm: u.YHM,
                xzqdm: u.XZQDM,
                dwmc: u.YHDW,
                lxdh: u.LXDH,
                rzzt: u.ZT,
                wechat: u.WECHAT,
                index: u.INDEX,
                sfgzgzh: u.OPENID ? "是" : "否"
            }
        });
        if (!responseObjects || responseObjects.length == 0) {
            throw new AppCommonError("当前用户无待审用户", "20022");
        }

        // let uncheckedUsers1,uncheckedUsers2,uncheckedUsers3;

        // let userApplication = await orm.ApplicationRecord.findAll({ where: { [orm.Sequelize.Op.or]: recordSearchCondition }, attributes: ['XMDDM'] });
        // if (!userApplication || userApplication.length == 0)
        //     throw new AppCommonError("当前用户无待审用户", "20022");
        // let xmddms = userApplication.map(app => app.XMDDM);

        // if (customerSearchCondition.indexOf('1') > -1) {
        //      uncheckedUsers1 = await orm.CustomerInfo.findAll({ where: { ZT: '1', XMDDM: { [orm.Sequelize.Op.in]: xmddms } } });
        // }

        // if (customerSearchCondition.indexOf('2') > -1) {
        //     uncheckedUsers2 = await orm.CustomerInfo.findAll({ where: { ZT: '2', XMDDM: { [orm.Sequelize.Op.in]: xmddms } } });
        // }

        // if (customerSearchCondition.indexOf('3') > -1) {
        //     uncheckedUsers3 = await orm.CustomerInfo.findAll({ where: { ZT: '3', XMDDM: { [orm.Sequelize.Op.in]: xmddms } } });
        // }

        // let responseObjects = uncheckedUsers.map(u => { return { yhm: u.YHM, xzqdm: u.XZQDM, dwmc: u.YHDW, lxdh: u.LXDH, rzzt: u.ZT, wechat: u.WECHAT, index: u.INDEX } });
        // if (!responseObjects || responseObjects.length == 0) {
        //     throw new AppCommonError("当前用户无待审用户", "20022");
        // }

        // res.json(responseObjects);
        res.json(responseObjects);
    }
}));

//// 管理人员获取申请审核信息
router.get('/unchecked_applications', catchAsyncErrors(async (req, res, next) => {
    let payload = jwt.decode(req.cookies.jwt);
    if (!payload || !payload.jsIndex || !payload.roleID) {
        throw new AppCommonError("无法获取已登陆信息，请重新登陆", "0005");
    }

    let recordSearchCondition = [];
    let applicationSearchCondition = [];
    let userQx = payload.roleID.split(',');

    if (userQx.indexOf('7') > -1) {
        let jsUser = await orm.User.findOne({
            where: {
                INDEX: payload.jsIndex
            },
            attributes: ['SSXMZ']
        });
        if (!jsUser.SSXMZ) {
            throw new AppCommonError("当前用户项目组为空");
        }
        let yhrzUSer = await orm.CustomerInfo.findAll({
            where: {
                YHDW: jsUser.SSXMZ,
                SFNBCY: "1"
            }
        });
        if (!yhrzUSer || yhrzUSer.length == 0) {
            throw new AppCommonError("当前用户项目组没有用户提交申请");
        }
        let yhIndexes = yhrzUSer.map(item => item.INDEX);
        let sq = await orm.ApplicationInfo.findAll({
            where: {
                YHRZXX_INDEX: {
                    [orm.Sequelize.Op.in]: yhIndexes
                },
                BLZT: "2",
                JFSY: '0'
            },
            include: [{
                model: orm.CustomerInfo,
                as: "Customers"
            }],
            order: [
                ['SQSJ', 'desc']
            ]
        });
        let responseObjects = sq.map(u => {
            let sqxlmArr = [];
            let sqxlmStr;
            if (u.SQXLM.slice(0, 1) == '[') {
                let sqxlmObjArr = JSON.parse(u.SQXLM);
                for (let i = 0; i < sqxlmObjArr.length; i++) {
                    sqxlmArr.push(sqxlmObjArr[i].value);
                }
                sqxlmStr = sqxlmArr.join(',');
            } else {
                sqxlmStr = u.SQXLM
            }
            return {
                yhm: u.Customers.YHM,
                xzqdm: u.SQXZDM,
                dwmc: u.Customers.YHDW,
                lxdh: u.Customers.LXDH,
                yxdz: u.Customers.YXDZ,
                blzt: u.BLZT,
                sqlx: u.SQLX,
                cpmc: u.CPMC,
                jmg: u.SFJMG,
                jfsy: u.JFSY,
                sqsl: u.SQSL,
                jzsj: u.JZSJ,
                swhtmc: u.SWHTMC,
                swlxr: u.SWLXR,
                xmddm: u.XMDDM,
                sqxks: u.SQXKS,
                sqxlm: sqxlmStr,
                index: u.INDEX,
                yhrzxxIndex: u.YHRZXX_INDEX,
                cpdm: u.CPDM,
                sqsj: u.SQSJ
            }
        });

        if (responseObjects.length == 0) {
            throw new AppCommonError("当前用户无待审申请", "20022");
        }
        return res.json(responseObjects);
    } else {
        if (userQx.indexOf("3") > -1) {
            recordSearchCondition.push({
                CSR: payload.jsIndex
            });
            applicationSearchCondition.push("2");
        }
        if (userQx.indexOf("4") > -1) {
            recordSearchCondition.push({
                FSR: payload.jsIndex
            });
            applicationSearchCondition.push("3");
        }
        // if (userQx.indexOf("5") > -1) {
        //     recordSearchCondition.push({
        //         SQSHR: payload.jsIndex
        //     });
        //     applicationSearchCondition.push("4");
        // }

        if (recordSearchCondition.length == 0) {
            throw new AppCommonError("当前用户无审核权限", "20021");
        }


        let uncheckedApplications = [];
        // or (a.SQSHR=\'" + payload.jsIndex + "\'and b.BLZT='4')
        orm.sequelize.query("SELECT a.JZSJ as XMJZSJ,b.*,c.YHM,c.LXDH,c.YHDW,c.SFNBCY,c.YXDZ FROM s_sj_sqdj a,s_sj_sqxx b,s_sj_yhrzxx c WHERE a.XMDDM=b.XMDDM and a.CPDM=b.CPDM and c.YHRZXX_INDEX=b.YHRZXX_INDEX and ((a.CSR=\'" + payload.jsIndex + "\'and b.BLZT='2') or (a.FSR=\'" + payload.jsIndex + "\'and b.BLZT='3')) group by b.SQXX_INDEX", {
                type: orm.sequelize.QueryTypes.SELECT
            })
            .then(results => {
                let responseObj = results.map(result => {
                    let sqxlmArr = [];
                    let sqxlmStr;
                    if (result.SQXLM.slice(0, 1) == '[') {
                        let sqxlmObjArr = JSON.parse(result.SQXLM);
                        for (let i = 0; i < sqxlmObjArr.length; i++) {
                            sqxlmArr.push(sqxlmObjArr[i].value);
                        }
                        sqxlmStr = sqxlmArr.join(',');
                    } else {
                        sqxlmStr = result.SQXLM
                    }
                    return {
                        yhm: result.YHM,
                        xzqdm: result.SQXZDM,
                        dwmc: result.YHDW,
                        lxdh: result.LXDH,
                        yxdz: result.YXDZ,
                        blzt: result.BLZT,
                        sqlx: result.SQLX,
                        cpmc: result.CPMC,
                        jmg: result.SFJMG,
                        jfsy: result.JFSY,
                        sqsl: result.SQSL,
                        jzsj: result.JZSJ,
                        swhtmc: result.SWHTMC,
                        swlxr: result.SWLXR,
                        xmddm: result.XMDDM,
                        sqxks: result.SQXKS,
                        sqxlm: sqxlmStr,
                        index: result.SQXX_INDEX,
                        xmjzsj: result.XMJZSJ,
                        sfnbcy: result.SFNBCY,
                        yhrzxxIndex: result.YHRZXX_INDEX,
                        cpdm: result.CPDM,
                        sqsj: result.SQSJ
                    }
                })



                for (let i = 0; i < applicationSearchCondition.length; i++) {
                    const blzt = applicationSearchCondition[i];
                    responseObj.forEach(item => {
                        if (item.blzt === blzt) {
                            uncheckedApplications.push(item)
                        }
                    });
                }

                // 选出甲方用户申请或者内部成员为甲方申请的信息
                uncheckedApplications = uncheckedApplications.filter(item =>
                    item.sfnbcy == "0" || (item.sfnbcy == "1" && item.jfsy == '1'));


                return res.json(uncheckedApplications);

            })



        // let applications = await orm.ApplicationRecord.findAll({
        //     include: [{
        //         model: orm.ApplicationInfo,
        //         where: { 
        //                     CPDM: orm.Sequelize.col('orm.ApplicationRecord.CPDM'),
        //                     XMDDM: orm.Sequelize.col('orm.ApplicationRecord.XMDDM'),
        //                     // BLZT: '2',
        //                }
        //     }],
        //     where:{
        //         CSR:payload.jsIndex
        //     }
        // });

        // return res.json(applications);


        // let userApplication = await orm.ApplicationRecord.findAll({
        //     where:
        //         {
        //             [orm.Sequelize.Op.or]: recordSearchCondition
        //         },
        //     attributes: ['XMDDM', 'CPDM', 'JZSJ']
        // });



        // if (!userApplication)
        //     throw new AppCommonError("当前用户无待审申请", "20022");

        // let allApplications = [];
        // console.log(new Date());

        // for (let app of userApplication) {
        //     let uncheckedApplications = await orm.ApplicationInfo.findAll({
        //         where: {
        //             BLZT: { [orm.Sequelize.Op.in]: applicationSearchCondition },
        //             XMDDM: app.XMDDM,
        //             CPDM: app.CPDM,
        //         },
        //         include: [{ model: orm.CustomerInfo, as: "Customers" }]
        //     });

        //     // 选出甲方用户申请或者内部成员为甲方申请的信息
        //     uncheckedApplications = uncheckedApplications.filter(item =>
        //         item.Customers.SFNBCY == "0" ||
        //         (item.Customers.SFNBCY == "1" && item.JFSY == '1'));


        //     let responseObjects = uncheckedApplications.map(u => {
        //         return {
        //             yhm: u.Customers.YHM,
        //             xzqdm: u.SQXZDM,
        //             dwmc: u.Customers.YHDW,
        //             lxdh: u.Customers.LXDH,
        //             blzt: u.BLZT,
        //             sqlx: u.SQLX,
        //             cpmc: u.CPMC,
        //             jmg: u.SFJMG,
        //             jfsy: u.JFSY,
        //             sqsl: u.SQSL,
        //             jzsj: u.JZSJ,
        //             swhtmc: u.SWHTMC,
        //             swlxr: u.SWLXR,
        //             xmddm: u.XMDDM,
        //             sqxks: u.SQXKS,
        //             sqxlm: u.SQXLM,
        //             index: u.INDEX,
        //             xmjzsj: app.JZSJ
        //         }
        //     });

        //     allApplications = allApplications.concat(responseObjects);
        // }

        //     const applicationsResults = [];

        //     for (let i = 0; i < applicationSearchCondition.length; i++) {
        //         const blzt = applicationSearchCondition[i];
        //         allApplications.forEach(item => {
        //             if (item.blzt === blzt) {
        //                 applicationsResults.push(item)
        //             }
        //         }); 
        //     }

        //     if (applicationsResults.length == 0) {
        //         throw new AppCommonError("当前用户无待审申请", "20022");
        //     }

        //     return res.json(applicationsResults);


        // if (allApplications.length == 0) {
        //     throw new AppCommonError("当前用户无待审申请", "20022");
        // }

        // return res.json(allApplications);
    }
}));


// router.post('/kkk', catchAsyncErrors(async (req, res) => {
//     // let yhInfo = await orm.CustomerInfo.findAll({ where: { INDEX: req.body.index }, attributes: ['LXDH','ZT'] })
//     // res.json({lxdh:yhInfo[0].LXDH})
//     let sqInfo = await orm.ApplicationInfo.findAll({ where: { INDEX: req.body.index }, attributes: ['YHRZXX_INDEX','BLZT'] });

//     let blzt = sqInfo[0].BLZT;
//     let lxdh = await orm.CustomerInfo.findAll({ where: { INDEX: sqInfo[0].YHRZXX_INDEX }, attributes: ['LXDH'] });

//     res.json({lxdh:lxdh[0].LXDH,zt:blzt})

// }));


//// 提交用户审核
router.post('/checked_users', catchAsyncErrors(async (req, res) => {
    let payload = jwt.decode(req.cookies.jwt);
    if (!payload || !payload.jsIndex || !payload.roleID) {
        throw new AppCommonError("无法获取已登陆信息，请重新登陆", "0005");
    }

    let userQx = payload.roleID.split(',');
    let indexes_update = req.body.index.split(',');
    let rows = 0;
    let tg = req.body.sftg == "1";
    // let rzzt = req.body.rzzt;

    let yhInfo = await orm.CustomerInfo.findAll({
        where: {
            INDEX: req.body.index
        },
        attributes: ['LXDH', 'ZT', 'OPENID']
    });
    let rzzt = yhInfo[0].ZT;
    let lxdh = yhInfo[0].LXDH;
    let openid = yhInfo[0].OPENID;


    let reqTokenData = {
        method: 'get',
        body: {},
        json: true,
        url: ADDRESS_ACCESSTOKEN
    };
    let body = await requester(reqTokenData);

    if (userQx.indexOf('7') > -1) {
        let jsUser = await orm.User.findOne({
            where: {
                INDEX: payload.jsIndex
            },
            attributes: ['SSXMZ']
        });
        if (!jsUser.SSXMZ) {
            throw new AppCommonError("当前用户项目组为空");
        }
        let yhrzUSer = await orm.CustomerInfo.findAll({
            where: {
                YHDW: jsUser.SSXMZ,
                SFNBCY: "1",
                INDEX: {
                    [orm.Sequelize.Op.in]: indexes_update
                }
            },
            include: [{
                model: orm.ApplicationInfo,
                as: 'Applications'
            }]
        });
        if (!yhrzUSer || yhrzUSer.length == 0) {
            throw new AppCommonError(jsUser.SSXMZ + "未包含当前用户信息");
        }

        if (tg) {
            for (let yh of yhrzUSer) {
                yh.ZT = '4';
                let apps = yh.Applications.filter(item => item.BLZT == "1");
                for (let a of apps) {
                    a.BLZT = "2";
                    a.save().then(() => {}).catch(err => {});
                }
                yh.save().then(() => {}).catch(err => {});
            }

            await wechatOper.sendTemplateMessage(openid, body.access_token, rzzt, tg, req.body.shyj, "内部用户认证");

        } else {
            for (let yh of yhrzUSer) {
                yh.ZT = '9';
                yh.BZ = req.body.shyj;
                let apps = yh.Applications.filter(item => item.BLZT == "1");
                for (let a of apps) {
                    a.BLZT = "2";
                    a.save().then(() => {}).catch(err => {});
                }
                yh.save().then(() => {}).catch(err => {});
            }

            console.log(openid);
            await wechatOper.sendTemplateMessage(openid, body.access_token, rzzt, tg, req.body.shyj, "内部用户认证");
        }



        return res.json({
            code: "0000"
        });

    } else {
        if (userQx.indexOf("4") > -1) {
            if (tg) {
                let count = await orm.CustomerInfo.findAll({
                    where: {
                        INDEX: {
                            [orm.Sequelize.Op.in]: indexes_update
                        },
                        ZT: "2"
                    },
                    include: [{
                        model: orm.ApplicationInfo,
                        as: 'Applications'
                    }]
                });
                if (count.length > 0) {
                    for (let c of count) {
                        c.ZT = "4";
                        let apps = c.Applications.filter(item => item.BLZT == "1");
                        for (let a of apps) {
                            a.BLZT = "2";
                            a.save().then(() => {}).catch(err => {});
                        }
                        c.save().then(() => {
                            rows = rows + 1;
                        }).catch(err => {});
                    }
                }

                //短信内容也需要修改
                if (rzzt === '2') {
                    if (!openid) {
                        await authOper.sendMessage(lxdh, config.allow_user_sendMessage_3);
                    } else {
                        await wechatOper.sendTemplateMessage(openid, body.access_token, rzzt, tg, req.body.shyj, "用户认证");
                    }
                }


            } else {
                let count = await orm.CustomerInfo.update({
                    ZT: "9",
                    BZ: req.body.shyj
                }, {
                    where: {
                        INDEX: {
                            [orm.Sequelize.Op.in]: indexes_update
                        },
                        ZT: "2"
                    }
                });
                rows = rows + count[0];
                if (rzzt === '2') {
                    if (!openid) {
                        await authOper.sendMessage(lxdh, config.refuse_user_sendMessage_3 + '，拒绝理由：' + req.body.shyj + ')');
                    } else {
                        await wechatOper.sendTemplateMessage(openid, body.access_token, rzzt, tg, req.body.shyj, "用户认证");
                    }
                }

            }
        }

        // if (userQx.indexOf("4") > -1) {
        //     if (tg) {
        //         let count = await orm.CustomerInfo.update({
        //             ZT: "3"
        //         }, {
        //             where: {
        //                 INDEX: {
        //                     [orm.Sequelize.Op.in]: indexes_update
        //                 },
        //                 ZT: "2"
        //             }
        //         });
        //         rows = rows + count[0];
        //         if (rzzt === '2') {
        //             await authOper.sendMessage(lxdh, config.allow_user_sendMessage_2);
        //         }
        //     } else {
        //         let count = await orm.CustomerInfo.update({
        //             ZT: "9",
        //             BZ: req.body.shyj
        //         }, {
        //             where: {
        //                 INDEX: {
        //                     [orm.Sequelize.Op.in]: indexes_update
        //                 },
        //                 ZT: "2"
        //             }
        //         });
        //         rows = rows + count[0];
        //         if (rzzt === '2') {
        //             await authOper.sendMessage(lxdh, config.refuse_user_sendMessage_2 + ',拒绝理由：' + req.body.shyj + ')');
        //         }
        //     }
        // }

        if (userQx.indexOf("3") > -1) {
            if (tg) {
                let count = await orm.CustomerInfo.update({
                    ZT: "2"
                }, {
                    where: {
                        INDEX: {
                            [orm.Sequelize.Op.in]: indexes_update
                        },
                        ZT: "1"
                    }
                });
                rows = rows + count[0];
                if (rzzt === '1') {
                    if (!openid) {
                        await authOper.sendMessage(lxdh, config.allow_user_sendMessage_1);
                    } else {
                        await wechatOper.sendTemplateMessage(openid, body.access_token, rzzt, tg, req.body.shyj, "用户认证");
                    }


                    let djxx = await orm.ApplicationRecord.findOne({
                        where: {
                            XMDDM: req.body.xmddm,
                            CPDM: {
                                [orm.Sequelize.Op.ne]: '0'
                            }
                        },
                        include: [{
                            model: orm.User,
                            as: 'Fsr'
                        }]
                    });

                    let openid_jscy = djxx.Fsr.OPENID;

                    console.log(openid_jscy);


                    await wechatOper.remindCheckMessage(openid_jscy, body.access_token);

                }

            } else {
                let count = await orm.CustomerInfo.update({
                    ZT: "9",
                    BZ: req.body.shyj
                }, {
                    where: {
                        INDEX: {
                            [orm.Sequelize.Op.in]: indexes_update
                        },
                        ZT: "1"
                    }
                });
                rows = rows + count[0];
                if (rzzt === '1') {
                    if (!openid) {
                        await authOper.sendMessage(lxdh, config.refuse_user_sendMessage_1 + ',拒绝理由：' + req.body.shyj + ')');
                    } else {
                        await wechatOper.sendTemplateMessage(openid, body.access_token, rzzt, tg, req.body.shyj, "用户认证");
                    }

                }
            }
        }



        // if (rows == indexes_update.length) {
        return res.json({
            code: "0000"
        });
        // }
        // else {
        //     console.log(rows);
        //     throw new AppCommonError("部分审核状态更新失败", "0006");
        // }
    }



}));

//// 提交申请审核
router.post('/checked_applications', catchAsyncErrors(async (req, res) => {
    let payload = jwt.decode(req.cookies.jwt);
    if (!payload || !payload.jsIndex || !payload.roleID) {
        throw new AppCommonError("无法获取已登陆信息，请重新登陆", "0005");
    }

    let userQx = payload.roleID.split(',');
    let indexes_update = req.body.index.split(',');
    let rows = 0;
    let tg = req.body.sftg == "1";
    // let blzt = req.body.blzt;

    let sqInfo = await orm.ApplicationInfo.findAll({
        where: {
            INDEX: req.body.index
        },
        attributes: ['YHRZXX_INDEX', 'BLZT']
    });

    let blzt = sqInfo[0].BLZT;
    let lxdhObj = await orm.CustomerInfo.findAll({
        where: {
            INDEX: sqInfo[0].YHRZXX_INDEX
        },
        attributes: ['LXDH', 'OPENID']
    });

    let lxdh = lxdhObj[0].LXDH;
    let openid = lxdhObj[0].OPENID;
    //// 申请信息
    let rows_submit = await orm.ApplicationInfo.findAll({
        where: {
            INDEX: {
                [orm.Sequelize.Op.in]: indexes_update
            }
        },
        include: [{
            model: orm.CustomerInfo,
            as: "Customers"
        }]
    });

    let reqTokenData = {
        method: 'get',
        body: {},
        json: true,
        url: ADDRESS_ACCESSTOKEN
    };
    let body = await requester(reqTokenData);

    //// 项目经理审核
    if (userQx.indexOf('7') > -1) {
        let rows_update = rows_submit.filter(item => item.BLZT == "2" && item.Customers.SFNBCY == "1");
        if (rows_update && rows_update.length != 0) {
            if (tg) {
                let count = await orm.ApplicationInfo.update({
                    BLZT: "5"
                }, {
                    where: {
                        INDEX: {
                            [orm.Sequelize.Op.in]: rows_update.map(item => item.INDEX)
                        },
                        BLZT: "2"
                    }
                });
                rows = rows + count[0];
                let rows_make = rows_update.filter(item => item.SQLX == "1" && item.SFJMG == "0"  && item.CPDM != '10'&& item.CPDM != '100'&& item.CPDM != '111'&& item.CPDM != '302');
                MakeAuthority(rows_make.map(item => item.INDEX));
                if (blzt === '2') {
                    if (!openid) {
                        await authOper.sendMessage(lxdh, config.allow_application_sendMessage_nbsq);
                    } else {
                        await wechatOper.sendTemplateMessage(openid, body.access_token, blzt, tg, req.body.shyj, "内部申请审核");
                    }
                }

            } else {
                let count = await orm.ApplicationInfo.update({
                    BLZT: "9",
                    BZ: `{"shyj":"${req.body.shyj}","shzt":"审核"}`
                }, {
                    where: {
                        INDEX: {
                            [orm.Sequelize.Op.in]: indexes_update
                        },
                        BLZT: "2"
                    }
                });
                rows = rows + count[0];
                if (blzt === '2') {
                    if (!openid) {
                        await authOper.sendMessage(lxdh, config.refuse_application_sendMessage_nbsq);
                    } else {
                        await wechatOper.sendTemplateMessage(openid, body.access_token, blzt, tg, req.body.shyj, "内部申请审核");
                    }

                }
            }
        }
    }

    //// 复审
    if (userQx.indexOf("4") > -1) {
        let rows_update = rows_submit.filter(item => item.BLZT == "3");
        if (rows_update && rows_update.length != 0) {
            if (tg) {
                let count = await orm.ApplicationInfo.update({
                    BLZT: "5"
                }, {
                    where: {
                        INDEX: {
                            [orm.Sequelize.Op.in]: indexes_update
                        },
                        BLZT: "3"
                    }
                });
                rows = rows + count[0];
                let rows_make = rows_update.filter(item => item.SQLX == "1" && item.SFJMG == "0" && item.CPDM != '10'&& item.CPDM != '100'&& item.CPDM != '111'&& item.CPDM != '302');
                MakeAuthority(rows_make.map(item => item.INDEX));
                if (blzt === '3') {
                    if (!openid) {
                        await authOper.sendMessage(lxdh, config.allow_application_sendMessage_3);
                    } else {
                        await wechatOper.sendTemplateMessage(openid, body.access_token, blzt, tg, req.body.shyj, "申请审核");
                    }
                }
            } else {
                let count = await orm.ApplicationInfo.update({
                    BLZT: "9",
                    BZ: `{"shyj":"${req.body.shyj}","shzt":"复审"}`
                }, {
                    where: {
                        INDEX: {
                            [orm.Sequelize.Op.in]: indexes_update
                        },
                        BLZT: "3"
                    }
                });
                rows = rows + count[0];
                if (blzt === '3') {
                    if (!openid) {
                        await authOper.sendMessage(lxdh, config.refuse_application_sendMessage_3 + '，拒绝理由：' + req.body.shyj + ')');
                    } else {
                        await wechatOper.sendTemplateMessage(openid, body.access_token, blzt, tg, req.body.shyj, "申请审核");
                    }
                }
            }
        }
    }

    // //// 二审
    // if (userQx.indexOf("4") > -1) {
    //     let rows_update = rows_submit.filter(item => item.BLZT == "3");
    //     if (rows_update && rows_update.length != 0) {
    //         if (tg) {
    //             let count = await orm.ApplicationInfo.update({
    //                 BLZT: "4"
    //             }, {
    //                 where: {
    //                     INDEX: {
    //                         [orm.Sequelize.Op.in]: indexes_update
    //                     },
    //                     BLZT: "3"
    //                 }
    //             });
    //             rows = rows + count[0];
    //             if (blzt === '3') {
    //                 await authOper.sendMessage(lxdh, config.allow_application_sendMessage_2);
    //             }

    //         } else {
    //             let count = await orm.ApplicationInfo.update({
    //                 BLZT: "9",
    //                 BZ: `{"shyj":"${req.body.shyj}","shzt":"二审"}`
    //             }, {
    //                 where: {
    //                     INDEX: {
    //                         [orm.Sequelize.Op.in]: indexes_update
    //                     },
    //                     BLZT: "3"
    //                 }
    //             });
    //             rows = rows + count[0];
    //             if (blzt === '3') {
    //                 await authOper.sendMessage(lxdh, config.refuse_application_sendMessage_2 + '，拒绝理由：' + req.body.shyj + ')');
    //             }

    //         }
    //     }
    // }

    //// 一审
    if (userQx.indexOf("3") > -1) {
        //// 甲方申请或者内部帮甲方申请的都要走一二三审模式
        let rows_update = rows_submit.filter(item => item.BLZT == "2" &&
            (item.Customers.SFNBCY == "0" || (item.Customers.SFNBCY == "1" && item.JFSY == "1")));
        if (rows_update && rows_update.length != 0) {
            if (tg) {
                let count = await orm.ApplicationInfo.update({
                    BLZT: "3"
                }, {
                    where: {
                        INDEX: {
                            [orm.Sequelize.Op.in]: indexes_update
                        },
                        BLZT: "2"
                    }
                });
                rows = rows + count[0];
                if (blzt === '2') {
                    if (!openid) {
                        await authOper.sendMessage(lxdh, config.allow_application_sendMessage_1);

                    } else {
                        await wechatOper.sendTemplateMessage(openid, body.access_token, blzt, tg, req.body.shyj, "申请审核");

                    }

                    let djxx = await orm.ApplicationRecord.findOne({
                        where: {
                            CPDM: req.body.cpdm,
                            XMDDM: req.body.xmddm
                        },
                        include: [{
                            model: orm.User,
                            as: "Fsr"
                        }]
                    });

                    console.log(djxx);

                    let openid_jscy = djxx.Fsr.OPENID;

                    await wechatOper.remindCheckMessage(openid_jscy, body.access_token, blzt);

                }
            } else {
                let count = await orm.ApplicationInfo.update({
                    BLZT: "9",
                    BZ: `{"shyj":"${req.body.shyj}","shzt":"初审"}`
                }, {
                    where: {
                        INDEX: {
                            [orm.Sequelize.Op.in]: indexes_update
                        },
                        BLZT: "2"
                    }
                });
                rows = rows + count[0];
                if (blzt === '2') {
                    if (!openid) {
                        await authOper.sendMessage(lxdh, config.refuse_application_sendMessage_1 + '，拒绝理由：' + req.body.shyj + ')');
                    } else {
                        await wechatOper.sendTemplateMessage(openid, body.access_token, blzt, tg, req.body.shyj, "申请审核");
                    }
                }
            }
        }
    }

    //console.log('提交成功1');
    return res.json({
        code: "0000"
    });
}));

//// 获取需要手工制作的申请
router.get('/need_authority', catchAsyncErrors(async (req, res) => {
    let payload = jwt.decode(req.cookies.jwt);
    if (!payload || !payload.jsIndex || !payload.roleID) {
        throw new AppCommonError("无法获取已登陆信息，请重新登陆", "0005");
    }

    if (!(payload.roleID.split(',').indexOf('8') > -1)) {
        throw new AppCommonError("当前用户无授权制作权限", "0005");
    }

    let need_authorities = await orm.ApplicationInfo.findAll({
        where: {
            [orm.Sequelize.Op.or]: [{
                BLZT: "5"
            }, {
                BLZT: "6"
            }, {
                BLZT: "10"
            }]
        },
        include: [{
            model: orm.CustomerInfo,
            as: "Customers"
        }]
    });
    need_authorities = need_authorities.filter((x) => {
        if (x.Customers)
            return x;
    });
    let responseObjects = need_authorities.map(u => {
        let sqxlmArr = [];
        let sqxlmStr;
        if (u.SQXLM.slice(0, 1) == '[') {
            let sqxlmObjArr = JSON.parse(u.SQXLM);
            for (let i = 0; i < sqxlmObjArr.length; i++) {
                sqxlmArr.push(sqxlmObjArr[i].value);
            }
            sqxlmStr = sqxlmArr.join(',');
        } else {
            sqxlmStr = u.SQXLM
        }
        return {
            yhm: u.Customers.YHM,
            xzqdm: u.SQXZDM,
            dwmc: u.Customers.YHDW,
            lxdh: u.Customers.LXDH,
            blzt: u.BLZT,
            sqlx: u.SQLX,
            cpmc: u.CPMC,
            jmg: u.SFJMG,
            sqsl: u.SQSL,
            jzsj: u.JZSJ,
            swhtmc: u.SWHTMC,
            swlxr: u.SWLXR,
            xmddm: u.XMDDM,
            sqxks: u.SQXKS,
            sqxlm: sqxlmStr,
            index: u.INDEX,
            jfsy: u.JFSY,
            yxdz: u.Customers.YXDZ
        }
    });
    if (!responseObjects || responseObjects.length == 0) {
        throw new AppCommonError("当前无待制作授权", "30022");
    }
    res.json(responseObjects);
}));

router.post('/checked_authority', catchAsyncErrors(async (req, res) => {
    let payload = jwt.decode(req.cookies.jwt);
    if (!payload || !payload.jsIndex || !payload.roleID) {
        throw new AppCommonError("无法获取已登陆信息，请重新登陆", "0005");
    }

    if (!(payload.roleID.split(',').indexOf('8') > -1)) {
        throw new AppCommonError("当前用户无授权制作权限", "0005");
    }

    let reqTokenData = {
        method: 'get',
        body: {},
        json: true,
        url: ADDRESS_ACCESSTOKEN
    };
    let body = await requester(reqTokenData);

    let sqInfo = await orm.ApplicationInfo.findAll({
        where: {
            INDEX: req.body.index
        },
        attributes: ['YHRZXX_INDEX', 'BLZT']
    });

    let yhInfo = await orm.CustomerInfo.findAll({
        where: {
            INDEX: sqInfo[0].YHRZXX_INDEX
        },
        attributes: ['LXDH', 'OPENID']
    });

    let lxdh = yhInfo[0].LXDH;
    let openid = yhInfo[0].OPENID;
    let blzt;

    let indexes_update = req.body.index.split(",");
    let tg = req.body.sftg == "1";
    let jmg = req.body.jmg == "使用";
    let sqsl = req.body.sqsl;
    let need_authorities = await orm.ApplicationInfo.findAll({
        where: {
            INDEX: {
                [orm.Sequelize.Op.in]: indexes_update
            }
        }
    });
    let update_count = 0;
    if (!need_authorities || need_authorities.length == 0) {
        return res.json({
            code: "0000"
        });
    } else {
        if (tg) {
            if (jmg) {
                let count = await orm.ApplicationInfo.update({
                    BLZT: "8a"
                }, {
                    where: {
                        INDEX: {
                            [orm.Sequelize.Op.in]: indexes_update
                        }
                    }
                });
                await wechatOper.sendTemplateMessage(openid, body.access_token, blzt, tg, sqsl, "制作授权加密狗");
            } else {
                let count = await orm.ApplicationInfo.update({
                    BLZT: "8"
                }, {
                    where: {
                        INDEX: {
                            [orm.Sequelize.Op.in]: indexes_update
                        }
                    }
                });
                update_count = count[0];
                await wechatOper.sendTemplateMessage(openid, body.access_token, blzt, tg, req.body.shyj, "制作授权");
                // await authOper.sendMessage(req.body.lxdh, config.allow_sendMessage_create);
            }
            // await wechatOper.sendTemplateMessage(openid, body.access_token, blzt, tg, req.body.shyj, "制作授权");
        } else {
            let count = await orm.ApplicationInfo.update({
                BLZT: "9",
                BZ: `{"shyj":"${req.body.shyj}","shzt":"制作授权"}`
            }, {
                where: {
                    INDEX: {
                        [orm.Sequelize.Op.in]: indexes_update
                    }
                }
            });
            update_count = count[0];
            // await authOper.sendMessage(req.body.lxdh, config.refuse_sendMessage_create + '。' + req.body.shyj);
            await wechatOper.sendTemplateMessage(openid, body.access_token, blzt, tg, req.body.shyj, "制作授权");

        }
    }

    return res.json({
        code: "0000"
    });

}));

//
router.get('/need_sendauthority', catchAsyncErrors(async (req, res) => {
    let payload = jwt.decode(req.cookies.jwt);
    if (!payload || !payload.jsIndex || !payload.roleID) {
        throw new AppCommonError("无法获取已登陆信息，请重新登陆", "0005");
    }

    if (!(payload.roleID.split(',').indexOf('9') > -1)) {
        throw new AppCommonError("当前用户无发送授权权限", "0005");
    }

    let need_sendAuthorities = await orm.ApplicationInfo.findAll({
        where: {
            BLZT: "8a"
        },
        include: [{
                model: orm.CustomerInfo,
                as: "Customers"
            },
            {
                model: orm.PostInfo,
                as: "Postinfo"
            },
            {
                model: orm.InvoiceInfo,
                as: "Invoiceinfo"
            }
        ]
    });

    let responseObjects = need_sendAuthorities.map(u => {
        return {
            index: u.INDEX,
            sqr: u.Customers.YHM,
            sqrdw: u.Customers.YHDW,
            lxdh: u.Customers.LXDH,
            sqsl: u.SQSL,
            money: u.SQSL * 500,
            sjr: u.Postinfo.SJR,
            sjrlxdh: u.Postinfo.LXDH,
            sjrdz: u.Postinfo.ADDRESS,
            company: u.Invoiceinfo.COMPANY_NAME,
            companydz: u.Invoiceinfo.COMPANY_ADDRESS,
            companylxdh: u.Invoiceinfo.COMPANY_TEL,
            taxobjectid: u.Invoiceinfo.TAX_OBJECTID,
            account: u.Invoiceinfo.ACCOUNT,
            bank: u.Invoiceinfo.BANK
        }
    })

    return res.json(responseObjects);
}))

router.post('/checked_sendauthority', catchAsyncErrors(async (req, res) => {
    let payload = jwt.decode(req.cookies.jwt);
    if (!payload || !payload.jsIndex || !payload.roleID) {
        throw new AppCommonError("无法获取已登陆信息，请重新登陆", "0005");
    }

    if (!(payload.roleID.split(',').indexOf('9') > -1)) {
        throw new AppCommonError("当前用户无发送授权权限", "0005");
    }

    let reqTokenData = {
        method: 'get',
        body: {},
        json: true,
        url: ADDRESS_ACCESSTOKEN
    };
    let body = await requester(reqTokenData);

    let sqInfo = await orm.ApplicationInfo.findAll({
        where: {
            INDEX: req.body.index
        },
        attributes: ['YHRZXX_INDEX', 'BLZT']
    });

    let yhInfo = await orm.CustomerInfo.findAll({
        where: {
            INDEX: sqInfo[0].YHRZXX_INDEX
        },
        attributes: ['LXDH', 'OPENID']
    });

    let lxdh = yhInfo[0].LXDH;
    let openid = yhInfo[0].OPENID;
    let blzt;


    let indexes_update = req.body.index.split(",");
    let tg = req.body.sftg == "1";
    let need_sendAuthorities = await orm.ApplicationInfo.findAll({
        where: {
            INDEX: {
                [orm.Sequelize.Op.in]: indexes_update
            }
        }
    });

    if (!need_sendAuthorities || need_sendAuthorities.length == 0) {
        return res.json({
            code: "0000"
        });
    } else {
        if (tg) {
            let count = await orm.ApplicationInfo.update({
                BLZT: "8"
            }, {
                where: {
                    INDEX: {
                        [orm.Sequelize.Op.in]: indexes_update
                    }
                }
            });
            // 发送订单号信息
            // await authOper.sendMessage(req.body.lxdh, config.allow_sendMessage_create);
            await wechatOper.sendTemplateMessage(openid, body.access_token, blzt, tg, req.body.postnumber, "发送授权");

        } else {
            let count = await orm.ApplicationInfo.update({
                BLZT: "9",
                BZ: `{"shyj":"${req.body.shyj}","shzt":"发送授权"}`
            }, {
                where: {
                    INDEX: {
                        [orm.Sequelize.Op.in]: indexes_update
                    }
                }
            });
            // await authOper.sendMessage(req.body.lxdh, config.refuse_sendMessage_create + '。' + req.body.shyj);
            await wechatOper.sendTemplateMessage(openid, body.access_token, blzt, tg, req.body.shyj, "发送授权");
        }
    }
    return res.json({
        code: "0000"
    });
}))

//// 发送验证码
router.post('/send_authcode', catchAsyncErrors(async (req, res) => {
    // let payload = jwt.decode(req.cookies.jwt);
    // if (!payload || !payload.phone)
    //     throw new AppCommonError('登录信息无效', '0001');

    // await authOper.getAuthCode(payload.phone);
    await authOper.getAuthCode(req.body.phone);



    // await authOper.sendMessage(payload.phone, '申请被拒绝1');
    // await authOper.sendMessage(payload.phone, '申请被拒绝2');
    // await authOper.sendMessage(payload.phone, '申请被拒绝3');
    return res.json({
        code: "0000",
        msg: "发送成功"
    });
}));

//// 发送短信通知
// router.post('/send_message', catchAsyncErrors(async (req, res) => {
//     let payload = jwt.decode(req.cookies.jwt);
//     if (!payload || !payload.phone)
//         throw new AppCommonError('登录信息无效', '0001');

//     await authOper.sendMessage(payload.phone, req.body.msg);
//     // await authOper.sendMessage(payload.phone, '申请被拒绝2');
//     // await authOper.sendMessage(payload.phone, '申请被拒绝3');

//     return res.json({ code: "0000", msg: "发送成功" });
// }));


async function MakeAuthority(indexes) {
    let rows = await orm.ApplicationInfo.findAll({
        where: {
            INDEX: {
                [orm.Sequelize.Op.in]: indexes
            },
            BLZT: "5"
        },
        include: [{
            model: orm.CustomerInfo,
            as: "Customers"
        }]
    });
    let promises = rows.map(item => Authority(item));
    await Promise.all(promises);
}

// 制作授权并发送邮件
async function Authority(appInfo) {
    try {
        postOption.body = {
            SQLX: (appInfo.SQLX - 1).toString(),
            ListXZQDM: appInfo.SQXZDM.split(','),
            CPDM: appInfo.CPDM,
            JZSJ: appInfo.JZSJ,
            SQSL: appInfo.SQSL,
            // ListSQXLM: appInfo.SQXLM.split(','),
            // ListSQXLM: sqxlmArr,
            // ListDatName: datArr,
            IsJMG: appInfo.SFJMG == "1",
            SQXKS: appInfo.SQXKS,
            NumJMG: 12345
        };

        if (appInfo.SQXLM.slice(0, 1) == '[') {
            let sqxlmAndDatArr = JSON.parse(appInfo.SQXLM);
            let sqxlmArr = [];
            let datArr = [];

            for (let i = 0; i < sqxlmAndDatArr.length; i++) {
                datArr.push(sqxlmAndDatArr[i].name);
                sqxlmArr.push(sqxlmAndDatArr[i].value);
            }

            postOption.body.ListSQXLM = sqxlmArr;
            postOption.body.ListDatName = datArr;

        } else {
            postOption.body.ListSQXLM = appInfo.SQXLM.split(',');
            postOption.body.ListDatName = appInfo.SQXLM.split(',');
        }


        console.log(postOption.body);

        let body = await requester(postOption); // 调用制作授权服务
        appInfo.SQNR = body;
        await SendAuthority([appInfo]); // 发送授权
        appInfo.BLZT = "8";
        await appInfo.save();
    } catch (error) {
        appInfo.BLZT = "6";
        if (error instanceof AppCommonError) {
            if (error.code == '0002')
                appInfo.BLZT = "10";
        }

        appInfo.save().catch(error => {
            console.warn("无法更新申请状态_" + appInfo.INDEX + "_" + error.message);
        })
    }
}

//// 发送邮件
async function SendAuthority(appInfos) {
    try {
        let bIsSuccess = true;
        for (let item of appInfos) {
            await mailerSender.SendMail(item.Customers.YXDZ, `${item.CPMC}(${item.SQXZDM})授权文件`, item.SQNR);
        }
    } catch (error) {
        throw error;
    }
}

//-----------------------------管理系统接口--------------------------------//

router.get('/suggestionsjscy', catchAsyncErrors(async (req, res) => {

    let jsdms = await orm.option.JSXX.findAll();
    let jsdm = jsdms.map(d => {
        return {
            value: d.DM,
            label: d.MC
        }
    });


    let ssbms = await orm.User.aggregate("SSBM", 'DISTINCT', {
        plain: false
    });
    let ssbm = ssbms.map(u => {
        return {
            value: u.DISTINCT
        }
    });


    let ssxmzs = await orm.User.aggregate("SSXMZ", 'DISTINCT', {
        plain: false
    });
    let ssxmz = ssxmzs.map(u => {
        return {
            value: u.DISTINCT
        }
    });

    return res.json({
        code: "0000",
        data: {
            'jsdm': jsdm,
            'ssbm': ssbm,
            'ssxmz': ssxmz
        }
    })
}));

router.get('/selectionscpdj', catchAsyncErrors(async (req, res) => {
    let dwdmArray = await orm.option.DWXX.findAll();
    let dwdm = dwdmArray.map(d => {
        return {
            value: d.DM,
            label: d.DM + ' ' + d.MC,
            index: d.INDEX
        }
    });

    let dwmcArray = await orm.option.DWXX.findAll();
    let dwmc = dwmcArray.map(d => {
        return {
            value: d.MC,
            label: d.MC,
            index: d.INDEX
        }
    });

    let cpdmArray = await orm.option.CPLX.findAll();
    let cpdm = cpdmArray.map(d => {
        return {
            value: d.DM,
            label: d.MC + '(' + d.DM + ')',
            index: d.INDEX
        }
    });

    let xmjlArray = await orm.User.findAll({
        where: {
            // [orm.Sequelize.Op.or]: [{
            //     jsdm: 7
            // }, {
            //     jsdm: {
            //         [orm.Sequelize.Op.like]: '7,%'
            //     }
            // }, {
            //     jsdm: {
            //         [orm.Sequelize.Op.like]: '%,7,%'
            //     }
            // }, {
            //     jsdm: {
            //         [orm.Sequelize.Op.like]: '%,7'
            //     }
            // }]
                   jsdm: {
                       [orm.Sequelize.Op.like]: '%7%'
                   }
        }
    });
    let xmjl = xmjlArray.map(d => {
        return {
            value: d.INDEX,
            label: d.JSCY
        }
    });

    let csrArray = await orm.User.findAll({
        where: {
            // [orm.Sequelize.Op.or]: [{
            //     jsdm: 3
            // }, {
            //     jsdm: {
            //         [orm.Sequelize.Op.like]: '3,%'
            //     }
            // }, {
            //     jsdm: {
            //         [orm.Sequelize.Op.like]: '%,3,%'
            //     }
            // }, {
            //     jsdm: {
            //         [orm.Sequelize.Op.like]: '%,3'
            //     }
            // }]
            jsdm: {
                [orm.Sequelize.Op.like]: '%3%'
            }
        }
    });
    let csr = csrArray.map(d => {
        return {
            value: d.INDEX,
            label: d.JSCY
        }
    });

    let fsrArray = await orm.User.findAll({
        where: {
            // [orm.Sequelize.Op.or]: [{
            //     jsdm: 4
            // }, {
            //     jsdm: {
            //         [orm.Sequelize.Op.like]: '4,%'
            //     }
            // }, {
            //     jsdm: {
            //         [orm.Sequelize.Op.like]: '%,4,%'
            //     }
            // }, {
            //     jsdm: {
            //         [orm.Sequelize.Op.like]: '%,4'
            //     }
            // }]
            jsdm: {
                [orm.Sequelize.Op.like]: '%4%'
            }
        }
    });
    let fsr = fsrArray.map(d => {
        return {
            value: d.INDEX,
            label: d.JSCY
        }
    });

    // let sqshrArray = await orm.User.findAll({
    //     where: {
    //         [orm.Sequelize.Op.or]: [{
    //             jsdm: 5
    //         }, {
    //             jsdm: {
    //                 [orm.Sequelize.Op.like]: '5,%'
    //             }
    //         }, {
    //             jsdm: {
    //                 [orm.Sequelize.Op.like]: '%,5,%'
    //             }
    //         }, {
    //             jsdm: {
    //                 [orm.Sequelize.Op.like]: '%,5'
    //             }
    //         }]
    //     }
    // });
    // let sqshr = sqshrArray.map(d => {
    //     return {
    //         value: d.INDEX,
    //         label: d.JSCY
    //     }
    // });

    let lrrArray = await orm.User.findAll({
        where: {
            // [orm.Sequelize.Op.or]: [{
            //     jsdm: 6
            // }, {
            //     jsdm: {
            //         [orm.Sequelize.Op.like]: '6,%'
            //     }
            // }, {
            //     jsdm: {
            //         [orm.Sequelize.Op.like]: '%,6,%'
            //     }
            // }, {
            //     jsdm: {
            //         [orm.Sequelize.Op.like]: '%,6'
            //     }
            // }]
            jsdm: {
                [orm.Sequelize.Op.like]: '%6%'
            }
        }
    });
    let lrr = lrrArray.map(d => {
        return {
            value: d.INDEX,
            label: d.JSCY
        }
    });


    return res.json({
        code: "0000",
        data: {
            xzqdm: dwdm,
            xzqmc: dwmc,
            cpdm: cpdm,
            xmjl: xmjl,
            csr: csr,
            fsr: fsr,
            sqshr: sqshr,
            lrr: lrr
        }
    })
}));

router.get('/systable/dwxx', catchAsyncErrors(async (req, res) => {
    let dwxx = await orm.option.DWXX.findAll();
    let responseObjects = dwxx.map((item) => {
        return {
            index: item.INDEX,
            dwdm: item.DM,
            dwmc: item.MC,
            xzqjb: item.JB,
            editing: false
        }
    })
    return res.json({
        code: '0000',
        data: responseObjects
    })
}));


router.post('/systable/dwxx', catchAsyncErrors(async (req, res) => {
    let reqParams = req.body;

    //0更新1新增2删除
    if (reqParams.xw === "1") {
        let newDwxx = await orm.option.DWXX.create({
            INDEX: uuidv1(),
            DM: reqParams.dwdm,
            MC: reqParams.dwmc,
            JB: reqParams.xzqjb,
            editing: false
        });

        if (!newDwxx) {
            throw new AppCommonError("无法新增该单位信息", "0006");
        } else {
            return res.json({
                code: "0000",
                msg: '单位信息新增成功'
            });
        }

    } else if (reqParams.xw === "0") {
        let dwxx = await orm.option.DWXX.findOne({
            where: {
                INDEX: reqParams.index
            }
        });
        dwxx.DM = reqParams.dwdm || dwxx.DM;
        dwxx.MC = reqParams.dwmc || dwxx.MC;
        dwxx.JB = reqParams.xzqjb || dwxx.JB;

        if (!dwxx) {
            throw new AppCommonError("无法更新该单位信息", "0006");
        } else {
            await dwxx.save();
            return res.json({
                code: "0000",
                msg: '单位信息更新成功'
            });
        }

    } else if (reqParams.xw === "2") {
        let destroyResult;
        for (let i = 0; i < reqParams.index.length; i++) {
            destroyResult = await orm.option.DWXX.destroy({
                where: {
                    INDEX: reqParams.index[i]
                }
            });
        }
        if (destroyResult === 0) {
            throw new AppCommonError("删除失败", "0001");
        } else {
            return res.json({
                code: '0000',
                msg: '此单位信息删除成功'
            });
        }
    }

}));


router.get('/systable/cpxx', catchAsyncErrors(async (req, res) => {
    let cplx = await orm.option.CPLX.findAll();
    let responseObjects = cplx.map((item) => {
        return {
            index: item.INDEX,
            cpdm: item.DM,
            cpmc: item.MC,
            sfwh: item.SFWH,
            editing: false
        }
    })
    return res.json({
        code: '0000',
        data: responseObjects
    })
}));

router.post('/systable/cpxx', catchAsyncErrors(async (req, res) => {
    let reqParams = req.body;

    //0更新1新增2删除
    if (reqParams.xw === "1") {
        let newCplx = await orm.option.CPLX.create({
            INDEX: uuidv1(),
            DM: reqParams.cpdm,
            MC: reqParams.cpmc,
            SFWH: reqParams.sfwh
        });


        if (!newCplx) {
            throw new AppCommonError("无法新增该产品类型", "0006");
        } else {
            return res.json({
                code: "0000",
                msg: '产品类型新增成功'
            });
        }



    } else if (reqParams.xw === "0") {
        let cplx = await orm.option.CPLX.findOne({
            where: {
                INDEX: reqParams.index
            }
        });
        cplx.DM = reqParams.cpdm || cplx.DM;
        cplx.MC = reqParams.cpmc || cplx.MC;
        cplx.SFWH = reqParams.sfwh || cplx.SFWH;

        if (!cplx) {
            throw new AppCommonError("无法更新该产品类型", "0006");
        } else {
            await cplx.save();
            return res.json({
                code: "0000",
                msg: '产品类型更新成功'
            });
        }

    } else if (reqParams.xw === "2") {
        let destroyResult;
        for (let i = 0; i < reqParams.index.length; i++) {
            destroyResult = await orm.option.CPLX.destroy({
                where: {
                    INDEX: reqParams.index[i]
                }
            });
        }
        if (destroyResult === 0) {
            throw new AppCommonError("产品类型删除失败", "0001");
        } else {
            return res.json({
                code: '0000',
                msg: '产品类型删除成功'
            });
        }
    }

}));


router.get('/systable/jsxx', catchAsyncErrors(async (req, res) => {
    let jsxx = await orm.option.JSXX.findAll();
    let responseObjects = jsxx.map((item) => {
        return {
            index: item.INDEX,
            jsdm: item.DM,
            jsmc: item.MC,
            editing: false
        }
    })
    return res.json({
        code: '0000',
        data: responseObjects
    })
}));

router.post('/systable/jsxx', catchAsyncErrors(async (req, res) => {
    let reqParams = req.body;

    //0更新1新增2删除
    if (reqParams.xw === "1") {
        let newJsxx = await orm.option.JSXX.create({
            INDEX: uuidv1(),
            DM: reqParams.jsdm,
            MC: reqParams.jsmc
        });

        if (!newJsxx) {
            throw new AppCommonError("无法新增该角色信息", "0006");
        } else {
            return res.json({
                code: "0000",
                msg: '角色信息新增成功'
            });
        }

    } else if (reqParams.xw === "0") {
        let jsxx = await orm.option.JSXX.findOne({
            where: {
                INDEX: reqParams.index
            }
        });
        jsxx.DM = reqParams.jsdm || jsxx.DM;
        jsxx.MC = reqParams.jsmc || jsxx.MC;

        if (!jsxx) {
            throw new AppCommonError("无法更新该角色信息", "0006");
        } else {
            await jsxx.save();
            return res.json({
                code: "0000",
                msg: '角色信息更新成功'
            });
        }

    } else if (reqParams.xw === "2") {
        let destroyResult;
        for (let i = 0; i < reqParams.index.length; i++) {
            destroyResult = await orm.option.JSXX.destroy({
                where: {
                    INDEX: reqParams.index[i]
                }
            });
        }
        if (destroyResult === 0) {
            throw new AppCommonError("角色信息删除失败", "0001");
        } else {
            return res.json({
                code: '0000',
                msg: '角色信息删除成功'
            });
        }
    }

}));

router.get('/systable/swlxr', catchAsyncErrors(async (req, res) => {
    let swlxr = await orm.option.SWLXR.findAll();
    let responseObjects = swlxr.map((item) => {
        return {
            index: item.INDEX,
            swlxr: item.SWLXR,
            xzqdm: item.XZQDM,
            editing: false
        }
    })
    return res.json({
        code: '0000',
        data: responseObjects
    })
}));

router.post('/systable/swlxr', catchAsyncErrors(async (req, res) => {
    let reqParams = req.body;

    //0更新1新增2删除
    if (reqParams.xw === "1") {
        let newSwlxr = await orm.option.SWLXR.create({
            INDEX: uuidv1(),
            SWLXR: reqParams.swlxr,
            XZQDM: reqParams.xzqdm
        });


        if (!newSwlxr) {
            throw new AppCommonError("无法新增该商务联系人", "0006");
        } else {
            return res.json({
                code: "0000",
                msg: '商务联系人新增成功'
            });
        }

    } else if (reqParams.xw === "0") {
        let swlxr = await orm.option.SWLXR.findOne({
            where: {
                INDEX: reqParams.index
            }
        });
        swlxr.SWLXR = reqParams.swlxr || swlxr.SWLXR;
        swlxr.XZQDM = reqParams.xzqdm || swlxr.XZQDM;

        if (!swlxr) {
            throw new AppCommonError("无法更新该商务联系人", "0006");
        } else {
            await swlxr.save();
            return res.json({
                code: "0000",
                msg: '产品类型更新成功'
            });
        }

    } else if (reqParams.xw === "2") {
        let destroyResult;
        for (let i = 0; i < reqParams.index.length; i++) {
            destroyResult = await orm.option.SWLXR.destroy({
                where: {
                    INDEX: reqParams.index[i]
                }
            });
        }
        if (destroyResult === 0) {
            throw new AppCommonError("商务联系人删除失败", "0001");
        } else {
            return res.json({
                code: '0000',
                msg: '商务联系人删除成功'
            });
        }
    }

}));

router.get('/role/jscy', catchAsyncErrors(async (req, res) => {
    let jscy = await orm.User.findAll();
    let responseObjects = jscy.map((item) => {
        return {
            index: item.INDEX,
            jscy: item.JSCY,
            jsdm: item.JSDM,
            ssbm: item.SSBM,
            ssxmz: item.SSXMZ,
            lxdh: item.LXDH,
            wechat: item.WECHAT,
            bz: item.BZ,
            pwd: item.PWD,
            lrr: item.LRR
        }
    })
    return res.json({
        code: '0000',
        data: responseObjects
    })
}));

router.post('/role/jscy_delete_tip', catchAsyncErrors(async (req, res) => {
    let reqParams = req.body;
    let relatedItems;
    let results = [];
    for (let i = 0; i < reqParams.index.length; i++) {
        relatedItems = await orm.ApplicationRecord.findAll({
            where: {
                [orm.Sequelize.Op.or]: [{
                    csr: reqParams.index[i]
                }, {
                    fsr: reqParams.index[i]
                }, {
                    sqshr: reqParams.index[i]
                }]
            }
        });
        if (relatedItems.length !== 0) {
            results.push('1')
        }
    }

    if (results.length === 0) {
        return res.json({
            related: '0'
        });
    } else {
        return res.json({
            related: '1'
        });
    }

    // let results=[];
    // relatedItems.map((item)=>{
    //     results.push({dwmc:item.DWMC,xmdmc:item.XMDMC,cpdm:item.CPDM})
    // });

    // return res.json(results)

}));


router.post('/role/jscy', catchAsyncErrors(async (req, res) => {
    let reqParams = req.body;

    //0更新1新增2删除
    if (reqParams.xw === "1") {
        let newJscy = await orm.User.create({
            INDEX: uuidv1(),
            JSCY: reqParams.jscy,
            JSDM: reqParams.jsdm,
            SSBM: reqParams.ssbm,
            SSXMZ: reqParams.ssxmz,
            LXDH: reqParams.lxdh,
            WECHAT: reqParams.wechat,
            BZ: reqParams.bz,
            PWD: reqParams.pwd,
            LRR: reqParams.lrr
        });

        if (!newJscy) {
            throw new AppCommonError("无法新增该角色信息", "0006");
        } else {
            return res.json({
                code: "0000",
                msg: '角色成员新增成功'
            });
        }

    } else if (reqParams.xw === "0") {
        let jscy = await orm.User.findOne({
            where: {
                INDEX: reqParams.index
            }
        });
        jscy.JSCY = reqParams.jscy || jscy.JSCY;
        jscy.JSDM = reqParams.jsdm || jscy.JSDM;
        jscy.SSBM = reqParams.ssbm || jscy.SSBM;
        jscy.SSXMZ = reqParams.ssxmz || jscy.SSXMZ;
        jscy.LXDH = reqParams.lxdh || jscy.LXDH;
        jscy.WECHAT = reqParams.wechat || jscy.WECHAT;
        jscy.BZ = reqParams.bz || jscy.BZ;
        jscy.PWD = reqParams.pwd || jscy.PWD;
        jscy.LRR = reqParams.lrr || jscy.LRR;

        if (!jscy) {
            throw new AppCommonError("无法更新该角色信息", "0006");
        } else {
            await jscy.save();
            return res.json({
                code: "0000",
                msg: '角色成员更新成功'
            });
        }

    } else if (reqParams.xw === "2") {
        let destroyResult;
        for (let i = 0; i < reqParams.index.length; i++) {
            destroyResult = await orm.User.destroy({
                where: {
                    INDEX: reqParams.index[i]
                }
            });
        }
        if (destroyResult === 0) {
            throw new AppCommonError("角色成员删除失败", "0001");
        } else {
            return res.json({
                code: '0000',
                msg: '角色成员删除成功'
            });
        }
    }

}));


router.get('/product/cpdj', catchAsyncErrors(async (req, res) => {
    let cpdj = await orm.ApplicationRecord.findAll();
    let responseObjects = cpdj.map((item) => {
        return {
            index: item.INDEX,
            dwdm: item.DWDM,
            dwmc: item.DWMC,
            xmddm: item.XMDDM,
            xmdmc: item.XMDMC,
            cpdm: item.CPDM,
            sfjmg: item.SFJMG,
            sfsq: item.SFSQ,
            jzsj: item.JZSJ,
            csr: item.CSR,
            fsr: item.FSR,
            sqshr: item.SQSHR,
            lrr: item.LRR,
            bz: item.BZ
        }
    })
    return res.json({
        code: '0000',
        data: responseObjects
    })
}));


router.post('/product/cpdj', catchAsyncErrors(async (req, res) => {
    let reqParams = req.body;

    //0更新1新增2删除
    if (reqParams.xw === "1") {
        let newCpdj = await orm.ApplicationRecord.create({
            INDEX: uuidv1(),
            DWDM: reqParams.dwdm,
            DWMC: reqParams.dwmc,
            XMDDM: reqParams.xmddm,
            XMDMC: reqParams.xmdmc,
            CPDM: reqParams.cpdm,
            SFJMG: reqParams.sfjmg,
            JZSJ: reqParams.jzsj,
            SFSQ: reqParams.sfsq,
            CSR: reqParams.csr,
            FSR: reqParams.fsr,
            SQSHR: reqParams.sqshr,
            LRR: reqParams.lrr,
            BZ: reqParams.bz
        });

        if (!newCpdj) {
            throw new AppCommonError("无法新增该产品登记信息", "0006");
        } else {
            return res.json({
                code: "0000",
                msg: '产品登记信息新增成功'
            });
        }

    } else if (reqParams.xw === "0") {
        let cpdj = await orm.ApplicationRecord.findOne({
            where: {
                INDEX: reqParams.index
            }
        });
        cpdj.DWDM = reqParams.dwdm || cpdj.DWDM;
        cpdj.DWMC = reqParams.dwmc || cpdj.DWMC;
        cpdj.XMDDM = reqParams.xmddm || cpdj.XMDDM;
        cpdj.XMDMC = reqParams.xmdmc || cpdj.XMDMC;
        cpdj.CPDM = reqParams.cpdm || cpdj.CPDM;
        cpdj.SFJMG = reqParams.sfjmg || cpdj.SFJMG;
        cpdj.SFSQ = reqParams.sfsq || cpdj.SFSQ;
        cpdj.JZSJ = reqParams.jzsj || cpdj.JZSJ;
        cpdj.CSR = reqParams.csr || cpdj.CSR;
        cpdj.FSR = reqParams.fsr || cpdj.FSR;
        cpdj.SQSHR = reqParams.sqshr || cpdj.SQSHR;
        cpdj.LRR = reqParams.lrr || cpdj.LRR;
        cpdj.BZ = reqParams.bz || cpdj.BZ;


        if (!cpdj) {
            throw new AppCommonError("无法更新该产品登记信息", "0006");
        } else {
            await cpdj.save();
            return res.json({
                code: "0000",
                msg: '产品登记信息更新成功'
            });
        }

    } else if (reqParams.xw === "2") {
        let destroyResult;
        for (let i = 0; i < reqParams.index.length; i++) {
            destroyResult = await orm.ApplicationRecord.destroy({
                where: {
                    INDEX: reqParams.index[i]
                }
            });
        }
        console.log(destroyResult);

        if (destroyResult === 0) {
            throw new AppCommonError("产品登记信息删除失败", "0001");
        } else {
            return res.json({
                code: '0000',
                msg: '产品登记信息删除成功'
            });
        }
    }

}));

router.get('/get_lrr', catchAsyncErrors(async (req, res) => {
    let payload = jwt.decode(req.cookies.jwt);
    if (!payload || !payload.phone) {
        throw new AppCommonError("无法获取已登陆信息，请重新登陆", "0005");
    }
    let lrr = await orm.User.findOne({
        where: {
            LXDH: payload.phone
        }
    });
    return res.json({
        code: '0000',
        lrr_index: lrr.INDEX,
        lrr: lrr.JSCY
    })
}));


router.get('/get_ssqy', catchAsyncErrors(async (req, res) => {
    let payload = jwt.decode(req.cookies.jwt);
    if (!payload || !payload.phone) {
        throw new AppCommonError("无法获取已登陆信息，请重新登陆", "0005");
    }

    let ssqydms = await orm.ApplicationRecord.findAll({
        where: {
            FSR: {
                [orm.Sequelize.Op.ne]: '\\N'
            }
        },
        group: ['XMDDM'],
        attributes: [
            ['XMDDM', 'dm'],
            ['XMDMC', 'mc']
        ]
    });


    return res.json(ssqydms)
}));


//---------------日志记录管理新增接口-------------------//
router.get('/get_log', catchAsyncErrors(async (req, res) => {
    let payload = jwt.decode(req.cookies.jwt);
    if (!payload || !payload.phone) {
        throw new AppCommonError("无法获取已登陆信息，请重新登陆", "0005");
    }

    let logs = await orm.LogRecord.findAll({
        include: [{
            model: orm.User,
            as: "Users"
        }, {
            model: orm.User,
            as: "Csr"
        }, {
            model: orm.User,
            as: "Fsr"
        }]
    });

    let responseObjects = logs.map(item => {
        return {
            index: item.INDEX,
            sqr: item.SQR,
            sqrdw: item.SQRDW,
            lxdh: item.LXDH,
            yxdz: item.YXDZ,
            sqsj: item.SQSJ,
            cpmc: item.CPMC,
            sqsl: item.SQSL,
            sqnr: item.SQNR,
            bljssj: item.BLJSSJ,
            bljg: item.BLJG === "1" ? "办理完成" : "不予办理",
            bz: item.BZ,
            zzblr: item.Users == null ? '-' : item.Users.JSCY,
            xzqdm: item.XZQDM == null ? '-' : item.XZQDM,
            csr: item.Csr == null ? '-' : item.Csr.JSCY,
            cssj: item.CSSJ == null ? '-' : item.CSSJ,
            fsr: item.Fsr == null ? '-' : item.Fsr.JSCY,
            fssj: item.FSSJ == null ? '-' : item.FSSJ
        }
    });

    let rzjl = {
        "code": "0000",
        "data": responseObjects
    }

    return res.json(rzjl)
}));

router.get('/get_blzt', catchAsyncErrors(async (req, res) => {
    let payload = jwt.decode(req.cookies.jwt);
    if (!payload || !payload.phone) {
        throw new AppCommonError("无法获取已登陆信息，请重新登陆", "0005");
    }

    let blzt = await orm.ApplicationInfo.findOne({
        where: {
            SQXX_INDEX: req.query.sqxx_index
        },
        attributes: [
            ['BLZT', 'blzt'],
            ['SQNR', 'sqnr'],
            ['BZ', 'bz']
        ]
    });


    return res.json(blzt)
}));

//---------------------不记录审核人和审核时间的日志记录-------------------------//
// router.post('/save_rzjl', catchAsyncErrors(async (req, res) => {
//     let payload = jwt.decode(req.cookies.jwt);
//     if (!payload || !payload.phone) {
//         throw new AppCommonError("无法获取已登陆信息，请重新登陆", "0005");
//     }

//     let reqParams = req.body;

//     let sqxx = await orm.ApplicationInfo.findOne({
//         where: {
//             INDEX: reqParams.sqxx_index
//         }
//     });

//     let rzjl = await orm.LogRecord.create({
//         SQXX_INDEX: reqParams.sqxx_index,
//         SQR: reqParams.sqr,
//         SQRDW: reqParams.sqrdw,
//         LXDH: reqParams.lxdh,
//         YXDZ: reqParams.yxdz,
//         CPMC: reqParams.cpmc,
//         SQSL: reqParams.sqsl,
//         SQNR: sqxx.SQNR,
//         SQSJ: sqxx.SQSJ,
//         BLJG: reqParams.bljg,
//         BLJSSJ: new Date(Date.now()).toMysqlFormat(),
//         BZ: reqParams.bz,
//         ZZBLR: payload.jsIndex,
//         INDEX: uuidv1()
//     });

//     if (!rzjl) {
//         throw new AppCommonError("无法创建新申请", "0006");
//     } else {
//         return res.json({
//             code: "0000"
//         });
//     }
// }));

router.post('/save_rzjl', catchAsyncErrors(async (req, res) => {
    let payload = jwt.decode(req.cookies.jwt);
    if (!payload || !payload.phone) {
        throw new AppCommonError("无法获取已登陆信息，请重新登陆", "0005");
    }

    let reqParams = req.body;

    let sqxx = await orm.ApplicationInfo.findOne({
        where: {
            INDEX: reqParams.sqxx_index
        }
    });

    let blzt = reqParams.blzt;
    if (blzt == 2) {
        let rzjl1 = await orm.LogRecord.create({
            SQXX_INDEX: reqParams.sqxx_index,
            SQR: reqParams.sqr,
            SQRDW: reqParams.sqrdw,
            LXDH: reqParams.lxdh,
            YXDZ: reqParams.yxdz,
            CPMC: reqParams.cpmc,
            SQSL: reqParams.sqsl,
            XZQDM: reqParams.xzqdm,
            // SQNR: sqxx.SQNR,
            SQSJ: sqxx.SQSJ,
            BLJG: reqParams.bljg,
            BLJSSJ: new Date(Date.now()).toMysqlFormatTime(),
            BZ: reqParams.bz,
            ZZBLR: payload.jsIndex,
            INDEX: uuidv1(),
            CSR: payload.jsIndex,
            CSSJ: new Date(Date.now()).toMysqlFormatTime()
        });
        if (!rzjl1) {
            throw new AppCommonError("无法记录日志", "0006");
        } else {
            return res.json({
                code: "0000"
            });
        }
    } else if (blzt == 3) {
        let rzjl2 = await orm.LogRecord.update({
            FSR: payload.jsIndex,
            FSSJ: new Date(Date.now()).toMysqlFormatTime(),
            BLJG: reqParams.bljg,
            BLJSSJ: new Date(Date.now()).toMysqlFormatTime(),
            BZ: reqParams.bz,
            ZZBLR: payload.jsIndex,
            SQNR: sqxx.SQNR,
        }, {
            where: {
                SQXX_INDEX: reqParams.sqxx_index
            }
        })
        if (!rzjl2) {
            throw new AppCommonError("无法记录日志", "0006");
        } else {
            return res.json({
                code: "0000"
            });
        }
    } else {
        let rzjl3 = await orm.LogRecord.update({
            BLJG: reqParams.bljg,
            BLJSSJ: new Date(Date.now()).toMysqlFormatTime(),
            BZ: reqParams.bz,
            ZZBLR: payload.jsIndex,
            SQNR: sqxx.SQNR,
        }, {
            where: {
                SQXX_INDEX: reqParams.sqxx_index
            }
        })
        if (!rzjl3) {
            throw new AppCommonError("无法记录日志", "0006");
        } else {
            return res.json({
                code: "0000"
            });
        }
    }

}));

router.post('/delete_log', catchAsyncErrors(async (req, res) => {
    let reqParams = req.body;
    let destroyResult;
    for (let i = 0; i < reqParams.index.length; i++) {
        destroyResult = await orm.LogRecord.destroy({
            where: {
                INDEX: reqParams.index[i]
            }
        });
    }

    if (destroyResult === 0)
        throw new AppCommonError("批量删除失败", "0001");
    else
        return res.json({
            code: '0000'
        });
}));


//-------------------------获取审核流程信息--------------------------------------------//
router.get('/flowchart_info', catchAsyncErrors(async (req, res) => {
    let resObj;
    if (req.query.xmddm !== '') {
        let flowchartInfo = await orm.ApplicationRecord.findAll({
            where: {
                CPDM: req.query.cpdm,
                XMDDM: req.query.xmddm
            }
        });

        // console.log(flowchartInfo);

        let flowchartInfo_jf;
        flowchartInfo.map(item => {
            if (item.FSR) {
                flowchartInfo_jf = item;
            }
        });


        let csr = await orm.User.findOne({
            where: {
                INDEX: flowchartInfo_jf.CSR
            }
        });

        let fsr = await orm.User.findOne({
            where: {
                INDEX: flowchartInfo_jf.FSR
            }
        })

        // let sqshr = await orm.User.findOne({
        //     where: {
        //         INDEX: flowchartInfo_jf.SQSHR
        //     }
        // })

        resObj = {
            csr: csr.JSCY,
            csrbm: csr.SSXMZ,
            csrlxdh: csr.LXDH,
            fsr: fsr.JSCY,
            fsrbm: fsr.SSXMZ,
            fsrlxdh: fsr.LXDH,
            // sqshr: sqshr.JSCY,
            // sqshrbm: sqshr.SSXMZ,
            // sqshrlxdh: sqshr.LXDH,
        }
    } else {
        let yhrzxx = await orm.CustomerInfo.findOne({
            where: {
                INDEX: req.query.user_index
            }
        });
        let yhdw = yhrzxx.YHDW;
        let jscy = await orm.User.findAll({
            where: {
                SSXMZ: yhdw
            }
        });

        let xmjlIndex;
        let xmjlMc;
        let xmjlSsxmz;
        let xmjlLxdh;

        jscy.map(item => {
            if (item.JSDM.indexOf('7') > -1) {
                xmjlIndex = item.INDEX;
                xmjlMc = item.JSCY;
                xmjlSsxmz = item.SSXMZ;
                xmjlLxdh = item.LXDH;
            }
        });

        let djxxInfo = await orm.ApplicationRecord.findOne({
            where: {
                CPDM: [req.query.cpdm, '0'],
                CSR: xmjlIndex
            }
        });

        if (djxxInfo) {
            resObj = {
                csr: xmjlMc,
                csrbm: xmjlSsxmz,
                csrlxdh: xmjlLxdh,
            };
        }


    }

    res.json(resObj)

}));

//-----------------------获取该用户通过的临时授权次数-------------------//
router.get('/get_temporary_amount', catchAsyncErrors(async (req, res) => {
    let temporarySqxx = await orm.ApplicationInfo.findAll({
        where: {
            BLZT: '8',
            JZSJLX: '1',
            YHRZXX_INDEX: req.query.yhrzxxIndex
        }
    })

    res.json({
        code: '0000',
        amount: temporarySqxx.length
    })
}))


//---------------------------获取对应区域商务联系人------------------------//
router.get('/get_swlxr', catchAsyncErrors(async (req, res) => {
    let swlxr = await orm.option.SWLXR.findAll({
        where: {
            // XZQDM: req.query.xzqdm,
            XZQDM: {
                [orm.Sequelize.Op.like]: `%${req.query.xzqdm}%`
            }
        }
    })

    let resObj = swlxr.map(item => {
        return {
            dm: item.SWLXR,
            mc: item.SWLXR
        }
    })

    res.json(resObj);
}))

router.get('/get_swlxr_xzqdm', catchAsyncErrors(async (req, res) => {
    let dwdmArray = await orm.option.DWXX.findAll();
    let dwdm = dwdmArray.map(d => {
        return {
            value: d.DM,
            label: d.DM + ' ' + d.MC,
            index: d.INDEX
        }
    });

    res.json({
        code: "0000",
        data: {
            xzqdm: dwdm
        }
    })
}))

// router.get('/get_jscy_name', catchAsyncErrors(async (req, res) => {
//     let jscy = await orm.User.findOne({
//         attributes:[['JSCY','jscy']],
//         where:{
//             INDEX: req.query.jscyIndex
//         }
//     })
//     return res.json(jscy)
// }));


//-------------------------获取存在临时表中的openid---------------------------//
router.get('/get_temp_openid', catchAsyncErrors(async (req, res) => {
    // let openid = await orm.TempOpenid.findOne({
    //    where: {
    //        LXDH: req.query.lxdh
    //    }
    // })
    // res.json(openid)

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

    // console.log(yhrzzOpenid);

    let resObj;

    if (yhrzzOpenid) {
        resObj = {
            LXDH: yhrzzOpenid.LXDH,
            OPENID: yhrzzOpenid.OPENID,
        }
    }

    if (tempOpenid) {
        res.json(tempOpenid)
    } else if(resObj) {
        res.json(resObj)
    } else {
        res.json({
            OPENID: null
        })
    }
}))

// //--------------------------清除临时openid----------------------------------//
// router.post('/get_temp_openid', catchAsyncErrors(async (req, res) => {
//     let openid = await orm.TempOpenid.update({
//         OPENID: null
//     }, {
//         where: {
//             INDEX: '1'
//         }
//     })
//     res.json({
//         code: "0000"
//     })
// }))


//--------------------------get access_token并存入redis------------------------------//
router.get('/get_access_token', catchAsyncErrors(async (req, res) => {
    var client = redis.createClient();
    let resObj;
    client.get("access_token", async (err, reply) => {
        // reply is null when the key is missing
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
            // request(getTokenUrl, function (err, response, body) {
            //     console.log(body);
            //     let access_token = JSON.parse(body).access_token;
            //     if (access_token != null) {
            //         client.set("access_token", access_token, 'EX', 5400, redis.print);
            //         resObj = {
            //             code: '0000',
            //             access_token: access_token
            //         }
            //         res.json(resObj);
            //         client.quit();
            //     }
            // });
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


router.get('/get_postinfo_tpl', catchAsyncErrors(async (req, res) => {
    let payload = jwt.decode(req.cookies.jwt);

    let postInfo = await orm.PostInfo.findAll({
        where: {
            YHRZXX_INDEX: payload.index
        }
    });

    let responseObj = postInfo.map(item => {
        return {
            dm: item.INDEX,
            mc: item.SJR
        }
    })

    res.json(responseObj)
}))

router.get('/get_postinfo', catchAsyncErrors(async (req, res) => {
    if (req.query.post_index == '0') {
        res.json({
            code: '9999'
        })
    } else {

        let postInfo = await orm.PostInfo.findOne({
            where: {
                POST_INDEX: req.query.post_index
            }
        });

        let responseObj = {
            code: '0000',
            sjr: postInfo.SJR,
            sjrdz: postInfo.ADDRESS,
            lxdh: postInfo.LXDH
        };

        res.json(responseObj)
    }
}))

router.post('/save_postinfo', catchAsyncErrors(async (req, res) => {
    let payload = jwt.decode(req.cookies.jwt);
    if (req.body.post_index !== '0') {
        let postInfo = await orm.PostInfo.create({
            INDEX: req.body.post_index,
            YHRZXX_INDEX: payload.index,
            SJR: req.body.sjr,
            ADDRESS: req.body.sjrdz,
            LXDH: req.body.sjrlxdh
        });
        res.json({
            code: "0000"
        })
    }
}))


router.get('/get_invoiceinfo_tpl', catchAsyncErrors(async (req, res) => {
    let payload = jwt.decode(req.cookies.jwt);

    let invoiceInfo = await orm.InvoiceInfo.findAll({
        where: {
            YHRZXX_INDEX: payload.index
        }
    });

    let responseObj = invoiceInfo.map(item => {
        return {
            dm: item.INDEX,
            mc: item.COMPANY_NAME
        }
    })

    res.json(responseObj)
}))

router.get('/get_invoiceinfo', catchAsyncErrors(async (req, res) => {
    if (req.query.invoice_index == '0') {
        res.json({
            code: '9999'
        })
    } else {
        let invoiceInfo = await orm.InvoiceInfo.findOne({
            where: {
                INVOICE_INDEX: req.query.invoice_index
            }
        });

        let responseObj = {
            code: '0000',
            companyName: invoiceInfo.COMPANY_NAME,
            companyAddress: invoiceInfo.COMPANY_ADDRESS,
            companyTel: invoiceInfo.COMPANY_TEL,
            taxObjectId: invoiceInfo.TAX_OBJECTID,
            account: invoiceInfo.ACCOUNT,
            bank: invoiceInfo.BANK
        };

        res.json(responseObj)
    }
}))

router.post('/save_invoiceinfo', catchAsyncErrors(async (req, res) => {
    let payload = jwt.decode(req.cookies.jwt);
    if (req.body.invoice_index !== '0') {
        let invoiceInfo = await orm.InvoiceInfo.create({
            INDEX: req.body.invoice_index,
            YHRZXX_INDEX: payload.index,
            COMPANY_NAME: req.body.company_name,
            COMPANY_ADDRESS: req.body.company_address,
            COMPANY_TEL: req.body.company_tel,
            TAX_OBJECTID: req.body.tax_objectid,
            ACCOUNT: req.body.account,
            BANK: req.body.bank
        });
        res.json({
            code: "0000"
        })
    }
}))

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

    //   console.log('jsapiTicket这个就是：' + jsapiTicket);

    //   console.log('url就是这个：' +  req.query.url);


    //   nonceStr = uuidv1();
    //   timestamp = Date.now();
    //   jsUrl = req.query.url;
    //   string = `jsapi_ticket=${jsapiTicket}&noncestr=${nonceStr}&timestamp=${timestamp}&url=${jsUrl}`
    //   signature = sha1(string);
    //   resObj = {
    //     nonceStr: nonceStr,
    //     timestamp: timestamp,
    //     signature: signature,
    //     appID: config.appid
    //   };
    //   res.json(resObj);
}));


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