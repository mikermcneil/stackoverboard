module.exports = {


  friendlyName: 'Create world fact table',


  description: 'Create the `worldfact` table (production uses migrate: safe), then seed it with the world\'s knowledge.',


  extendedDescription:
`Run this once against the production database BEFORE deploying the code that uses this table:

  sails_models__migrate=safe sails_datastores__default__adapter=sails-mysql sails_datastores__default__url='mysql://...' sails run create-world-fact-table

It's safe to run more than once: if the table already exists it's left alone (and just re-seeded).
(Schema changes are the one thing the ORM can't do, so this talks to the database directly.  The
seeding itself goes through the ORM, and also happens automatically every time the app lifts.)`,


  fn: async function () {

    var datastore = sails.getDatastore();

    var existing = (await datastore.sendNativeQuery('SHOW TABLES LIKE \'worldfact\'')).rows;
    if (existing.length) {
      sails.log('`worldfact` is already there.');
    } else {
      await datastore.sendNativeQuery(
        'CREATE TABLE IF NOT EXISTS `worldfact` ('+
        '`createdAt` double DEFAULT NULL, '+
        '`updatedAt` double DEFAULT NULL, '+
        '`id` int unsigned NOT NULL AUTO_INCREMENT, '+
        '`key` varchar(255) NOT NULL, '+
        '`topic` varchar(255) NOT NULL, '+
        '`title` varchar(255) NOT NULL, '+
        '`body` text, '+
        '`tags` longtext, '+
        '`related` longtext, '+
        '`status` varchar(255) NOT NULL DEFAULT \'built\', '+
        '`spoilerLevel` double NOT NULL DEFAULT 0, '+
        '`optional` tinyint(1) NOT NULL DEFAULT 0, '+
        '`seeAlso` longtext, '+
        '`data` longtext, '+
        '`source` varchar(255) NOT NULL DEFAULT \'\', '+
        '`contentHash` varchar(255) NOT NULL DEFAULT \'\', '+
        'PRIMARY KEY (`id`), '+
        'UNIQUE KEY `key` (`key`)'+
        ') ENGINE=InnoDB DEFAULT CHARSET=utf8mb4'
      );
      sails.log('Created `worldfact`.');
    }

    var seeded = await sails.helpers.world.seedWorldFacts();
    sails.log('Seeded world facts:', seeded);

  }


};
