module.exports = function (sequlize, dataTypes) {
    const User = sequlize.define('User', {
        JSCY: { type: dataTypes.STRING }
        , JSDM: { type: dataTypes.STRING }
        , SSBM: { type: dataTypes.STRING }
        , SSXMZ: { type: dataTypes.STRING }
        , LXDH: { type: dataTypes.STRING }
        , WECHAT: { type: dataTypes.STRING }
        , BZ: { type: dataTypes.STRING }
        , PWD: { type: dataTypes.STRING }
        , LRR: { type: dataTypes.STRING }
        , OPENID: { type: dataTypes.STRING }
        , INDEX: { type: dataTypes.STRING, primaryKey: true, field: "JSCY_INDEX" }
    }, {
            freezeTableName: true,
            tableName:"s_sj_jscy"
        });

    return User;
};