module.exports = function (sequlize, dataTypes) {
    const CustomerInfo = sequlize.define('CustomerInfo', {
        YHM: { type: dataTypes.STRING }
        , SFNBCY: { type: dataTypes.STRING }
        , XZQDM: { type: dataTypes.STRING }
        , YHDW: { type: dataTypes.STRING }
        , LXDH: { type: dataTypes.STRING }
        , ZDSM: { type: dataTypes.INTEGER }
        , YSQSM: { type: dataTypes.INTEGER }
        , YXDZ: { type: dataTypes.STRING }
        , ZT: { type: dataTypes.STRING }
        , WECHAT: { type: dataTypes.STRING }
        , BZ: { type: dataTypes.STRING }
        , XMDDM: { type: dataTypes.STRING }
        , OPENID: { type: dataTypes.STRING }
        , REMARK: { type: dataTypes.STRING }
        , INDEX: { type: dataTypes.STRING, primaryKey: true, field: "YHRZXX_INDEX" }
    }, {
            freezeTableName: true,
            tableName: "s_sj_yhrzxx"
        });

    return CustomerInfo;
};