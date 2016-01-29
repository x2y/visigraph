'use strict';

/**
 * Module dependencies
 */
var graphsPolicy = require('../policies/graphs.server.policy'),
  graphs = require('../controllers/graphs.server.controller');

module.exports = function (app) {
  // Graphs collection routes
  app.route('/api/graphs').all(graphsPolicy.isAllowed)
    .get(graphs.list)
    .post(graphs.create);

  // Single graph routes
  app.route('/api/graphs/:graphId').all(graphsPolicy.isAllowed)
    .get(graphs.read)
    .put(graphs.update)
    .delete(graphs.delete);

  // Finish by binding the graph middleware
  app.param('graphId', graphs.graphByID);
};
