// Searching the world's history (WorldEvent) with every filter the history tools offer, using the ORM
// only.  Filters the database can do (kind, subject, squid, time, spoilers, cursor) go in the query;
// the ones it can't (room and level, which live in an event's subject or details) are applied while
// reading through the results a page at a time, up to a limit, and the result says if it looked at
// everything.

const SCAN_LIMIT = 20000;
const PAGE = 500;

var roomLevels = {};

// The room an event happened in, if it says.
function roomOf(e) {
  var d = e.details || {};
  if (['tile-discovered', 'gem-gathered', 'place-visited', 'lungfish-woken', 'first-words', 'west-milestone'].includes(e.kind)) { return e.subject; }
  return typeof d.room === 'string' && d.room ? d.room : typeof d.location === 'string' && d.location ? d.location : null;
}

// Which level a room is in (see get-levels), remembered per room.
function levelOfRoom(room) {
  if (!room) { return null; }
  if (roomLevels[room] === undefined) {
    var key = null;
    try {
      var at = sails.helpers.world.getLevels.with({ room }).at;
      key = at && at.level ? at.level.key : null;
    } catch (unusedErr) { /* unknown */ }
    if (Object.keys(roomLevels).length > 5000) { roomLevels = {}; }
    roomLevels[room] = key;
  }
  return roomLevels[room];
}

function encodeCursor(e) { return Buffer.from(JSON.stringify([e.startsAt, e.id])).toString('base64').replace(/=+$/, ''); }
function decodeCursor(cursor) {
  try {
    var v = JSON.parse(Buffer.from(String(cursor), 'base64').toString('utf8'));
    return Array.isArray(v) && typeof v[0] === 'number' && v[1] !== undefined ? { startsAt: v[0], id: v[1] } : null;
  } catch (unusedErr) { return null; }
}

module.exports = {


  friendlyName: 'Find events',


  description: 'Search the world\'s history with filters, a cursor, and (optionally) a summary instead of the events.',


  inputs: {

    kind: { type: 'string', description: 'Only this kind (see config/event-kinds.js).' },
    kinds: { type: 'ref', description: 'Only these kinds (an array).' },
    group: { type: 'string', description: 'Only kinds in this group (see config/event-kinds.js).' },
    subject: { type: 'string', description: 'Only this exact subject.' },
    squidNames: { type: 'ref', description: 'Only events by these squids (an array of names).' },
    since: { type: 'number', description: 'Only events that started at or after this (epoch ms).' },
    until: { type: 'number', description: 'Only events that started at or before this (epoch ms).' },
    room: { type: 'string', description: 'Only events that happened in (or are about) this room.' },
    level: { type: 'string', description: 'Only events in (or about) this level of the world.' },
    includeSpoilers: { type: 'boolean', defaultsTo: false, description: 'Include story-ending spoilers.' },
    order: { type: 'string', isIn: ['newest', 'oldest'], defaultsTo: 'newest' },
    limit: { type: 'number', defaultsTo: 50 },
    cursor: { type: 'string', description: 'From a previous call\'s `nextCursor`.' },
    summary: { type: 'boolean', defaultsTo: false, description: 'Return counts (by kind, group, day, squid) instead of events.' },

  },


  exits: {

    success: {
      outputType: 'ref',
      outputDescription: '`{ events, count, nextCursor, exhaustive }`, or with `summary`, `{ summary }`.'
    },

  },


  fn: async function ({ kind, kinds, group, subject, squidNames, since, until, room, level, includeSpoilers, order, limit, cursor, summary }) {

    var config = sails.config.eventKinds;
    var where = {};
    var allowed = Object.keys(config.kinds);
    if (kind) { allowed = allowed.filter((k) => k === kind); }
    if (Array.isArray(kinds) && kinds.length) { allowed = allowed.filter((k) => kinds.includes(k)); }
    if (group) { allowed = allowed.filter((k) => config.kinds[k].group === group); }
    if (!includeSpoilers) { allowed = allowed.filter((k) => !config.spoilerKinds.includes(k)); }
    if (!allowed.length) {
      return summary ? { summary: { matched: 0, byKind: {}, byGroup: {}, byDay: [], squids: 0, topSquids: [], first: null, last: null, scanned: 0, exhaustive: true } } : { events: [], count: 0, nextCursor: null, exhaustive: true };
    }
    if (kind || (Array.isArray(kinds) && kinds.length) || group) {
      where.kind = allowed.length === 1 ? allowed[0] : { in: allowed };
    } else if (!includeSpoilers) {
      where.kind = { nin: config.spoilerKinds };
    }
    if (subject !== undefined) {
      if (!includeSpoilers && config.spoilerSubjects.includes(subject)) {
        return summary ? { summary: { matched: 0, byKind: {}, byGroup: {}, byDay: [], squids: 0, topSquids: [], first: null, last: null, scanned: 0, exhaustive: true } } : { events: [], count: 0, nextCursor: null, exhaustive: true };
      }
      where.subject = subject;
    } else if (!includeSpoilers) {
      where.subject = { nin: config.spoilerSubjects };
    }
    if (Array.isArray(squidNames) && squidNames.length) { where.squidName = squidNames.length === 1 ? squidNames[0] : { in: squidNames }; }
    if (since !== undefined || until !== undefined) {
      where.startsAt = {};
      if (since !== undefined) { where.startsAt['>='] = since; }
      if (until !== undefined) { where.startsAt['<='] = until; }
    }

    var postFilter = room || level ? (e) => {
      var r = roomOf(e);
      if (room && r !== room) { return false; }
      if (level && !(e.kind === 'level-reached' && e.subject === level) && levelOfRoom(r) !== level) { return false; }
      return true;
    } : null;

    // ── Summary: read through everything that matches (by id, a page at a time) and count. ──
    if (summary) {
      let out = { matched: 0, byKind: {}, byGroup: {}, byDay: {}, bySquid: {}, first: null, last: null, scanned: 0, exhaustive: true };
      let lastId = 0;
      for (;;) {
        let page = await WorldEvent.find({ where: Object.assign({}, where, { id: { '>': lastId } }), select: ['kind', 'squidName', 'subject', 'startsAt', 'details'] }).sort('id ASC').limit(2000);
        if (!page.length) { break; }
        lastId = page[page.length - 1].id;
        for (let e of page) {
          out.scanned++;
          if (postFilter && !postFilter(e)) { continue; }
          out.matched++;
          out.byKind[e.kind] = (out.byKind[e.kind] || 0) + 1;
          let g = (config.kinds[e.kind] || {}).group || 'other';
          out.byGroup[g] = (out.byGroup[g] || 0) + 1;
          let day = new Date(e.startsAt || 0).toISOString().slice(0, 10);
          out.byDay[day] = out.byDay[day] || { day, count: 0, byKind: {} };
          out.byDay[day].count++;
          out.byDay[day].byKind[e.kind] = (out.byDay[day].byKind[e.kind] || 0) + 1;
          if (e.squidName) { out.bySquid[e.squidName] = (out.bySquid[e.squidName] || 0) + 1; }
          if (!out.first || e.startsAt < out.first) { out.first = e.startsAt; }
          if (!out.last || e.startsAt > out.last) { out.last = e.startsAt; }
        }
        if (page.length < 2000) { break; }
        if (out.scanned >= SCAN_LIMIT * 5) { out.exhaustive = false; break; }
      }
      return { summary: {
        matched: out.matched,
        byKind: out.byKind,
        byGroup: out.byGroup,
        byDay: _.sortBy(_.values(out.byDay), 'day'),
        squids: Object.keys(out.bySquid).length,
        topSquids: _.sortBy(_.map(out.bySquid, (count, squidName) => ({ squidName, count })), (r) => -r.count).slice(0, 10),
        first: out.first,
        last: out.last,
        scanned: out.scanned,
        exhaustive: out.exhaustive,
      } };
    }

    // ── Events, sorted by start time, after the cursor. ──
    var direction = order === 'oldest' ? 'ASC' : 'DESC';
    var after = cursor ? decodeCursor(cursor) : null;
    var whereAfter = (from) => {
      if (!from) { return where; }
      var cmp = direction === 'ASC' ? '>' : '<';
      return Object.assign({}, where, { or: [{ startsAt: { [cmp]: from.startsAt } }, { startsAt: from.startsAt, id: { [cmp]: from.id } }] });
    };
    limit = Math.max(1, Math.floor(limit));
    var found = [];
    var exhaustive = true;
    var hasMore = false;
    var lastScanned = null;
    if (!postFilter) {
      found = await WorldEvent.find(whereAfter(after)).sort([{ startsAt: direction }, { id: direction }]).limit(limit + 1);
      hasMore = found.length > limit;
      found = found.slice(0, limit);
    } else {
      let from = after;
      let scanned = 0;
      for (;;) {
        let page = await WorldEvent.find(whereAfter(from)).sort([{ startsAt: direction }, { id: direction }]).limit(PAGE);
        for (let e of page) {
          scanned++;
          from = lastScanned = e;
          if (postFilter(e)) {
            if (found.length === limit) { hasMore = true; break; }
            found.push(e);
          }
        }
        if (hasMore || page.length < PAGE) { break; }
        if (scanned >= SCAN_LIMIT) { exhaustive = false; hasMore = true; break; }
      }
    }
    var count = postFilter ? (exhaustive && !cursor && !hasMore ? found.length : null) : await WorldEvent.count(where);
    var resumeFrom = exhaustive ? _.last(found) : lastScanned;
    var nextCursor = hasMore && resumeFrom ? encodeCursor(resumeFrom) : null;
    return { events: found, count, nextCursor, exhaustive };

  }


};
