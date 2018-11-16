module.exports = function (sequlize, dataTypes) {
    const ApplicationInfo = sequlize.define('ApplicationInfo', {
        YHRZXX_INDEX: { type: dataTypes.STRING }
        , SQLX: { type: dataTypes.STRING }
        , SQXZDM: { type: dataTypes.STRING }
        , CPDM: { type: dataTypes.STRING }
        , CPMC: { type: dataTypes.STRING }
        , SQXLM: { type: dataTypes.STRING }
        , BLZT: { type: dataTypes.STRING }
        , SFJMG: { type: dataTypes.STRING }
        , JZSJLX: { type: dataTypes.STRING }
        , SWHTMC: { type: dataTypes.STRING }
        , SWLXR: { type: dataTypes.STRING }
        , SQXKS: { type: dataTypes.INTEGER }
        , SQSJ: { type: dataTypes.DATE }
        , JZSJ: { type: dataTypes.DATE }
        , BZ: { type: dataTypes.STRING }
        , XMDDM: { type: dataTypes.STRING }
        , SQNR: { type: dataTypes.TEXT }
        , SQSL: { type: dataTypes.INTEGER }
        , JFSY: { type: dataTypes.INTEGER }   // 是否甲方使用
        , POST_INDEX: { type: dataTypes.STRING }
        , INVOICE_INDEX: { type: dataTypes.STRING }
        , INDEX: { type: dataTypes.STRING, primaryKey: true, field: "SQXX_INDEX" }
    }, {
            freezeTableName: true,
            tableName: "s_sj_sqxx"
        });

    return ApplicationInfo;
};