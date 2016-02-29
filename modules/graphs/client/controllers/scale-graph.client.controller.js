(function () {
  'use strict';

  angular
    .module('graphs')
    .controller('ScaleGraphController', ScaleGraphController);

  ScaleGraphController.$inject = ['$scope', '$state'];


  var SCALE_FACTOR = 1.25;


  function ScaleGraphController($scope, $state) {
    var graph = $scope.vm.graph;

    var vm = this;
    vm.contract = contract;
    vm.expand = expand;


    function contract() {
      scale(1 / SCALE_FACTOR);
    }
    
    function expand() {
      scale(SCALE_FACTOR);
    }
    
    function scale(factor) {
      var vertices = getActionableVertices();
      var centroid = getCentroid(vertices);
      var incidentEdges = {};
      for (var i = 0; i < vertices.length; ++i) {
        var vertex = vertices[i];
        vertex.x = centroid.x + factor * (vertex.x - centroid.x);
        vertex.y = centroid.y + factor * (vertex.y - centroid.y);
      
        for (var id in vertex.edges) {
          incidentEdges[id] = vertex.edges[id];
        }
      }

      // Update the edges altered by previous vertex translations.
      for (var id in incidentEdges) {
        incidentEdges[id].update();
      }
    }

    function getActionableVertices() {
      var vertices = graph.getSelectedVertices();
      if (!vertices.length) {
        for (var id in graph.vertices) {
          vertices.push(graph.vertices[id]);
        }
      }
      return vertices;
    }

    function getCentroid(vertices) {
      return {
        x: vertices.reduce((sum, v) => v.x + sum, 0) / vertices.length,
        y: vertices.reduce((sum, v) => v.y + sum, 0) / vertices.length,
      };
    }
  }
})();
