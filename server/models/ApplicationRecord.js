module.exports = function (sequlize, dataTypes) {
    const ApplicationRecord = sequlize.define('ApplicationRecord', {

        DWDM: { type: dataTypes.STRING }
        , DWMC: { type: dataTypes.STRING }
        , XMDDM: { type: dataTypes.STRING }
        , XMDMC: { type: dataTypes.STRING }
        , CPDM: { type: dataTypes.STRING }
        , SFJMG: { type: dataTypes.STRING }
        , SFSQ: { type: dataTypes.STRING }
        , JZSJ: { type: dataTypes.DATE }
        , CSR: { type: dataTypes.STRING }
        , FSR: { type: dataTypes.STRING }
        // , SQSHR: { type: dataTypes.STRING }
        , LRR: { type: dataTypes.STRING }
        , BZ: { type: dataTypes.STRING }
        , INDEX: { type: dataTypes.STRING, primaryKey: true, field: "SQDJ_INDEX" }
    }, {
            freezeTableName: true,
            tableName:"s_sj_sqdj"
        });

    return ApplicationRecord;
};