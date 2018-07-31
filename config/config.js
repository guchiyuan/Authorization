module.exports={
    // 数据库名
    databaseName:"mytest_db",
    // 数据库用户
    databaseUser:"gtis",
    // 数据库密码
    databasePwd:"gtis",
    // 数据库地址
    hostAddress:"192.168.50.67",

    // // 数据库名
    // databaseName:"sqxt",
    // // 数据库用户
    // databaseUser:"root",
    // // 数据库密码
    // databasePwd:"gtis",
    // // 数据库地址
    // hostAddress:"192.168.2.99",

    // 授权地址
    // authorityAddress:"http://192.168.50.80:8090",
    authorityAddress:"http://192.168.2.99:8096",

    // // 邮箱主机地址
    // mailHost:"mail.gtmap.cn",
    // // 邮箱端口号
    // mailPort:25,
    // // 发送邮件用户名
    // mailUser:"xiangqiang@gtmap.cn",
    // // 发送邮件用户密码
    // mailPwd:"xq123456",
    // // 发件人邮箱地址
    // mailSender:"xiangqiang@gtmap.cn",

     // 邮箱主机地址
     mailHost:"mail.gtmap.cn",
     // 邮箱端口号
     mailPort:25,
     // 发送邮件用户名
     mailUser:"huangli@gtmap.cn",
     // 发送邮件用户密码
     mailPwd:"333444",
     // 发件人邮箱地址
     mailSender:"huangli@gtmap.cn",
 

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

    refuse_user_sendMessage_1:"用户认证（一审拒绝",
    refuse_user_sendMessage_2:"用户认证（二审拒绝",
    refuse_user_sendMessage_3:"用户认证（三审拒绝",
    refuse_user_sendMessage_nbsq:"用户认证（审核拒绝",
    refuse_sendMessage_create:"授权制作（已被拒绝）",

    allow_user_sendMessage_1:"用户认证（一审通过，请等待二审）",
    allow_user_sendMessage_2:"用户认证（二审通过，请等待三审）",
    allow_user_sendMessage_3:"用户认证（审核通过，完成认证）",
    allow_user_sendMessage_nbsq:"用户认证（审核通过，完成认证）",
    allow_sendMessage_create:"授权制作（注意查收邮箱）",

    refuse_application_sendMessage_1:"申请审核（一审拒绝",
    refuse_application_sendMessage_2:"申请审核（二审拒绝",
    refuse_application_sendMessage_3:"申请审核（三审拒绝",
    refuse_application_sendMessage_nbsq:"申请审核（审核拒绝",
   

    allow_application_sendMessage_1:"申请审核（一审通过，请等待二审）",
    allow_application_sendMessage_2:"申请审核（二审通过，请等待三审）",
    allow_application_sendMessage_3:"申请审核（审核通过，请等待制作授权，注意查收邮箱）",
    allow_application_sendMessage_nbsq:"申请审核（审核通过，请等待制作授权，注意查收邮箱）"
    
    
}