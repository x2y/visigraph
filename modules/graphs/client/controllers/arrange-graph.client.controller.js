(function () {
  'use strict';

  angular
    .module('graphs')
    .controller('ArrangeGraphController', ArrangeGraphController);

  ArrangeGraphController.$inject = ['$scope', '$state', '$interval'];

  function ArrangeGraphController($scope, $state, $interval) {
    var graph = $scope.vm.graph;

    var vm = this;
    vm.arrangeAsCircle = arrangeAsCircle;
    vm.arrangeAsGrid = arrangeAsGrid;
    vm.arrangeAsTree = arrangeAsTree;
    vm.arrangeAsSprings = arrangeAsSprings;

    function arrangeAsCircle() {
      // Get the actionable vertices.
      var vertices = graph.getSelectedVertices();
      if (!vertices.length) {
        for (var id in graph.vertices) {
          vertices.push(graph.vertices[id]);
        }
      }

      // Find their centroid.
      var centroidX = 0;
      var centroidY = 0;
      for (var i = 0; i < vertices.length; ++i) {
        centroidX += vertices[i].x;
        centroidY += vertices[i].y;
      }
      centroidX /= vertices.length;
      centroidY /= vertices.length;

      // Sort the vertices by angle around the centroid.
      vertices.sort(function (a, b) {
        return a.angleFrom(centroidX, centroidY) - b.angleFrom(centroidX, centroidY);
      });

      // Fix the edge-case where the last vertex is actually closer to the 0-angle than the first
      // (albeit close to +pi rather than -pi). In that case, we want to make it the first vertex
      // instead so that the arrangement algorithm is more "stable".
      //
      // For example, if you have n vertices and use this function to arrange them as a circle,
      // successive applications of the function should not modify the arrangement of the vertices.
      // If you move any vertex slightly and call this function again, so long as it has not crossed
      // another vertex in terms of polar angle, it should snap back to its original position and
      // all other vertices should remain in their same positions.
      //
      // Unfortunately, without this fix, that is only true for the first vertex half of the time.
      // If you move it up slightly (in the direction of -y), it will snap back to its original
      // position correctly. However, if you move it down slightly (in the direction of +y), its
      // angle from the centroid will go from near -pi to near +pi, pushing it to the very end of
      // the list and rotating all of the vertices counter-clockwise one position. This fix prevents
      // that degenerate condition by using the closest vertex to the 0-angle (rather than the
      // lowest angle) so that the moved vertex snaps back to its original position and no other
      // vertices move relative to the centroid.
      if (-vertices[0].angleFrom(centroidX, centroidY) <
          vertices[vertices.length - 1].angleFrom(centroidX, centroidY)) {
        vertices.unshift(vertices.pop());
      }

      // Rearrange them radially according to their existing order around their centroid while also
      // collecting their incident edges.
      var radius = 10 * vertices.length;
      var incidentEdges = {};
      for (var i = 0; i < vertices.length; ++i) {
        var vertex = vertices[i];
        var angle = Math.PI * (2 * i / vertices.length - 1);
        vertex.x = centroidX + radius * Math.cos(angle);
        vertex.y = centroidY + radius * Math.sin(angle);

        for (var id in vertex.edges) {
          incidentEdges[id] = vertex.edges[id];
        }
      }

      // Fix the edges altered by previous vertex translations.
      for (var id in incidentEdges) {
        incidentEdges[id].fix();
      }
    }

    function arrangeAsGrid() {
      // TODO
    }

    function arrangeAsTree() {
      // TODO
    }

    function arrangeAsSprings() {
      // TODO
    }
  }
})();
