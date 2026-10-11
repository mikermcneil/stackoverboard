module.exports = {


  friendlyName: 'Create name claim table',


  description: 'Create the `nameclaim` table (production uses migrate: safe).',


  extendedDescription:
`Run this once against the production database BEFORE deploying the code that lets squids choose names:

  sails_models__migrate=safe sails_datastores__default__adapter=sails-mysql sails_datastores__default__url='mysql://...' sails run create-name-claim-table

It's safe to run more than once.  (Schema changes are the one thing the ORM can't do, so this
talks to the database directly.)`,


  fn: async function () {

    var datastore = sails.getDatastore();
    var rows = (await datastore.sendNativeQuery('SHOW TABLES LIKE \'nameclaim\'')).rows;
    if (rows.length) {
      sails.log('`nameclaim` is already there.');
      return;
    }
    await datastore.sendNativeQuery(
      'CREATE TABLE `nameclaim` (' +
      '`id` int(11) NOT NULL AUTO_INCREMENT, `createdAt` bigint(20) DEFAULT NULL, `updatedAt` bigint(20) DEFAULT NULL, ' +
      '`nameKey` varchar(255) NOT NULL, `name` varchar(255) NOT NULL, `tokenHash` varchar(255) NOT NULL, ' +
      'PRIMARY KEY (`id`), UNIQUE KEY `nameKey` (`nameKey`)' +
      ') DEFAULT CHARSET=utf8mb4'
    );
    sails.log('Created `nameclaim`.');

  }


};
