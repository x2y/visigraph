(function () {
  'use strict';

  angular
    .module('graphs')
    .controller('AlignGraphController', AlignGraphController);

  AlignGraphController.$inject = ['$scope', '$state'];


  function AlignGraphController($scope, $state) {
    var graph = $scope.vm.graph;

    var vm = this;
    vm.alignHorizontally = alignHorizontally;
    vm.alignVertically = alignVertically;
    vm.distributeHorizontally = distributeHorizontally;
    vm.distributeVertically = distributeVertically;


    function align(axis) {
      var vertices = getActionableVertices();
      var median = getMedian(vertices);
      var incidentEdges = {};
      for (var i = 0; i < vertices.length; ++i) {
        var vertex = vertices[i];
        vertex[axis] = median[axis];
        for (var id in vertex.edges) {
          incidentEdges[id] = vertex.edges[id];
        }
      }

      // Update the edges altered by previous vertex translations.
      for (var id in incidentEdges) {
        incidentEdges[id].update();
      }
    }

    function alignHorizontally() {
      align('y');
    }
    
    function alignVertically() {
      align('x');
    }
    
    function distribute(axis) {
      var vertices = getActionableVertices().sort((v0, v1) => v0[axis] - v1[axis]);
      if (vertices.length < 3) {
        return
      }

      var incidentEdges = {};
      var spacing = (vertices[vertices.length - 1][axis] - vertices[0][axis]) /
                    (vertices.length - 1);
      for (var i = 0; i < vertices.length; ++i) {
        var vertex = vertices[i];
        vertex[axis] = vertices[0][axis] + i * spacing;
        for (var id in vertex.edges) {
          incidentEdges[id] = vertex.edges[id];
        }
      };
      
      // Update the edges altered by previous vertex translations.
      for (var id in incidentEdges) {
        incidentEdges[id].update();
      }
    }

    function distributeHorizontally() {
      distribute('x');
    }

    function distributeVertically() {
      distribute('y');
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

    function getMedian(vertices) {
      var xs = vertices.map(v => v.x).sort();
      var ys = vertices.map(v => v.y).sort();
      return {
        x: xs[Math.floor(xs.length / 2)],
        y: ys[Math.floor(ys.length / 2)],
      };
    }
  }
})();
