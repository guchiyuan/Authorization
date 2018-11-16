var express = require('express');
var router = express.Router();
var wechat = require('wechat');
const uuidv1 = require('uuid/v1');

var orm = require('../models');

const AppCommonError = require('../error/CommonError');

var redis = require('redis');

var sha1 = require('sha1');

var requester = require('request-promise-native');
var getTicketUrl = 'https://api.weixin.qq.com/cgi-bin/ticket/getticket?access_token=ACCESS_TOKEN&type=jsapi';


//配置公众号的各项参数
// var config = {
//   token: 'wechat',
//   appid: 'wx9f3b7c80d6875f00',
//   appsecret: '0a062130ef298d1bac155e46d4e20f7a',
//   encodingAESKey: ''
// };

var config = {
  token: 'wechat',
  appid: 'wxdbc7eb74fd2614fd',
  appsecret: 'e985e2999de5b18acc89d10f3cb1bab2',
  encodingAESKey: ''
};

router.use(express.query());


//异步捕捉错误，类似异步的try...catch
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

// router.get('/get_wxconfig', catchAsyncErrors(async (req, res) => {
//   let nonceStr, timestamp, signature, jsUrl, string;
//   getTicketUrl = getTicketUrl.replace('ACCESS_TOKEN', req.query.access_token);

//   let client = redis.createClient();
//   let jsapiTicket;
//   let resObj = {};
//   client.get("jsapi_ticket", async (err, reply) => {
//     if (!reply) {
//       let reqTicketData = {
//         method: 'get',
//         body: {},
//         json: true,
//         url: getTicketUrl
//       };
//       let res = await requester(reqTicketData);
//       if (res.ticket && res.errmsg == 'ok') {
//         jsapiTicket = res.ticket;
//         client.set("jsapi_ticket", jsapiTicket, 'EX', 5400, redis.print);
//         client.quit();
//       }
//     } else {
//       jsapiTicket = reply
//       client.quit();
//     }
//   })
//   nonceStr = uuidv1();
//   timestamp = Date.now();
//   jsUrl = req.query.url;
//   string = `jsapi_ticket=${resObj.jsapi_ticket}&noncestr=${nonceStr}&timestamp=${timestamp}&url=${jsUrl}`
//   signature = sha1(string);
//   resObj = {
//     nonceStr: nonceStr,
//     timestamp: timestamp,
//     signature: signature,
//     appID: config.appid
//   };
//   res.json(resObj);
// }));


//利用npm提供的wechat包，接收微信服务端发来的请求
router.use('/', wechat(config, catchAsyncErrors(async (req, res, next) => {
  console.log(req.weixin);
  // var message = req.weixin;
  if (req.weixin.Event === 'subscribe') {
    let lxdh = req.weixin.EventKey.slice(8);
    let jscy = await orm.User.findOne({
      where: {
        LXDH: lxdh
      }
    })

    //如果用户不是角色成员，openid存入yhrzxx表或者存入temp_openid表里，如果是角色成员，jscy表里也需要保存openid
    if (!jscy) {
      //----------------------用数据库的一张表临时存openid-------------------//
      console.log(req.weixin.FromUserName);
      console.log(req.weixin.EventKey);
      let yhxx = await orm.CustomerInfo.findOne({
        where: {
          LXDH: lxdh
        }
      });

      let temp = await orm.TempOpenid.findOne({
        where: {
          LXDH: lxdh
        }
      });
      if (yhxx && !yhxx.OPENID) {
        // let openid = await orm.CustomerInfo.update({
        //   OPENID: req.weixin.FromUserName,
        //   where:{
        //     LXDH: lxdh
        //   }
        // })
        yhxx.OPENID = req.weixin.FromUserName;
        yhxx.save().then(() => {}).catch(err => {});
      } else if (!temp && !yhxx && lxdh) {
        let openid = await orm.TempOpenid.create({
          OPENID: req.weixin.FromUserName,
          LXDH: lxdh,
          INDEX: uuidv1()
        })

      }
    } else if (!jscy.OPENID) {
      jscy.OPENID = req.weixin.FromUserName;
      jscy.save().then(() => {}).catch(err => {});
    }
  }



  if (req.weixin.Event === 'unsubscribe') {
    console.log(req.weixin.FromUserName);
    let openid = req.weixin.FromUserName;

    let yhxx = await orm.CustomerInfo.findOne({
      where: {
        OPENID: openid
      }
    });

    if (yhxx) {
      yhxx.OPENID = null;
      yhxx.save().then(() => {}).catch(err => {});
      let destroyTempOpenid = await orm.TempOpenid.destroy({
        where: {
          OPENID: openid
        }
      });

    } else {
      let destroyTempOpenid = await orm.TempOpenid.destroy({
        where: {
          OPENID: openid
        }
      });
    }

  }


  //用户已经关注过公众号的情况下，扫码后为SCAN操作，行为类似上面的subscribe操作
  if (req.weixin.Event == 'SCAN') {
    let lxdh = req.weixin.EventKey;
    console.log(lxdh);
    let jscy = await orm.User.findOne({
      where: {
        LXDH: lxdh
      }
    });
    if (jscy && !jscy.OPENID) {
      jscy.OPENID = req.weixin.FromUserName;
      jscy.save().then(() => {}).catch(err => {});
      res.reply('授权申请系统账号关联成功！');
    }

    let yhxx = await orm.CustomerInfo.findOne({
      where: {
        LXDH: lxdh
      }
    });

    //
    let temp = await orm.TempOpenid.findOne({
      where: {
        LXDH: lxdh
      }
    });

    if (yhxx && !yhxx.OPENID) {
      yhxx.OPENID = req.weixin.FromUserName;
      yhxx.save().then(() => {}).catch(err => {});
      res.reply('授权申请系统账号关联成功！');
    }
    //
    else if (!temp && !yhxx) {
      let openid = await orm.TempOpenid.create({
        OPENID: req.weixin.FromUserName,
        LXDH: lxdh,
        INDEX: uuidv1()
      })
      res.reply('您已关注国图软件公众号！');      
    }
  }

  //用户在公众号里发送文本时自动回复
  if (req.weixin.Content) {

    res.reply('欢迎关注国图软件，您可以使用国图软件授权管理系统！');
  }

})));

// // 错误处理中间件
// router.use((err, req, res, next) => {
//   if (err instanceof AppCommonError) {
//       res.json({
//           code: err.code,
//           msg: err.message
//       });
//   } else {
//       res.json({
//           code: "9999",
//           msg: err.message
//       });
//   }
// });

module.exports = router;