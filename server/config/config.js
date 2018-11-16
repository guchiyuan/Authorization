module.exports = {
    //数据库名
    databaseName: "mytest_db",
    // databaseName: "sqxt_v2_1008",
    //数据库用户
    databaseUser: "gtis",
    //数据库密码
    databasePwd: "gtis",
    //数据库地址
    hostAddress: "192.168.50.67",

    // // 数据库名
    //   databaseName:"sqxt_v2",
    //  // 数据库用户
    //  databaseUser:"root",
    //  // 数据库密码
    //  databasePwd:"gtis",
    //  // 数据库地址
    //  hostAddress:"192.168.2.99",

    // 授权地址
    // authorityAddress:"http://192.168.50.80:8090",
    // authorityAddress:"http://192.168.2.99:8096",
    // authorityAddress:"http://192.168.50.215:8090",
    //99上的
    // authorityAddress: "http://192.168.2.99:8090",
    authorityAddress: "http://192.168.50.131:8900",

    getAccessTokenAddress: "http://localhost:3333/test/get_access_token",

    // //正式外网环境用下面配置
    // getAccessTokenAddress:"http://lkwx.gtis.com.cn/test/get_access_token",

    getWechatOpenidAddress: 'https://api.weixin.qq.com/sns/oauth2/access_token',


    // 邮箱主机地址
    mailHost: "mail.gtmap.cn",
    // 邮箱端口号
    mailPort: 25,
    // 发送邮件用户名
    mailUser: "gtmaplicense@gtmap.cn",
    // 发送邮件用户密码
    mailPwd: "123123",
    // 发件人邮箱地址
    mailSender: "gtmaplicense@gtmap.cn",


    // 拒绝理由
    rejectReasons_Application: [
        "理由一",
        "理由二",
        "理由三"
    ],

    rejectReasons_User: [
        "理由一",
        "理由二",
        "理由三"
    ],

    refuse_user_sendMessage_1: "用户认证（一审拒绝",
    refuse_user_sendMessage_2: "用户认证（二审拒绝",
    refuse_user_sendMessage_3: "用户认证（三审拒绝",
    refuse_user_sendMessage_nbsq: "用户认证（审核拒绝",
    refuse_sendMessage_create: "授权制作（已被拒绝）",

    allow_user_sendMessage_1: "用户认证（一审通过，请等待二审）",
    allow_user_sendMessage_2: "用户认证（二审通过，请等待三审）",
    allow_user_sendMessage_3: "用户认证（审核通过，完成认证）",
    allow_user_sendMessage_nbsq: "用户认证（审核通过，完成认证）",
    allow_sendMessage_create: "授权制作（注意查收邮箱）",

    refuse_application_sendMessage_1: "申请审核（一审拒绝",
    refuse_application_sendMessage_2: "申请审核（二审拒绝",
    refuse_application_sendMessage_3: "申请审核（三审拒绝",
    refuse_application_sendMessage_nbsq: "申请审核（审核拒绝",


    allow_application_sendMessage_1: "申请审核（一审通过，请等待二审）",
    allow_application_sendMessage_2: "申请审核（二审通过，请等待三审）",
    allow_application_sendMessage_3: "申请审核（审核通过，请等待制作授权，注意查收邮箱）",
    allow_application_sendMessage_nbsq: "申请审核（审核通过，请等待制作授权，注意查收邮箱）",

    remind_csr: "提醒审核人（您有新申请等待审核！）",


    //公众号的参数
    grant_type: 'client_credential',
    appid: 'wx9f3b7c80d6875f00',
    secret: '0a062130ef298d1bac155e46d4e20f7a',

    informTemplateId: "VNTEvR3UL555zNLS3T7fqUsCI4ROrN02okxlt-it7Ow",
    remindTemplateId: "VTuNfY8Ke0dvb6jLlCLqT9py6G9QYOSQRfz5TcdfArU",


    // //公众号的参数
    // grant_type: 'client_credential',
    // appid: 'wxdbc7eb74fd2614fd',
    // secret: 'e985e2999de5b18acc89d10f3cb1bab2',

    // // informTemplateId:"LM6MElZg49m89Di8sxedCfZPqGX1XSCfonitlbx7EP0",
    // informTemplateId:"ZuT36B26mD7wsz31YuodU3Iz36JObN1luAJCWXSEdKs",    
    // remindTemplateId:"WKtXbxcW7IbM5Q18sjuJ8CFsHJECkMjdPVBOyTrroiI",

    access_token_url: 'https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=APPID&secret=APPSECRET',
    getJSApiTicketUrl: 'https://api.weixin.qq.com/cgi-bin/ticket/getticket?access_token=ACCESS_TOKEN&type=jsapi',


    // template_id:'Ln1GXVJmcXer7nRSAWN0ygFtOAv6_7cv2lMy3Qqptrc',
    //发送模板消息的接口
    send_templatemsg_url: 'https://api.weixin.qq.com/cgi-bin/message/template/send?access_token=ACCESS_TOKEN',

    qrcode_ticket_url: 'https://api.weixin.qq.com/cgi-bin/qrcode/create?access_token=ACCESS_TOKEN',
    showqrcode_url: 'https://mp.weixin.qq.com/cgi-bin/showqrcode?ticket='
}