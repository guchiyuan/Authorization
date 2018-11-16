var express = require('express');
var router = express.Router();
var jwt = require('../common_function/jwt');
var common = require('../common_function/CustomFunc');
var orm = require('../models');
const config = require('../config/config');
const MyAppError = require('../error/MyAppError');
const AppCommonError = require('../error/CommonError');
const uuidv1 = require('uuid/v1');
const optionConverter = require('../common_function/OptionConverter')
var requester = require('request-promise-native');


var request = require('request');

var wechatOper = require('../common_function/WechatOperation')

var ADDRESS_ACCESSTOKEN = config.getAccessTokenAddress;

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

//用于时间格式的补位
function twoDigits(d) {
    if (0 <= d && d < 10) return "0" + d.toString();
    if (-10 < d && d < 0) return "-0" + (-1 * d).toString();
    return d.toString();
}

//Date原型上添加方法，用于将时间转成用于存在MySQL上的时间戳
Date.prototype.toMysqlFormat = function () {
    // return this.getUTCFullYear() + "-" + twoDigits(1 + this.getUTCMonth()) + "-" + twoDigits(this.getUTCDate()) + " " + twoDigits(this.getHours()) + ":" + twoDigits(this.getUTCMinutes()) + ":" + twoDigits(this.getUTCSeconds());
    // return this.getUTCFullYear() + "-" + twoDigits(1 + this.getUTCMonth()) + "-" + twoDigits(this.getUTCDate());
    return this.getFullYear() + "-" + twoDigits(1 + this.getMonth()) + "-" + twoDigits(this.getDate());
};


Date.prototype.toMysqlFormatTime = function () {
    return this.getFullYear() + "-" + twoDigits(1 + this.getMonth()) + "-" + twoDigits(this.getDate()) + " " + twoDigits(this.getHours()) + ":" + twoDigits(this.getMinutes()) + ":" + twoDigits(this.getSeconds());
};


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

    //如果角色成员没有openid，且传入的参数有openid，则存入
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

//从sqdj表中获取用户所属区域，确保用户认证必有审核人
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


    //根据申请人类型去查找审核人的openid，用于发送审核提醒消息
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

        resObj = {
            csr: csr.JSCY,
            csrbm: csr.SSXMZ,
            csrlxdh: csr.LXDH,
            fsr: fsr.JSCY,
            fsrbm: fsr.SSXMZ,
            fsrlxdh: fsr.LXDH
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

    //因为日志记录在初审后就会产生，所以在撤销申请的同时，如果存有日志记录也要相应删除
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

    //验证不为lic文件
    if (reqParams.sqxlm.indexOf('abcDefG') > -1) {
        // throw new AppCommonError("您上传的文件中混有lic文件，请不要上传lic文件", "0001");
        throw new AppCommonError("上传的授权序列码有误，请重新导出", "0001");
    }
    


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
        xmXzq = common.GetXZQArray(targetXzqs[0]);
        xmXzq.splice(0, 1);
        console.log(xmXzq);
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
        if (openid_jscy) {
            bodyToken = await requester(reqTokenData);
            await wechatOper.remindCheckMessage(openid_jscy, bodyToken.access_token);
        }

        return res.json({
            code: "0000"
        });
    }
}));


//获取邮寄信息选项，用于加载到select选项中
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

//获取邮寄信息
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

//保存邮寄信息
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

//获取开票信息选项，用于加载到select选项中
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

//获取开票详细信息
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

//保存开票信息
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