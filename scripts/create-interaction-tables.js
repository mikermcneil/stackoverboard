module.exports = {


  friendlyName: 'Create interaction tables',


  description: 'Create the `objectinteraction` and `interactionanswer` tables (production uses migrate: safe).',


  extendedDescription:
`Run this once against the production database BEFORE deploying the code that adds shared
interactions and questions:

  sails_models__migrate=safe sails_datastores__default__adapter=sails-mysql sails_datastores__default__url='mysql://...' sails run create-interaction-tables

It's safe to run more than once.  (Schema changes are the one thing the ORM can't do, so this
talks to the database directly.)  Until it has run, interactions degrade quietly: note-interaction
answers 503, and get-interactions, get-answers, and get-squid return no interactions or answers.`,


  fn: async function () {

    var datastore = sails.getDatastore();
    var TABLES = {
      objectinteraction:
        'CREATE TABLE IF NOT EXISTS `objectinteraction` (' +
        '`id` int(11) NOT NULL AUTO_INCREMENT, `createdAt` bigint(20) DEFAULT NULL, `updatedAt` bigint(20) DEFAULT NULL, ' +
        '`key` varchar(255) NOT NULL, `room` varchar(255) NOT NULL, `kind` varchar(255) NOT NULL, `squidName` varchar(255) NOT NULL, ' +
        '`tokenHash` varchar(255) NOT NULL DEFAULT \'\', `at` bigint(20) NOT NULL, `localHour` double DEFAULT NULL, `isNight` tinyint(1) NOT NULL DEFAULT 0, ' +
        '`questionKey` varchar(255) NOT NULL DEFAULT \'\', `answer` varchar(255) NOT NULL DEFAULT \'\', ' +
        'PRIMARY KEY (`id`), KEY `key_at` (`key`(191), `at`), KEY `room_at` (`room`(191), `at`), KEY `squidName_at` (`squidName`(191), `at`), ' +
        'KEY `tokenHash_at` (`tokenHash`(191), `at`), KEY `kind_at` (`kind`(191), `at`), KEY `at` (`at`)' +
        ') DEFAULT CHARSET=utf8mb4',
      interactionanswer:
        'CREATE TABLE IF NOT EXISTS `interactionanswer` (' +
        '`id` int(11) NOT NULL AUTO_INCREMENT, `createdAt` bigint(20) DEFAULT NULL, `updatedAt` bigint(20) DEFAULT NULL, ' +
        '`answerKey` varchar(255) NOT NULL, `key` varchar(255) NOT NULL, `questionKey` varchar(255) NOT NULL, `room` varchar(255) NOT NULL DEFAULT \'\', ' +
        '`squidName` varchar(255) NOT NULL, `tokenHash` varchar(255) NOT NULL, `answer` varchar(255) NOT NULL, `at` bigint(20) NOT NULL, ' +
        'PRIMARY KEY (`id`), UNIQUE KEY `answerKey` (`answerKey`), KEY `key_question` (`key`(191), `questionKey`(64)), ' +
        'KEY `question_at` (`questionKey`(191), `at`), KEY `tokenHash_at` (`tokenHash`(191), `at`), KEY `squidName` (`squidName`(191))' +
        ') DEFAULT CHARSET=utf8mb4',
    };

    for (let table of Object.keys(TABLES)) {
      let rows = (await datastore.sendNativeQuery('SHOW TABLES LIKE \''+table+'\'')).rows;
      if (rows.length) {
        sails.log(`\`${table}\` is already there.`);
        continue;
      }
      await datastore.sendNativeQuery(TABLES[table]);
      sails.log(`Created \`${table}\`.`);
    }

  }


};
