var fs = require('fs');
var path = require('path');
var Sequelize = require('sequelize');
var basename = path.basename(__filename);
var env = process.env.NODE_ENV || 'development';
var config = require(__dirname + '/../config/config.js');
var db = {};

const sequelize = new Sequelize(config.databaseName, config.databaseUser, config.databasePwd, {
  host: config.hostAddress,
  dialect: 'mysql',
  operatorsAliases: false,
  pool: {
    max: 15,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  logging: false,
  define: {
    timestamps: false
  }
});

fs
  .readdirSync(__dirname)
  .filter(function (file) {
    return (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js');
  })
  .forEach(function (file) {
    var model = sequelize['import'](path.join(__dirname, file));
    db[model.name] = model;
  });

Object.keys(db).forEach(function (modelName) {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;
sequelize.sync().then((result) => {
  console.log("同步数据库成功");
}).catch((err) => {
  console.log("同步数据库失败");
});
db.CustomerInfo.hasMany(db.ApplicationInfo, { foreignKey: 'YHRZXX_INDEX', sourceKey: 'INDEX', as: 'Applications' });
db.ApplicationInfo.belongsTo(db.CustomerInfo, { foreignKey: 'YHRZXX_INDEX', targetKey: 'INDEX', as: 'Customers' });

// db.User.hasMany(db.LogRecord, { foreignKey: 'INDEX', sourceKey: 'INDEX', as: 'Logs' });
db.LogRecord.belongsTo(db.User, { foreignKey: 'ZZBLR', targetKey: 'INDEX', as: 'Users' });
db.LogRecord.belongsTo(db.User, { foreignKey: 'CSR', targetKey: 'INDEX', as: 'Csr' });
db.LogRecord.belongsTo(db.User, { foreignKey: 'FSR', targetKey: 'INDEX', as: 'Fsr' });
db.LogRecord.belongsTo(db.User, { foreignKey: 'HDR', targetKey: 'INDEX', as: 'Hdr' });

db.ApplicationRecord.belongsTo(db.User, { foreignKey: 'FSR', targetKey: 'INDEX', as: 'Fsr' });
db.ApplicationRecord.belongsTo(db.User, { foreignKey: 'CSR', targetKey: 'INDEX', as: 'Csr' });
db.ApplicationRecord.belongsTo(db.User, { foreignKey: 'HDR', targetKey: 'INDEX', as: 'Hdr' });

db.ApplicationInfo.belongsTo(db.PostInfo, { foreignKey: 'POST_INDEX', targetKey: 'INDEX', as: 'Postinfo' });
db.ApplicationInfo.belongsTo(db.InvoiceInfo, { foreignKey: 'INVOICE_INDEX', targetKey: 'INDEX', as: 'Invoiceinfo' });

db.ApplicationInfo.belongsTo(db.LogRecord, { foreignKey: 'INDEX', targetKey: 'SQXX_INDEX', as: 'Rzjl' });

db.ApplicationInfo.belongsTo(db.option.CPLX, { foreignKey: 'CPDM', targetKey: 'DM', as: 'Cplx' });


module.exports = db;
