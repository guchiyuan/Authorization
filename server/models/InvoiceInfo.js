module.exports = function (sequlize, dataTypes) {
  const InvoiceInfo = sequlize.define('InvoiceInfo', {
    YHRZXX_INDEX: { type: dataTypes.STRING, field: "YHRZXX_INDEX" }
    ,COMPANY_NAME: { type: dataTypes.STRING, field: "COMPANY_NAME" }
    ,COMPANY_ADDRESS: { type: dataTypes.STRING, field: "COMPANY_ADDRESS" }
    ,COMPANY_TEL: { type: dataTypes.STRING, field: "COMPANY_TEL" }
    ,TAX_OBJECTID: { type: dataTypes.STRING, field: "TAX_OBJECTID" }
    ,ACCOUNT: { type: dataTypes.STRING, field: "ACCOUNT" }
    ,BANK: { type: dataTypes.STRING, field: "BANK" }
      , INDEX: { type: dataTypes.STRING, primaryKey: true, field: "INVOICE_INDEX" }
  }, {
          freezeTableName: true,
          tableName:"s_sj_invoiceinfo"
      });

  return InvoiceInfo;
};