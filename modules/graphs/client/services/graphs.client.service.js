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
      
      for (var id in vertex.edges) {
        this.removeEdge(id);
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

    function translateElements(x, y, opt_vertices, opt_edges, opt_captions) {
      /* jshint validthis: true */
      if (opt_vertices == null && opt_edges == null && opt_captions == null) {
        opt_vertices = this.getSelectedVertices();
        opt_edges = this.getSelectedEdges();
        opt_captions = this.getSelectedCaptions();
      }

      // Translate the specified vertices.
      var incidentUntranslatedEdges = {};
      for (var i = 0; i < opt_vertices.length; ++i) {
        var vertex = opt_vertices[i];
        vertex.x += x;
        vertex.y += y;
        for (var id in vertex.edges) {
          incidentUntranslatedEdges[id] = vertex.edges[id];
        }
      }

      // Translate the specified edges.
      for (var i = 0; i < opt_edges.length; ++i) {
        var edge = opt_edges[i];
        edge.handleX += x;
        edge.handleY += y;
        delete incidentUntranslatedEdges[edge.id];
      }

      // Fix the edges altered by previous vertex translations, but not themselves translated.
      for (var id in incidentUntranslatedEdges) {
        incidentUntranslatedEdges[id].fix();
      }

      // Translate the specified captions.
      for (var i = 0; i < opt_captions.length; ++i) {
        var caption = opt_captions[i];
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

  Vertex.prototype.angleFrom = function (x, y) {
    return Math.atan2(this.y - y, this.x - x);
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
    this.isLinear = opt_data.isLinear || true;
    this.handleX = opt_data.handleX || 0;
    this.handleY = opt_data.handleY || 0;
    this.label = opt_data.label || '';
    this.radius = opt_data.radius || 10;
    this.color = opt_data.color || '#444';
    this.isSelected = opt_data.isSelected || false;
    this.weight = opt_data.weight || 1;
    this.thickness = opt_data.thickness || 1.5;
    this.fix();
  }

  Edge.prototype.fix = function () {
    this.handleX = (this.from.x + this.to.x) / 2;
    this.handleY = (this.from.y + this.to.y) / 2;
  };

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
})();
