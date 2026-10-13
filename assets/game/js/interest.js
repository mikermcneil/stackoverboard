/**
 * interest.js
 *
 * Not everything on screen wants your attention. What matters (the story, the
 * people and creatures you talk to, quests, landmarks, keepsakes, doors, the
 * odd things that hold the world's secrets) can always be picked. The rest
 * (passing fish, scavengers, plants, the drifting dead) is scenery: only
 * none, one or two of those can be picked in any one place, and which ones is
 * the same for everyone. Everything else just lives there.
 */
(function () {

  const SO = window.SO;
  const U = SO.util;
  const E = SO.E;

  // Scenery: pickable only within the per-place allowance.
  const SCENERY = { lightDrinker: 1, life: 1, scavCrab: 1, lanternfish: 1, combJelly: 1, moonReeds: 1, polyps: 1, seaLife: 1, deepFish: 1, gull: 1, tern: 1, pelican: 1, ageGlass: 1, ageBleach: 1 };
  // Things that belong to quests (quests.js), always pickable.
  const QUEST = { belfry: 1, feathers: 1, holder: 1, weaver: 1, 'carved-swans': 1, 'egg-hook': 1, 'flashlight-fish': 1, 'hook-marks': 1, 'ledge-pen': 1, 'lost-egg': 1, 'old-axolotl': 1, 'pale-stalk': 1, 'quiet-reeds': 1, 'rain-float': 1, 'singing-shard': 1, 'twelve-rings': 1 };

  function scenery(a) {
    if (a.plot || a.lm || a.roamer || a.door) { return false; }
    if (SCENERY[a.type]) { return true; }
    if (a.type === 'thing') { const K = SO.things && SO.things.KINDS[a.kind]; return !QUEST[a.kind] && !(K && (K.plot || K.quest)); }
    if (a.type === 'oddity') { return /^(sad-|kill-)/.test(a.id || ''); }// (the drifting dead; the placed oddities are the world's secrets)
    if (a.type === 'westSight') { return true; }
    return false;
  }

  function sort(room) {
    if (!room) { return; }
    if (room._allow === undefined) { room._allow = U.hash((E.roomKey || '') + ':interest') % 3; room._allowed = 0; }// 0, 1 or 2
    // Decide in a fixed order (by id), so the same ones are pickable for everyone.
    const fresh = room.actors.filter((a) => !a._interest && a.touch).sort((a, b) => U.hash(E.roomKey + ':' + a.id) - U.hash(E.roomKey + ':' + b.id));
    fresh.forEach((a) => {
      a._interest = true;
      if (!scenery(a)) { return; }
      if (room._allowed < room._allow) { room._allowed++; return; }
      a.touch = false;
      if (E.inspected === a) { E.inspected = null; }
    });
  }

  const populate = SO.oddities.populate.bind(SO.oddities);
  SO.oddities.populate = function (room) { populate(room); sort(room); };
  setInterval(() => { if (E.mode === 'play' && E.room) { sort(E.room); } }, 500);// (things that turn up later)

  SO.interest = { scenery, sort };

})();
