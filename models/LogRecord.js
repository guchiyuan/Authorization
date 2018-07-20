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
      , ZZSQR: { type: dataTypes.STRING }
      , INDEX: { type: dataTypes.STRING, primaryKey: true, field: "RZJL_INDEX" }
  }, {
          freezeTableName: true,
          tableName: "s_sj_rzjl"
      });

  return LogRecord;
};