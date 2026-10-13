/**
 * danger.js
 *
 * How dangerous it is here, right now (0 nothing comes for you .. 1 anything
 * might). Things that hunt (strikers after blood, the shark, leeches, the slow
 * follower) only come when it's dangerous enough, so the sea starts gentle and
 * gets harder as the story goes on. Out west it's the distance that does it:
 * the farther you go, the worse it gets.
 *
 * And some places are safe, whatever's spilled: the lairs of the ones who
 * look after you (the vampire squid's dome, the nautilus and the eel's cave,
 * the octopus garden, Grandmother Seven's hall, the cuttlefish's kelp, the
 * old turtle's reef, home). Blood there brings nothing.
 */
(function () {

  const SO = window.SO;
  const U = SO.util;
  const E = SO.E;

  const SAFE = ['hollowglass-hall', 'mural-room', 'spire-inside', 'mouth-deep', 'keeper-hall', 'hatchery', 'undershine', 'undershine-gate', 'kelp-deep', 'bright-reef', 'home-pool', 'home-rings', 'home-lip'];
  // By chapter: nothing at first, then a little, then more.
  const BY_CHAPTER = [0, 0, 0.3, 0.5, 0.7, 0.85, 1, 1, 1];

  SO.danger = {
    SAFE,
    safe(room) { room = room || E.room; return !!room && (room.def.safe || SAFE.includes(E.roomKey) || room.def.region === 'home'); },
    level(room) {
      room = room || E.room;
      if (!room || this.safe(room)) { return 0; }
      const n = room.def.west || (/^west:(\d+)$/.exec(E.roomKey || '') || [])[1];
      if (n) { return U.clamp(0.2 + (+n) / 40, 0, 1); }// out west: the distance
      if (/^deep:/.test(E.roomKey || '')) { return 1; }
      const ch = (SO.story && SO.story.ch) || 0;
      return BY_CHAPTER[Math.min(BY_CHAPTER.length - 1, ch)];
    },
    at(x, room) { return this.level(room) >= x; },
  };

  const populate = SO.oddities.populate.bind(SO.oddities);
  SO.oddities.populate = function (room) { populate(room); if (SAFE.includes(E.roomKey)) { room.def.safe = true; } };

})();
