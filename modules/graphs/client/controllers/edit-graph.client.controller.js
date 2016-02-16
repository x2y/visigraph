(function () {
  'use strict';

  angular
    .module('graphs')
    .controller('EditGraphController', EditGraphController);

  EditGraphController.$inject = ['$scope', '$state', '$interval', 'graphResolve', 'GraphsService', 'Authentication'];


  var PAN_SPEED_FACTOR = 0.15;
  var WHEEL_SCALE_FACTOR = 0.2;

  var Tool = {
    CURSOR: 'cursor',
    GRAPH: 'graph',
    CAPTION: 'caption',
    CUT: 'cut',
    PAINT: 'paint',
  };


  function EditGraphController($scope, $state, $interval, graph, GraphsService, Authentication) {
    var panInterval = -1;
    var panEndPoint = { x: 0, y: 0 };

    var vm = this;
    vm.graph = graph;
    vm.transform = [[1, 0, 0],
                    [0, 1, 0],
                    [0, 0, 1]];
    vm.tool = Tool.CURSOR;
    vm.isSelectionVisible = false;
    vm.selectionStartPoint = { x: 0, y: 0 };
    vm.selectionEndPoint = { x: 10, y: 10 };
    vm.paintColor = '#f00';

    vm.authentication = Authentication;
    vm.onViewportMousedown = onViewportMousedown;
    vm.onViewportMousemove = onViewportMousemove;
    vm.onViewportMouseup = onViewportMouseup;
    vm.onViewportDblClick = onViewportDblClick;
    vm.onViewportKeydown = onViewportKeydown;
    vm.onVertexMousedown = onVertexMousedown;
    vm.onVertexMouseup = onVertexMouseup;
    vm.onEdgeMousedown = onEdgeMousedown;
    vm.onEdgeMouseup = onEdgeMouseup;
    vm.onCaptionMousedown = onCaptionMousedown;
    vm.onCaptionMouseup = onCaptionMouseup;
    vm.onWheel = onWheel;
    vm.save = save;

    EditGraphController.Tool = Tool;


    function onViewportMousedown(e) {
      e.target.focus();
      if (e.which !== 1) {
        return;
      }

      e.preventDefault();
      switch (vm.tool) {
        case Tool.CURSOR:
        case Tool.CUT:
        case Tool.PAINT:
          if (!e.shiftKey) {
            vm.graph.selectAll(false);
          }
          vm.isSelectionVisible = true;
          vm.selectionEndPoint = vm.selectionStartPoint = { x: e.offsetX, y: e.offsetY };
          break;
      }
    }

    function onViewportMousemove(e) {
      if (e.which !== 1) {
        return;
      }
      switch (vm.tool) {
        case Tool.CURSOR:
          if (!vm.isSelectionVisible &&
              (vm.graph.hasSelectedVertices() || vm.graph.hasSelectedEdges() ||
               vm.graph.hasSelectedCaptions())) {
            var scale = vm.transform[0][0];
            vm.graph.translateElements(e.movementX / scale, e.movementY / scale);
            vm.selectionEndPoint = { x: e.offsetX, y: e.offsetY };
          } else {
            vm.selectionEndPoint = { x: e.offsetX, y: e.offsetY };
          }  
          break;
        case Tool.CUT:
        case Tool.PAINT:
          vm.selectionEndPoint = { x: e.offsetX, y: e.offsetY };
          break;
      }
    }

    function onViewportMouseup(e) {
      if (e.which !== 1) {
        return;
      }

      var mousePoint = { x: e.offsetX, y: e.offsetY };
      var svgPoint = invertPoint(vm.transform, mousePoint.x, mousePoint.y);
      switch (vm.tool) {
        case Tool.CURSOR:
        case Tool.CUT:
        case Tool.PAINT:
          if (!vm.isSelectionVisible) {
            break;
          }
          var svgSelectionStartPoint = invertPoint(vm.transform, vm.selectionStartPoint.x,
                                                   vm.selectionStartPoint.y);
          var svgSelectionEndPoint = svgPoint;

          for (var id in vm.graph.vertices) {
            var vertex = vm.graph.vertices[id];
            if (isPointInRect(vertex.x, vertex.y, svgSelectionStartPoint, svgSelectionEndPoint)) {
              switch (vm.tool) {
                case Tool.CURSOR:
                  vertex.isSelected = true;
                  break;
                case Tool.CUT:
                  vm.graph.removeVertex(vertex);
                  break;
                case Tool.PAINT:
                  vertex.color = vm.paintColor;
                  break;
              }
            }
          }
          for (var id in vm.graph.edges) {
            var edge = vm.graph.edges[id];
            if (isPointInRect(edge.handleX, edge.handleY, svgSelectionStartPoint,
                              svgSelectionEndPoint)) {
              switch (vm.tool) {
                case Tool.CURSOR:
                  edge.isSelected = true;
                  break;
                case Tool.CUT:
                  vm.graph.removeEdge(edge);
                  break;
                case Tool.PAINT:
                  edge.color = vm.paintColor;
                  break;
              }
            }
          }
          for (var id in vm.graph.captions) {
            var caption = vm.graph.captions[id];
            if (isPointInRect(caption.x, caption.y, svgSelectionStartPoint, svgSelectionEndPoint)) {
              switch (vm.tool) {
                case Tool.CURSOR:
                  caption.isSelected = true;
                  break;
                case Tool.CUT:
                  vm.graph.removeCaption(caption);
                  break;
                case Tool.PAINT:
                  caption.color = vm.paintColor;
                  break;
              }
            }
          }

          vm.isSelectionVisible = false;
          break;
        case Tool.GRAPH:
          var vertex = vm.graph.addVertex({
            x: svgPoint.x,
            y: svgPoint.y,
          });

          var selectedVertices = vm.graph.getSelectedVertices();
          for (var i = 0; i < selectedVertices.length; ++i) {
            vm.graph.addEdge({
              from: selectedVertices[i],
              to: vertex
            });
            selectedVertices[i].isSelected = false;
          }
          break;
        case Tool.CAPTION:
          var caption = vm.graph.addCaption({
            x: svgPoint.x,
            y: svgPoint.y,
            label: 'Test caption',
          });
          break;
      }
    }

    function onViewportDblClick(e) {
      var viewportEl = e.target.closest('.viewport');
      var mousePoint = { x: e.offsetX, y: e.offsetY };
      panEndPoint = invertPoint(vm.transform, mousePoint.x, mousePoint.y);
      
      $interval.cancel(panInterval);
      panInterval = $interval(function () {
        var panStartPoint = invertPoint(vm.transform, viewportEl.offsetWidth / 2,
            viewportEl.offsetHeight / 2);
        var scale = vm.transform[0][0];
        var xDelta = (panEndPoint.x - panStartPoint.x) * PAN_SPEED_FACTOR;
        var yDelta = (panEndPoint.y - panStartPoint.y) * PAN_SPEED_FACTOR;

        if (Math.abs(xDelta) < 0.1 && Math.abs(yDelta) < 0.1) {
          $interval.cancel(panInterval);
        } else {
          translate(vm.transform, -xDelta * scale, -yDelta * scale);
        }
      }, 30);
    }

    function onViewportKeydown(e) {
      switch (e.code) {
        case 'ArrowUp':
        case 'ArrowRight':
        case 'ArrowDown':
        case 'ArrowLeft':
          var increment = 10;
          if (e.shiftKey) {
            increment *= 10;
          }
          if (e.altKey) {
            increment /= 10;
          }
          if (e.ctrlKey) {
            switch (e.code) {
              case 'ArrowUp':
                translate(vm.transform, 0, increment);
                break;
              case 'ArrowRight':
                translate(vm.transform, -increment, 0);
                break;
              case 'ArrowDown':
                translate(vm.transform, 0, -increment);
                break;
              case 'ArrowLeft':
                translate(vm.transform, increment, 0);
                break;
            }
          } else {
            switch (e.code) {
              case 'ArrowUp':
                vm.graph.translateElements(0, -increment);
                break;
              case 'ArrowRight':
                vm.graph.translateElements(increment, 0);
                break;
              case 'ArrowDown':
                vm.graph.translateElements(0, increment);
                break;
              case 'ArrowLeft':
                vm.graph.translateElements(-increment, 0);
                break;
            }
          }
          e.preventDefault();
          break;
        case 'Backspace':
        case 'Delete':
          var selectedVertices = vm.graph.getSelectedVertices();
          while (selectedVertices.length > 0) {
            vm.graph.removeVertex(selectedVertices.pop());
          }
          var selectedEdges = vm.graph.getSelectedEdges();
          while (selectedEdges.length > 0) {
            vm.graph.removeEdge(selectedEdges.pop());
          }
          var selectedCaptions = vm.graph.getSelectedCaptions();
          while (selectedCaptions.length > 0) {
            vm.graph.removeCaption(selectedCaptions.pop());
          }
          e.preventDefault();
          break;
        case 'Escape':
          vm.graph.selectAll(false);
          e.preventDefault();
          break;
        case 'KeyA':
          if (e.ctrlKey) {
            vm.graph.selectAll(true);
            e.preventDefault();
          }
          break;
      }
    }

    function onVertexMousedown(vertex, e) {
      if (e.which !== 1) {
        return;
      }

      e.preventDefault();
      switch (vm.tool) {
        case Tool.CURSOR:
          if (!vertex.isSelected && !e.shiftKey) {
            vm.graph.selectAll(false);
          }
          vertex.isSelected = true;
          e.stopPropagation();
          break;
        case Tool.GRAPH:
          if (!vm.graph.hasSelectedVertices()) {
            vertex.isSelected = true;
            e.stopPropagation();
          }
          break;
        case Tool.CUT:
          vm.graph.removeVertex(vertex);
          e.stopPropagation();
          break;
        case Tool.PAINT:
          vertex.color = vm.paintColor;
          e.stopPropagation();
          break;
      }
    }

    function onVertexMouseup(vertex, e) {
      if (e.which !== 1) {
        return;
      }
      switch (vm.tool) {
        case Tool.GRAPH:
          var selectedVertices = vm.graph.getSelectedVertices();
          if (selectedVertices.length === 1 && selectedVertices[0] === vertex) {
            // Do nothing.
          } else {
            for (var i = 0; i < selectedVertices.length; ++i) {
              vm.graph.addEdge({
                from: selectedVertices[i],
                to: vertex
              });
              selectedVertices[i].isSelected = false;
            }
          }
          e.stopPropagation();
          break;
      }
    }

    function onEdgeMousedown(edge, e) {
      if (e.which !== 1) {
        return;
      }

      e.preventDefault();
      switch (vm.tool) {
        case Tool.CURSOR:
          if (!edge.isSelected && !e.shiftKey) {
            vm.graph.selectAll(false);
          }
          edge.isSelected = true;
          e.stopPropagation();
          break;
        case Tool.CUT:
          vm.graph.removeEdge(edge);
          e.stopPropagation();
          break;
        case Tool.PAINT:
          edge.color = vm.paintColor;
          e.stopPropagation();
          break;
      }
    }

    function onEdgeMouseup(edge, e) {
      if (e.which !== 1) {
        return;
      }
      switch (vm.tool) {
        case Tool.CURSOR:
          break;
      }
    }

    function onCaptionMousedown(caption, e) {
      if (e.which !== 1) {
        return;
      }

      e.preventDefault();
      switch (vm.tool) {
        case Tool.CURSOR:
          if (!caption.isSelected && !e.shiftKey) {
            vm.graph.selectAll(false);
          }
          caption.isSelected = true;
          e.stopPropagation();
          break;
        case Tool.CUT:
          vm.graph.removeCaption(caption);
          e.stopPropagation();
          break;
        case Tool.PAINT:
          caption.color = vm.paintColor;
          e.stopPropagation();
          break;
      }
    }

    function onCaptionMouseup(caption, e) {
      if (e.which !== 1) {
        return;
      }
      switch (vm.tool) {
        case Tool.CURSOR:
          break;
      }
    }

    function onWheel(e, delta, deltaX, deltaY) {
      var x = e.originalEvent.offsetX;
      var y = e.originalEvent.offsetY;
      translate(vm.transform, -x, -y);
      scale(vm.transform, delta * WHEEL_SCALE_FACTOR + 1);
      translate(vm.transform, x, y);
      e.preventDefault();
    }

    function translate(matrix, x, y) {
      matrix[0][2] += x;
      matrix[1][2] += y;
    }

    function scale(matrix, factor) {
      matrix[0][0] *= factor;
      matrix[0][2] *= factor;
      matrix[1][1] *= factor;
      matrix[1][2] *= factor;
    }

    function invertPoint(matrix, x, y) {
      return {
        x: (x - matrix[0][2]) / matrix[0][0],
        y: (y - matrix[1][2]) / matrix[1][1],
      };
    }

    function isPointInRect(x, y, rectStartPoint, rectEndPoint) {
      return x >= Math.min(rectStartPoint.x, rectEndPoint.x) &&
             x <= Math.max(rectStartPoint.x, rectEndPoint.x) &&
             y >= Math.min(rectStartPoint.y, rectEndPoint.y) &&
             y <= Math.max(rectStartPoint.y, rectEndPoint.y);
    }

    function save() {
      vm.graph.$update(successCallback, errorCallback);

      function successCallback(res) {
        $state.go('graphs.edit', {
          graphId: res._id
        });
      }

      function errorCallback(res) {
        vm.error = res.data.message;
      }
    }
  }
})();
