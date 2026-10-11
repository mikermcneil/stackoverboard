module.exports = {


  friendlyName: 'Create native species table',


  description: 'Create the `nativespecies` table (production uses migrate: safe), then seed it with the world\'s native creatures, plants, and items.',


  extendedDescription:
`Run this once against the production database BEFORE deploying the code that uses this table:

  sails_models__migrate=safe sails_datastores__default__adapter=sails-mysql sails_datastores__default__url='mysql://...' sails run create-native-species-table

It's safe to run more than once: if the table already exists it's left alone (and just re-seeded).
(Schema changes are the one thing the ORM can't do, so this talks to the database directly.  The
seeding itself goes through the ORM, and also happens automatically every time the app lifts.)`,


  fn: async function () {

    var datastore = sails.getDatastore();

    var existing = (await datastore.sendNativeQuery('SHOW TABLES LIKE \'nativespecies\'')).rows;
    if (existing.length) {
      sails.log('`nativespecies` is already there.');
    } else {
      await datastore.sendNativeQuery(
        'CREATE TABLE IF NOT EXISTS `nativespecies` ('+
        '`createdAt` double DEFAULT NULL, '+
        '`updatedAt` double DEFAULT NULL, '+
        '`id` int unsigned NOT NULL AUTO_INCREMENT, '+
        '`key` varchar(255) NOT NULL, '+
        '`kind` varchar(255) NOT NULL, '+
        '`name` varchar(255) NOT NULL, '+
        '`commonName` varchar(255) NOT NULL DEFAULT \'\', '+
        '`latin` varchar(255) NOT NULL DEFAULT \'\', '+
        '`regions` longtext, '+
        '`places` longtext, '+
        '`teaches` varchar(255) NOT NULL DEFAULT \'\', '+
        '`smell` varchar(255) NOT NULL DEFAULT \'\', '+
        '`blurb` text, '+
        '`role` text, '+
        '`realWorld` longtext, '+
        '`contentHash` varchar(255) NOT NULL DEFAULT \'\', '+
        'PRIMARY KEY (`id`), '+
        'UNIQUE KEY `key` (`key`)'+
        ') ENGINE=InnoDB DEFAULT CHARSET=utf8mb4'
      );
      sails.log('Created `nativespecies`.');
    }

    var seeded = await sails.helpers.world.seedNativeSpecies();
    sails.log('Seeded native species:', seeded);

  }


};
