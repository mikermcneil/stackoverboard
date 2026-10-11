/**
 * Route Mappings
 * (sails.config.routes)
 *
 * Your routes tell Sails what to do each time it receives a request.
 *
 * For more information on configuring custom routes, check out:
 * https://sailsjs.com/anatomy/config/routes-js
 */

module.exports.routes = {

  //  ╦ ╦╔═╗╔╗ ╔═╗╔═╗╔═╗╔═╗╔═╗
  //  ║║║║╣ ╠╩╗╠═╝╠═╣║ ╦║╣ ╚═╗
  //  ╚╩╝╚═╝╚═╝╩  ╩ ╩╚═╝╚═╝╚═╝
  'GET /':                   { action: 'view-homepage-or-redirect' },
  'GET /welcome/:unused?':   { action: 'dashboard/view-welcome' },

  'GET /faq':                { action:   'view-faq' },
  'GET /legal/terms':        { action:   'legal/view-terms' },
  'GET /legal/privacy':      { action:   'legal/view-privacy' },
  'GET /contact':            { action:   'view-contact' },

  'GET /signup':             { action: 'entrance/view-signup' },
  'GET /email/confirm':      { action: 'entrance/confirm-email' },
  'GET /email/confirmed':    { action: 'entrance/view-confirmed-email' },

  'GET /login':              { action: 'entrance/view-login' },
  'GET /password/forgot':    { action: 'entrance/view-forgot-password' },
  'GET /password/new':       { action: 'entrance/view-new-password' },

  'GET /account':            { action: 'account/view-account-overview' },
  'GET /account/password':   { action: 'account/view-edit-password' },
  'GET /account/profile':    { action: 'account/view-edit-profile' },


  //  ╔╦╗╦╔═╗╔═╗  ╦═╗╔═╗╔╦╗╦╦═╗╔═╗╔═╗╔╦╗╔═╗   ┬   ╔╦╗╔═╗╦ ╦╔╗╔╦  ╔═╗╔═╗╔╦╗╔═╗
  //  ║║║║╚═╗║    ╠╦╝║╣  ║║║╠╦╝║╣ ║   ║ ╚═╗  ┌┼─   ║║║ ║║║║║║║║  ║ ║╠═╣ ║║╚═╗
  //  ╩ ╩╩╚═╝╚═╝  ╩╚═╚═╝═╩╝╩╩╚═╚═╝╚═╝ ╩ ╚═╝  └┘   ═╩╝╚═╝╚╩╝╝╚╝╩═╝╚═╝╩ ╩═╩╝╚═╝
  '/terms':                   '/legal/terms',
  '/logout':                  '/api/v1/account/logout',


  //  ╦ ╦╔═╗╔╗ ╦ ╦╔═╗╔═╗╦╔═╔═╗
  //  ║║║║╣ ╠╩╗╠═╣║ ║║ ║╠╩╗╚═╗
  //  ╚╩╝╚═╝╚═╝╩ ╩╚═╝╚═╝╩ ╩╚═╝
  // …


  //  ╔═╗╔═╗╦  ╔═╗╔╗╔╔╦╗╔═╗╔═╗╦╔╗╔╔╦╗╔═╗
  //  ╠═╣╠═╝║  ║╣ ║║║ ║║╠═╝║ ║║║║║ ║ ╚═╗
  //  ╩ ╩╩  ╩  ╚═╝╝╚╝═╩╝╩  ╚═╝╩╝╚╝ ╩ ╚═╝
  // Note that, in this app, these API endpoints may be accessed using the `Cloud.*()` methods
  // from the Parasails library, or by using those method names as the `action` in <ajax-form>.
  '/api/v1/account/logout':                           { action: 'account/logout' },
  'PUT   /api/v1/account/update-password':            { action: 'account/update-password' },
  'PUT   /api/v1/account/update-profile':             { action: 'account/update-profile' },
  'PUT   /api/v1/account/update-billing-card':        { action: 'account/update-billing-card' },
  'PUT   /api/v1/entrance/login':                        { action: 'entrance/login' },
  'POST  /api/v1/entrance/signup':                       { action: 'entrance/signup' },
  'POST  /api/v1/entrance/send-password-recovery-email': { action: 'entrance/send-password-recovery-email' },
  'POST  /api/v1/entrance/update-password-and-login':    { action: 'entrance/update-password-and-login' },
  'POST  /api/v1/deliver-contact-form-message':          { action: 'deliver-contact-form-message' },
  'POST  /api/v1/observe-my-session':                 { action: 'observe-my-session', hasSocketFeatures: true },


  //  ╔═╗╔═╗╔╦╗╔═╗
  //  ║ ╦╠═╣║║║║╣
  //  ╚═╝╩ ╩╩ ╩╚═╝
  // The player's own game (identified by a secret token in the session; no login needed).
  'GET   /api/v1/game/load-game':                     { action: 'game/load-game' },
  'POST  /api/v1/game/start-game':                    { action: 'game/start-game' },
  'PUT   /api/v1/game/save-game':                     { action: 'game/save-game' },
  'POST  /api/v1/game/discover-tile':                 { action: 'game/discover-tile' },
  'POST  /api/v1/game/encounter-species':             { action: 'game/encounter-species' },
  'POST  /api/v1/game/claim-gem':                     { action: 'game/claim-gem' },
  'POST  /api/v1/game/wake-vent':                     { action: 'game/wake-vent' },
  'POST  /api/v1/game/record-ending':                 { action: 'game/record-ending' },
  'PUT   /api/v1/game/update-presence':               { action: 'game/update-presence' },
  'PUT   /api/v1/game/rename-squid':                  { action: 'game/rename-squid' },
  'POST  /api/v1/game/say':                           { action: 'game/say' },
  'GET   /api/v1/game/get-local-conditions':          { action: 'game/get-local-conditions' },


  //  ╦ ╦╔═╗╦═╗╦  ╔╦╗
  //  ║║║║ ║╠╦╝║   ║║
  //  ╚╩╝╚═╝╩╚═╩═╝═╩╝
  // The shared world (read-only, public).
  'GET   /api/v1/world/get-overview':                 { action: 'world/get-overview' },
  'GET   /api/v1/world/get-history':                  { action: 'world/get-history' },
  'GET   /api/v1/world/get-state':                    { action: 'world/get-state' },
  'GET   /api/v1/world/get-map':                      { action: 'world/get-map' },
  'GET   /api/v1/world/get-species':                  { action: 'world/get-species' },
  'GET   /api/v1/world/get-squids':                   { action: 'world/get-squids' },
  'GET   /api/v1/world/get-online':                   { action: 'world/get-online' },
  'GET   /api/v1/world/get-skin-words':               { action: 'world/get-skin-words' },
  'GET   /api/v1/world/get-lore':                     { action: 'world/get-lore' },
  'GET   /api/v1/world/get-world-facts':              { action: 'world/get-world-facts' },
  'GET   /api/v1/world/get-chat':                     { action: 'world/get-chat' },
  'GET   /api/v1/world/get-world-age':                { action: 'world/get-world-age' },
  'GET   /api/v1/world/get-west-path':                { action: 'world/get-west-path' },

};
