(function () {
  'use strict';

  angular
    .module('graphs')
    .controller('EditGraphController', EditGraphController);

  EditGraphController.$inject = ['$scope', '$state', '$interval', 'graphResolve', 'GraphsService', 'hotkeys', 'Authentication'];


  var PAN_SPEED_FACTOR = 0.15;
  var WHEEL_SCALE_FACTOR = 1.25;
  var GRAPH_MARGIN_FACTOR = 1.3;
  var MIN_GRAPH_WIDTH = 200;

  var Tool = {
    CURSOR: 'cursor',
    GRAPH: 'graph',
    CAPTION: 'caption',
    CUT: 'cut',
    PAINT: 'paint',
  };


  function EditGraphController($scope, $state, $interval, graph, GraphsService, hotkeys, Authentication) {
    var viewportEl = document.querySelector('.viewport');
    var panInterval = -1;
    var panEndPoint = { x: 0, y: 0 };
    var isMouseDown = false;

    var vm = this;
    vm.areVertexLabelsShown = true;
    vm.areVertexWeightsShown = false;
    vm.areEdgeHandlesShown = true;
    vm.areEdgeLabelsShown = true;
    vm.areEdgeWeightsShown = false;
    vm.areCaptionHandlesShown = true;
    vm.urlPath = $state.href($state.current);  // See https://github.com/meanjs/mean/issues/1224
    vm.graph = graph;
    vm.transform = [[1, 0, 0],
                    [0, 1, 0],
                    [0, 0, 1]];
    vm.tool = Tool.CURSOR;
    vm.isSelectionShown = false;
    vm.selectionStartPoint = { x: 0, y: 0 };
    vm.selectionEndPoint = { x: 10, y: 10 };
    vm.paintColor = '#f00';

    vm.authentication = Authentication;
    vm.onViewportMousedown = onViewportMousedown;
    vm.onViewportMousemove = onViewportMousemove;
    vm.onViewportMouseup = onViewportMouseup;
    vm.onViewportDblClick = onViewportDblClick;
    vm.onVertexMousedown = onVertexMousedown;
    vm.onVertexMouseup = onVertexMouseup;
    vm.onEdgeMousedown = onEdgeMousedown;
    vm.onCaptionMousedown = onCaptionMousedown;
    vm.onWheel = onWheel;
    vm.onSave = onSave;
    vm.scaleViewportAroundCenter = scaleViewportAroundCenter;
    vm.fitViewportToGraph = fitViewportToGraph;
    vm.getActionableVertices = getActionableVertices;

    EditGraphController.Tool = Tool;

    fitViewportToGraph();
    hotkeys.bindTo($scope)
        .add({
          combo: 'ctrl+a',
          description: 'Select all',
          callback: onSelectAllShortcut
        })
        .add({
          combo: 'escape',
          description: 'Deselect all',
          callback: onDeselectAllShortcut
        })
        .add({
          combo: ['backspace', 'del'],
          description: 'Delete selected',
          callback: onDeleteSelectedShortcut
        })
        .add({
          combo: ['up', 'down', 'left', 'right',
                  'shift+up', 'shift+down', 'shift+left', 'shift+right',
                  'alt+up', 'alt+down', 'alt+left', 'alt+right'],
          description: 'Translate selected',
          callback: onTranslateSelectedShortcut
        })
        .add({
          combo: ['ctrl+up', 'ctrl+down', 'ctrl+left', 'ctrl+right',
                  'ctrl+shift+up', 'ctrl+shift+down', 'ctrl+shift+left', 'ctrl+shift+right',
                  'ctrl+alt+up', 'ctrl+alt+down', 'ctrl+alt+left', 'ctrl+alt+right'],
          description: 'Translate viewport',
          callback: onTranslateViewportShortcut
        })
        .add({
          combo: 'ctrl+s',
          description: 'Save graph',
          callback: onSaveShortcut
        });


    function onViewportMousedown(e) {
      if (e.which !== 1) {
        return;
      }

      isMouseDown = true;
      var mousePoint = getMousePoint(e);
      e.preventDefault();
      switch (vm.tool) {
        case Tool.CURSOR:
        case Tool.CUT:
        case Tool.PAINT:
          if (!e.shiftKey) {
            vm.graph.selectAll(false);
          }
          vm.isSelectionShown = true;
          vm.selectionEndPoint = vm.selectionStartPoint = { x: mousePoint.x, y: mousePoint.y };
          break;
      }
    }

    function onViewportMousemove(e) {
      if (!isMouseDown) {
        return;
      }

      var mousePoint = getMousePoint(e);
      switch (vm.tool) {
        case Tool.CURSOR:
          if (!vm.isSelectionShown &&
              (vm.graph.hasSelectedVertices() || vm.graph.hasSelectedEdges() ||
               vm.graph.hasSelectedCaptions())) {
            var scale = vm.transform[0][0];
            vm.graph.translateElements(e.movementX / scale, e.movementY / scale,
                                       null, null, null, true);
            vm.selectionEndPoint = { x: mousePoint.x, y: mousePoint.y };
          } else {
            vm.selectionEndPoint = { x: mousePoint.x, y: mousePoint.y };
          }  
          break;
        case Tool.CUT:
        case Tool.PAINT:
          vm.selectionEndPoint = { x: mousePoint.x, y: mousePoint.y };
          break;
      }
    }

    function onViewportMouseup(e) {
      if (e.which !== 1) {
        return;
      }

      isMouseDown = false;
      var mousePoint = getMousePoint(e);
      var svgPoint = invertPoint(mousePoint.x, mousePoint.y);
      switch (vm.tool) {
        case Tool.CURSOR:
          if (!vm.isSelectionShown) {
            for (var selectedEdge of vm.graph.getSelectedEdges()) {
              selectedEdge.release();
            }
            break;
          }
          /* falls through */
        case Tool.CUT:
        case Tool.PAINT:
          if (!vm.isSelectionShown) {
            break;
          }
          var svgSelectionStartPoint = invertPoint(vm.selectionStartPoint.x,
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
            if (isPointInRect(edge.handle.x, edge.handle.y, svgSelectionStartPoint,
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

          vm.isSelectionShown = false;
          break;
        case Tool.GRAPH:
          var vertex = vm.graph.addVertex({
            x: svgPoint.x,
            y: svgPoint.y,
          });

          for (var selectedVertex of vm.graph.getSelectedVertices()) {
            vm.graph.addEdge({
              from: selectedVertex,
              to: vertex,
            });
            selectedVertex.isSelected = false;
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
      var mousePoint = getMousePoint(e);
      panEndPoint = invertPoint(mousePoint.x, mousePoint.y);
      
      $interval.cancel(panInterval);
      panInterval = $interval(function () {
        var panStartPoint = invertPoint(viewportEl.offsetWidth / 2,
                                        viewportEl.offsetHeight / 2);
        var scale = vm.transform[0][0];
        var xDelta = (panEndPoint.x - panStartPoint.x) * PAN_SPEED_FACTOR;
        var yDelta = (panEndPoint.y - panStartPoint.y) * PAN_SPEED_FACTOR;

        if (Math.abs(xDelta) < 0.1 && Math.abs(yDelta) < 0.1) {
          $interval.cancel(panInterval);
        } else {
          translateViewport(-xDelta * scale, -yDelta * scale);
        }
      }, 30);
    }

    function onVertexMousedown(vertex, e) {
      if (e.which !== 1) {
        return;
      }

      isMouseDown = true;
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
          var selectedVertices = vm.graph.getSelectedVertices();
          if (selectedVertices.length === 0) {
            vertex.isSelected = true;
            e.stopPropagation();
          } else if (vm.graph.allowLoops && vertex.isSelected) {
            for (var selectedVertex of selectedVertices) {
              vm.graph.addEdge({
                from: selectedVertex,
                to: vertex,
              });
              selectedVertex.isSelected = false;
            }
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

      isMouseDown = false;
      switch (vm.tool) {
        case Tool.GRAPH:
          var selectedVertices = vm.graph.getSelectedVertices();
          if (selectedVertices.length === 1 && selectedVertices[0] === vertex) {
            // Do nothing.
          } else {
            for (var selectedVertex of selectedVertices) {
              vm.graph.addEdge({
                from: selectedVertex,
                to: vertex,
              });
              selectedVertex.isSelected = false;
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

      isMouseDown = true;
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

    function onCaptionMousedown(caption, e) {
      if (e.which !== 1) {
        return;
      }

      isMouseDown = true;
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

    function onWheel(e, delta, deltaX, deltaY) {
      var mousePoint = getMousePoint(e.originalEvent);
      scaleViewport(mousePoint, Math.pow(WHEEL_SCALE_FACTOR, delta));
      e.preventDefault();
    }

    function onSelectAllShortcut(e) {
      vm.graph.selectAll(true);
      e.preventDefault();
    }

    function onDeselectAllShortcut(e) {
      vm.graph.selectAll(false);
      e.preventDefault();
    }

    function onDeleteSelectedShortcut(e) {
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
    }

    function onTranslateSelectedShortcut(e) {
      var increment = 10;
      if (e.shiftKey) {
        increment *= 10;
      }
      if (e.altKey) {
        increment /= 10;
      }
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
      e.preventDefault();
    }

    function onTranslateViewportShortcut(e) {
      var increment = 10;
      if (e.shiftKey) {
        increment *= 10;
      }
      if (e.altKey) {
        increment /= 10;
      }
      switch (e.code) {
        case 'ArrowUp':
          translateViewport(0, increment);
          break;
        case 'ArrowRight':
          translateViewport(-increment, 0);
          break;
        case 'ArrowDown':
          translateViewport(0, -increment);
          break;
        case 'ArrowLeft':
          translateViewport(increment, 0);
          break;
      }
      e.preventDefault();
    }

    function onSaveShortcut(e) {
      onSave();
      e.preventDefault();
    }

    function onSave() {
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

    function getMousePoint(e) {
      // Unfortunately, we can't just use offsetX/offsetY from the event because, when hovering over
      // a <text> element they are incorrectly (or at least unexpectedly) computed relative to the
      // <text> node, rather than the SVG viewportEl. So instead we must use the jqLite-normalize
      // pageX/pageY members relative to the viewportEl's computed equivalent page x/y values.
      var boundingClientRect = viewportEl.getBoundingClientRect();
      return {
        x: e.pageX - boundingClientRect.left - document.body.scrollLeft -
            document.documentElement.scrollLeft,
        y: e.pageY - boundingClientRect.top - document.body.scrollTop -
            document.documentElement.scrollTop,
      };
    }

    function invertPoint(x, y) {
      return {
        x: (x - vm.transform[0][2]) / vm.transform[0][0],
        y: (y - vm.transform[1][2]) / vm.transform[1][1],
      };
    }

    function resetViewport() {
      vm.transform = [[1, 0, 0],
                      [0, 1, 0],
                      [0, 0, 1]];
    }

    function translateViewport(x, y) {
      vm.transform[0][2] += x;
      vm.transform[1][2] += y;
    }

    function scaleViewport(center, factor) {
      translateViewport(-center.x, -center.y);
      vm.transform[0][0] *= factor;
      vm.transform[0][2] *= factor;
      vm.transform[1][1] *= factor;
      vm.transform[1][2] *= factor;
      translateViewport(center.x, center.y);
    }

    function scaleViewportAroundCenter(factor) {
      scaleViewport({
        x: viewportEl.offsetWidth / 2,
        y: viewportEl.offsetHeight / 2,
      }, factor);
    }

    function fitViewportToGraph() {
      var minX = Infinity, maxX = -Infinity;
      var minY = Infinity, maxY = -Infinity;
      var vertices = getActionableVertices();
      for (var vertex of vertices) {
        minX = Math.min(minX, vertex.x - vertex.radius);
        maxX = Math.max(maxX, vertex.x + vertex.radius);
        minY = Math.min(minY, vertex.y - vertex.radius);
        maxY = Math.max(maxY, vertex.y + vertex.radius);
      }
      var maxDimensionRatio = GRAPH_MARGIN_FACTOR *
          Math.max(Math.max(MIN_GRAPH_WIDTH, maxX - minX) / viewportEl.offsetWidth,
                   Math.max(MIN_GRAPH_WIDTH, maxY - minY) / viewportEl.offsetHeight);

      resetViewport();
      translateViewport(-(maxX + minX) / 2, -(maxY + minY) / 2);
      translateViewport(viewportEl.offsetWidth / 2, viewportEl.offsetHeight / 2);
      scaleViewportAroundCenter(1 / maxDimensionRatio);
    }

    function getActionableVertices() {
      var vertices = vm.graph.getSelectedVertices();
      if (!vertices.length) {
        for (var id in vm.graph.vertices) {
          vertices.push(vm.graph.vertices[id]);
        }
      }
      return vertices;
    }

    function isPointInRect(x, y, rectStartPoint, rectEndPoint) {
      return x >= Math.min(rectStartPoint.x, rectEndPoint.x) &&
             x <= Math.max(rectStartPoint.x, rectEndPoint.x) &&
             y >= Math.min(rectStartPoint.y, rectEndPoint.y) &&
             y <= Math.max(rectStartPoint.y, rectEndPoint.y);
    }
  }
})();
