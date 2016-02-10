(function () {
  'use strict';

  angular
    .module('graphs.services')
    .factory('GraphsService', GraphsService);

  GraphsService.$inject = ['$resource', '$http'];

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
    Resource.prototype.selectAll = selectAll;
    Resource.prototype.deselectAll = deselectAll;
    Resource.prototype.hasSelectedVertices = hasSelectedVertices;
    Resource.prototype.getSelectedVertices = getSelectedVertices;
    Resource.prototype.hasSelectedEdges = hasSelectedEdges;
    Resource.prototype.getSelectedEdges = getSelectedEdges;

    Resource.Vertex = Vertex;
    Resource.Edge = Edge;

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
      for (id in resourceData.edges) {
        edges[id] = resourceData.edges[id].toSerializable();
      }
      delete resourceData.edges;  // Prevent circular references.

      resourceData.data = angular.toJson({
        version: resourceData.version,
        allowLoops: resourceData.allowLoops,
        allowDirectedEdges: resourceData.allowDirectedEdges,
        allowMultiEdges: resourceData.allowMultiEdges,
        allowCycles: resourceData.allowCycles,
        vertices: vertices,
        edges: edges,
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
      for (var vertexId in data.vertices) {
        addVertex.call(resourceData, data.vertices[vertexId]);
      }

      resourceData.edges = {};
      for (var edgeId in data.edges) {
        addEdge.call(resourceData, data.edges[edgeId]);
      }

      return resourceData;
    }

    function transformResponseArray(resourceData, header) {
      var validResourceData = [];
      for (var i = 0; i < resourceData.length; ++i) {
        try {
          validResourceData.push(transformResponse(resourceData[i], header));
        } catch (e) {
          console.error('Unable to parse graph data:', resourceData[i], e);
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
      
      for (var edgeId in vertex.edges) {
        this.removeEdge(edgeId);
      }
      delete this.vertices[vertex.id];
      return vertex;
    }

    function addEdge(edge) {
      /* jshint validthis: true */
      if (!(edge instanceof Edge)) {
        if (!edge.from && edge.fromId != null) {
          edge.from = this.vertices[edge.fromId];
        }
        if (!edge.to && edge.toId != null) {
          edge.to = this.vertices[edge.toId];
        }
        edge = new Edge(edge);
      }
      if (edge.id in this.edges) {
        return;
      }

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

    function selectAll() {
      /* jshint validthis: true */
      for (var vertexId in this.vertices) {
        this.vertices[vertexId].isSelected = true;
      }
      for (var edgeId in this.edges) {
        this.edges[edgeId].isSelected = true;
      }
    }

    function deselectAll() {
      /* jshint validthis: true */
      for (var vertexId in this.vertices) {
        this.vertices[vertexId].isSelected = false;
      }
      for (var edgeId in this.edges) {
        this.edges[edgeId].isSelected = false;
      }
    }

    function hasSelectedVertices() {
      /* jshint validthis: true */
      for (var id in this.vertices) {
        if (this.vertices[id].isSelected) {
          return true;
        }
      }
      return false;
    }

    function getSelectedVertices() {
      /* jshint validthis: true */
      var selected = [];
      for (var id in this.vertices) {
        if (this.vertices[id].isSelected) {
          selected.push(this.vertices[id]);
        }
      }
      return selected;
    }

    function hasSelectedEdges() {
      /* jshint validthis: true */
      for (var id in this.edges) {
        if (this.edges[id].isSelected) {
          return true;
        }
      }
      return false;
    }

    function getSelectedEdges() {
      /* jshint validthis: true */
      var selected = [];
      for (var id in this.edges) {
        if (this.edges[id].isSelected) {
          selected.push(this.edges[id]);
        }
      }
      return selected;
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
    this.isLinear = opt_data.isLinear || true;
    this.handleX = opt_data.handleX || (this.from.x + this.to.x) / 2;
    this.handleY = opt_data.handleY || (this.from.y + this.to.y) / 2;
    this.label = opt_data.label || '';
    this.radius = opt_data.radius || 10;
    this.color = opt_data.color || '#444';
    this.isSelected = opt_data.isSelected || false;
    this.weight = opt_data.weight || 1;
    this.thickness = opt_data.thickness || 1.5;
  }

  Edge.prototype.toSerializable = function () {
    return {
      id:         this.id,
      isDirected: this.isDirected,
      fromId:     this.from.id,
      toId:       this.to.id,
      isLinear:   this.isLinear,
      handleX:    this.handleX,
      handleY:    this.handleY,
      label:      this.label,
      radius:     this.radius,
      color:      this.color,
      isSelected: this.isSelected,
      weight:     this.weight,
      thickness:  this.thickness,
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
})();
