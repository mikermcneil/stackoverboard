// The names new squids are given: squid puns and squid genera, short and silly, none of them the
// name of anyone or anything in the game (birds, characters, creatures, or the made-up species).
// Each one is claimed (NameClaim's unique key), so no two squids ever share a name. A new squid
// starts at its own place in the list (from its token) and takes the first one nobody has; once
// every one is taken, it's "Inkling 2", "Squidney 2", and so on.
const NAMES = [
  'Inkling',
  'Squidney',
  'Calamarie',
  'Tentacool',
  'Squidgy',
  'Inkspot',
  'Cuttlebug',
  'Squiddly',
  'Lady Calamari',
  'Squidlet',
  'Squidbit',
  'Mantlepiece',
  'Inkognito',
  'Inkredible',
  'Squiddington',
  'Tentacle Tess',
  'Squishy',
  'Squidmund',
  'Arm Strong',
  'Ten Tickles',
  'Ink Blot',
  'Squid Pro Quo',
  'Calamaribelle',
  'Jet Setter',
  'Siphonia',
  'Chroma',
  'Squiddle',
  'Cephalopal',
  'Squid Vicious',
  'Inky Dinky',
  'Mollusk Mo',
  'Squidaddle',
  'Tentacuddle',
  'Squidwick',
  'Squidonia',
  'Kraken Wise',
  'Little Kraken',
  'Krakers',
  'Inkwell',
  'Squidget',
  'Tentaclaire',
  'Calamity',
  'Squidmore',
  'Suckerpunch',
  'Squidzilla',
  'Ink Floyd',
  'Squidbeard',
  'Inkspresso',
  'Squidoodle',
  'Squiddykins',
  'Jetsam',
  'Flotsquid',
  'Squidjet',
  'Pen Pal',
  'Gladius',
  'Hecto',
  'Stato',
  'Chromie',
  'Glowbelly',
  'Inky Tea',
  'Calamarina',
  'Squidelia',
  'Squidrick',
  'Tentatively',
  'Arms Akimbo',
  'Ten Arms Tim',
  'Octo Plus Two',
  'Sea Noodle',
  'Noodle Arms',
  'Wiggleton',
  'Squidbert',
  'Squidamus',
  'Inksworth',
  'Lord Inkington',
  'Captain Squidd',
  'Squid Kid',
  'Jet Stream',
  'Bubble Squeak',
  'Squidsy',
  'Cuttle Muffin',
  'Mantleray',
  'Inkadink',
  'Squiddlywink',
  'Squidwig',
  'Calamari Annie',
  'Teuthie',
  'Lolly Go',
  'Illex Rex',
  'Archie',
  'Mesa Nyx',
  'Tanny',
  'Cockeyed Kip',
  'Omma',
  'Spiro',
  'Wata',
  'Chiro',
  'Bathy',
  'Grimaldi',
  'Abra',
  'Pyro',
  'Eno',
  'Prym',
  'Diamond Dee',
  'Magna',
];

module.exports = {


  friendlyName: 'Claim squid name',


  description: 'Pick a fun, unique name for a new squid (from a list of squid puns), and claim it so no other squid can have it.',


  inputs: {

    token: { type: 'string', required: true, description: 'The new save\'s token (only a hash of it is stored).' },

  },


  exits: {

    success: { outputType: 'string', outputExample: 'Inkling' },

  },


  fn: async function ({ token }) {
    var tokenHash = sails.helpers.world.hashToken(token);
    var start = require('crypto').createHash('sha1').update('squid-name:'+token).digest().readUInt32BE(0) % NAMES.length;
    for (let round = 1; round < 10000; round++) {
      let candidates = [];
      for (let i = 0; i < NAMES.length; i++) {
        let base = NAMES[(start + i) % NAMES.length];
        candidates.push(round === 1 ? base : base+' '+round);
      }
      // Which of these are spoken for already (claimed, or in use by any squid)?
      let claimed = await NameClaim.find({ where: { nameKey: candidates.map((n) => n.toLowerCase()) }, select: ['nameKey', 'tokenHash'] });
      let used = await Save.find({ where: { squidName: candidates }, select: ['squidName'] });
      let taken = new Set(claimed.filter((c) => c.tokenHash !== tokenHash).map((c) => c.nameKey).concat(used.map((s) => s.squidName.toLowerCase())));
      let mine = claimed.find((c) => c.tokenHash === tokenHash);
      if (mine) { return candidates.find((n) => n.toLowerCase() === mine.nameKey); }
      for (let name of candidates) {
        if (taken.has(name.toLowerCase())) { continue; }
        // Claim it. (If another new squid got there first, keep looking.)
        let made = await sails.helpers.world.createOnce.with({ model: 'nameclaim', uniqueBy: 'nameKey', values: { nameKey: name.toLowerCase(), name, tokenHash } });
        if (made.record && made.record.tokenHash === tokenHash) { return name; }
      }
    }
    return 'Squid '+tokenHash.slice(0, 6);
  }


};
