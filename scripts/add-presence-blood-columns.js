module.exports = {


  friendlyName: 'Add presence blood columns',


  description: 'Add the `bloody` and `spill` columns to the `presence` table (production uses migrate: safe).',


  extendedDescription:
`Run this once against the production database BEFORE deploying the code that uses these columns:

  sails_models__migrate=safe sails_datastores__default__adapter=sails-mysql sails_datastores__default__url='mysql://...' sails run add-presence-blood-columns

It's safe to run more than once: columns that already exist are skipped.  (Schema changes are
the one thing the ORM can't do, so this talks to the database directly.)`,


  fn: async function () {

    var COLUMNS = {
      bloody: 'double NOT NULL DEFAULT 0',
      spill: 'varchar(255) NOT NULL DEFAULT \'\'',
    };
    var datastore = sails.getDatastore();

    var existing = (await datastore.sendNativeQuery('SHOW COLUMNS FROM `presence`')).rows.map((row) => row.Field);
    for (let column of Object.keys(COLUMNS)) {
      if (existing.includes(column)) {
        sails.log(`\`${column}\` is already there.`);
        continue;
      }
      await datastore.sendNativeQuery('ALTER TABLE `presence` ADD COLUMN `'+column+'` '+COLUMNS[column]);
      sails.log(`Added \`${column}\`.`);
    }

  }


};
