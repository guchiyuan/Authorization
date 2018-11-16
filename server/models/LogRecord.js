module.exports = function (sequlize, dataTypes) {
  const LogRecord = sequlize.define('LogRecord', {
      SQXX_INDEX: { type: dataTypes.STRING }
      , SQR: { type: dataTypes.STRING }
      , SQRDW: { type: dataTypes.STRING }
      , LXDH: { type: dataTypes.STRING }
      , YXDZ: { type: dataTypes.STRING }
      , SQSJ: { type: dataTypes.DATE }
      , CPMC: { type: dataTypes.STRING }
      , SQSL: { type: dataTypes.INTEGER }
      , SQNR: { type: dataTypes.TEXT }
      , BLJSSJ: { type: dataTypes.DATE }
      , BLJG: { type: dataTypes.STRING }
      , BZ: { type: dataTypes.STRING }
      , ZZBLR: { type: dataTypes.STRING }
      , INDEX: { type: dataTypes.STRING, primaryKey: true, field: "RZJL_INDEX" }
      , CSR: { type: dataTypes.STRING }
      , CSSJ: { type: dataTypes.DATE }
      , FSR: { type: dataTypes.STRING }
      , FSSJ: { type: dataTypes.DATE }
      , XZQDM: { type: dataTypes.STRING }
  }, {
          freezeTableName: true,
          tableName: "s_sj_rzjl"
      });

  return LogRecord;
};