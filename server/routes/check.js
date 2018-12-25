var express = require('express');
var router = express.Router();
var jwt = require('../common_function/jwt');
var common = require('../common_function/CustomFunc');
var orm = require('../models');
const config = require('../config/config');
const MyAppError = require('../error/MyAppError');
const AppCommonError = require('../error/CommonError');
const mailerSender = require('../common_function/MailSender');
var authOper = require('../common_function/AuthCode');
var requester = require('request-promise-native');
const uuidv1 = require('uuid/v1');
var postOption = {
  method: 'post',
  body: {},
  json: true,
  url: config.authorityAddress
};
var wechatOper = require('../common_function/WechatOperation')
const ADDRESS_ACCESSTOKEN = config.getAccessTokenAddress;

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


//获取授权申请常用拒绝理由
router.get('/application_reject_reason', (req, res) => {
  if (config.rejectReasons_Application) {
    return res.json(config.rejectReasons_Application);
  } else {
    return res.json([]);
  }
});

//获取用户认证常用拒绝理由
router.get('/user_reject_reason', (req, res) => {
  if (config.rejectReasons_User) {
    return res.json(config.rejectReasons_User);
  } else {
    return res.json([]);
  }
});

//// 审核人员获取未认证用户信息
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
        sfgzgzh: u.OPENID ? "是" : "否",
        remark: u.REMARK ? u.REMARK : '无'
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
    // if (userQx.indexOf("4") > -1) {
    //   recordSearchCondition.push({
    //     FSR: payload.jsIndex
    //   });
    //   customerSearchCondition.push("2");
    // }

    if (userQx.indexOf("5") > -1) {
      recordSearchCondition.push({
        HDR: payload.jsIndex
      });
      customerSearchCondition.push("2");
    }

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
        HDR: payload.jsIndex
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
        sfgzgzh: u.OPENID ? "是" : "否",
        remark: u.REMARK ? u.REMARK : '无'
      }
    });
    if (!responseObjects || responseObjects.length == 0) {
      throw new AppCommonError("当前用户无待审用户", "20022");
    }
    res.json(responseObjects);
  }
}));

//// 审核人员获取未审核的授权申请信息
router.get('/unchecked_applications', catchAsyncErrors(async (req, res, next) => {
  let payload = jwt.decode(req.cookies.jwt);
  if (!payload || !payload.jsIndex || !payload.roleID) {
    throw new AppCommonError("无法获取已登陆信息，请重新登陆", "0005");
  }

  let recordSearchCondition = [];
  let applicationSearchCondition = [];
  let userQx = payload.roleID.split(',');

  console.log(userQx, payload);


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
        sqsj: u.SQSJ,
        remark: u.REMARK ? u.REMARK : '无'
      }
    });

    if (responseObjects.length == 0) {
      throw new AppCommonError("当前用户无待审申请", "20022");
    }
    return res.json(responseObjects);
  } else if (userQx.indexOf('4a') > -1) {

    let sqxx = await orm.ApplicationInfo.findAll({
      where: {
        BLZT: 3
      },
      include: [{
        model: orm.CustomerInfo,
        as: "Customers"
      }]
    })

    let uncheckedSqxx = sqxx.filter(item => item.Customers.SFNBCY === '1' && item.JFSY === '0');

    let responseObj = uncheckedSqxx.map(item => {
      let sqxlmArr = [];
      let sqxlmStr;
      if (item.SQXLM.slice(0, 1) == '[') {
        let sqxlmObjArr = JSON.parse(item.SQXLM);
        for (let i = 0; i < sqxlmObjArr.length; i++) {
          sqxlmArr.push(sqxlmObjArr[i].value);
        }
        sqxlmStr = sqxlmArr.join(',');
      } else {
        sqxlmStr = item.SQXLM
      }
      return {
        yhm: item.Customers.YHM,
        xzqdm: item.SQXZDM,
        dwmc: item.Customers.YHDW,
        lxdh: item.Customers.LXDH,
        yxdz: item.Customers.YXDZ,
        blzt: item.BLZT,
        sqlx: item.SQLX,
        cpmc: item.CPMC,
        jmg: item.SFJMG,
        jfsy: item.JFSY,
        sqsl: item.SQSL,
        jzsj: item.JZSJ,
        swhtmc: item.SWHTMC,
        swlxr: item.SWLXR,
        xmddm: item.XMDDM,
        sqxks: item.SQXKS,
        sqxlm: sqxlmStr,
        index: item.INDEX,
        yhrzxxIndex: item.YHRZXX_INDEX,
        cpdm: item.CPDM,
        sqsj: item.SQSJ,
        remark: item.REMARK ? item.REMARK : '无'
      }
    })

    if (responseObj.length == 0) {
      throw new AppCommonError("当前用户无待审申请", "20022");
    }
    return res.json(responseObj);
  } else {
    //查找审核状态为2的给初审人（3），查找审核状态为3的给复审人（4）
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

    // if (userQx.indexOf("4a") > -1) {
    //   recordSearchCondition.push({
    //     FSR: payload.jsIndex
    //   });
    //   applicationSearchCondition.push("3");
    // }

    if (userQx.indexOf("5") > -1) {
      recordSearchCondition.push({
        HDR: payload.jsIndex
      });
      applicationSearchCondition.push("3");
      applicationSearchCondition.push("4");
    }

    if (recordSearchCondition.length == 0) {
      throw new AppCommonError("当前用户无审核权限", "20021");
    }


    let uncheckedApplications = [];
    orm.sequelize.query("SELECT a.JZSJ as XMJZSJ,b.*,c.YHM,c.LXDH,c.YHDW,c.SFNBCY,c.YXDZ FROM s_sj_sqdj a,s_sj_sqxx b,s_sj_yhrzxx c,s_zd_cplx d WHERE a.XMDDM=b.XMDDM and a.CPDM=b.CPDM and c.YHRZXX_INDEX=b.YHRZXX_INDEX and b.CPDM = d.CPDM and ((a.CSR=\'" + payload.jsIndex + "\'and b.BLZT='2') or (a.FSR=\'" + payload.jsIndex + "\'and b.BLZT='3') or (a.HDR=\'" + payload.jsIndex + "\'and b.BLZT='4') or (a.HDR=\'" + payload.jsIndex + "\'and b.BLZT='3' and d.SFFS = '0' )) group by b.SQXX_INDEX", {
        type: orm.sequelize.QueryTypes.SELECT
      })
      .then(results => {
        console.log(results);
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
            sqsj: result.SQSJ,
            remark: result.REMARK ? result.REMARK : '无'
          }
        })


        // 选出甲方用户申请或者内部成员为甲方申请的信息
        responseObj = responseObj.filter(item => item.sfnbcy == "0" || (item.sfnbcy == "1" && item.jfsy == '1'));


        return res.json(responseObj);

        // for (let i = 0; i < applicationSearchCondition.length; i++) {
        //   const blzt = applicationSearchCondition[i];
        //   responseObj.forEach(item => {
        //     if (item.blzt === blzt) {
        //       uncheckedApplications.push(item)
        //     }
        //   });
        // }

        // // 选出甲方用户申请或者内部成员为甲方申请的信息
        // uncheckedApplications = uncheckedApplications.filter(item =>
        //   item.sfnbcy == "0" || (item.sfnbcy == "1" && item.jfsy == '1'));


        // return res.json(uncheckedApplications);

      })
  }
}));


//// 审核人员审核用户
router.post('/checked_users', catchAsyncErrors(async (req, res) => {
  let payload = jwt.decode(req.cookies.jwt);
  if (!payload || !payload.jsIndex || !payload.roleID) {
    throw new AppCommonError("无法获取已登陆信息，请重新登陆", "0005");
  }

  let userQx = payload.roleID.split(',');
  let indexes_update = req.body.index.split(',');
  let rows = 0;
  let tg = req.body.sftg == "1";

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
    if (userQx.indexOf("5") > -1) {
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

        //给用户发送消息提醒
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

    return res.json({
      code: "0000"
    });
  }

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
    let rows_update = rows_submit.filter(item => item.BLZT == "2" && item.JFSY == "0" && item.Customers.SFNBCY == "1" && (item.Customers.YHDW.indexOf('不动产软件中心') > -1 || item.Customers.YHDW.indexOf('软件工程中心') > -1));
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
        // // let rows_make = rows_update.filter(item => item.SQLX == "1" && item.SFJMG == "0" && item.CPDM != '10' && item.CPDM != '100' && item.CPDM != '111' && item.CPDM != '302');
        // // let rows_make = rows_update.filter(item => item.SQLX == "1" && item.SFJMG == "0" && !(item.CPDM.indexOf('100') != -1 || item.CPDM.indexOf('111') != -1 || item.CPDM.indexOf('302') != -1|| item.CPDM.indexOf('10') != -1));
        // let rows_make = rows_update.filter(async item => {
        //   let cpdmArr = item.CPDM.split(',');
        //   let cplx = await orm.option.CPLX.findOne({
        //     where: {
        //       CPDM: cpdmArr[0]
        //     }
        //   });
        //   console.log('到这里了',cplx.SFDJ);
        //   // return item.SQLX == "1" && item.SFJMG == "0" && !cpdmArr.includes('100') && !cpdmArr.includes('111') && !cpdmArr.includes('10') && !cpdmArr.includes('302')
        //   return item.SQLX == "1" && item.SFJMG == "0" && cplx.SFDJ == '0'
        // });

        let rows_make = [];

        for (let i = 0; i < rows_update.length; i++) {
          let item = rows_update[i];
          let cpdmArr = item.CPDM.split(',');
          let cplx = await orm.option.CPLX.findOne({
            where: {
              DM: cpdmArr[0]
            }
          });
          if (item.SQLX == "1" && item.SFJMG == "0" && cplx.SFDJ == '0') {
            rows_make.push(item);
          }
        }
        console.log('自动制作授权的申请', rows_make);

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

    let rows_2check = rows_submit.filter(item => item.BLZT == "2" && item.JFSY == "0" && item.Customers.SFNBCY == "1" && !(item.Customers.YHDW.indexOf('不动产软件中心') > -1 || item.Customers.YHDW.indexOf('软件工程中心') > -1));

    if (rows_2check && rows_2check.length != 0) {

      if (tg) {
        let count = await orm.ApplicationInfo.update({
          BLZT: "3"
        }, {
          where: {
            INDEX: {
              [orm.Sequelize.Op.in]: rows_2check.map(item => item.INDEX)
            },
            BLZT: "2"
          }
        });

        if (blzt === '2') {
          if (!openid) {
            await authOper.sendMessage(lxdh, config.allow_application_sendMessage_nbsq);
          } else {
            await wechatOper.sendTemplateMessage(openid, body.access_token, '2a', tg, req.body.shyj, "内部申请审核");
          }
        }

      } else {
        let count = await orm.ApplicationInfo.update({
          BLZT: "9",
          BZ: `{"shyj":"${req.body.shyj}","shzt":"内部初审"}`
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
            await wechatOper.sendTemplateMessage(openid, body.access_token, '2a', tg, req.body.shyj, "内部申请审核");
          }

        }
      }
    }
  }


  if (userQx.indexOf("4a") > -1) {
    let rows_update = rows_submit.filter(item => item.BLZT == "3" && item.Customers.SFNBCY == "1" && item.JFSY == "0" && !(item.Customers.YHDW.indexOf('不动产软件中心') > -1 || item.Customers.YHDW.indexOf('软件工程中心') > -1));
    if (rows_update && rows_update.length != 0) {
      if (tg) {
        let count = await orm.ApplicationInfo.update({
          BLZT: "5"
        }, {
          where: {
            INDEX: {
              [orm.Sequelize.Op.in]: rows_update.map(item => item.INDEX)
            },
            BLZT: "3"
          }
        });
        rows = rows + count[0];

        let rows_make = [];

        for (let i = 0; i < rows_update.length; i++) {
          let item = rows_update[i];
          let cpdmArr = item.CPDM.split(',');
          let cplx = await orm.option.CPLX.findOne({
            where: {
              DM: cpdmArr[0]
            }
          });
          if (item.SQLX == "1" && item.SFJMG == "0" && cplx.SFDJ == '0') {
            rows_make.push(item);
          }
        }
        console.log('自动制作授权的申请', rows_make);

        MakeAuthority(rows_make.map(item => item.INDEX));
        if (blzt === '3') {
          if (!openid) {
            await authOper.sendMessage(lxdh, config.allow_application_sendMessage_nbsq);
          } else {
            await wechatOper.sendTemplateMessage(openid, body.access_token, blzt, tg, req.body.shyj, "内部申请审核");
          }
        }

      } else {
        let count = await orm.ApplicationInfo.update({
          BLZT: "9",
          BZ: `{"shyj":"${req.body.shyj}","shzt":"内部复审"}`
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
            await authOper.sendMessage(lxdh, config.refuse_application_sendMessage_nbsq);
          } else {
            await wechatOper.sendTemplateMessage(openid, body.access_token, blzt, tg, req.body.shyj, "内部申请审核");
          }

        }
      }
    }
  }


  //// 核定
  if (userQx.indexOf("5") > -1) {
    let rows_update = rows_submit;
    if (rows_update && rows_update.length != 0) {
      if (tg) {
        let count = await orm.ApplicationInfo.update({
          BLZT: "5"
        }, {
          where: {
            INDEX: {
              [orm.Sequelize.Op.in]: indexes_update
            },
            // BLZT: "3",
          }
        });

        rows = rows + count[0];
        // // let rows_make = rows_update.filter(item => item.SQLX == "1" && item.SFJMG == "0" && item.CPDM != '10' && item.CPDM != '100' && item.CPDM != '111' && item.CPDM != '302');
        // let rows_make = rows_update.filter(async item => {
        //   let cpdmArr = item.CPDM.split(',');
        //   let cplx = await orm.option.CPLX.findOne({
        //     where: {
        //       CPDM: cpdmArr[0]
        //     }
        //   });
        //   console.log(cplx);
        //   // return item.SQLX == "1" && item.SFJMG == "0" && !cpdmArr.includes('100') && !cpdmArr.includes('111') && !cpdmArr.includes('10') && !cpdmArr.includes('302')
        //   return item.SQLX == "1" && item.SFJMG == "0" && cplx.SFDJ == '0'
        // });

        let rows_make = [];

        for (let i = 0; i < rows_update.length; i++) {
          let item = rows_update[i];
          let cpdmArr = item.CPDM.split(',');
          let cplx = await orm.option.CPLX.findOne({
            where: {
              DM: cpdmArr[0]
            }
          });
          if (item.SQLX == "1" && item.SFJMG == "0" && cplx.SFDJ == '0') {
            rows_make.push(item);
          }
        }
        console.log('自动制作授权的申请', rows_make);

        MakeAuthority(rows_make.map(item => item.INDEX));
        // if (blzt === '3') {
        if (!openid) {
          await authOper.sendMessage(lxdh, config.allow_application_sendMessage_3);
        } else {
          await wechatOper.sendTemplateMessage(openid, body.access_token, '4', tg, req.body.shyj, "申请审核");
        }
        // }
      } else {
        let count = await orm.ApplicationInfo.update({
          BLZT: "9",
          BZ: `{"shyj":"${req.body.shyj}","shzt":"核定"}`
        }, {
          where: {
            INDEX: {
              [orm.Sequelize.Op.in]: indexes_update
            },
            // BLZT: "3"
          }
        });
        rows = rows + count[0];
        // if (blzt === '3') {
        if (!openid) {
          await authOper.sendMessage(lxdh, config.refuse_application_sendMessage_3 + '，拒绝理由：' + req.body.shyj + ')');
        } else {
          await wechatOper.sendTemplateMessage(openid, body.access_token, '4', tg, req.body.shyj, "申请审核");
        }
        // }
      }
    }
  }

  //// 复审
  if (userQx.indexOf("4") > -1) {
    //// 甲方申请或者内部帮甲方申请的都要走初审复审模式
    let rows_update = rows_submit.filter(item => item.BLZT == "3" &&
      (item.Customers.SFNBCY == "0" || (item.Customers.SFNBCY == "1" && item.JFSY == "1")));
    if (rows_update && rows_update.length != 0) {
      if (tg) {
        let count = await orm.ApplicationInfo.update({
          BLZT: "4"
        }, {
          where: {
            INDEX: {
              [orm.Sequelize.Op.in]: indexes_update
            },
            // BLZT: "3"
          }
        });
        rows = rows + count[0];
        if (blzt === '3') {
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
              as: "Hdr"
            }]
          });

          let openid_jscy = djxx.Hdr.OPENID;

          await wechatOper.remindCheckMessage(openid_jscy, body.access_token, blzt);

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
            await authOper.sendMessage(lxdh, config.refuse_application_sendMessage_1 + '，拒绝理由：' + req.body.shyj + ')');
          } else {
            await wechatOper.sendTemplateMessage(openid, body.access_token, blzt, tg, req.body.shyj, "申请审核");
          }
        }
      }
    }
  }


  //// 初审
  if (userQx.indexOf("3") > -1) {
    //// 甲方申请或者内部帮甲方申请的都要走初审复审模式
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

        let result = await orm.ApplicationInfo.findOne({
          where: {
            INDEX: {
              [orm.Sequelize.Op.in]: indexes_update
            }
          },
          include: [{
            model: orm.option.CPLX,
            as: "Cplx"
          }]
        });

        if (result.Cplx.SFFS === '1') {
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

          let openid_jscy = djxx.Fsr.OPENID;

          await wechatOper.remindCheckMessage(openid_jscy, body.access_token, blzt);
        } else {
          if (!openid) {
            await authOper.sendMessage(lxdh, config.allow_application_sendMessage_1);

          } else {
            await wechatOper.sendTemplateMessage(openid, body.access_token, '3a', tg, req.body.shyj, "申请审核");
          }

          let djxx = await orm.ApplicationRecord.findOne({
            where: {
              CPDM: req.body.cpdm,
              XMDDM: req.body.xmddm
            },
            include: [{
              model: orm.User,
              as: "Hdr"
            }]
          });

          let openid_jscy = djxx.Hdr.OPENID;

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

  //包括包括自动发送授权失败的申请
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
    // let sqxlmArr = [];
    // let sqxlmStr;
    // if (u.SQXLM.slice(0, 1) == '[') {
    //   let sqxlmObjArr = JSON.parse(u.SQXLM);
    //   for (let i = 0; i < sqxlmObjArr.length; i++) {
    //     sqxlmArr.push(`${sqxlmObjArr[i].name}:${sqxlmObjArr[i].value}`);
    //   }
    //   sqxlmStr = sqxlmArr.join(',');
    // } else {
    //   sqxlmStr = u.SQXLM
    // }
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
      // sqxlm: sqxlmStr,
      sqxlm: u.SQXLM,
      index: u.INDEX,
      jfsy: u.JFSY,
      yxdz: u.Customers.YXDZ,
      remark: u.REMARK ? u.REMARK : '无'
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

//申请加密狗的多一个发送授权阶段，加密狗申请在制作授权后，状态为8a而非8
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

//审核发送授权阶段的申请
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
      CPDM: appInfo.CPDM.split(','), //内蒙需求，一次申请多个产品
      // CPDM: appInfo.CPDM, //内蒙需求，一次申请多个产品
      JZSJ: appInfo.JZSJ,
      SQSL: appInfo.SQSL,
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
      await mailerSender.SendMail(item.Customers.YXDZ, `${item.CPMC}(${item.SQXZDM})`, item.SQNR);
    }
  } catch (error) {
    throw error;
  }
}

//批量日志记录
router.post('/save_batch_rzjl', catchAsyncErrors(async (req, res) => {

  let payload = jwt.decode(req.cookies.jwt);
  let sqxx_index = req.body.index.split(',');
  console.log(sqxx_index);

  for (let i = 0; i < sqxx_index.length; i++) {
    let itemIndex = sqxx_index[i];
    let row = await orm.ApplicationInfo.findOne({
      where: {
        INDEX: itemIndex
      },
      include: [{
        model: orm.CustomerInfo,
        as: "Customers"
      }]
    });
    console.log(row.INDEX);
    let rzjl = await orm.LogRecord.create({
      SQXX_INDEX: row.INDEX,
      SQR: row.Customers.YHM,
      SQRDW: row.Customers.YHDW,
      LXDH: row.Customers.LXDH,
      YXDZ: row.Customers.YXDZ,
      CPMC: row.CPMC,
      SQSL: row.SQSL,
      XZQDM: row.SQXZDM,
      SQSJ: row.SQSJ,
      BLJG: '1',
      BLJSSJ: new Date(Date.now()).toMysqlFormatTime(),
      BZ: row.BZ,
      ZZBLR: payload.jsIndex,
      INDEX: uuidv1(),
      CSR: payload.jsIndex,
      CSSJ: new Date(Date.now()).toMysqlFormatTime()
    });
  }
  return res.json({
    code: "0000"
  });

}))


//批量日志记录
router.post('/check_batch_applications', catchAsyncErrors(async (req, res) => {
  let payload = jwt.decode(req.cookies.jwt);
  if (!payload || !payload.jsIndex || !payload.roleID) {
    throw new AppCommonError("无法获取已登陆信息，请重新登陆", "0005");
  }

  let userQx = payload.roleID.split(',');
  //// 申请信息
  let rows_submit = await orm.ApplicationInfo.findAll({
    where: {
      INDEX: {
        [orm.Sequelize.Op.in]: req.body.index.split(',')
      }
    },
    include: [{
      model: orm.CustomerInfo,
      as: "Customers"
    }]
  });

  let contacts = rows_submit.map((item) => {
    return {
      lxdh: item.Customers.LXDH,
      openid: item.Customers.OPENID
    }
  })

  let reqTokenData = {
    method: 'get',
    body: {},
    json: true,
    url: ADDRESS_ACCESSTOKEN
  };
  let body = await requester(reqTokenData);


  //// 项目经理才能批量审核
  if (userQx.indexOf('7') > -1) {
    let rows_update = rows_submit.filter(item => item.BLZT == "2" && item.JFSY == "0" && item.Customers.SFNBCY == "1" && (item.Customers.YHDW.indexOf('不动产软件中心') > -1 || item.Customers.YHDW.indexOf('软件工程中心') > -1));
    if (rows_update && rows_update.length != 0) {
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

      let rows_make = [];

      for (let i = 0; i < rows_update.length; i++) {
        let item = rows_update[i];
        let cpdmArr = item.CPDM.split(',');
        let cplx = await orm.option.CPLX.findOne({
          where: {
            DM: cpdmArr[0]
          }
        });
        if (item.SQLX == "1" && item.SFJMG == "0" && cplx.SFDJ == '0') {
          rows_make.push(item);
        }
      }
      console.log('自动制作授权的申请', rows_make);

      MakeAuthority(rows_make.map(item => item.INDEX));
      for (let i = 0; i < contacts.length; i++) {
        if (!contacts[i].openid) {
          await authOper.sendMessage(contacts[i].lxdh, config.allow_application_sendMessage_nbsq);
        } else {
          await wechatOper.sendTemplateMessage(contacts[i].openid, body.access_token, '2', true, '', "内部申请审核");
        }
      }
      return res.json({
        code: "0000"
      });
    }

    let rows_2check = rows_submit.filter(item => item.BLZT == "2" && item.JFSY == "0" && item.Customers.SFNBCY == "1" && !(item.Customers.YHDW.indexOf('不动产软件中心') > -1 || item.Customers.YHDW.indexOf('软件工程中心') > -1));
    if (rows_2check && rows_2check.length != 0) {
      let count = await orm.ApplicationInfo.update({
        BLZT: "3"
      }, {
        where: {
          INDEX: {
            [orm.Sequelize.Op.in]: rows_2check.map(item => item.INDEX)
          },
          BLZT: "2"
        }
      });

      for (let i = 0; i < contacts.length; i++) {
        if (!contacts[i].openid) {
          await authOper.sendMessage(contacts[i].lxdh, config.allow_application_sendMessage_nbsq);
        } else {
          await wechatOper.sendTemplateMessage(contacts[i].openid, body.access_token, '2a', true, '', "内部申请审核");
        }
      }
      return res.json({
        code: "0000"
      });
    }

  }

}))


router.get('/get_history_amount', catchAsyncErrors(async (req, res) => {
  let sqxx = await orm.ApplicationInfo.findAll({
    where: {
      YHRZXX_INDEX: req.query.yhrzxx_index
    }
  })

  let historyAmount = 0;
  sqxx.forEach(element => {
    historyAmount = historyAmount + element.SQSL
  });
  let result = {
    code: '0000',
    data: {
      history_amount: historyAmount.toString()
    }
  }
  res.json(result)
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