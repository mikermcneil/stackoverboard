module.exports = {


  friendlyName: 'Add player device columns',


  description: 'Add the device / place columns to the `save` table (production uses migrate: safe).',


  extendedDescription:
`Run this once against the production database BEFORE deploying the code that uses these columns:

  sails_datastores__default__url='mysql://...' sails run add-player-device-columns --environment=production

It's safe to run more than once: columns that already exist are skipped.  (Schema changes are
the one thing the ORM can't do, so this talks to the database directly.)`,


  fn: async function () {

    var COLUMNS = ['device', 'os', 'browser', 'userAgent', 'timeZone', 'place', 'language'];
    var datastore = sails.getDatastore();

    var existing = (await datastore.sendNativeQuery('SHOW COLUMNS FROM `save`')).rows.map((row) => row.Field);
    for (let column of COLUMNS) {
      if (existing.includes(column)) {
        sails.log(`\`${column}\` is already there.`);
        continue;
      }
      await datastore.sendNativeQuery('ALTER TABLE `save` ADD COLUMN `'+column+'` varchar(255) NOT NULL DEFAULT \'\'');
      sails.log(`Added \`${column}\`.`);
    }

  }


};
