module.exports = {


  friendlyName: 'Resolve squid names',


  description: 'Find every name one squid has gone by, following its "renamed" events both ways, and its save (if it still has one).',


  extendedDescription:
`World events keep the name a squid had at the time, so one squid's history can be spread over several
names (e.g. its generated name "Squidney", then "Lantern Bob").  Names are matched exactly
first, then ignoring capital letters (claimed names are kept lowercased too; see rename-squid).`,


  inputs: {

    name: { type: 'string', required: true, description: 'Any name the squid has gone by.' },

  },


  exits: {

    success: {
      outputType: 'ref',
      outputDescription: '`{ current, names, save }`: the name it goes by now, every name it has had (oldest first, as far as the history knows), and its Save (or undefined).'
    },

  },


  fn: async function ({ name }) {

    var clean = name.replace(/\s+/g, ' ').trim();
    var save = clean ? await Save.findOne({ squidName: clean }) : undefined;
    if (!save && clean) {
      let claim = await NameClaim.findOne({ nameKey: clean.toLowerCase() }).tolerate(() => undefined);
      if (claim) {
        save = await Save.findOne({ squidName: claim.name });
        if (save) { clean = save.squidName; }
      }
    }

    // Walk forward (renamed away from this name) to the current name, then back to the first one.
    var current = clean;
    var seen = {};
    for (let i = 0; i < 20 && !save; i++) {
      seen[current] = true;
      let next = (await WorldEvent.find({ kind: 'renamed', subject: current }).sort([{ startsAt: 'DESC' }, { id: 'DESC' }]).limit(1))[0];
      if (!next || seen[next.squidName]) { break; }
      current = next.squidName;
      save = await Save.findOne({ squidName: current });
    }
    if (save) { current = save.squidName; }

    var names = [current];
    var queue = [current];
    for (let i = 0; i < 20 && queue.length; i++) {
      let n = queue.shift();
      let earlier = await WorldEvent.find({ where: { kind: 'renamed', squidName: n }, select: ['subject', 'startsAt'] }).sort('startsAt DESC').limit(20);
      for (let e of earlier) {
        if (e.subject && !names.includes(e.subject)) { names.unshift(e.subject); queue.push(e.subject); }
      }
    }
    if (clean && !names.includes(clean)) { names.push(clean); }

    return { current, names, save };

  }


};
