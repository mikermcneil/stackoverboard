/**
 * mcp hook
 *
 * Turns this Sails app into an MCP server: a JSON-RPC endpoint that lets AI agents
 * (Claude, Cursor, ChatGPT, etc.) discover and call your actions.
 *
 *   POST /mcp        every action
 *   POST /mcp/safe   only read-only actions: GET routes, plus any action that
 *                    declares `sideEffects: 'cacheable'`
 *
 * Install: save this file as api/hooks/mcp/index.js.  That's it.
 *
 * ┌─ Which actions are exposed ─────────────────────────────────────────────────────
 * │  Every route in config/routes.js that points at an actions2 action, using the
 * │  same rules as the Cloud SDK (method names like `updatePassword`).  Skipped:
 * │  redirects, `view-*` actions, view/redirect responses, socket-only routes, and
 * │  file uploads.  The list is built when the app lifts, from each action's
 * │  friendlyName, descriptions, inputs, exits, and sideEffects.
 * │
 * ├─ Connect a client ──────────────────────────────────────────────────────────────
 * │  Claude Code:
 * │    claude mcp add --transport http my-app http://localhost:1337/mcp \
 * │      --header "Cookie: sails.sid=…"          (or "Authorization: Bearer …")
 * │
 * │  Anything else that speaks "Streamable HTTP": just point it at the same URL.
 * │
 * ├─ How calls run ─────────────────────────────────────────────────────────────────
 * │  Each call is a request (from inside the app) to the action's route, e.g.
 * │  PUT /api/v1/account/update-profile, carrying the caller's headers and session.
 * │  Policies run exactly as they would for the browser.  If an action needs a
 * │  logged-in user, the agent must send whatever your app normally authenticates with.
 * │  If CSRF protection is on, the hook gets a token from `security/grant-csrf-token`
 * │  first, just like a single-page app would: via your app's route for it if it has
 * │  one, otherwise via `GET /csrfToken` (as recommended in the Sails docs).
 * │
 * ├─ Security notes ────────────────────────────────────────────────────────────────
 * │  • The endpoint itself is exempt from CSRF and policies (it's just a menu).
 * │    Instead it requires a JSON body and rejects foreign `Origin` headers, which
 * │    is what stops a hostile web page from calling actions with your cookie.
 * │  • To gate the whole endpoint, set `sails.config.policies['mcp/*']`.
 * │  • To hide a route from agents, add `mcp: false` to its target in config/routes.js.
 * │  • A GET action that changes things (e.g. logging out) should say so with
 * │    `sideEffects: ''`, or it will be treated as read-only.
 * │
 * ├─ Config (sails.config.mcp) ─────────────────────────────────────────────────────
 * │  path            Base URL path.                    Default: '/mcp'
 * │  allowedOrigins  Extra browser origins to accept.  Default: []
 * └─────────────────────────────────────────────────────────────────────────────────
 */

module.exports = function defineMcpHook(sails) {

  const PROTOCOL_VERSIONS = ['2025-11-25', '2025-06-18', '2025-03-26'];
  const isSafe = (action) => action.sideEffects === 'cacheable';
  let csrfTokenUrl;
  let actionsByMethodName = {};

  // RTTC type (or exemplar) -> JSON Schema.  (Recursive, so it needs a name.)
  const typeToJsonSchema = (type) => {
    switch (type) {
      case 'string': return { type: 'string' };
      case 'number': return { type: 'number' };
      case 'boolean': return { type: 'boolean' };
      case 'json': case 'ref': case '*': case '===': case undefined: return {};
    }
    if (Array.isArray(type)) {
      return type.length ? { type: 'array', items: typeToJsonSchema(type[0]) } : { type: 'array' };
    }
    if (type && typeof type === 'object') {
      if (!Object.keys(type).length) { return { type: 'object' }; }
      // Faceted dictionary: every key is expected.
      return {
        type: 'object',
        properties: Object.fromEntries(Object.entries(type).map(([k, v]) => [k, typeToJsonSchema(v)])),
        required: Object.keys(type)
      };
    }
    return {};
  };

  // Send a request to one of this app's own routes, on behalf of the caller.
  const sendRequest = (req, method, url, { query = {}, body, headers = {} } = {}) => new Promise((resolve) => {
    sails.router.route(
      {
        method, url, query, body, session: req.session,
        headers: Object.assign(Object.fromEntries(Object.entries(req.headers).filter(([k]) => k !== 'content-length' && k !== 'origin')), { 'content-type': 'application/json', 'accept': 'application/json' }, headers),
      },
      { _clientCallback: resolve }
    );
  });

  return {

    defaults: {
      mcp: { path: '/mcp', allowedOrigins: [] }
    },

    configure() {
      const base = sails.config.mcp.path.replace(/\/$/, '');
      // Put our routes first, so no catch-all in config/routes.js can shadow them.
      sails.config.routes = Object.assign({
        [base]: { action: 'mcp/serve', csrf: false },
        [`${base}/safe`]: { action: 'mcp/serve', csrf: false, mcpSafeOnly: true },
      }, sails.config.routes);
      // Calls get CSRF tokens from the app's own `security/grant-csrf-token` route,
      // or from `GET /csrfToken` (the one the Sails docs recommend) if there isn't one.
      if (sails.config.security.csrf) {
        csrfTokenUrl = Object.keys(sails.config.routes).filter((address) => /^get\s/i.test(address) && (sails.config.routes[address] || {}).action === 'security/grant-csrf-token').map((address) => address.replace(/^get\s+/i, ''))[0];
        if (!csrfTokenUrl) {
          csrfTokenUrl = '/csrfToken';
          sails.config.routes[`GET ${csrfTokenUrl}`] = { action: 'security/grant-csrf-token' };
        }
      }
      // The endpoint is just a menu; each call still goes through your policies.
      // (Set these yourself in config/policies.js to lock things down.)
      sails.config.policies = Object.assign({ 'mcp/*': true, 'security/grant-csrf-token': true }, sails.config.policies);
    },

    initialize(done) {

      // Once routes are bound (and again whenever they're reloaded), read config/routes.js
      // and each action's definition to build the list of actions agents can call.
      sails.on('router:after', () => {
        const built = {};

        for (const address in sails.config.routes) {
          let target = sails.config.routes[address];

          // Same ground rules as the Cloud SDK:
          // only consider the last sub-target, skip redirects and anything that isn't an action.
          if (Array.isArray(target)) { target = target[target.length - 1]; }
          if (!target || typeof target === 'string' || !target.action) { continue; }

          // Explicit opt-out from config/routes.js, e.g. `{ action: 'nuke-everything', mcp: false }`
          if (target.mcp === false) { continue; }

          const bareActionName = target.action.split('/').pop();
          const methodName = bareActionName.replace(/[-_]+(.)?/g, (match, chr) => chr ? chr.toUpperCase() : '');

          // Skip actions that just serve pages.
          if (target.view || /^view-/.test(bareActionName)) { continue; }

          // Neither are routes that only make sense with a live WebSocket.
          if (target.isSocket || target.hasSocketFeatures) {
            sails.log.verbose('MCP: Skipping `'+target.action+'` (requires a socket).');
            continue;
          }

          const requestable = sails.getActions()[target.action];
          if (!requestable) {
            sails.log.warn('MCP: Skipping unrecognized action: `'+target.action+'`');
            continue;
          }

          // Classic (req,res) actions have no definition to read, so there's nothing
          // to tell an agent about them.  Actions2 or bust.
          const def = requestable.toJSON && requestable.toJSON();
          if (!def || !def.fn) {
            sails.log.verbose('MCP: Skipping `'+target.action+'` (not an actions2 action, so it has no metadata).');
            continue;
          }

          const successExit = (def.exits && def.exits.success) || {};
          if (successExit.responseType === 'view' || successExit.responseType === 'redirect') { continue; }
          if (def.files && def.files.length) {
            sails.log.verbose('MCP: Skipping `'+target.action+'` (file uploads aren\'t supported over MCP).');
            continue;
          }

          if (built[methodName]) {
            throw new Error(
              'Both `'+built[methodName].identity+'` and `'+target.action+'` would be exposed '+
              'as `'+methodName+'`.  Rename one, or add `mcp: false` to one of their route targets.'
            );
          }

          const expandedAddress = sails.getRouteFor(target);
          let verb = (expandedAddress.method || '').toUpperCase();
          if (!verb || verb === 'ALL') { verb = def.sideEffects === 'cacheable' ? 'GET' : 'POST'; }

          // GET routes are read-only, so unless the action says otherwise, treat it as `cacheable`.
          // (A GET action that does change things, like logging out, can say so with `sideEffects: ''`.)
          const sideEffects = def.sideEffects !== undefined ? def.sideEffects : (verb === 'GET' || verb === 'HEAD' ? 'cacheable' : '');

          // Inputs -> JSON Schema, keeping as much of the machine spec's metadata as possible.
          const properties = {};
          const required = [];
          for (const [inputCodeName, inputDef] of Object.entries(def.inputs || {})) {
            const schema = typeToJsonSchema(inputDef.type);

            // Validations.
            if (inputDef.isIn) { schema.enum = inputDef.isIn; }
            if (inputDef.isEmail) { schema.format = 'email'; }
            if (inputDef.isURL) { schema.format = 'uri'; }
            if (inputDef.isUUID) { schema.format = 'uuid'; }
            if (inputDef.regex) { schema.pattern = inputDef.regex.source; }
            if (inputDef.isNotEmptyString) { schema.minLength = 1; }
            if (inputDef.minLength !== undefined) { schema.minLength = inputDef.minLength; }
            if (inputDef.maxLength !== undefined) { schema.maxLength = inputDef.maxLength; }
            if (inputDef.min !== undefined) { schema.minimum = inputDef.min; }
            if (inputDef.max !== undefined) { schema.maximum = inputDef.max; }
            if (inputDef.isInteger) { schema.type = 'integer'; }
            if (inputDef.allowNull && schema.type) { schema.type = [schema.type, 'null']; }

            // Agent-facing metadata.
            if (inputDef.friendlyName) { schema.title = inputDef.friendlyName; }
            const whereToGet = inputDef.whereToGet || {};
            const description = [
              inputDef.description,
              inputDef.extendedDescription,
              (whereToGet.description || whereToGet.url) && 'Where to get it: '+(whereToGet.description || whereToGet.url),
              whereToGet.extendedDescription,
              whereToGet.description && whereToGet.url,
              inputDef.moreInfoUrl && 'More info: '+inputDef.moreInfoUrl,
              (inputDef.sensitive || inputDef.protect) && 'Sensitive: never echo or log this value.'
            ].filter(Boolean).join('\n\n');
            if (description) { schema.description = description; }
            if (inputDef.example !== undefined && inputDef.example !== '===' && typeof inputDef.example !== 'function') { schema.examples = [inputDef.example]; }
            if (inputDef.defaultsTo !== undefined) { schema.default = inputDef.defaultsTo; }

            properties[inputCodeName] = schema;
            if (inputDef.required) { required.push(inputCodeName); }
          }

          // Exits -> a menu of possible outcomes, which is what makes an agent good at recovering.
          // > (Skip the built-in `error` exit.  Also, `responseType` wins over the default
          // > `statusCode` the machine runner fills in, since it's what actually decides the status.)
          const exits = {};
          for (const [exitCodeName, exitDef] of Object.entries(def.exits || {})) {
            if (exitCodeName === 'error') { continue; }
            const exit = {};
            const description = [exitDef.description, exitDef.extendedDescription, exitDef.moreInfoUrl && 'More info: '+exitDef.moreInfoUrl].filter(Boolean).join('\n\n');
            if (description) { exit.description = description; }
            if (exitDef.responseType) { exit.responseType = exitDef.responseType; }
            else if (exitDef.statusCode) { exit.statusCode = exitDef.statusCode; }
            exits[exitCodeName] = exit;
          }
          const outcomes = Object.entries(exits).filter(([exitCodeName]) => exitCodeName !== 'success').map(([exitCodeName, exit]) => {
            const how = exit.responseType || exit.statusCode;
            return '• '+exitCodeName+(how ? ' ('+how+')' : '')+(exit.description ? ': '+exit.description.replace(/\s+/g, ' ') : '');
          });

          built[methodName] = {
            identity: target.action,
            verb: verb,
            url: expandedAddress.url,
            sideEffects: sideEffects,
            title: def.friendlyName || bareActionName,
            description: [
              def.description,
              def.extendedDescription,
              def.moreInfoUrl && 'More info: '+def.moreInfoUrl,
              successExit.outputDescription && ('Returns '+(successExit.outputFriendlyName ? successExit.outputFriendlyName.toLowerCase()+': ' : '')+successExit.outputDescription),
              outcomes.length && 'Possible outcomes besides success:\n'+outcomes.join('\n')
            ].filter(Boolean).join('\n\n'),
            inputSchema: Object.assign({ type: 'object', properties: properties }, required.length ? { required: required } : {}),
            exits: exits,
          };
        }//∞

        actionsByMethodName = built;
        sails.log.verbose('MCP: Exposing '+Object.keys(built).length+' action(s) ('+Object.values(built).filter(isSafe).length+' read-only) at '+sails.config.mcp.path);
      });

      this.registerActions(done);
    },

    registerActions(done) {
      sails.registerAction(async (req, res) => {

        if (req.method !== 'POST') {
          // No server-initiated stream (yet): per spec, say so with a 405.
          res.set('Allow', 'POST');
          return res.status(405).send();
        }

        // Since this route is exempt from CSRF, require evidence the caller isn't a web page
        // someone else controls: a JSON body (forces a CORS preflight) and a same/allowed Origin.
        const origin = req.get('origin');
        if (origin) {
          let host;
          try { host = new URL(origin).host; } catch (unusedErr) { /* treat as foreign */ }
          if (host !== req.get('host') && !sails.config.mcp.allowedOrigins.includes(origin)) {
            return res.status(403).json({ jsonrpc: '2.0', id: null, error: { code: -32600, message: 'Origin not allowed' } });
          }
        }
        if (!req.is('application/json')) {
          return res.status(415).json({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Expected Content-Type: application/json' } });
        }

        const safeOnly = !!req.options.mcpSafeOnly;
        const visible = Object.entries(actionsByMethodName).filter(([, action]) => !safeOnly || isSafe(action));
        const isBatch = Array.isArray(req.body);

        const replies = (await Promise.all((isBatch ? req.body : [req.body]).map(async (message) => {
          const { id, method, params = {} } = message || {};
          const reply = (result) => ({ jsonrpc: '2.0', id, result });
          const fail = (code, msg) => ({ jsonrpc: '2.0', id: id === undefined ? null : id, error: { code, message: msg } });

          if (!message || message.jsonrpc !== '2.0' || typeof method !== 'string') { return fail(-32600, 'Invalid request'); }
          if (id === undefined) { return undefined; }// Notifications (e.g. `notifications/initialized`) need no reply.

          switch (method) {

            case 'initialize': {
              let pkg = {};
              try { pkg = require(require('path').resolve(sails.config.appPath, 'package.json')); } catch (unusedErr) { /* fine */ }
              return reply({
                protocolVersion: PROTOCOL_VERSIONS.includes(params.protocolVersion) ? params.protocolVersion : PROTOCOL_VERSIONS[0],
                capabilities: { tools: { listChanged: false } },
                serverInfo: { name: pkg.name || 'sails-app', title: pkg.description || undefined, version: pkg.version || '0.0.0' },
                instructions:
                  `These are the actions in the HTTP API of ${pkg.name ? `"${pkg.name}"` : 'a Sails.js app'}${pkg.description ? ` (${pkg.description})` : ''}. `+
                  `Each action's description lists its possible outcomes; when a call fails, the error names which one happened. `+
                  (safeOnly ? 'This endpoint exposes read-only actions only.' : 'Actions marked read-only never change anything; prefer them for exploration.')
              });
            }

            case 'ping':
              return reply({});

            // (`tools/list`, `tools/call`, and the `tools` keys are the protocol's own wording.)
            case 'tools/list':
              return reply({
                tools: visible.map(([name, action]) => ({
                  name,
                  title: action.title,
                  description: action.description,
                  inputSchema: action.inputSchema,
                  annotations: {
                    title: action.title,
                    readOnlyHint: isSafe(action),
                    idempotentHint: action.sideEffects === 'cacheable' || action.sideEffects === 'idempotent',
                    ...(isSafe(action) ? { destructiveHint: false } : {}),
                  },
                }))
              });

            case 'tools/call': {
              const found = visible.find(([name]) => name === params.name);
              if (!found) { return fail(-32602, `Unknown action: ${params.name}`); }
              const action = found[1];

              try {
                // Fill in route params like `/api/v1/things/:id`; the rest go in the query or body.
                const args = Object.assign({}, params.arguments);
                const url = action.url.replace(/\/:([A-Za-z0-9_]+)(\?)?/g, (match, name) => {
                  if (args[name] === undefined) { return ''; }
                  const value = encodeURIComponent(args[name]);
                  delete args[name];
                  return '/' + value;
                });
                const isBodyless = ['GET', 'HEAD', 'DELETE'].includes(action.verb);

                // If CSRF protection is on, get a token the documented way: from `security/grant-csrf-token`.
                const headers = {};
                if (sails.config.security.csrf && !['GET', 'HEAD', 'OPTIONS'].includes(action.verb)) {
                  const granted = await sendRequest(req, 'GET', csrfTokenUrl);
                  headers['x-csrf-token'] = granted.body && granted.body._csrf;
                }

                const response = await sendRequest(req, action.verb, url, {
                  query: isBodyless ? args : {},
                  body: isBodyless ? undefined : args,
                  headers
                });

                let output = response.body;
                if (Buffer.isBuffer(output)) { output = output.toString(); }
                if (typeof output === 'string') { try { output = JSON.parse(output); } catch (unusedErr) { /* leave as text */ } }

                const status = response.statusCode || 200;
                const exitCodeName = response.headers && (response.headers['x-exit'] || response.headers['X-Exit']);
                const exit = exitCodeName && action.exits[exitCodeName];
                const location = response.headers && (response.headers.location || response.headers.Location);
                const outputText = output === undefined || output === '' ? '' : typeof output === 'string' ? output : JSON.stringify(output, null, 2);

                if (status >= 400) {
                  let text = exit
                  ? `Failed with exit \`${exitCodeName}\` (${status}): ${exit.description || 'no description'}`
                  : `Failed with status ${status}.`;
                  if (!exit && (status === 401 || status === 403)) { text += '\n(This may mean the MCP client isn\'t sending credentials this app recognizes.)'; }
                  if (outputText) { text += '\n\n' + outputText; }
                  return reply({ content: [{ type: 'text', text }], isError: true });
                }

                const result = { content: [{ type: 'text', text: outputText || (location ? `Done (redirected to ${location}).` : 'Done.') }] };
                if (output && typeof output === 'object' && !Array.isArray(output)) { result.structuredContent = output; }
                return reply(result);

              } catch (err) {
                sails.log.error('MCP: Unexpected error calling `' + params.name + '`:', err);
                return reply({ content: [{ type: 'text', text: 'Unexpected server error.' }], isError: true });
              }
            }

            default:
              return fail(-32601, `Method not found: ${method}`);
          }
        }))).filter((r) => r !== undefined);

        if (!replies.length) { return res.status(202).send(); }
        return res.json(isBatch ? replies : replies[0]);

      }, 'mcp/serve', true);
      return done();
    },

  };
};