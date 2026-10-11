module.exports = {


  friendlyName: 'Add world event indexes',


  description: 'Add indexes to the `worldevent` table, so the history tools stay quick as the history grows (production uses migrate: safe).',


  extendedDescription:
`The world's history (WorldEvent) is now kept aggressively: save-game logs many more events (levels,
skin words, natives, quests, west milestones...).  No new columns are needed, so the new code works
without this, but searches by kind, subject, squid and time get slower as the table grows.  Run this
once against the production database, before or after deploying:

  sails_models__migrate=safe sails_datastores__default__adapter=sails-mysql sails_datastores__default__url='mysql://...' sails run add-world-event-indexes

It's safe to run more than once: indexes that already exist are skipped.  (Schema changes are the one
thing the ORM can't do, so this talks to the database directly.)`,


  fn: async function () {

    var INDEXES = {
      'worldevent_kind_subject_startsAt': '(`kind`(40), `subject`(100), `startsAt`)',
      'worldevent_squidName_startsAt': '(`squidName`(100), `startsAt`)',
      'worldevent_startsAt': '(`startsAt`)',
    };
    var datastore = sails.getDatastore();

    var existing = _.uniq((await datastore.sendNativeQuery('SHOW INDEX FROM `worldevent`')).rows.map((row) => row.Key_name));
    for (let name of Object.keys(INDEXES)) {
      if (existing.includes(name)) {
        sails.log(`\`${name}\` is already there.`);
        continue;
      }
      await datastore.sendNativeQuery('ALTER TABLE `worldevent` ADD INDEX `'+name+'` '+INDEXES[name]);
      sails.log(`Added \`${name}\`.`);
    }

  }


};
