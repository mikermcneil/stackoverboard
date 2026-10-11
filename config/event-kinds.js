/**
 * World event kinds
 * (sails.config.eventKinds)
 *
 * Every kind of WorldEvent (the append-only history of the shared world), in one place, so the model's
 * validation, the history tools' input lists, and their descriptions never drift apart.
 *
 * `about` says what the event means and what its `subject` and `details` hold.  `first: true` marks
 * kinds where "who did this first, for each subject?" is interesting: when one of those is logged for a
 * subject nobody has done before, a "world-first" event is logged too (see the log-events helper and
 * world/get-firsts).  Chapters and endings were kept before world-first events existed, so their firsts
 * come from the oldest event instead (record-ending only claims a world-first for a truly first ending).
 *
 * Spoilers: events about the end of Bead's story, the warm room and the homecoming are story-ending
 * spoilers.  They're logged like any other event, but the history tools leave them out unless asked
 * (see `spoilerKinds` and `spoilerSubjects`).
 */

module.exports.eventKinds = {

  kinds: {

    // Logged by the actions that cause them.
    'arrival': { group: 'story', about: 'A squid fell into the sea (started a playthrough).  subject "surface"; details.playthrough.' },
    'chapter-reached': { group: 'story', about: 'A squid reached a chapter (1 to 8) of the story.  subject is the chapter number as a string; details.chapter, details.playthrough, details.location (the room), details.skipped (true if it skipped ahead from the title screen).' },
    'tile-discovered': { group: 'world', about: 'A squid was first to reach a tile of the Below (the deep maze).  subject is the tile key, e.g. "below:2,9"; details.x, details.y, details.isGoal, details.memory.' },
    'species-introduced': { group: 'world', about: 'A squid met a procedurally generated species no one had seen before.  subject is the species key, e.g. "creature:3"; details.name, details.kind, details.region.' },
    'eruption': { group: 'world', about: 'A squid woke the volcano.  subject "forge"; startsAt = woken, endsAt = eruption over (20 minutes later); details.coolsAt (40 more minutes), details.seq (1 = the first eruption ever).' },
    'gem-gathered': { group: 'world', about: 'A squid gathered a pearl (called a gem in the API) from a tile of the Below.  subject is the tile key; details.index, details.regrowsAt.' },
    'ending': { group: 'story', about: 'A squid finished a playthrough.  subject is the ending: "return" (home), "lantern" (stay), "gift" (the whale), or "song" (the swans); details.playthrough.' },
    'renamed': { group: 'social', about: 'A squid chose a new name.  squidName is the new name, subject is the old one; details.from, details.to.  (Older events keep the name the squid had at the time: get-timeline follows renames.)' },
    'first-words': { group: 'social', about: 'The first thing a squid ever said out loud.  subject is the room; details.text, details.room.' },

    // Worked out by save-game, from what changed between a squid's previous save and its new one.
    'level-reached': { group: 'exploration', first: true, about: 'A squid reached one of the fifteen levels of the world for the first time (see get-levels).  subject is the level key, e.g. "abyss"; details.playthrough.' },
    'place-visited': { group: 'exploration', about: 'A squid wrote a place in its journal for the first time.  subject is the room key, e.g. "mouth-deep".' },
    'skin-word-learned': { group: 'story', first: true, about: 'A squid learned a skin word in this playthrough (see get-skin-words).  subject is the word key, e.g. "calm" ("cloud" = passing cloud); details.playthrough, details.skipped.' },
    'memory-found': { group: 'story', first: true, about: 'A squid found one of the three pieces of glass from home.  subject is "1" (the pool), "2" (the edge) or "3" (the shaking); details.playthrough.' },
    'pearl-gained': { group: 'story', about: 'A squid picked up pearls.  subject is how many it now carries; details.from, details.to, details.delta.' },
    'pearl-spent': { group: 'story', about: 'A squid gave pearls away (five buy the skin word "wake" from Grandmother Seven).  subject is how many it now carries; details.from, details.to, details.delta.' },
    'native-met': { group: 'exploration', first: true, about: 'A squid met a native creature, plant or thing for the first time (its journal keeps it across playthroughs; see get-species).  subject is the native key, e.g. "moray"; details.name.' },
    'quest-started': { group: 'quests', about: 'A squid started a side quest.  subject is the quest key: "bells" (the singing shards), "reeds" (the quiet reeds), "egg" (the fallen egg case), "lamps" (the glowing ledges), "rain" (rain for the lungfish), "sphinx" (the sphinx), or "kept" (the warm room, a spoiler); details.playthrough.' },
    'quest-finished': { group: 'quests', first: true, about: 'A squid finished a side quest.  subject is the quest key (as for quest-started); details.playthrough.' },
    'story-moment': { group: 'story', about: 'A moment in the story, e.g. calming the moray eel or falling into the Below.  subject is the game\'s flag for it (e.g. "morayCalmed", "fellThrough", "sepiaDone"); details.label says it in words.' },
    'bead-met': { group: 'bead', about: 'A squid freed Bead, the little glass squid, from the kelp and made a friend.  subject "bead"; details.playthrough.' },
    'bead-closer': { group: 'bead', about: 'A squid and Bead grew closer: a closeness milestone.  subject is the milestone ("0.3", "0.6", "0.9"; closeness runs 0 to 1); details.closeness.' },
    'bead-fate': { group: 'bead', about: 'What happened to Bead at the end of its story.  A story-ending spoiler: hidden unless asked for.  subject "bead"; details.spoiler.' },
    'west-milestone': { group: 'west', about: 'A squid got farther west than it ever had, past another ten places (it\'s logged once per squid per ten places, so each one is also a new personal best).  subject is "west:N" (N = the milestone); details.farthest, details.elevation (meters climbed, from the highlands on).' },
    'west-landmark': { group: 'west', first: true, about: 'A squid passed one of the twelve landmarks of the first crossing west for the first time (see get-west-path).  subject is the landmark key, e.g. "glass-buoy"; details.n, details.name.' },
    'west-crossing': { group: 'west', about: 'A squid finished a whole crossing of 60 places west.  subject is the crossing number as a string; details.farthest.' },
    'climb-milestone': { group: 'west', about: 'A squid climbed higher into the western highlands than it ever had, past another 250 meters.  subject is the milestone in meters; details.elevation, details.farthest.' },
    'air-milestone': { group: 'feats', about: 'A squid leapt out of the water for longer than it ever had, past another whole second.  subject is the seconds; details.bestAirTime, details.bestAirHeight.' },
    'record-broken': { group: 'feats', about: 'A squid beat the world record for a stat (or took it from another squid).  subject is the stat: "westFarthest", "bestAirTime", "bestAirHeight" or "deepest"; details.value, details.previous, details.previousHolder.' },
    'chat-milestone': { group: 'social', about: 'A squid has said this many things out loud (10, 50, 100, 500, 1000).  subject is the count.' },
    'personality-shift': { group: 'character', about: 'A squid\'s personality, in the game\'s own words, changed (or first showed).  subject is the new summary, e.g. "curious, gentle, a little wistful"; details.from, details.to, details.strongest.' },
    'lungfish-woken': { group: 'quests', about: 'A squid woke a lungfish asleep in dried mud out west by bringing it rain.  subject is the room, "west:N".' },
    'hunter-seen': { group: 'danger', about: 'A squid first noticed the slow hunter, the thing that follows it through anything.  subject "hunter".' },
    'hunter-escaped': { group: 'danger', about: 'A squid got away from the slow hunter.  subject is how many times it has now; details.count, details.times (how many in this save).' },
    'hunter-caught': { group: 'danger', about: 'The slow hunter caught a squid.  subject is how many times it has now; details.count, details.times.' },
    'whale-caught': { group: 'danger', about: 'The sperm whale caught a squid in the trench.  subject is how many times it has now; details.count, details.times.' },
    'elemental-grab': { group: 'danger', about: 'Water that moves on its own (a water elemental) grabbed a squid.  subject is how many times it has now; details.count, details.times.' },
    'blacked-out': { group: 'danger', about: 'A squid ran out of air out of the water and blacked out, coming to in the last water it was in.  subject is how many times it has now; details.count, details.times.' },
    'world-first': { group: 'firsts', about: 'Somebody did something nobody in the world had done before.  subject is "<kind>:<subject>", e.g. "level-reached:hadal"; details.kind, details.subject, details.eventKey.  See get-firsts.' },

  },

  // Hidden from the history tools unless they're asked for spoilers.
  spoilerKinds: ['bead-fate'],
  spoilerSubjects: ['kept', 'homecoming', 'ringsDone', 'world-first:quest-finished:kept'],

};
