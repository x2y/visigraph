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

    Resource.prototype.vertices = [];
    Resource.prototype.edges = [];
    Resource.prototype.incidences = new Map();
    Resource.prototype.captions = [];

    Resource.Vertex = Vertex;
    Resource.Edge = Edge;

    return Resource;


    function chainTransform(defaults, transform) {
      // We can't guarantee that the default transformation is an array
      defaults = angular.isArray(defaults) ? defaults : [defaults];
      return defaults.concat(transform);
    }

    function transformRequest(resourceData, header) {
      resourceData.data = angular.toJson({
        version: resourceData.version,
        allowLoops: resourceData.allowLoops,
        allowDirectedEdges: resourceData.allowDirectedEdges,
        allowMultiEdges: resourceData.allowMultiEdges,
        allowCycles: resourceData.allowCycles,
        vertices: resourceData.vertices.map(function(v) {
          return v.toSerializable();
        }),
        edges: resourceData.edges.map(function(e) {
          return e.toSerializable();
        }),
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

      var vertexIds = {};
      resourceData.vertices = [];
      resourceData.incidences = new Map();
      for (var vertexData in data.vertices) {
        var vertex = new Vertex(vertexData);
        vertexIds[vertex.id] = vertex;
        resourceData.vertices.push(vertex);
        resourceData.incidences[vertex] = [];
      }

      resourceData.edges = [];
      for (var edgeData in data.edges) {
        edgeData.from = vertexIds[edgeData.fromId];
        edgeData.to = vertexIds[edgeData.toId];
        var edge = new Edge(edgeData);
        resourceData.edges.push(edge);
        resourceData.incidences[edge.from].push(edge);
        if (edge.from !== edge.to) {
          resourceData.incidences[edge.to].push(edge);
        }
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
  }


  function Vertex(opt_data) {
    opt_data = opt_data || {};
    this.id = opt_data.id || generateRandomId();
    this.x = opt_data.x || 0;
    this.y = opt_data.y || 0;
    this.label = opt_data.label || '';
    this.radius = opt_data.radius || 8;
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
    this.handleX = opt_data.handleX || 0;
    this.handleY = opt_data.handleY || 0;
    this.label = opt_data.label || '';
    this.radius = opt_data.radius || 10;
    this.color = opt_data.color || '#ddd';
    this.isSelected = opt_data.isSelected || false;
    this.weight = opt_data.weight || 1;
    this.thickness = opt_data.thickness || 1;
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
