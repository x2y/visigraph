'use strict';

/**
 * Module dependencies
 */
var path = require('path'),
  mongoose = require('mongoose'),
  Graph = mongoose.model('Graph'),
  errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller'));

/**
 * Create a graph
 */
exports.create = function (req, res) {
  var graph = new Graph(req.body);
  graph.user = req.user;

  graph.save(function (err) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.json(graph);
    }
  });
};

/**
 * Show the current graph
 */
exports.read = function (req, res) {
  // convert mongoose document to JSON
  var graph = req.graph ? req.graph.toJSON() : {};

  // Add a custom field to the Graph, for determining if the current User is the "owner".
  // NOTE: This field is NOT persisted to the database, since it doesn't exist in the Graph model.
  graph.isCurrentUserOwner = req.user && graph.user && graph.user._id.toString() === req.user._id.toString() ? true : false;

  res.json(graph);
};

/**
 * Update a graph
 */
exports.update = function (req, res) {
  var graph = req.graph;

  graph.name = req.body.name;
  graph.data = req.body.data;

  graph.save(function (err) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.json(graph);
    }
  });
};

/**
 * Delete a graph
 */
exports.delete = function (req, res) {
  var graph = req.graph;

  graph.remove(function (err) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.json(graph);
    }
  });
};

/**
 * List of Graphs
 */
exports.list = function (req, res) {
  Graph.find().sort('-created').populate('user', 'displayName').exec(function (err, graphs) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.json(graphs);
    }
  });
};

/**
 * Graph middleware
 */
exports.graphByID = function (req, res, next, id) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).send({
      message: 'Graph is invalid'
    });
  }

  Graph.findById(id).populate('user', 'displayName').exec(function (err, graph) {
    if (err) {
      return next(err);
    } else if (!graph) {
      return res.status(404).send({
        message: 'No graph with that identifier has been found'
      });
    }
    req.graph = graph;
    next();
  });
};
