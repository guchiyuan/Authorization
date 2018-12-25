var express = require('express');
var router = express.Router();
var jwt = require('../common_function/jwt');
var orm = require('../models');
const config = require('../config/config');
const AppCommonError = require('../error/CommonError');
const uuidv1 = require('uuid/v1');

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


//获取角色成员详细信息中，下拉框选项的option
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

//获取登记信息详细信息中，下拉框选项的option
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
            jsdm: {
                [orm.Sequelize.Op.like]: '%7%'
            }
        }
    });
    let xmjl = xmjlArray.map(d => {
        return {
            value: d.INDEX,
            label: d.JSCY,
            need2check: (d.SSBM.indexOf('不动产软件中心') > -1 || d.SSBM.indexOf('软件工程中心') > -1) ? '0' : '1'
        }
    });

    let csrArray = await orm.User.findAll({
        where: {

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
            jsdm: {
                [orm.Sequelize.Op.like]: '%4%',
                [orm.Sequelize.Op.notLike]: '%4a%',
            }
        }
    });
    let fsr = fsrArray.map(d => {
        return {
            value: d.INDEX,
            label: d.JSCY
        }
    });


    let innerFsrArray = await orm.User.findAll({
        where: {
            jsdm: {
                [orm.Sequelize.Op.like]: '%4a%',
            }
        }
    });
    let innerFsr = innerFsrArray.map(d => {
        return {
            value: d.INDEX,
            label: d.JSCY
        }
    });

    let hdrArray = await orm.User.findAll({
        where: {

            jsdm: {
                [orm.Sequelize.Op.like]: '%5%'
            }
        }
    });
    let hdr = hdrArray.map(d => {
        return {
            value: d.INDEX,
            label: d.JSCY
        }
    });



    let lrrArray = await orm.User.findAll({
        where: {
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
            hdr: hdr,
            lrr: lrr,
            innerfsr:innerFsr
        }
    })
}));

router.get('/check_fushen', catchAsyncErrors(async (req, res) => {
    let cpxx = await orm.option.CPLX.findOne({
        where: {
            DM: req.query.cpdm
        }
    });

    if (cpxx.SFFS === '1') {
        return res.json({
            code: '0000',
            data: {
                sffs: '1'
            }
        })
    } else {
        return res.json({
            code: '0000',
            data: {
                sffs: '0'
            }
        })
    }
}))

//获取单位信息
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

//编辑保存单位信息
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

//获取产品信息
router.get('/systable/cpxx', catchAsyncErrors(async (req, res) => {
    let cplx = await orm.option.CPLX.findAll();
    let responseObjects = cplx.map((item) => {
        return {
            index: item.INDEX,
            cpdm: item.DM,
            cpmc: item.MC,
            sfwh: item.SFWH,
            sfdj: item.SFDJ,
            sffs: item.SFFS,
            editing: false
        }
    })
    return res.json({
        code: '0000',
        data: responseObjects
    })
}));

//编辑保存产品信息
router.post('/systable/cpxx', catchAsyncErrors(async (req, res) => {
    let reqParams = req.body;

    //0更新1新增2删除
    if (reqParams.xw === "1") {
        let newCplx = await orm.option.CPLX.create({
            INDEX: uuidv1(),
            DM: reqParams.cpdm,
            MC: reqParams.cpmc,
            SFWH: reqParams.sfwh,
            SFDJ: reqParams.sfdj,
            SFFS: reqParams.sffs
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
        cplx.SFDJ = reqParams.sfdj || cplx.SFDJ;
        cplx.SFFS = reqParams.sffs || cplx.SFFS;

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

//获取角色信息
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

//编辑保存角色信息
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

//获取商务联系人信息
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

//编辑保存删我联系人信息
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

//获取角色成员信息
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

}));

//编辑保存角色成员信息
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

//获取产品登记信息
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
            hdr: item.HDR,
            lrr: item.LRR,
            bz: item.BZ
        }
    })
    return res.json({
        code: '0000',
        data: responseObjects
    })
}));

//编辑保存产品登记信息
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
            HDR: reqParams.hdr,
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
        cpdj.HDR = reqParams.hdr || cpdj.HDR;
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

//获取录入人信息
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

//---------------日志记录管理新增接口-------------------//
//获取日志记录
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
        }, {
            model: orm.User,
            as: "Hdr"
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
            fssj: item.FSSJ == null ? '-' : item.FSSJ,
            hdr: item.Hdr == null ? '-' : item.Hdr.JSCY,
            hdsj: item.HDSJ == null ? '-' : item.HDSJ
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

//保存日志记录
router.post('/save_rzjl', catchAsyncErrors(async (req, res) => {
    let payload = jwt.decode(req.cookies.jwt);
    if (!payload || !payload.phone) {
        throw new AppCommonError("无法获取已登陆信息，请重新登陆", "0005");
    }

    let reqParams = req.body;

    let sqxx = await orm.ApplicationInfo.findOne({
        where: {
            INDEX: reqParams.sqxx_index
        },
        include: [{
          model: orm.CustomerInfo,
          as: "Customers"
        }]
    });

    let blzt = parseInt(reqParams.blzt);
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
        let cplx = await orm.option.CPLX.findOne({
            where: {
                MC: reqParams.cpmc
            }
        });
        
        if (((cplx.SFFS === '1' && sqxx.Customers.SFNBCY === '0') || !(cplx.SFFS === '1' && sqxx.JFSY === '1')) || ((sqxx.Customers.YHDW.indexOf('不动产软件中心') > -1 || sqxx.Customers.YHDW.indexOf('软件工程中心') > -1) && sqxx.Customers.SFNBCY === '1' && sqxx.JFSY === '0')) {
            let rzjl2 = await orm.LogRecord.update({
                FSR: payload.jsIndex,
                FSSJ: new Date(Date.now()).toMysqlFormatTime(),
                BLJG: reqParams.bljg,
                BLJSSJ: new Date(Date.now()).toMysqlFormatTime(),
                BZ: reqParams.bz,
                ZZBLR: payload.jsIndex,
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
            let rzjl2 = await orm.LogRecord.update({
                HDR: payload.jsIndex,
                HDSJ: new Date(Date.now()).toMysqlFormatTime(),
                BLJG: reqParams.bljg,
                BLJSSJ: new Date(Date.now()).toMysqlFormatTime(),
                BZ: reqParams.bz,
                ZZBLR: payload.jsIndex,
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
        }

    } else if (blzt == 4) {
        let rzjl3 = await orm.LogRecord.update({
            HDR: payload.jsIndex,
            HDSJ: new Date(Date.now()).toMysqlFormatTime(),
            BLJG: reqParams.bljg,
            BLJSSJ: new Date(Date.now()).toMysqlFormatTime(),
            BZ: reqParams.bz,
            ZZBLR: payload.jsIndex,
            SQNR: sqxx.SQNR
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
    } else {
        let rzjl4 = await orm.LogRecord.update({
            BLJG: reqParams.bljg,
            BLJSSJ: new Date(Date.now()).toMysqlFormatTime(),
            BZ: reqParams.bz,
            ZZBLR: payload.jsIndex,
            SQNR: sqxx.SQNR
        }, {
            where: {
                SQXX_INDEX: reqParams.sqxx_index
            }
        })
        if (!rzjl4) {
            throw new AppCommonError("无法记录日志", "0006");
        } else {
            return res.json({
                code: "0000"
            });
        }
    }

}));

//删除日志记录
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