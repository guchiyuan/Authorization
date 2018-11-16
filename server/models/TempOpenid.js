module.exports = function (sequlize, dataTypes) {
  const TempOpenid = sequlize.define('TempOpenid', {
      OPENID: { type: dataTypes.STRING }
      ,LXDH: { type: dataTypes.STRING }
      , INDEX: { type: dataTypes.STRING, primaryKey: true, field: "INDEX" }
  }, {
          freezeTableName: true,
          tableName:"s_temp_openid"
      });

  return TempOpenid;
};