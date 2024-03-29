/* global Parse */
const _ = require('lodash');
const mongoAdapter = require('parse-server/lib/Config').get(process.env.PARSE_APPID).database.adapter;

const cloud = require('./cloudUtils');
const { role } = require('./types');

const noAccess = {};
const publicAccess = { '*': true };
const adminAccess = { [`role:${role.admin}`]: true };
const clientAccess = { [`role:${role.client}`]: true };

const schemaDefinitions = [{
  className: '_Role',
  clp: {
    get: noAccess, find: noAccess, create: noAccess, update: noAccess, delete: noAccess, addField: noAccess,
  },
}, {
  className: '_User',
  clp: {
    get: { ...adminAccess, ...clientAccess }, find: adminAccess, create: { ...adminAccess, ...publicAccess }, update: { ...adminAccess, ...clientAccess }, delete: adminAccess, addField: noAccess,
  },
  columns: {
    name: 'String', lastActivity: 'Date', language: 'String', photo: { type: 'Pointer', targetClass: 'Resource' }, role: 'String',
  },
}, {
  className: 'Config',
  clp: {
    get: publicAccess, find: publicAccess, create: adminAccess, update: adminAccess, delete: adminAccess, addField: noAccess,
  },
  columns: { name: 'String', value: 'String', visibility: 'String' },
  indices: [{ name: 'name_idx', unique: true, key: { name: 1 } }],
}, {
  className: 'Resource',
  clp: {
    get: publicAccess, find: adminAccess, create: adminAccess, update: adminAccess, delete: adminAccess, addField: noAccess,
  },
  columns: {
    src: 'File', thumbnail: 'File', refs: 'Number', desc: 'String', metadata: 'Object',
  },
  indices: [{ name: 'refs_idx', unique: false, key: { refs: 1 } }],
}, {
  className: 'EventLog',
  clp: {
    get: adminAccess, find: adminAccess, create: adminAccess, update: noAccess, delete: noAccess, addField: noAccess,
  },
  columns: {
    timestamp: 'Date', userId: 'String', eventName: 'String', dimensions: 'Object',
  },
  indices: [{
    name: 'timestamp_idx', unique: false, key: { timestamp: 1 }, expireAfterSeconds: 60 * 60 * 24 * 365,
  }],
}, {
  className: 'ContentDefinition',
  clp: {
    get: publicAccess, find: publicAccess, create: adminAccess, update: adminAccess, delete: adminAccess, addField: noAccess,
  },
  columns: {
    enabled: 'Boolean', title: 'Object', mobileView: 'String', order: 'Number', image: { type: 'Pointer', targetClass: 'Resource' }, description: 'Object', refs: 'Number', sortContentsBy: 'String',
  },
}, {
  className: 'Content',
  clp: {
    get: publicAccess, find: publicAccess, create: adminAccess, update: adminAccess, delete: adminAccess, addField: noAccess,
  },
  columns: {
    definition: { type: 'Pointer', targetClass: 'ContentDefinition' }, image: { type: 'Pointer', targetClass: 'Resource' }, visibility: 'String', entityType: 'String', entityInfo: 'Object', title: 'Object', description: 'Object', document: 'Object', documentResources: 'Array', order: 'Number',
  },
}, {
  className: 'Page',
  clp: {
    get: publicAccess, find: publicAccess, create: adminAccess, update: adminAccess, delete: adminAccess, addField: noAccess,
  },
  columns: {
    visibility: 'String', title: 'Object', description: 'Object', document: 'Object', documentResources: 'Array', order: 'Number',
  },
}, {
  className: 'DeviceInstallation',
  clp: {
    get: noAccess, find: adminAccess, create: noAccess, update: noAccess, delete: noAccess, addField: noAccess,
  },
  columns: {
    installationId: 'String', deviceName: 'String', deviceYear: 'Number', devicePlatform: 'String', deviceVersion: 'String', appVersion: 'String', buildVersion: 'String', language: 'String', enabled: 'Boolean', user: { type: 'Pointer', targetClass: '_User' }, pushToken: 'String',
  },
  indices: [{ name: 'installationId_idx', unique: true, key: { installationId: 1 } }, {
    name: 'updatedAt_idx', unique: false, key: { _updated_at: 1 }, expireAfterSeconds: 60 * 60 * 24 * 90,
  }, {
    name: 'enabled_user_idx', unique: false, key: { enabled: 1, _p_user: 1 }, partialFilterExpression: { enabled: true },
  }],
}];

cloud.setupJob('setup-app-db-schemes', async (req) => {
  const db = await mongoAdapter.client.db(mongoAdapter.client.s.options.dbName);
  const existingSchemas = await Parse.Schema.all().then((schemas) => _.keyBy(schemas, 'className'));

  await Promise.all(_.map(schemaDefinitions, async (schemaInfo) => {
    const {
      className, clp, columns, indices,
    } = schemaInfo;
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

  const existingRoles = await new Parse.Query(Parse.Role).containedIn('name', [role.admin, role.client]).count(cloud.masterPermissions);
  if (existingRoles < 2) {
    const masterAcl = new Parse.ACL();
    const adminRole = new Parse.Role(role.admin, masterAcl);
    const clientRole = new Parse.Role(role.client, masterAcl);

    await Parse.Object.saveAll([adminRole, clientRole], cloud.masterPermissions);
  }

  req.write(`${_.size(schemaDefinitions)} schemas where successfully created/updated`);
});
