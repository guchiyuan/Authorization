module.exports = function (sequlize, dataTypes) {
    var opt = { name: "option" };

    var DWXX = sequlize.define('s_sj_dwxx', {
        DM: { type: dataTypes.STRING, field: "DWDM" }
        , MC: { type: dataTypes.STRING, field: "DWMC" }
        ,JB:{type: dataTypes.STRING, field: "XZQJB"}
        , INDEX: { type: dataTypes.STRING, primaryKey: true, field: "DWXX_INDEX" }
    }, {
            freezeTableName: true
        });
    opt.DWXX = DWXX;

    var CPLX = sequlize.define('s_zd_cplx', {
        DM: { type: dataTypes.STRING, field: "CPDM" }
        , MC: { type: dataTypes.STRING, field: "CPMC" }
        , SFWH: { type: dataTypes.STRING, field: "SFWH" }        
        , SFDJ: { type: dataTypes.STRING, field: "SFDJ" }        
        , INDEX: { type: dataTypes.STRING, primaryKey: true, field: "CPLX_INDEX" }
    }, {
            freezeTableName: true
        });
    opt.CPLX = CPLX;

    var JSXX = sequlize.define('s_zd_jsxx', {
        DM: { type: dataTypes.STRING, field: "JSDM" }
        , MC: { type: dataTypes.STRING, field: "JSMC" }
        , INDEX: { type: dataTypes.STRING, primaryKey: true, field: "JSXX_INDEX" }
    }, {
            freezeTableName: true
        });
    opt.JSXX = JSXX;

    var SWLXR = sequlize.define('s_zd_swlxr', {
        SWLXR: { type: dataTypes.STRING, field: "SWLXR" }
        ,XZQDM: { type: dataTypes.STRING, field: "XZQDM" }
        ,BZ: { type: dataTypes.STRING, field: "BZ" }
        , INDEX: { type: dataTypes.STRING, primaryKey: true, field: "SWLXR_INDEX" }
    }, {
            freezeTableName: true
        });
    opt.SWLXR = SWLXR;
    
    return opt;
};

