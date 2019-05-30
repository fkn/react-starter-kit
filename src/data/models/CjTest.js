import DataType from 'sequelize';
import Model from '../sequelize';
import * as util from './util';

const CjTest = Model.define('cjtest', {
  id: {
    type: DataType.UUID,
    defaultValue: DataType.UUIDV1,
    primaryKey: true,
  },
  idcjtest: {
    type: DataType.STRING(255),
    allowNull: false,
  },
});

CjTest.prototype.canRead = function canRead(user) {
  return util.haveRootAccess(user);
};

CjTest.prototype.canWrite = function canWrite(user) {
  return util.haveRootAccess(user);
};

export default CjTest;
