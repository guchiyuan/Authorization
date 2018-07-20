module.exports = {
    ConvertApplicationStatus: function (shzt) {
        switch (shzt) {
            case "1":
                return "待认证";
            case "2":
                return "待审核";
            case "3":
                return "一审通过";
            case "4":
                return "二审通过";
            case "5":
                return "审核通过"
            case "6":
                return "在线授权失败";
            case "7":
                return "在线授权成功";
            case "8":
                return "申请已办结"
            case "9":
                return "不予办理";
            case "10":
                return "发送邮件失败";
            default:
                return "未知状态";
        }
    }
}