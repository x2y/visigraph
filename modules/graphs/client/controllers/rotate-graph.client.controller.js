(function () {
  'use strict';

  angular
    .module('graphs')
    .controller('RotateGraphController', RotateGraphController);

  RotateGraphController.$inject = ['$scope', '$state'];


  function RotateGraphController($scope, $state) {
    var graph = $scope.vm.graph;

    var vm = this;
    vm.rotateLeft = rotateLeft;
    vm.rotateRight = rotateRight;
    vm.flipHorizontally = flipHorizontally;
    vm.flipVertically = flipVertically;


    function rotate(direction) {
      var vertices = getActionableVertices();
      var edges = graph.getSelectedEdges();
      var centroid = getCentroid(vertices);
      var edgesToUpdate = {};
      for (var i = 0; i < vertices.length; ++i) {
        var vertex = vertices[i];
        var oldX = vertex.x;
        vertex.x = centroid.x - direction * (vertex.y - centroid.y);
        vertex.y = centroid.y + direction * (oldX - centroid.x);

        for (var id in vertex.edges) {
          edgesToUpdate[id] = vertex.edges[id];
        }
      }

      for (var i = 0; i < edges.length; ++i) {
        var edge = edges[i];
        var oldX = edge.handle.x;
        edge.handle.x = centroid.x - direction * (edge.handle.y - centroid.y);
        edge.handle.y = centroid.y + direction * (oldX - centroid.x);

        edgesToUpdate[edge.id] = edge;
      }

      // Update the edges altered by previous vertex translations.
      for (var id in edgesToUpdate) {
        edgesToUpdate[id].update();
      }
    }

    function rotateLeft() {
      rotate(-1);
    }
    
    function rotateRight() {
      rotate(1);
    }
    
    function flip(axis) {
      var vertices = getActionableVertices();
      var edges = graph.getSelectedEdges();
      var centroid = getCentroid(vertices);
      var edgesToUpdate = {};
      for (var i = 0; i < vertices.length; ++i) {
        var vertex = vertices[i];
        vertex[axis] = 2 * centroid[axis] - vertex[axis];

        for (var id in vertex.edges) {
          edgesToUpdate[id] = vertex.edges[id];
        }
      }

      for (var i = 0; i < edges.length; ++i) {
        var edge = edges[i];
        edge.handle[axis] = 2 * centroid[axis] - edge.handle[axis];

        edgesToUpdate[edge.id] = edge;
      }

      // Update the edges altered by previous vertex translations.
      for (var id in edgesToUpdate) {
        edgesToUpdate[id].update();
      }
    }

    function flipHorizontally() {
      flip('x');
    }
    
    function flipVertically() {
      flip('y');
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
