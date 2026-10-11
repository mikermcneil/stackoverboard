module.exports = {


  friendlyName: 'Create chat message table',


  description: 'Create the `chatmessage` table (production uses migrate: safe).',


  extendedDescription:
`Run this once against the production database BEFORE deploying the code that adds chat:

  sails_models__migrate=safe sails_datastores__default__adapter=sails-mysql sails_datastores__default__url='mysql://...' sails run create-chat-message-table

It's safe to run more than once.  (Schema changes are the one thing the ORM can't do, so this
talks to the database directly.)  Until it has run, chat degrades quietly: say answers 503,
update-presence returns no chat, and get-chat returns nothing.`,


  fn: async function () {

    var datastore = sails.getDatastore();
    var rows = (await datastore.sendNativeQuery('SHOW TABLES LIKE \'chatmessage\'')).rows;
    if (rows.length) {
      sails.log('`chatmessage` is already there.');
      return;
    }
    await datastore.sendNativeQuery(
      'CREATE TABLE IF NOT EXISTS `chatmessage` (' +
      '`id` int(11) NOT NULL AUTO_INCREMENT, `createdAt` bigint(20) DEFAULT NULL, `updatedAt` bigint(20) DEFAULT NULL, ' +
      '`squidName` varchar(255) NOT NULL, `room` varchar(255) NOT NULL, `text` varchar(1000) NOT NULL, `at` bigint(20) NOT NULL, ' +
      'PRIMARY KEY (`id`), KEY `room_at` (`room`(191), `at`), KEY `at` (`at`), KEY `squidName_at` (`squidName`(191), `at`)' +
      ') DEFAULT CHARSET=utf8mb4'
    );
    sails.log('Created `chatmessage`.');

  }


};
