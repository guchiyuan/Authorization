module.exports = function (sequlize, dataTypes) {
  const PostInfo = sequlize.define('PostInfo', {
    YHRZXX_INDEX: { type: dataTypes.STRING, field: "YHRZXX_INDEX" }
    ,SJR: { type: dataTypes.STRING, field: "SJR" }
    ,ADDRESS: { type: dataTypes.STRING, field: "ADDRESS" }
    ,LXDH: { type: dataTypes.STRING, field: "LXDH" }
      , INDEX: { type: dataTypes.STRING, primaryKey: true, field: "POST_INDEX" }
  }, {
          freezeTableName: true,
          tableName:"s_sj_postinfo"
      });

  return PostInfo;
};