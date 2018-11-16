const config = require('../config/config');
var requester = require('request-promise-native');

module.exports = {
  sendTemplateMessage: async (openid, access_token, blzt, tg, shyj, type) => {
    // console.log(openid,access_token);

    console.log(shyj);

    let sendMessageUrl = config.send_templatemsg_url.replace('ACCESS_TOKEN', access_token);

    let templateData = {
      "first": {
        "value": "尊敬的用户您的申请正在处理中：",
        "color": "#173177"
      },
      "keyword1": {
        "value": "",
        "color": "#173177"
      },
      "keyword2": {
        "value": "",
        "color": "#173177"
      },
      "keyword3": {
        "value": "",
        "color": "#173177"
      },
      "remark": {
        "value": "",
        "color": "#173177"
      }
    };

    if (type == "申请审核") {
      templateData.keyword1.value = "授权申请";
      if (blzt == '2') {
        if (tg === true) {
          templateData.keyword2.value = "初审通过";
          templateData.keyword3.value = "无";
          templateData.remark.value = "请耐心等待复审";
        } else {
          templateData.keyword2.value = "申请被初审拒绝";
          templateData.keyword3.value = shyj;
          templateData.remark.value = "如有疑问，请联系我司相关工作人员。";
        }
      } else if (blzt == '3') {
        if (tg === true) {
          templateData.keyword2.value = "审核通过";
          templateData.keyword3.value = "无";
          templateData.remark.value = "请耐心等待制作授权,注意查收邮箱（加密狗授权除外）!";
        } else {
          templateData.keyword2.value = "申请被复审拒绝";
          templateData.keyword3.value = shyj;
          templateData.remark.value = "如有疑问，请联系我司相关工作人员。";
        }
      }

    } else if (type == '用户认证') {
      templateData.keyword1.value = "用户认证";

      if (blzt == '1') {
        if (tg === true) {
          templateData.keyword2.value = "初审通过";
          templateData.keyword3.value = "无";
          templateData.remark.value = "请耐心等待复审";
        } else {
          templateData.keyword2.value = "用户认证被初审拒绝";
          templateData.keyword3.value = shyj;
          templateData.remark.value = "如有疑问，请联系我司相关工作人员。";
        }
      } else if (blzt == '2') {
        if (tg === true) {
          templateData.keyword2.value = "认证通过";
          templateData.keyword3.value = "无";
          templateData.remark.value = "您现在可以进行授权申请操作！";
        } else {
          templateData.keyword2.value = "用户认证被复审拒绝";
          templateData.keyword3.value = shyj;
          templateData.remark.value = "如有疑问，请联系我司相关工作人员。";
        }
      }
    }

    if (type == '内部申请审核') {
      templateData.keyword1.value = "授权申请";
      if (tg === true) {
        templateData.keyword2.value = "审核通过";
        templateData.keyword3.value = "无";
        templateData.remark.value = "请耐心等待制作授权,注意查收邮箱!";
      } else {
        templateData.keyword2.value = "申请被拒绝";
        templateData.keyword3.value = shyj;
        templateData.remark.value = "如有疑问，请联系您的项目经理。";
      }
    }

    if (type == '内部用户认证') {
      templateData.keyword1.value = "用户认证";
      if (tg === true) {
        templateData.keyword2.value = "审核通过";
        templateData.keyword3.value = "无";
        templateData.remark.value = "您现在可以进行授权申请操作！";
      } else {
        templateData.keyword2.value = "用户认证被拒绝";
        templateData.keyword3.value = shyj;
        templateData.remark.value = "如有疑问，请联系您的项目经理。";
      }
    }


    if (type == '制作授权加密狗') {
      templateData.keyword1.value = "制作授权";
      if (tg === true) {
        templateData.keyword2.value = "制作授权成功";
        templateData.keyword3.value = `请您汇款${shyj*500}元（${shyj}*500元）至以下账户
公司名称：南京国图信息产业有限公司;
开户行：中国银行南京定淮门支行;
账号：532658192714
        `;
        templateData.remark.value = "请尽快汇款到指定银行账户。";
      } else {
        templateData.keyword2.value = "制作授权失败";
        templateData.keyword3.value = shyj;
        templateData.remark.value = "如有疑问，请联系公司相关工作人员！";
      }
    }

    if (type == '制作授权') {
      templateData.keyword1.value = "制作授权";
      if (tg === true) {
        templateData.keyword2.value = "制作授权成功";
        templateData.keyword3.value = "无";
        templateData.remark.value = "请您查收邮箱。";
      } else {
        templateData.keyword2.value = "制作授权失败";
        templateData.keyword3.value = shyj;
        templateData.remark.value = "如有疑问，请联系公司相关工作人员！";
      }
    }


    if (type == '发送授权') {
      templateData.keyword1.value = "发送授权";
      if (tg === true) {
        templateData.keyword2.value = "加密狗已发货";
        templateData.keyword3.value = `顺丰快递：${shyj}`;
        templateData.remark.value = "您的加密狗已经发出，可以通过快递单号追踪物流信息！";
      } else {
        templateData.keyword2.value = "加密狗未发货";
        templateData.keyword3.value = shyj;
        templateData.remark.value = "如有疑问，请联系公司相关工作人员！";
      }
    }

    let reqOptions = {
      method: 'post',
      body: {
        "touser": openid,
        "template_id": config.informTemplateId,
        "data": templateData
      },
      json: true,
      url: sendMessageUrl,
    }
    let res = await requester(reqOptions);
    console.log(res);
  },

  remindCheckMessage: async (openid, access_token) => {
    let sendMessageUrl = config.send_templatemsg_url.replace('ACCESS_TOKEN', access_token);
    let date = new Date();
    let dateStr = date.getFullYear() + '/' + (date.getMonth() + 1) + '/' + date.getDate();
    let templateData = {
      "first": {
        "value": "有新的申请等待您的审核，请尽快审核！",
        "color": "#173177"
      },
      "remark": {
        "value": "",
        "color": "#173177"
      },
       //----------------------服务号模板-----------------------//
       "keyword1": {
        "value": "国图软件授权管理系统",
        "color": "#173177"
      },
      "keyword2": {
        "value": dateStr,
        "color": "#173177"
      }
    };
    let reqOptions = {
      method: 'post',
      body: {
        "touser": openid,
        "template_id": config.remindTemplateId,
        "data": templateData
      },
      json: true,
      url: sendMessageUrl,
    }
    let res = await requester(reqOptions);
  }

}