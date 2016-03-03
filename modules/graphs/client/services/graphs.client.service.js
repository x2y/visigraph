(function () {
  'use strict';

  angular
    .module('graphs.services')
    .factory('GraphsService', GraphsService);

  GraphsService.$inject = ['$resource', '$http'];


  var EDGE_SNAP_MARGIN_RATIO = 0.02;
  var LOOP_DIAMETER = 50;


  function GraphsService($resource, $http) {
    var chainedTransformRequest =
        chainTransform(transformRequest, $http.defaults.transformRequest);
    var chainedTransformResponse =
        chainTransform($http.defaults.transformResponse, transformResponse);
    var chainedTransformResponseArray =
        chainTransform($http.defaults.transformResponse, transformResponseArray);

    var Resource = $resource('api/graphs/:graphId', {
      graphId: '@_id'
    }, {
      get: {
        method: 'GET',
        // No need to transform the request further, since only an id is needed.
        transformResponse: chainedTransformResponse
      },
      save: {
        method: 'POST',
        transformRequest: chainedTransformRequest,
        transformResponse: chainedTransformResponse
      },
      query: {
        method: 'GET',
        isArray: true,
        // No need to transform the request further, since only a query is needed.
        transformResponse: chainedTransformResponseArray
      },
      update: {
        method: 'PUT',
        transformRequest: chainedTransformRequest,
        transformResponse: chainedTransformResponse
      }
    });

    Resource.prototype.version = '20160201';
    Resource.prototype.allowLoops = false;
    Resource.prototype.allowDirectedEdges = false;
    Resource.prototype.allowMultiEdges = false;
    Resource.prototype.allowCycles = true;

    Resource.prototype.vertices = {};
    Resource.prototype.edges = {};
    Resource.prototype.captions = {};

    Resource.prototype.addVertex = addVertex;
    Resource.prototype.removeVertex = removeVertex;
    Resource.prototype.addEdge = addEdge;
    Resource.prototype.removeEdge = removeEdge;
    Resource.prototype.addCaption = addCaption;
    Resource.prototype.removeCaption = removeCaption;
    Resource.prototype.selectAll = selectAll;
    Resource.prototype.hasSelectedVertices = hasSelectedVertices;
    Resource.prototype.getSelectedVertices = getSelectedVertices;
    Resource.prototype.hasSelectedEdges = hasSelectedEdges;
    Resource.prototype.getSelectedEdges = getSelectedEdges;
    Resource.prototype.hasSelectedCaptions = hasSelectedCaptions;
    Resource.prototype.getSelectedCaptions = getSelectedCaptions;
    Resource.prototype.translateElements = translateElements;

    Resource.Vertex = Vertex;
    Resource.Edge = Edge;
    Resource.Caption = Caption;

    return Resource;


    function chainTransform(defaults, transform) {
      // We can't guarantee that the default transformation is an array
      defaults = angular.isArray(defaults) ? defaults : [defaults];
      return defaults.concat(transform);
    }

    function transformRequest(resourceData, header) {
      var vertices = {};
      for (var id in resourceData.vertices) {
        vertices[id] = resourceData.vertices[id].toSerializable();
      }
      delete resourceData.vertices;  // Prevent circular references.

      var edges = {};
      for (var id in resourceData.edges) {
        edges[id] = resourceData.edges[id].toSerializable();
      }
      delete resourceData.edges;  // Prevent circular references.

      var captions = {};
      for (var id in resourceData.captions) {
        captions[id] = resourceData.captions[id].toSerializable();
      }

      resourceData.data = angular.toJson({
        version: resourceData.version,
        allowLoops: resourceData.allowLoops,
        allowDirectedEdges: resourceData.allowDirectedEdges,
        allowMultiEdges: resourceData.allowMultiEdges,
        allowCycles: resourceData.allowCycles,
        vertices: vertices,
        edges: edges,
        captions: captions,
      });
      return resourceData;
    }

    function transformResponse(resourceData, header) {
      var data = angular.fromJson(resourceData.data);
      delete resourceData.data;

      resourceData.version = data.version;
      resourceData.allowLoops = data.allowLoops;
      resourceData.allowDirectedEdges = data.allowDirectedEdges;
      resourceData.allowMultiEdges = data.allowMultiEdges;
      resourceData.allowCycles = data.allowCycles;

      resourceData.vertices = {};
      for (var id in data.vertices) {
        addVertex.call(resourceData, data.vertices[id]);
      }

      resourceData.edges = {};
      for (var id in data.edges) {
        addEdge.call(resourceData, data.edges[id]);
      }

      resourceData.captions = {};
      for (var id in data.captions) {
        addCaption.call(resourceData, data.captions[id]);
      }

      return resourceData;
    }

    function transformResponseArray(resourceData, header) {
      var validResourceData = [];
      for (var resourceDatum of resourceData) {
        try {
          validResourceData.push(transformResponse(resourceDatum, header));
        } catch (e) {
          console.error('Unable to parse graph data:', resourceDatum, e);
        }
      }
      return validResourceData;
    }

    function addVertex(vertex) {
      /* jshint validthis: true */
      if (!(vertex instanceof Vertex)) {
        vertex = new Vertex(vertex);
      }
      if (vertex.id in this.vertices) {
        return;
      }

      this.vertices[vertex.id] = vertex;
      return vertex;
    }

    function removeVertex(vertex) {
      /* jshint validthis: true */
      if (!(vertex instanceof Vertex)) {
        vertex = this.vertices[vertex];
      }
      
      for (var id in vertex.edges) {
        this.removeEdge(id);
      }
      delete this.vertices[vertex.id];
      return vertex;
    }

    function addEdge(edge) {
      /* jshint validthis: true */
      if (!(edge instanceof Edge)) {
        if (!edge.from && edge.fromId !== null) {
          edge.from = this.vertices[edge.fromId];
        }
        if (!edge.to && edge.toId !== null) {
          edge.to = this.vertices[edge.toId];
        }
        edge = new Edge(edge);
      }
      if (edge.id in this.edges) {
        return;
      }

      edge.isDirected = this.allowDirectedEdges;
      this.edges[edge.id] = edge;
      edge.from.edges[edge.id] = edge;
      edge.to.edges[edge.id] = edge;
      return edge;
    }

    function removeEdge(edge) {
      /* jshint validthis: true */
      if (!(edge instanceof Edge)) {
        edge = this.edges[edge];
      }
      
      delete edge.from.edges[edge.id];
      delete edge.to.edges[edge.id];
      delete this.edges[edge.id];
      return edge;
    }

    function addCaption(caption) {
      /* jshint validthis: true */
      if (!(caption instanceof Caption)) {
        caption = new Caption(caption);
      }
      if (caption.id in this.captions) {
        return;
      }

      this.captions[caption.id] = caption;
      return caption;
    }

    function removeCaption(caption) {
      /* jshint validthis: true */
      if (!(caption instanceof Caption)) {
        caption = this.captions[caption];
      }
      
      delete this.captions[caption.id];
      return caption;
    }

    function selectAll(select) {
      /* jshint validthis: true */
      for (var id in this.vertices) {
        this.vertices[id].isSelected = select;
      }
      for (var id in this.edges) {
        this.edges[id].isSelected = select;
      }
      for (var id in this.captions) {
        this.captions[id].isSelected = select;
      }
    }

    function hasSelectedElements(map) {
      for (var id in map) {
        if (map[id].isSelected) {
          return true;
        }
      }
      return false;
    }

    function getSelectedElements(map) {
      var selected = [];
      for (var id in map) {
        if (map[id].isSelected) {
          selected.push(map[id]);
        }
      }
      return selected;
    }

    function hasSelectedVertices(map) {
      /* jshint validthis: true */
      return hasSelectedElements(this.vertices);
    }

    function getSelectedVertices(map) {
      /* jshint validthis: true */
      return getSelectedElements(this.vertices);
    }

    function hasSelectedEdges(map) {
      /* jshint validthis: true */
      return hasSelectedElements(this.edges);
    }

    function getSelectedEdges(map) {
      /* jshint validthis: true */
      return getSelectedElements(this.edges);
    }

    function hasSelectedCaptions(map) {
      /* jshint validthis: true */
      return hasSelectedElements(this.captions);
    }

    function getSelectedCaptions(map) {
      /* jshint validthis: true */
      return getSelectedElements(this.captions);
    }

    function translateElements(x, y, opt_vertices, opt_edges, opt_captions, opt_suspendRelease) {
      /* jshint validthis: true */
      if (opt_vertices == null && opt_edges == null && opt_captions == null) {
        opt_vertices = this.getSelectedVertices();
        opt_edges = this.getSelectedEdges();
        opt_captions = this.getSelectedCaptions();
      }

      // Translate the specified vertices.
      var edgesToUpdate = {};
      for (var vertex of opt_vertices) {
        vertex.x += x;
        vertex.y += y;
        for (var id in vertex.edges) {
          edgesToUpdate[id] = vertex.edges[id];
        }
      }

      // Translate the specified edges.
      for (var edge of opt_edges) {
        edge.handle.x += x;
        edge.handle.y += y;
        edgesToUpdate[edge.id] = edge;
      }

      // Fix the edges altered by previous vertex translations.
      for (var id in edgesToUpdate) {
        edgesToUpdate[id].update(opt_suspendRelease);
      }

      // Translate the specified captions.
      for (var caption of opt_captions) {
        caption.x += x;
        caption.y += y;
      }
    }
  }


  function Vertex(opt_data) {
    opt_data = opt_data || {};
    this.id = opt_data.id || generateRandomId();
    this.x = opt_data.x || 0;
    this.y = opt_data.y || 0;
    this.edges = opt_data.edges || {};
    this.label = opt_data.label || '';
    this.radius = opt_data.radius || 5;
    this.color = opt_data.color || '#ddd';
    this.isSelected = opt_data.isSelected || false;
    this.weight = opt_data.weight || 1;
  }

  Vertex.prototype.getAngleFrom = function (point) {
    return getAngle(point, this);
  };

  Vertex.prototype.toSerializable = function () {
    return {
      id:         this.id,
      x:          this.x,
      y:          this.y,
      label:      this.label,
      radius:     this.radius,
      color:      this.color,
      isSelected: this.isSelected,
      weight:     this.weight,
    };
  };


  function Edge(opt_data) {
    opt_data = opt_data || {};
    this.id = opt_data.id || generateRandomId();
    this.isDirected = opt_data.isDirected || false;
    this.from = opt_data.from || null;
    this.to = opt_data.to || null;
    this.isLinear = opt_data.isLinear || !(this.from && this.from === this.to);
    this.handle = opt_data.handle || { x: NaN, y: NaN };
    this.label = opt_data.label || '';
    this.radius = opt_data.radius || 10;
    this.color = opt_data.color || '#444';
    this.isSelected = opt_data.isSelected || false;
    this.weight = opt_data.weight || 1;
    this.thickness = opt_data.thickness || 1.5;

    // Initialize to NaN so that we're sure they'll be updated.
    this._radius = NaN;
    this._isLargeArc = false;
    this._isPositiveArc = false;
    this._lastFrom = { x: NaN, y: NaN };
    this._lastTo = { x: NaN, y: NaN };
    this._lastHandle = { x: NaN, y: NaN };

    if (Number.isNaN(this.handle.x) || Number.isNaN(this.handle.y)) {
      this.reset();
    } else {
      this.update();
    }
  }

  Edge.prototype.reset = function () {
    if (this.from === this.to) {
      this.handle.x = this.from.x + LOOP_DIAMETER;
      this.handle.y = this.from.y;
    } else {
      this.handle = getMidpoint(this.from, this.to);
    }

    this._recalculate();
  };

  Edge.prototype.update = function (opt_suspendRelease) {
    var hasVertexTranslated = (this.from.x !== this._lastFrom.x) ||
                              (this.from.y !== this._lastFrom.y) ||
                              (this.to.x !== this._lastTo.x) ||
                              (this.to.y !== this._lastTo.y);
    var hasHandleTranslated = (this.handle.x !== this._lastHandle.x) ||
                              (this.handle.y !== this._lastHandle.y);
    if (!hasVertexTranslated && !hasHandleTranslated) {
      return;
    }

    if (hasVertexTranslated && !hasHandleTranslated) {
      if (this.from === this.to) {
        this.handle.x += this.from.x - this._lastFrom.x;
        this.handle.y += this.from.y - this._lastFrom.y;
      } else {
        var oldLength = getDistance(this._lastFrom, this._lastTo);
        var oldLineAngle = getAngle(this._lastFrom, this._lastTo);
        var oldMidpoint = getMidpoint(this._lastFrom, this._lastTo);
        var oldHandleRadiusRatio = getDistance(oldMidpoint, this.handle) / oldLength || 0;
        var oldHandleAngle = getAngle(oldMidpoint, this.handle) - oldLineAngle;

        var newLength = getDistance(this.from, this.to);
        var newLineAngle = getAngle(this.from, this.to);
        var newMidpoint = getMidpoint(this.from, this.to);
        var newHandleRadius = oldHandleRadiusRatio * newLength;
        var newHandleAngle = oldHandleAngle + newLineAngle;

        this.handle.x = newMidpoint.x + newHandleRadius * Math.cos(newHandleAngle);
        this.handle.y = newMidpoint.y + newHandleRadius * Math.sin(newHandleAngle);
      }
    }

    this._recalculate();
    if (!opt_suspendRelease) {
      this.release();
    }
  };

  Edge.prototype.release = function () {
    if (!this.isLinear) {
      return;
    }
    
    this.handle = getMidpoint(this.from, this.to);
    this._lastHandle.x = this.handle.x;
    this._lastHandle.y = this.handle.y;
  };

  Edge.prototype._recalculate = function () {
    if (this.from === this.to) {
      this.isLinear = false;
    } else {
      var length = getDistance(this.from, this.to);
      var handleDistance = getDistanceToLine(this.handle, this.from, this.to);
      var snapMargin = EDGE_SNAP_MARGIN_RATIO * length;
      this.isLinear = handleDistance <= snapMargin;
    }

    if (!this.isLinear) {
      this._recalculateArc();
    }

    this._updateLastPoints();
  };

  Edge.prototype._recalculateArc = function () {
    if (this.from === this.to) {
      this._radius = getDistance(this.from, this.handle) / 2;
      this._isPositiveArc = true;
      this._isLargeArc = true;
      return;
    }
    
    // Calculate the center of the arc.
    var x0 = this.from.x, y0 = this.from.y;
    var x1 = this.handle.x, y1 = this.handle.y;
    var x2 = this.to.x, y2 = this.to.y;
    var center = { x: 0, y: 0 };
    var divisor = 2.0 * getDeterminant([[x0, y0, 1],
                                        [x1, y1, 1],
                                        [x2, y2, 1]]);
    center.x = getDeterminant([[x0 * x0 + y0 * y0, y0, 1],
                               [x1 * x1 + y1 * y1, y1, 1],
                               [x2 * x2 + y2 * y2, y2, 1]]) / divisor;
    center.y = getDeterminant([[x0, x0 * x0 + y0 * y0, 1],
                               [x1, x1 * x1 + y1 * y1, 1],
                               [x2, x2 * x2 + y2 * y2, 1]]) / divisor;
    this._radius = getDistance(this.handle, center);
    
    // Calculate the other properties of the arc from the center.
    var fromAngle = getAngle(center, this.from);
    var handleAngle = getAngle(center, this.handle) - fromAngle ;
    var toAngle = getAngle(center, this.to) - fromAngle;

    while (handleAngle < 0) handleAngle += 2 * Math.PI;
    while (handleAngle > 2 * Math.PI) handleAngle -= 2 * Math.PI;
    while (toAngle < 0) toAngle += 2 * Math.PI;
    while (toAngle > 2 * Math.PI) toAngle -= 2 * Math.PI;

    this._isPositiveArc = handleAngle < toAngle;
    this._isLargeArc = this._isPositiveArc ^ (toAngle < Math.PI);
  };

  Edge.prototype._updateLastPoints = function () {
    this._lastFrom.x = this.from.x;
    this._lastFrom.y = this.from.y;
    this._lastTo.x = this.to.x;
    this._lastTo.y = this.to.y;
    this._lastHandle.x = this.handle.x;
    this._lastHandle.y = this.handle.y;
  };

  Edge.prototype.toSerializable = function () {
    return {
      id:         this.id,
      isDirected: this.isDirected,
      fromId:     this.from.id,
      toId:       this.to.id,
      isLinear:   this.isLinear,
      handle:     this.handle,
      label:      this.label,
      radius:     this.radius,
      color:      this.color,
      isSelected: this.isSelected,
      weight:     this.weight,
      thickness:  this.thickness,
    };
  };


  function Caption(opt_data) {
    opt_data = opt_data || {};
    this.id = opt_data.id || generateRandomId();
    this.x = opt_data.x || 0;
    this.y = opt_data.y || 0;
    this.label = opt_data.label || '';
    this.fontSize = opt_data.fontSize || 14;
    this.color = opt_data.color || '#444';
    this.isSelected = opt_data.isSelected || false;
  }

  Caption.prototype.toSerializable = function () {
    return {
      id:         this.id,
      x:          this.x,
      y:          this.y,
      label:      this.label,
      fontSize:   this.fontSize,
      color:      this.color,
      isSelected: this.isSelected,
    };
  };


  function generateRandomId() {
    var id = '';
    var chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_-';
    for (var i = 0; i < 11; ++i) {
      id += chars[Math.floor(Math.random() * 64)];
    }
    return id;
  }

  function getDeterminant(matrix) {
    if (matrix.length == 1) {
      return matrix[0][0];
    }
    
    if (matrix.length == 2) {
      return matrix[0][0] * matrix[1][1] - matrix[0][1] * matrix[1][0];
    }

    var result = 0;
    for (var i = 0; i < matrix[0].length; ++i) {
      var tmp = [[0, 0], [0, 0]];
      for (var j = 1; j < matrix.length; ++j) {
        for (var k = 0; k < matrix[0].length; ++k) {
          if (k < i) {
            tmp[j - 1][k] = matrix[j][k];
          } else if (k > i) {
            tmp[j - 1][k - 1] = matrix[j][k];
          }
        }
      }
      
      result += matrix[0][i] * ((i & 1) == 0 ? 1 : -1) * getDeterminant(tmp);
    }
    
    return result;
  }

  function getDistance(from, to) {
    return Math.sqrt(getDistanceSq(from, to));
  }

  function getDistanceSq(from, to) {
    return Math.pow(to.x - from.x, 2) + Math.pow(to.y - from.y, 2);
  }

  function getDistanceToLine(point, from, to) {
    // This technique has been adapted from http://goo.gl/WsnSI.
    var dx = (to.x - from.x);
    var dy = (to.y - from.y);

    var distance = Math.abs(dy * point.x - dx * point.y - from.x * to.y + to.x * from.y) /
                   Math.sqrt(dx * dx + dy * dy);
    return Number.isFinite(distance) ? distance : getDistance(point, to);
  }

  function getMidpoint(from, to) {
    return { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 };
  }

  function getAngle(from, to) {
    return Math.atan2(to.y - from.y, to.x - from.x);
  }
})();
