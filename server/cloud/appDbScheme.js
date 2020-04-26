/* global Parse */
const _ = require('lodash');
const mongoAdapter = require('parse-server/lib/Config').get(process.env.PARSE_APPID).database.adapter;

const cloud = require('./cloudUtils');

const noAccess = {};
const publicAccess = { '*': true };
const adminAccess = { 'role:Admin': true };

const schemas = [{
  className: '_Role',
  clp: { get: noAccess, find: noAccess, create: noAccess, update: noAccess, delete: noAccess, addField: noAccess },
}, {
  className: '_User',
  clp: { get: adminAccess, find: adminAccess, create: adminAccess, update: adminAccess, delete: adminAccess, addField: noAccess },
  columns: { name: 'String', lastActivity: 'Date', photo: { type: 'Pointer', targetClass: 'Resource' } },
}, {
  className: 'Config',
  clp: { get: publicAccess, find: publicAccess, create: adminAccess, update: adminAccess, delete: adminAccess, addField: noAccess },
  columns: { name: 'String', value: 'String', visibility: 'String' },
  indices: [{ name: 'name_idx', unique: true, key: { 'name': 1 } }],
}, {
  className: 'Resource',
  clp: { get: publicAccess, find: adminAccess, create: adminAccess, update: adminAccess, delete: adminAccess, addField: noAccess },
  columns: { src: 'File', thumbnail: 'File', refs: 'Number', desc: 'String', metadata: 'Object' },
  indices: [{ name: 'refs_idx', unique: false, key: { 'refs': 1 } }],
}, {
  className: 'EventLog',
  clp: { get: adminAccess, find: adminAccess, create: adminAccess, update: noAccess, delete: noAccess, addField: noAccess },
  columns: { timestamp: 'Date', userId: 'String', eventName: 'String', dimensions: 'Object' },
  indices: [{ name: 'timestamp_idx', unique: false, key: { 'timestamp': 1 }, expireAfterSeconds: 60 * 60 * 24 * 365 }],
}];

cloud.setupJob('setup-app-db-schemes', async () => {
  const db = await mongoAdapter.client.db(mongoAdapter.client.s.options.dbName);
  const existingSchemas = await Parse.Schema.all().then((schemas) => _.keyBy(schemas, 'className'));

  await Promise.all(_.map(schemas, async (schemaInfo) => {
    const { className, clp, columns, indices } = schemaInfo;
    const prevSchema = existingSchemas[className];
    const schema = _.reduce(columns, (s, data, name) => {
      const { type, targetClass } = _.isString(data) ? { type: data } : data;

      if (prevSchema && prevSchema.fields[name]) {
        return s;
      }

      switch (type) {
        case 'Pointer': return s.addPointer(name, targetClass);
        case 'Relation': return s.addRelation(name, targetClass);
        default: return s.addField(name, type);
      }
    }, new Parse.Schema(className));

    if (clp) {
      schema.setCLP(clp);
    }

    await (prevSchema ? schema.update() : schema.save());

    if (indices) {
      await db.collection(className).createIndexes(indices);
    }
  }));

  const hasRoles = await new Parse.Query(Parse.Role).containedIn('name', ['Admin']).count(cloud.masterPermissions);
  if (!hasRoles) {
    const masterAcl = new Parse.ACL();
    const adminRole = new Parse.Role('Admin', masterAcl);

    await Parse.Object.saveAll([adminRole], cloud.masterPermissions);
  }

  return `${_.size(schemas)} schemas where successfully created/updated`;
});
