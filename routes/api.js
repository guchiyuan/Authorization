var express = require('express');
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

function twoDigits(d) {
    if (0 <= d && d < 10) return "0" + d.toString();
    if (-10 < d && d < 0) return "-0" + (-1 * d).toString();
    return d.toString();
}

Date.prototype.toMysqlFormat = function () {
    return this.getUTCFullYear() + "-" + twoDigits(1 + this.getUTCMonth()) + "-" + twoDigits(this.getUTCDate()) + " " + twoDigits(this.getHours()) + ":" + twoDigits(this.getUTCMinutes()) + ":" + twoDigits(this.getUTCSeconds());
};


function catchAsyncErrors(fn) {
    return (req, res, next) => {
        const routePromise = fn(req, res, next);
        if (routePromise.catch) {
            routePromise.catch(err => { next(err); console.log(err) });
        }
    }
}

router.use((req, res, next) => {
    if (req.path == '/login' || req.path == '/sendCaptcha') {
        next();
    }
    else {
        if (req.cookies.jwt) {
            let payload = jwt.checkToken(req.cookies.jwt);
            if (payload) {
                let newToken = jwt.encode(jwt.generatePayload(payload.phone, payload.roleID, payload.index, payload.jsIndex));
                res.cookie('jwt', newToken, { httpOnly: true });
                next();
            }
            else {
                throw new AppCommonError("token认证失败", "0005")
            }
        }
        else {
            throw new AppCommonError("未登录，拒绝访问", "0005")
        }
    }
});

router.get('/logout', (req, res) => {
    res.cookie('jwt', '', { expires: new Date(0) });
    return res.json({ code: "0000" });
});

router.post('/login', catchAsyncErrors(async (req, res) => {
    if (!req.body.phone) {
        throw new AppCommonError("手机号为空", "0001");
    }

    //// 检查验证码正确性(没有阿里短息服务暂时不要)
    // let isValid = await authOper.valideAuthCode(req.body.phone, req.body.captcha);
    // if (!isValid)
    //     throw new AppCommonError("验证码错误", "0002");

    let user = await orm.User.findOne({ where: { LXDH: req.body.phone } });
    if (!user) {
        var token = jwt.encode(jwt.generatePayload(req.body.phone, "", "", ""));
        res.cookie('jwt', token, { httpOnly: true });
        return res.json({ role: "0" });
    }
    else {
        let role = user.JSDM.indexOf("1") > -1 ? "2" : "1";
        let token = jwt.encode(jwt.generatePayload(req.body.phone, user.JSDM, "", user.INDEX));
        res.cookie('jwt', token, { httpOnly: true });
        return res.json({ role: role });
    }
}));

router.get('/application_reject_reason', (req, res) => {
    if (config.rejectReasons_Application) {
        return res.json(config.rejectReasons_Application);
    }
    else {
        return res.json([]);
    }
});

router.get('/user_reject_reason', (req, res) => {
    if (config.rejectReasons_User) {
        return res.json(config.rejectReasons_User);
    }
    else {
        return res.json([]);
    }
});

//// 获取用户信息
router.get('/get_userInfo', catchAsyncErrors(async (req, res) => {
    let payload = jwt.decode(req.cookies.jwt);
    if (!payload || !payload.phone) {
        throw new AppCommonError("无法获取已登陆信息，请重新登陆", "0005");
    }

    let rzxx = await orm.CustomerInfo.findOne({ where: { LXDH: payload.phone } });
    if (!rzxx) {
        return res.json({ newUser: "1", code: "0000" });
    }
    else {
        let token = jwt.encode(jwt.generatePayload(payload.phone, payload.roleID, rzxx.INDEX, payload.jsIndex));
        res.cookie('jwt', token, { httpOnly: true });
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

    let yhxx = await orm.CustomerInfo.findOne({ where: { LXDH: req.body.lxdh } });
    if (!yhxx) {
        let newYh = await orm.CustomerInfo.create({
            ZDSM: 10
            , YSQSM: 0
            , ZT: "1"
            , INDEX: uuidv1()
            , YHM: req.body.sqr
            , SFNBCY: req.body.sqrlx
            , YHDW: req.body.sqrdw
            , LXDH: req.body.lxdh
            , WECHAT: req.body.wechat
            , YXDZ: req.body.jsyx
            , XMDDM: req.body.ssqy
            , XZQDM: req.body.ssqy
        });

        let token = jwt.encode(jwt.generatePayload(payload.phone, payload.roleID, newYh.INDEX, payload.jsIndex));
        res.cookie('jwt', token, { httpOnly: true });
        return res.json({ code: "0000" });
    }
    else {
        if (req.body.updateUser == "1") {
            yhxx.YHM = req.body.sqr || yhxx.YHM;
            yhxx.SFNBCY = req.body.sqrlx || yhxx.SFNBCY;
            yhxx.YHDW = req.body.sqrdw || yhxx.YHDW;
            yhxx.WECHAT = req.body.wechat || yhxx.WECHAT;
            yhxx.YXDZ = req.body.jsyx || yhxx.YXDZ;
            yhxx.XMDDM = req.body.ssqy || yhxx.XMDDM;
            yhxx.XZQDM = req.body.ssqy || yhxx.XZQDM;
            yhxx.ZT = "1";
        }
        else {
            yhxx.WECHAT = req.body.wechat || yhxx.WECHAT;
            yhxx.YXDZ = req.body.jsyx || yhxx.YXDZ;
        }

        await yhxx.save();
        return res.json({ code: "0000" });
    }
}));

//// 用户获取历史申请信息
router.get('/user_history', catchAsyncErrors(async (req, res) => {
    let index = "";
    let payload = jwt.decode(req.cookies.jwt);
    if (!payload || !payload.phone) {
        throw new AppCommonError("无法获取已登陆信息，请重新登陆", "0005");
    }

    if (!payload.index) {
        let yhxx = await orm.CustomerInfo.findOne({ where: { LXDH: payload.phone } });
        if (!yhxx || !yhxx.INDEX) {
            throw new AppCommonError("无申请记录", "10022");
        }
        index = yhxx.INDEX;
    }
    else {
        index = payload.index;
    }

    let searchBody = { YHRZXX_INDEX: index };
    if (req.query.shzt) {
        searchBody.BLZT = req.query.shzt;
    }

    let page = 1, pageSize = 5;
    if (req.query.page && !isNaN(req.query.pageSize)) {
        page = parseInt(req.query.page);
    }

    if (req.query.pageSize && !isNaN(req.query.pageSize)) {
        pageSize = parseInt(req.query.pageSize);
    }

    let records = await orm.ApplicationInfo.findAll({ where: searchBody, limit: pageSize, offset: pageSize * (page - 1) });
    if (!records || records.length == 0) {
        throw new AppCommonError("无申请记录", "10022");
    }
    else {
        let result = records.map(r => {
            return {
                index: r.INDEX,
                sqlx: r.SQLX,
                cpmc: r.CPMC,
                jmg: r.SFJMG,
                xzqdm: r.SQXZDM,
                sqsl: r.SQSL,
                jzsj: r.JZSJ,
                sqxlm: r.SQXLM,
                swhtmc: r.SWHTMC,
                swlxr: r.SWLXR,
                xmddm: r.XMDDM,
                sqxks: r.SQXKS,
                jfsy: r.JFSY,
                shzt: optionConverter.ConvertApplicationStatus(r.BLZT),
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

    let destroyResult = await orm.ApplicationInfo.destroy({ where: { INDEX: reqParams.index } });
    if (destroyResult == 0)
        throw new AppCommonError("撤销申请失败", "0001");
    else
        return res.json({ code: '0000' });
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
            let users = await orm.User.aggregate("SSXMZ", 'DISTINCT', { plain: false });
            return res.json(users.map(u => { return { mc: u.DISTINCT, dm: 1 } }));
            break;
        default:
            throw new AppCommonError("目标字典不存在", "0002");
            break;
    }

    let dwxxs = await queryOption.findAll();
    let dict = dwxxs.map(d => { return { mc: d.MC, dm: d.DM } });
    res.json(dict);
}));

router.get('/xzqdm', catchAsyncErrors(async (req, res, next) => {
    if (!req.query.xzqjb) {
        throw new AppCommonError("行政区级别为空");
    }

    let xzq;
    if (!req.query.xzqdm && req.query.xzqjb == "1") {
        xzq = await orm.option.DWXX.findAll({ where: { JB: { [orm.Sequelize.Op.like]: req.query.xzqjb + '%' } } });
    }
    else {
        let jb = 4 - parseInt(req.query.xzqjb);
        let target = req.query.xzqdm.substring(0, req.query.xzqdm.length - 2 * jb);

        xzq = await orm.option.DWXX.findAll({ where: { JB: { [orm.Sequelize.Op.like]: req.query.xzqjb + '%' }, DM: { [orm.Sequelize.Op.like]: target + '%' } } });
    }
    let dict = xzq.map(d => { return { mc: d.MC, dm: d.DM } });
    return res.json(dict);
}));

router.get('/xzqmc', catchAsyncErrors(async (req, res, next) => {
    if (!req.query.xzqdm) {
        throw new AppCommonError("行政区代码为空");
    }

    console.log(req.query.xzqdm);
    let resultxzq = await orm.option.DWXX.findAll({
        attributes: ['MC', 'DM'],
        where: { DM: req.query.xzqdm }
    });
    if (!resultxzq || resultxzq.length == 0)
        throw new AppCommonError("未查询到行政区信息");

    let dict = resultxzq.map(x => { return { mc: x.MC, dm: x.DM } });
    return res.json(dict);
}));

//// 提交申请
router.post('/submitApplication', catchAsyncErrors(async (req, res, next) => {
    let reqParams = req.body;
    let payload = jwt.decode(req.cookies.jwt);
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

    if (!reqParams.sqxlm)
        throw new AppCommonError("授权序列码为空", "0001");

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
    }
    if (reqParams.sqlx == "2") {
        if (!reqParams.sqxks) {
            throw new AppCommonError("授权许可数为空", "0001");
        }
    }

    let cp = await orm.option.CPLX.findAll();
    let cpmc = "";
    if (!cp) {
        console.warn("产品代码表查询失败，请联系管理员");
        throw new AppCommonError("软件产品无效", "0002");
    }
    else {
        let selectedCP = cp.find(c => c.DM == reqParams.cpdm);
        if (!selectedCP) {
            throw new AppCommonError("软件产品无效", "0002");
        }
        else {
            cpmc = selectedCP.MC;
        }
    }

    let userInfo = await orm.CustomerInfo.findOne({ where: { INDEX: payload.index } });
    if (!userInfo)
        throw new AppCommonError("当前用户不存在", "0001");
    if (userInfo.ZT == "9")
        throw new AppCommonError("当前用户认证被拒绝，请联系项目负责人", "0001");
    if (userInfo.SFNBCY == "0") {                                           // 甲方用户必须填写合同和联系人
        if (!reqParams.swhtmc)
            throw new AppCommonError("商务合同名称为空", "0001");
        if (!reqParams.swlxr)
            throw new AppCommonError("商务联系人为空", "0001");
    }

    let sxmddm = '';              // 行政单位代码组
    if (userInfo.SFNBCY == "1" && reqParams.jfsy == '0') {
        //// 内部用户逻辑（内部 不是给甲方使用的转给部门主任）
        // 查找项目经理
        let userManager = await orm.User.findOne({ where: { SSXMZ: userInfo.YHDW, JSDM: 7 } });
        if (!userManager)
            throw new AppCommonError("未找到项目组负责人", "0001");
        // 项目经理是否负责该项目
        let djxxInfo = await orm.ApplicationRecord.findOne({ where: { CPDM: [reqParams.cpdm, '0'], CSR: userManager.INDEX } });
        if (!djxxInfo)
            throw new AppCommonError("项目组经理不负责审核该软件产品", "0001");
    }
    else {
        //// 外部用户逻辑（内部帮甲方申请或者甲方自己申请转给商务人员）
        let targetXzqs = reqParams.xzqdm.split(',');
        let xmXzq = common.GetXZQArray(targetXzqs[0]);
        let appRecord = await orm.ApplicationRecord.findOne({ where: { XMDDM: xmXzq, CPDM: reqParams.cpdm } });
        if (!appRecord) {
            throw new AppCommonError("用户所属区域没有对应的项目", "0001");
        }
        sxmddm = appRecord.XMDDM;       // 获取项目点代码
    }

    let jmg = reqParams.sqlx == "1" ? reqParams.jmg : "0";              // 授权类型（临时、长期、自定义）
    let jzsj = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
    if (reqParams.jzsjlx == "2") {
        jzsj = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
    }
    if (reqParams.jzsjlx == "3") {
        jzsj = new Date(parseInt(reqParams.jzsj));
    }

    let blzt = userInfo.ZT == "4" ? "2" : "1";
    let newApplication = await orm.ApplicationInfo.create({
        YHRZXX_INDEX: userInfo.INDEX
        , SQLX: reqParams.sqlx
        , SQXZDM: reqParams.xzqdm
        , CPDM: reqParams.cpdm
        , CPMC: cpmc
        , SQXLM: reqParams.sqxlm
        , BLZT: blzt
        , SFJMG: jmg
        , SQSJ: new Date(Date.now()).toMysqlFormat()
        , JZSJ: jzsj.toMysqlFormat()
        , XMDDM: sxmddm
        , SQSL: reqParams.sqsl
        , SWHTMC: reqParams.swhtmc
        , SWLXR: reqParams.swlxr
        , SQXKS: reqParams.sqxks
        , JZSJLX: reqParams.jzsjlx
        , JFSY: reqParams.jfsy
        , INDEX: uuidv1()
    });

    if (!newApplication) {
        throw new AppCommonError("无法创建新申请", "0006");
    } else {
        return res.json({ code: "0000" });
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
        let jsUser = await orm.User.findOne({ where: { INDEX: payload.jsIndex }, attributes: ['SSXMZ'] });
        if (!jsUser.SSXMZ) {
            throw new AppCommonError("当前用户项目组为空");
        }
        let yhrzUSer = await orm.CustomerInfo.findAll({ where: { YHDW: jsUser.SSXMZ, SFNBCY: "1" } });
        if (!yhrzUSer || yhrzUSer.length == 0) {
            throw new AppCommonError("当前用户项目组没有用户提交申请");
        }

        let uncheckedUsers = yhrzUSer.filter(item => (item.ZT !== '4') && (item.ZT !== '9'));
        let responseObjects = uncheckedUsers.map(u => { return { yhm: u.YHM, xzqdm: u.XZQDM, dwmc: u.YHDW, lxdh: u.LXDH, rzzt: u.ZT, wechat: u.WECHAT, index: u.INDEX } });
        if (!responseObjects || responseObjects.length == 0) {
            throw new AppCommonError("当前用户无待审用户", "20022");
        }
        res.json(responseObjects);
    }
    else {
        if (userQx.indexOf("3") > -1) {
            recordSearchCondition.push({ CSR: payload.jsIndex });
            customerSearchCondition.push("1");
        }
        if (userQx.indexOf("4") > -1) {
            recordSearchCondition.push({ FSR: payload.jsIndex });
            customerSearchCondition.push("2");
        }
        if (userQx.indexOf("5") > -1) {
            recordSearchCondition.push({ SQSHR: payload.jsIndex });
            customerSearchCondition.push("3");
        }

        if (recordSearchCondition.length == 0) {
            throw new AppCommonError("当前用户无审核权限", "20021");
        }

        let userApplication = await orm.ApplicationRecord.findAll({ where: { [orm.Sequelize.Op.or]: recordSearchCondition }, attributes: ['XMDDM'] });
        if (!userApplication || userApplication.length == 0)
            throw new AppCommonError("当前用户无待审用户", "20022");
        let xmddms = userApplication.map(app => app.XMDDM);

        let uncheckedUsers = await orm.CustomerInfo.findAll({ where: { ZT: { [orm.Sequelize.Op.in]: customerSearchCondition }, XMDDM: { [orm.Sequelize.Op.in]: xmddms } } });
        let responseObjects = uncheckedUsers.map(u => { return { yhm: u.YHM, xzqdm: u.XZQDM, dwmc: u.YHDW, lxdh: u.LXDH, rzzt: u.ZT, wechat: u.WECHAT, index: u.INDEX } });
        if (!responseObjects || responseObjects.length == 0) {
            throw new AppCommonError("当前用户无待审用户", "20022");
        }
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
        let jsUser = await orm.User.findOne({ where: { INDEX: payload.jsIndex }, attributes: ['SSXMZ'] });
        if (!jsUser.SSXMZ) {
            throw new AppCommonError("当前用户项目组为空");
        }
        let yhrzUSer = await orm.CustomerInfo.findAll({ where: { YHDW: jsUser.SSXMZ, SFNBCY: "1" } });
        if (!yhrzUSer || yhrzUSer.length == 0) {
            throw new AppCommonError("当前用户项目组没有用户提交申请");
        }
        let yhIndexes = yhrzUSer.map(item => item.INDEX);
        let sq = await orm.ApplicationInfo.findAll({
            where: {
                YHRZXX_INDEX: { [orm.Sequelize.Op.in]: yhIndexes },
                BLZT: "2", JFSY: '0'
            }, include: [{ model: orm.CustomerInfo, as: "Customers" }]
        });
        let responseObjects = sq.map(u => {
            return {
                yhm: u.Customers.YHM,
                xzqdm: u.SQXZDM,
                dwmc: u.Customers.YHDW,
                lxdh: u.Customers.LXDH,
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
                sqxlm: u.SQXLM,
                index: u.INDEX
            }
        });

        if (responseObjects.length == 0) {
            throw new AppCommonError("当前用户无待审申请", "20022");
        }
        return res.json(responseObjects);
    }
    else {
        if (userQx.indexOf("3") > -1) {
            recordSearchCondition.push({ CSR: payload.jsIndex });
            applicationSearchCondition.push("2");
        }
        if (userQx.indexOf("4") > -1) {
            recordSearchCondition.push({ FSR: payload.jsIndex });
            applicationSearchCondition.push("3");
        }
        if (userQx.indexOf("5") > -1) {
            recordSearchCondition.push({ SQSHR: payload.jsIndex });
            applicationSearchCondition.push("4");
        }

        if (recordSearchCondition.length == 0) {
            throw new AppCommonError("当前用户无审核权限", "20021");
        }

        let userApplication = await orm.ApplicationRecord.findAll({
            where:
                {
                    [orm.Sequelize.Op.or]: recordSearchCondition
                },
            attributes: ['XMDDM', 'CPDM', 'JZSJ']
        });

        if (!userApplication)
            throw new AppCommonError("当前用户无待审申请", "20022");

        let allApplications = [];
        for (let app of userApplication) {
            let uncheckedApplications = await orm.ApplicationInfo.findAll({
                where: {
                    BLZT: { [orm.Sequelize.Op.in]: applicationSearchCondition },
                    XMDDM: app.XMDDM,
                    CPDM: app.CPDM,
                },
                include: [{ model: orm.CustomerInfo, as: "Customers" }]
            });

            // 选出甲方用户申请或者内部成员为甲方申请的信息
            uncheckedApplications = uncheckedApplications.filter(item =>
                item.Customers.SFNBCY == "0" ||
                (item.Customers.SFNBCY == "1" && item.JFSY == '1'));

            let responseObjects = uncheckedApplications.map(u => {
                return {
                    yhm: u.Customers.YHM,
                    xzqdm: u.SQXZDM,
                    dwmc: u.Customers.YHDW,
                    lxdh: u.Customers.LXDH,
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
                    sqxlm: u.SQXLM,
                    index: u.INDEX,
                    xmjzsj: app.JZSJ
                }
            });
            allApplications = allApplications.concat(responseObjects);
        }

        if (allApplications.length == 0) {
            throw new AppCommonError("当前用户无待审申请", "20022");
        }

        return res.json(allApplications);
    }
}));

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

    if (userQx.indexOf('7') > -1) {
        let jsUser = await orm.User.findOne({ where: { INDEX: payload.jsIndex }, attributes: ['SSXMZ'] });
        if (!jsUser.SSXMZ) {
            throw new AppCommonError("当前用户项目组为空");
        }
        let yhrzUSer = await orm.CustomerInfo.findAll({ where: { YHDW: jsUser.SSXMZ, SFNBCY: "1", INDEX: { [orm.Sequelize.Op.in]: indexes_update } }, include: [{ model: orm.ApplicationInfo, as: 'Applications' }] });
        if (!yhrzUSer || yhrzUSer.length == 0) {
            throw new AppCommonError(jsUser.SSXMZ + "未包含当前用户信息");
        }
        for (let yh of yhrzUSer) {
            yh.ZT = '4';
            let apps = yh.Applications.filter(item => item.BLZT == "1");
            for (let a of apps) {
                a.BLZT = "2";
                a.save().then(() => {
                }).catch(err => {
                });
            }
            yh.save().then(() => {
            }).catch(err => {
            });
        }

        return res.json({ code: "0000" });

    } else {
        if (userQx.indexOf("5") > -1) {
            if (tg) {
                console.log('log');
                let count = await orm.CustomerInfo.findAll({ where: { INDEX: { [orm.Sequelize.Op.in]: indexes_update }, ZT: "3" }, include: [{ model: orm.ApplicationInfo, as: 'Applications' }] });
                if (count.length > 0) {
                    for (let c of count) {
                        c.ZT = "4";
                        let apps = c.Applications.filter(item => item.BLZT == "1");
                        for (let a of apps) {
                            a.BLZT = "2";
                            a.save().then(() => {
                            }).catch(err => {
                            });
                        }
                        c.save().then(() => {
                            rows = rows + 1;
                        }).catch(err => {
                        });
                    }
                }
            }
            else {
                let count = await orm.CustomerInfo.update({ ZT: "9", BZ: req.body.shzt }, { where: { INDEX: { [orm.Sequelize.Op.in]: indexes_update }, ZT: "2" } });
                rows = rows + count[0];
            }
        }

        if (userQx.indexOf("4") > -1) {
            if (tg) {
                let count = await orm.CustomerInfo.update({ ZT: "3" }, { where: { INDEX: { [orm.Sequelize.Op.in]: indexes_update }, ZT: "2" } });
                rows = rows + count[0];
            }
            else {
                let count = await orm.CustomerInfo.update({ ZT: "9", BZ: req.body.shzt }, { where: { INDEX: { [orm.Sequelize.Op.in]: indexes_update }, ZT: "2" } });
                rows = rows + count[0];
            }
        }

        if (userQx.indexOf("3") > -1) {
            if (tg) {
                let count = await orm.CustomerInfo.update({ ZT: "2" }, { where: { INDEX: { [orm.Sequelize.Op.in]: indexes_update }, ZT: "1" } });
                rows = rows + count[0];
            }
            else {
                let count = await orm.CustomerInfo.update({ ZT: "9", BZ: req.body.shzt }, { where: { INDEX: { [orm.Sequelize.Op.in]: indexes_update }, ZT: "1" } });
                rows = rows + count[0];
            }
        }

        // if (rows == indexes_update.length) {
        return res.json({ code: "0000" });
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

    //// 申请信息
    let rows_submit = await orm.ApplicationInfo.findAll({ where: { INDEX: { [orm.Sequelize.Op.in]: indexes_update } }, include: [{ model: orm.CustomerInfo, as: "Customers" }] });

    //// 项目经理审核
    if (userQx.indexOf('7') > -1) {
        let rows_update = rows_submit.filter(item => item.BLZT == "2" && item.Customers.SFNBCY == "1");
        if (rows_update && rows_update.length != 0) {
            if (tg) {
                let count = await orm.ApplicationInfo.update({ BLZT: "5" }, { where: { INDEX: { [orm.Sequelize.Op.in]: rows_update.map(item => item.INDEX) }, BLZT: "2" } });
                rows = rows + count[0];
                let rows_make = rows_update.filter(item => item.SQLX == "1" && item.SFJMG == "0");
                MakeAuthority(rows_make.map(item => item.INDEX));
            }
            else {
                let count = await orm.ApplicationInfo.update({ BLZT: "9", BZ: req.body.shyj }, { where: { INDEX: { [orm.Sequelize.Op.in]: indexes_update }, BLZT: "2" } });
                rows = rows + count[0];
            }
        }
    }

    //// 三审
    if (userQx.indexOf("5") > -1) {
        let rows_update = rows_submit.filter(item => item.BLZT == "4");
        if (rows_update && rows_update.length != 0) {
            if (tg) {
                let count = await orm.ApplicationInfo.update({ BLZT: "5" }, { where: { INDEX: { [orm.Sequelize.Op.in]: indexes_update }, BLZT: "4" } });
                rows = rows + count[0];
                let rows_make = rows_update.filter(item => item.SQLX == "1" && item.SFJMG == "0");
                MakeAuthority(rows_make.map(item => item.INDEX));
            }
            else {
                let count = await orm.ApplicationInfo.update({ BLZT: "9", BZ: req.body.shyj }, { where: { INDEX: { [orm.Sequelize.Op.in]: indexes_update }, BLZT: "4" } });
                rows = rows + count[0];
            }
        }
    }

    //// 二审
    if (userQx.indexOf("4") > -1) {
        let rows_update = rows_submit.filter(item => item.BLZT == "3");
        if (rows_update && rows_update.length != 0) {
            if (tg) {
                let count = await orm.ApplicationInfo.update({ BLZT: "4" }, { where: { INDEX: { [orm.Sequelize.Op.in]: indexes_update }, BLZT: "3" } });
                rows = rows + count[0];
            }
            else {
                let count = await orm.ApplicationInfo.update({ BLZT: "9", BZ: req.body.shyj }, { where: { INDEX: { [orm.Sequelize.Op.in]: indexes_update }, BLZT: "3" } });
                rows = rows + count[0];
            }
        }
    }

    //// 一审
    if (userQx.indexOf("3") > -1) {
        //// 甲方申请或者内部帮甲方申请的都要走一二三审模式
        let rows_update = rows_submit.filter(item => item.BLZT == "2" &&
            (item.Customers.SFNBCY == "0" || (item.Customers.SFNBCY == "1" && item.JFSY == "1")));
        if (rows_update && rows_update.length != 0) {
            if (tg) {
                let count = await orm.ApplicationInfo.update({ BLZT: "3" }, { where: { INDEX: { [orm.Sequelize.Op.in]: indexes_update }, BLZT: "2" } });
                rows = rows + count[0];
            }
            else {
                let count = await orm.ApplicationInfo.update({ BLZT: "9", BZ: req.body.shyj }, { where: { INDEX: { [orm.Sequelize.Op.in]: indexes_update }, BLZT: "2" } });
                rows = rows + count[0];
            }
        }
    }

    //console.log('提交成功1');
    return res.json({ code: "0000" });
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

    let need_authorities = await orm.ApplicationInfo.findAll({ where: { [orm.Sequelize.Op.or]: [{ BLZT: "5" }, { BLZT: "6" }] }, include: [{ model: orm.CustomerInfo, as: "Customers" }] });
    need_authorities = need_authorities.filter((x) => {
        if (x.Customers)
            return x;
    });
    let responseObjects = need_authorities.map(u => {
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
            sqxlm: u.SQXLM,
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

    let indexes_update = req.body.index.split(",");
    let sftg = req.body.sftg == "1";
    let need_authorities = await orm.ApplicationInfo.findAll({ where: { INDEX: { [orm.Sequelize.Op.in]: indexes_update } } });
    let update_count = 0;
    if (!need_authorities || need_authorities.length == 0) {
        return res.json({ code: "0000" });
    }
    else {
        if (sftg) {
            let count = await orm.ApplicationInfo.update({ BLZT: "8" }, { where: { INDEX: { [orm.Sequelize.Op.in]: indexes_update } } });
            update_count = count[0];
        }
        else {
            let count = await orm.ApplicationInfo.update({ BLZT: "9" }, { where: { INDEX: { [orm.Sequelize.Op.in]: indexes_update } } });
            update_count = count[0];
        }
    }

    return res.json({ code: "0000" });

}));

//// 发送验证码
router.post('/send_authcode', catchAsyncErrors(async (req, res) => {
    let payload = jwt.decode(req.cookies.jwt);
    if (!payload || !payload.phone)
        throw new AppCommonError('登录信息无效', '0001');

    // await authOper.sendMessage(payload.phone, '申请被拒绝1');
    // await authOper.sendMessage(payload.phone, '申请被拒绝2');
    // await authOper.sendMessage(payload.phone, '申请被拒绝3');
    return res.json({ code: "0000", msg: "发送成功" });
}));


async function MakeAuthority(indexes) {
    let rows = await orm.ApplicationInfo.findAll({
        where: { INDEX: { [orm.Sequelize.Op.in]: indexes }, BLZT: "5" },
        include: [{ model: orm.CustomerInfo, as: "Customers" }]
    });
    let promises = rows.map(item => Authority(item));
    await Promise.all(promises);
}

// 制作授权并发送邮件
async function Authority(appInfo) {
    try {
        postOption.body = {
            SQLX: (appInfo.SQLX - 1).toString()
            , ListXZQDM: appInfo.SQXZDM.split(',')
            , CPDM: appInfo.CPDM
            , JZSJ: appInfo.JZSJ
            , SQSL: appInfo.SQSL
            , ListSQXLM: appInfo.SQXLM.split(',')
            , IsJMG: appInfo.SFJMG == "1"
            , SQXKS: appInfo.SQXKS
            , NumJMG: 12345
        };

        let body = await requester(postOption);     // 调用制作授权服务
        appInfo.SQNR = body;
        await SendAuthority([appInfo]);        // 发送授权
        appInfo.BLZT = "8";
        await appInfo.save();
    }
    catch (error) {
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
            await mailerSender.SendMail(item.Customers.YXDZ, "授权信息", item.SQNR);
        }
    }
    catch (error) {
        throw error;
    }
}

//-----------------------------管理系统接口--------------------------------//

router.get('/suggestionsjscy',  catchAsyncErrors(async (req, res) => {

    let jsdms = await orm.option.JSXX.findAll();
    let jsdm = jsdms.map(d => { return { value: d.DM, label:d.MC} });


    let ssbms = await orm.User.aggregate("SSBM", 'DISTINCT', { plain: false });
    let ssbm = ssbms.map(u => { return { value: u.DISTINCT } });


    let ssxmzs = await orm.User.aggregate("SSXMZ", 'DISTINCT', { plain: false });
    let ssxmz = ssxmzs.map(u => { return { value: u.DISTINCT } });

    return res.json({code:"0000",data:{'jsdm':jsdm,'ssbm':ssbm,'ssxmz':ssxmz}})
}));

router.get('/selectionscpdj',  catchAsyncErrors(async (req, res) => {
    let dwdmArray = await orm.option.DWXX.findAll();
    let dwdm = dwdmArray.map(d => { return { value: d.DM, label:d.DM + ' ' + d.MC, index:d.INDEX} });

    let dwmcArray = await orm.option.DWXX.findAll();
    let dwmc = dwmcArray.map(d => { return { value: d.MC, label:d.MC, index:d.INDEX} });

    let cpdmArray = await orm.option.CPLX.findAll();
    let cpdm = cpdmArray.map(d => { return { value: d.DM, label:d.MC+'('+ d.DM +')', index:d.INDEX} });

    let xmjlArray = await orm.User.findAll({
        where: {
            [orm.Sequelize.Op.or]: [{jsdm: 7},{jsdm: {[orm.Sequelize.Op.like]:'7,%'}},{jsdm: {[orm.Sequelize.Op.like]:'%,7,%'}},{jsdm: {[orm.Sequelize.Op.like]:'%,7'}}]
        }
    });
    let xmjl = xmjlArray.map(d => { return { value: d.INDEX, label: d.JSCY} });

    let csrArray = await orm.User.findAll({
        where: {
            [orm.Sequelize.Op.or]: [{jsdm: 3},{jsdm: {[orm.Sequelize.Op.like]:'3,%'}},{jsdm: {[orm.Sequelize.Op.like]:'%,3,%'}},{jsdm: {[orm.Sequelize.Op.like]:'%,3'}}]
        }
    });
    let csr = csrArray.map(d => { return { value: d.INDEX, label: d.JSCY} });

    let fsrArray = await orm.User.findAll({
        where: {
            [orm.Sequelize.Op.or]: [{jsdm: 4},{jsdm: {[orm.Sequelize.Op.like]:'4,%'}},{jsdm: {[orm.Sequelize.Op.like]:'%,4,%'}},{jsdm: {[orm.Sequelize.Op.like]:'%,4'}}]
        }
    });
    let fsr = fsrArray.map(d => { return { value: d.INDEX, label: d.JSCY} });

    let sqshrArray = await orm.User.findAll({
        where: {
            [orm.Sequelize.Op.or]: [{jsdm: 5},{jsdm: {[orm.Sequelize.Op.like]:'5,%'}},{jsdm: {[orm.Sequelize.Op.like]:'%,5,%'}},{jsdm: {[orm.Sequelize.Op.like]:'%,5'}}]
        }
    });
    let sqshr = sqshrArray.map(d => { return { value: d.INDEX, label: d.JSCY} });

    let lrrArray = await orm.User.findAll({
        where: {
            [orm.Sequelize.Op.or]: [{jsdm: 6},{jsdm: {[orm.Sequelize.Op.like]:'6,%'}},{jsdm: {[orm.Sequelize.Op.like]:'%,6,%'}},{jsdm: {[orm.Sequelize.Op.like]:'%,6'}}]
        }
    });
    let lrr = lrrArray.map(d => { return { value: d.INDEX, label: d.JSCY} });


    return res.json({code:"0000",data:{xzqdm:dwdm,xzqmc:dwmc,cpdm:cpdm, xmjl:xmjl, csr:csr, fsr:fsr, sqshr:sqshr, lrr:lrr}})
}));

router.get('/systable/dwxx',  catchAsyncErrors(async (req, res) => {
    let dwxx = await orm.option.DWXX.findAll();
    let responseObjects = dwxx.map((item)=>{
        return {
            index:item.INDEX,
            dwdm:item.DM,
            dwmc:item.MC,
            xzqjb:item.JB,
            editing:false            
        }
    })
    return res.json({code:'0000',data:responseObjects})
}));


router.post('/systable/dwxx',  catchAsyncErrors(async (req, res) => {
    let reqParams = req.body;

    //0更新1新增2删除
    if (reqParams.xw === "1") {
        let newDwxx = await orm.option.DWXX.create({
            INDEX: uuidv1(),
            DM: reqParams.dwdm,
            MC: reqParams.dwmc,
            JB: reqParams.xzqjb,
            editing:false
        });

        if (!newDwxx) {
            throw new AppCommonError("无法新增该单位信息", "0006");
        } else {
            return res.json({ code: "0000",msg:'单位信息新增成功' });
        }

    } else if (reqParams.xw === "0"){
        let dwxx = await orm.option.DWXX.findOne({ where: { INDEX: reqParams.index } });
        dwxx.DM = reqParams.dwdm || dwxx.DM;
        dwxx.MC = reqParams.dwmc || dwxx.MC;
        dwxx.JB = reqParams.xzqjb || dwxx.JB;

        if (!dwxx) {
            throw new AppCommonError("无法更新该单位信息", "0006");            
        } else {
            await dwxx.save();
            return res.json({ code: "0000",msg:'单位信息更新成功' });
        }

    } else if (reqParams.xw === "2"){
        let destroyResult;
        for(let i= 0;i<reqParams.index.length;i++){  
             destroyResult = await orm.option.DWXX.destroy({ where: { INDEX: reqParams.index[i] } });
        }
        if (destroyResult === 0){
            throw new AppCommonError("删除失败", "0001");            
        }
        else {
            return res.json({ code: '0000' , msg:'此单位信息删除成功'});
        }
    }

}));


router.get('/systable/cpxx',  catchAsyncErrors(async (req, res) => {
    let cplx = await orm.option.CPLX.findAll();
    let responseObjects = cplx.map((item)=>{
        return {
            index:item.INDEX,
            cpdm:item.DM,
            cpmc:item.MC,
            sfwh:item.SFWH,
            editing:false
        }
    })
    return res.json({code:'0000',data:responseObjects})
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
            return res.json({ code: "0000",msg:'产品类型新增成功' });
        }

    } else if (reqParams.xw === "0"){
        let cplx = await orm.option.CPLX.findOne({ where: { INDEX: reqParams.index } });
        cplx.DM = reqParams.cpdm || cplx.DM;
        cplx.MC = reqParams.cpmc || cplx.MC;
        cplx.SFWH = reqParams.sfwh || cplx.SFWH;

        if (!cplx) {
            throw new AppCommonError("无法更新该产品类型", "0006");            
        } else {
            await cplx.save();
            return res.json({ code: "0000",msg:'产品类型更新成功' });
        }

    } else if (reqParams.xw === "2"){
        let destroyResult;
        for(let i= 0;i<reqParams.index.length;i++){  
             destroyResult = await orm.option.CPLX.destroy({ where: { INDEX: reqParams.index[i] } });
        }
        if (destroyResult === 0){
            throw new AppCommonError("产品类型删除失败", "0001");            
        }
        else {
            return res.json({ code: '0000' , msg:'产品类型删除成功'});
        }
    }

}));


router.get('/systable/jsxx',  catchAsyncErrors(async (req, res) => {
    let jsxx = await orm.option.JSXX.findAll();
    let responseObjects = jsxx.map((item)=>{
        return {
            index:item.INDEX,
            jsdm:item.DM,
            jsmc:item.MC,
            editing:false
        }
    })
    return res.json({code:'0000',data:responseObjects})
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
            return res.json({ code: "0000",msg:'角色信息新增成功' });
        }

    } else if (reqParams.xw === "0"){
        let jsxx = await orm.option.JSXX.findOne({ where: { INDEX: reqParams.index } });
        jsxx.DM = reqParams.jsdm || jsxx.DM;
        jsxx.MC = reqParams.jsmc || jsxx.MC;

        if (!jsxx) {
            throw new AppCommonError("无法更新该角色信息", "0006");            
        } else {
            await jsxx.save();
            return res.json({ code: "0000",msg:'角色信息更新成功' });
        }

    } else if (reqParams.xw === "2"){
        let destroyResult;
        for(let i= 0;i<reqParams.index.length;i++){  
             destroyResult = await orm.option.JSXX.destroy({ where: { INDEX: reqParams.index[i] } });
        }
        if (destroyResult === 0){
            throw new AppCommonError("角色信息删除失败", "0001");            
        }
        else {
            return res.json({ code: '0000' , msg:'角色信息删除成功'});
        }
    }

}));

router.get('/role/jscy',  catchAsyncErrors(async (req, res) => {
    let jscy = await orm.User.findAll();
    let responseObjects = jscy.map((item)=>{
        return {
            index:item.INDEX,
            jscy:item.JSCY,
            jsdm:item.JSDM,
            ssbm:item.SSBM,
            ssxmz:item.SSXMZ,
            lxdh:item.LXDH,
            wechat:item.WECHAT,
            bz:item.BZ,
            pwd:item.PWD
        }
    })
    return res.json({code:'0000',data:responseObjects})
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
            PWD: reqParams.pwd
        });

        if (!newJscy) {
            throw new AppCommonError("无法新增该角色信息", "0006");
        } else {
            return res.json({ code: "0000",msg:'角色成员新增成功' });
        }

    } else if (reqParams.xw === "0"){
        let jscy = await orm.User.findOne({ where: { INDEX: reqParams.index } });
        jscy.JSCY = reqParams.jscy || jscy.JSCY;
        jscy.JSDM = reqParams.jsdm || jscy.JSDM;
        jscy.SSBM = reqParams.ssbm || jscy.SSBM;
        jscy.SSXMZ = reqParams.ssxmz || jscy.SSXMZ;
        jscy.LXDH = reqParams.lxdh || jscy.LXDH;
        jscy.WECHAT = reqParams.wechat || jscy.WECHAT;
        jscy.BZ = reqParams.bz || jscy.BZ;
        jscy.PWD = reqParams.pwd || jscy.PWD;

        if (!jscy) {
            throw new AppCommonError("无法更新该角色信息", "0006");            
        } else {
            await jscy.save();
            return res.json({ code: "0000",msg:'角色成员更新成功' });
        }

    } else if (reqParams.xw === "2"){
        let destroyResult;
        for(let i= 0;i<reqParams.index.length;i++){  
             destroyResult = await orm.User.destroy({ where: { INDEX: reqParams.index[i] } });
        }
        if (destroyResult === 0){
            throw new AppCommonError("角色成员删除失败", "0001");            
        }
        else {
            return res.json({ code: '0000' , msg:'角色成员删除成功'});
        }
    }

}));


router.get('/product/cpdj',  catchAsyncErrors(async (req, res) => {
    let cpdj = await orm.ApplicationRecord.findAll();
    let responseObjects = cpdj.map((item)=>{
        return {
            index:item.INDEX,
            dwdm:item.DWDM,
            dwmc:item.DWMC,
            xmddm:item.XMDDM,
            xmdmc:item.XMDMC,
            cpdm:item.CPDM,
            sfjmg:item.SFJMG,
            sfsq: item.SFSQ,            
            jzsj:item.JZSJ,
            csr:item.CSR,
            fsr:item.FSR,
            sqshr:item.SQSHR,
            lrr:item.LRR,
            bz:item.BZ
        }
    })
    return res.json({code:'0000',data:responseObjects})
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
            return res.json({ code: "0000",msg:'产品登记信息新增成功' });
        }

    } else if (reqParams.xw === "0"){
        let cpdj = await orm.ApplicationRecord.findOne({ where: { INDEX: reqParams.index } });
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
            return res.json({ code: "0000",msg:'产品登记信息更新成功' });
        }

    } else if (reqParams.xw === "2"){
        let destroyResult;
        for(let i= 0;i<reqParams.index.length;i++){  
             destroyResult = await orm.ApplicationRecord.destroy({ where: { INDEX: reqParams.index[i] } });
        }
        if (destroyResult === 0){
            throw new AppCommonError("产品登记信息删除失败", "0001");            
        }
        else {
            return res.json({ code: '0000' , msg:'产品登记信息删除成功'});
        }
    }

}));

router.use((err, req, res, next) => {
    if (err instanceof AppCommonError) {
        res.json({ code: err.code, msg: err.message });
    }
    else {
        res.json({ code: "9999", msg: err.message });
    }
});
module.exports = router;