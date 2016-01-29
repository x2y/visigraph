(function (app) {
  'use strict';

  app.registerModule('graphs');
  app.registerModule('graphs.services');
  app.registerModule('graphs.routes', ['ui.router', 'graphs.services']);
})(ApplicationConfiguration);
