(function () {
  'use strict';

  angular
    .module('graphs')
    .controller('ArrangeGraphController', ArrangeGraphController);

  ArrangeGraphController.$inject = ['$scope', '$state', '$interval'];


  var VERTEX_SPACING = 70;


  function ArrangeGraphController($scope, $state, $interval) {
    var graph = $scope.vm.graph;

    var vm = this;
    vm.arrangeAsCircle = arrangeAsCircle;
    vm.arrangeAsGrid = arrangeAsGrid;
    vm.arrangeAsLinearTree = arrangeAsLinearTree;
    vm.arrangeAsRadialTree = arrangeAsRadialTree;
    vm.arrangeAsForces = arrangeAsForces;


    function arrangeAsCircle() {
      var vertices = getActionableVertices();
      var centroid = getCentroid(vertices);

      // Sort the vertices by angle around the centroid.
      vertices.sort(function (a, b) {
        return a.getAngleFrom(centroid) - b.getAngleFrom(centroid);
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
      if (-vertices[0].getAngleFrom(centroid) <
          vertices[vertices.length - 1].getAngleFrom(centroid)) {
        vertices.unshift(vertices.pop());
      }

      // Rearrange them radially according to their existing order around their centroid while also
      // collecting their incident edges.
      var radius = VERTEX_SPACING * vertices.length / (2 * Math.PI);
      var incidentEdges = {};
      for (var i = 0; i < vertices.length; ++i) {
        var vertex = vertices[i];
        var angle = Math.PI * (2 * i / vertices.length - 1);
        vertex.x = centroid.x + radius * Math.cos(angle);
        vertex.y = centroid.y + radius * Math.sin(angle);

        for (var id in vertex.edges) {
          incidentEdges[id] = vertex.edges[id];
        }
      }

      // Reset the edges altered by previous vertex translations.
      for (var id in incidentEdges) {
        incidentEdges[id].reset();
      }
    }

    function arrangeAsGrid() {
      // TODO: At some point we should probably transition this function to use a more generalizable
      // approach. Specifically, I'm thinking of using the Hungarian Algorithm to determine an
      // optimal mapping between the original vertex coordinates and their ideal destination
      // coordinates (see http://goo.gl/XRdVZl for a good explanation of this algorithm). The hard
      // part will be determining the ideal grid dimensions from the existing vertex coordinates. We
      // could assume a square grid, or try multiple different dimensions for the grid and chose the
      // one with minimal cost, but neither approach is ideal.
      var vertices = getActionableVertices();
      var centroid = getCentroid(vertices);
      var rows = Math.ceil(Math.sqrt(vertices.length));
      var cols = rows;  // For now we only support square grids.

      // Get the min/max Y values bounding the actionable vertices.
      var minY = Infinity, maxY = -Infinity;
      for (var i = 0; i < vertices.length; ++i) {
        minY = Math.min(minY, vertices[i].y);
        maxY = Math.max(maxY, vertices[i].y);
      }
      var height = maxY - minY;

      // Sort the vertices before arrangement by row and x position to minimize vertex rearrangement
      // if the vertices are already in a gridlike configuration.
      vertices.sort(function (a, b) {
        // We need the Math.min to prevent vertices at maxY from falling into an extra row "bucket".
        var aRow = Math.min(rows - 1, Math.floor(rows * (a.y - minY) / height));
        var bRow = Math.min(rows - 1, Math.floor(rows * (b.y - minY) / height));
        return aRow - bRow || a.x - b.x;
      });

      // Rearrange them into a grid.
      var incidentEdges = {};
      for (var row = 0; row < rows; ++row) {
        for (var col = 0; col < cols; ++col) {
          var vertex = vertices[row * cols + col];
          if (!vertex) {
            break;  // Handle non-square numbers of vertices.
          }

          vertex.x = centroid.x + (col - (cols - 1) / 2) * VERTEX_SPACING;
          vertex.y = centroid.y + (row - (rows - 1) / 2) * VERTEX_SPACING;

          for (var id in vertex.edges) {
            incidentEdges[id] = vertex.edges[id];
          }
        }
      }

      // Reset the edges altered by previous vertex translations.
      for (var id in incidentEdges) {
        incidentEdges[id].reset();
      }
    }

    function arrangeAsTree(d3Tree, separateFn, applyFn) {
      var vertices = graph.getSelectedVertices();
      if (vertices.length !== 1) {
        return;
      }

      var vertexD3Nodes = {};
      var edgesVisited = {};

      // Convert the vertices to D3-friendly "nodes" in a breadth-first search.
      var root = d3NodeFrom(vertices[0], vertexD3Nodes);
      var rootX = vertices[0].x, rootY = vertices[0].y;
      var d3Nodes = [root];
      while (d3Nodes.length > 0) {
        var d3Node = d3Nodes.shift();
        for (var id in d3Node.vertex.edges) {
          var edge = d3Node.vertex.edges[id];
          edgesVisited[id] = edge;

          if (!(edge.from.id in vertexD3Nodes)) {
            var child = d3NodeFrom(edge.from, vertexD3Nodes);
            d3Node.children.push(child);
            d3Nodes.push(child);
          } else if (!(edge.to.id in vertexD3Nodes)) {
            var child = d3NodeFrom(edge.to, vertexD3Nodes);
            d3Node.children.push(child);
            d3Nodes.push(child);
          }
        }
      }
      
      // Use D3's tree layout engine for the heavy lifting. See its API reference at
      // https://github.com/mbostock/d3/wiki/Tree-Layout for more information.
      d3Tree.sort(compareLabels).separation(separateFn);
      d3Nodes = d3Tree.nodes(root);

      // Rearrange the vertices according to D3's results.
      for (var i = 0; i < d3Nodes.length; ++i) {
        applyFn(d3Nodes[i], rootX, rootY);
      }

      // Reset the edges altered by previous vertex translations.
      for (var id in edgesVisited) {
        edgesVisited[id].reset();
      }


      function d3NodeFrom(vertex, vertexD3Nodes) {
        var d3Node = {
          vertex: vertex,
          x: vertex.x,
          y: vertex.y,
          children: [],
          label: vertex.label,
        };
        vertexD3Nodes[vertex.id] = d3Node;
        return d3Node;
      }

      function compareLabels(a, b) {
        return a.label < b.label ? 1 : (a.label > b.label ? -1 : 0);
      }
    }

    function arrangeAsLinearTree() {
      arrangeAsTree(d3.layout.tree().nodeSize([VERTEX_SPACING, VERTEX_SPACING]), function (a, b) {
        return a.parent === b.parent ? 1 : 2;
      }, function (d3Node, rootX, rootY) {
        d3Node.vertex.x = d3Node.x + rootX;
        d3Node.vertex.y = d3Node.y + rootY;
      });
    }

    function arrangeAsRadialTree() {
      arrangeAsTree(d3.layout.tree().size([2 * Math.PI, 1]), function (a, b) {
        return (a.parent === b.parent ? 1 : 2) / a.depth;
      }, function (d3Node, rootX, rootY) {
        d3Node.vertex.x = VERTEX_SPACING * d3Node.depth * Math.cos(d3Node.x) + rootX;
        d3Node.vertex.y = VERTEX_SPACING * d3Node.depth * Math.sin(d3Node.x) + rootY;
      });
    }

    function arrangeAsForces() {
      // TODO: Support vertex/edge weights.
      var hasSelectedVertices = graph.hasSelectedVertices();
      var centroid = getCentroid(graph.vertices);

      // Convert the vertices to D3-friendly "nodes".
      var vertexD3Nodes = {};
      var d3Nodes = [];
      for (var id in graph.vertices) {
        var vertex = graph.vertices[id];
        var node = {
          vertex: vertex,
          x: vertex.x - centroid.x,
          y: vertex.y - centroid.y,
          fixed: hasSelectedVertices && !vertex.isSelected,
        };
        vertexD3Nodes[id] = node;
        d3Nodes.push(node);
      }

      // Convert the edges to D3-friendly "links".
      var d3Links = [];
      for (var id in graph.edges) {
        var edge = graph.edges[id];
        var source = vertexD3Nodes[edge.from.id];
        var target = vertexD3Nodes[edge.to.id];
        if (source.fixed && target.fixed) {
          continue;  // No sense wasting computations links between fixed nodes.
        }
        d3Links.push({
          edge: edge,
          source: source,
          target: target,
        });
      }

      // Use D3's efficient force layout engine for the heavy lifting. See its API reference at
      // https://github.com/mbostock/d3/wiki/Force-Layout for more information.
      d3.layout.force()
          .nodes(d3Nodes)
          .links(d3Links)
          .linkDistance(VERTEX_SPACING)
          .charge(-500)
          .on('tick', onTick)
          .start();


      function onTick() {
        $scope.$apply(function () {
          for (var i = 0; i < d3Nodes.length; ++i) {
            var d3Node = d3Nodes[i];
            d3Node.vertex.x = d3Node.x + centroid.x;
            d3Node.vertex.y = d3Node.y + centroid.y;
          }

          for (var i = 0; i < d3Links.length; ++i) {
            d3Links[i].edge.reset();
          }
        });
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
      var length = 0;
      var centroid = { x: 0, y: 0 };
      for (var id in vertices) {
        centroid.x += vertices[id].x;
        centroid.y += vertices[id].y;
        ++length;
      }
      centroid.x /= length;
      centroid.y /= length;
      return centroid;
    }
  }
})();
