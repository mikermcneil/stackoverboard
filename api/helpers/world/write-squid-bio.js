module.exports = {


  friendlyName: 'Write squid bio',


  description: 'Write a short, plain-language paragraph about a squid, from its public profile.',


  sync: true,


  inputs: {

    profile: { type: 'ref', required: true, description: 'The profile built by world/get-squid (before `bio` is filled in).' },

  },


  exits: {

    success: { outputType: 'string' },

  },


  fn: function ({ profile }) {

    var p = profile;
    var s = p.stats || {};
    var sentences = [];
    var list = (items) => items.length <= 1 ? items.join('') : items.slice(0, -1).join(', ')+' and '+items[items.length - 1];
    var plural = (n, one, many) => n+' '+(n === 1 ? one : many);

    // Where and on what.
    var gadget = {
      'phone:iOS': 'an iPhone', 'tablet:iOS': 'an iPad', 'tablet:iPadOS': 'an iPad', 'phone:Android': 'an Android phone',
      'tablet:Android': 'an Android tablet', 'desktop:macOS': 'a Mac', 'desktop:Windows': 'a Windows computer',
      'desktop:Linux': 'a Linux computer', 'desktop:ChromeOS': 'a Chromebook',
    }[p.device+':'+p.os] || { phone: 'a phone', tablet: 'a tablet', desktop: 'a computer' }[p.device] || '';
    var where = p.place && p.place !== 'unknown' ? ' from '+p.place.replace(/, US$/, '')+(p.placeSource === 'timezone' ? ' (roughly, going by the time zone)' : '') : '';
    if (gadget || where) {
      sentences.push(p.squidName+' plays'+where+(gadget ? ' on '+gadget : '')+(p.browser && p.browser !== 'unknown' ? ' in '+p.browser : '')+'.');
    } else {
      sentences.push(p.squidName+' is a squid in Stack Overboard.');
    }

    // Personality.
    if (p.personality && p.personality.summary) {
      let summary = p.personality.summary.replace(/\.$/, '');
      let leaning = [];
      let t = p.personality.traits || {};
      if (t.curious >= 0.6) { leaning.push('pokes at everything'); }
      if (t.brave >= 0.6) { leaning.push('swims toward trouble'); }
      if (t.gentle >= 0.6) { leaning.push('would rather calm things than flee'); }
      if (t.playful >= 0.6) { leaning.push('leaps and spins for fun'); }
      if (t.wistful >= 0.6) { leaning.push('keeps looking up toward home'); }
      if (t.social >= 0.6) { leaning.push('likes company'); }
      if (t.wanderer >= 0.6) { leaning.push('keeps going west to see what\'s there'); }
      sentences.push((/^[aeiou]/i.test(summary) ? 'An ' : 'A ')+summary+' squid'+(leaning.length ? ' who '+list(leaning.slice(0, 3)) : '')+'.');
    }

    // Story progress.
    var progress = 'It\'s on playthrough '+p.playthrough+', '+(p.chapter >= 8 ? 'past the end of the story' : p.chapter >= 1 ? 'in chapter '+p.chapter+(p.chapterTitle ? ' ("'+p.chapterTitle+'")' : '') : 'just arrived');
    progress += (p.endings && p.endings.length ? ', and has reached '+plural(p.endings.length, 'ending', 'endings')+' ('+list(_.uniq(p.endings).map((e) => '"'+e+'"'))+')' : '')+'.';
    sentences.push(progress);

    // What it knows.
    var wordNames = { cloud: 'passing cloud' };
    if (p.skinWords && p.skinWords.length) {
      sentences.push('It knows '+plural(p.skinWords.length, 'skin word', 'skin words')+': '+list(p.skinWords.map((w) => wordNames[w] || w))+'.');
    }
    if (p.nativesMet && p.nativesMet.length) {
      let names = _.indexBy(sails.helpers.world.getNativeSpecies(), 'key');
      let met = p.nativesMet.map((k) => names[k] ? names[k].name.replace(/^The /, 'the ') : k);
      sentences.push('It has met '+(met.length > 5 ? list(met.slice(0, 5).concat([(met.length - 5)+' more'])) : list(met))+'.');
    }

    // Feats.
    var feats = [];
    if (s.westFarthest > 0) { feats.push('been '+plural(Math.round(s.westFarthest), 'room', 'rooms')+' west of the Bright'); }
    if (s.bestAirTime > 0) { feats.push('leapt out of the water for '+Math.round(s.bestAirTime * 10) / 10+' seconds'); }
    if (s.whaleCatches > 0) { feats.push('been caught by the whale '+plural(Math.round(s.whaleCatches), 'time', 'times')); }
    if (s.stalkerEscapes > 0) { feats.push('escaped the slow hunter '+plural(Math.round(s.stalkerEscapes), 'time', 'times')); }
    if (s.eaten) {
      let ate = (s.eaten.krill || 0) + (s.eaten.shrimp || 0) + (s.eaten.minnow || 0);
      if (ate > 0) { feats.push('eaten '+ate+' small things'); }
    }
    if (feats.length) { sentences.push('It has '+list(feats.slice(0, 4))+'.'); }
    if (s.playSeconds > 0) {
      let minutes = Math.round(s.playSeconds / 60);
      let night = s.nightSeconds > 0 && s.daySeconds >= 0 ? s.nightSeconds / Math.max(1, s.nightSeconds + (s.daySeconds || 0)) : 0;
      sentences.push('It has played for '+(minutes >= 120 ? Math.round(minutes / 6) / 10+' hours' : plural(minutes, 'minute', 'minutes'))+(night >= 0.6 ? ', mostly at night' : '')+'.');
    }

    // Shared things.
    var shared = [];
    if (p.interactions && p.interactions.length) { shared.push('clicked on '+plural(_.uniq(_.pluck(p.interactions, 'key')).length, 'thing', 'things')+' lately'); }
    if (p.answers && p.answers.length) { shared.push('answered '+plural(p.answers.length, 'question', 'questions')); }
    if (p.chats && p.chats.length) { shared.push('said things out loud ("'+p.chats[0].text+'")'); }
    if (shared.length) { sentences.push('It has '+list(shared)+'.'); }

    if (p.buddy && typeof p.buddy.closeness === 'number') {
      sentences.push(p.buddy.closeness >= 0.6 ? 'It and Bead, its little glass squid friend, are close.' : 'It has met Bead, a little glass squid.');
    }

    sentences.push(p.online ? 'It\'s swimming right now, in '+p.room+'.' : 'It isn\'t online right now.');

    return sentences.join(' ');

  }


};
