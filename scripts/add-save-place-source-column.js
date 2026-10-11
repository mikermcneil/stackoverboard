module.exports = {


  friendlyName: 'Add save place source column',


  description: 'Add the `placeSource` column to the `save` table (production uses migrate: safe).',


  extendedDescription:
`Run this once against the production database BEFORE deploying the code that uses this column
(start-game and save-game write it, so they would fail without it):

  sails_models__migrate=safe sails_datastores__default__adapter=sails-mysql sails_datastores__default__url='mysql://...' sails run add-save-place-source-column

It's safe to run more than once: if the column already exists, it's skipped.  (Schema changes are
the one thing the ORM can't do, so this talks to the database directly.)`,


  fn: async function () {

    var COLUMNS = {
      placeSource: 'varchar(255) NOT NULL DEFAULT \'\'',
    };
    var datastore = sails.getDatastore();

    var existing = (await datastore.sendNativeQuery('SHOW COLUMNS FROM `save`')).rows.map((row) => row.Field);
    for (let column of Object.keys(COLUMNS)) {
      if (existing.includes(column)) {
        sails.log(`\`${column}\` is already there.`);
        continue;
      }
      await datastore.sendNativeQuery('ALTER TABLE `save` ADD COLUMN `'+column+'` '+COLUMNS[column]);
      sails.log(`Added \`${column}\`.`);
    }

  }


};
