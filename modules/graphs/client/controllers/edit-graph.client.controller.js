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
    ADD_ELEMENT: 'add_element',
    ADD_CAPTION: 'add_caption',
    SCISSORS: 'scissors',
    PAINTBRUSH: 'paintbrush',
  };


  function EditGraphController($scope, $state, $interval, graph, GraphsService, Authentication) {
    var panInterval = -1;
    var panEndPoint = { x: 0, y: 0 };

    var vm = this;
    vm.graph = graph;
    vm.transform = [[1, 0, 0],
                    [0, 1, 0],
                    [0, 0, 1]];
    vm.tool = Tool.ADD_ELEMENT;

    vm.authentication = Authentication;
    vm.onViewportMousedown = onViewportMousedown;
    vm.onViewportMouseup = onViewportMouseup;
    vm.onVertexMousedown = onVertexMousedown;
    vm.onVertexMouseup = onVertexMouseup;
    vm.onDblClick = onDblClick;
    vm.onWheel = onWheel;
    vm.save = save;

    EditGraphController.Tool = Tool;


    function onViewportMousedown(e) {
      switch (vm.tool) {
        case Tool.CURSOR:
          if (!e.shiftKey) {
            vm.graph.deselectAll();
          }
          break;
      }
    }

    function onViewportMouseup(e) {
      var mousePoint = { x: e.offsetX, y: e.offsetY };
      var svgPoint = invertPoint(vm.transform, mousePoint.x, mousePoint.y);
      switch (vm.tool) {
        case Tool.CURSOR:
          break;
        case Tool.ADD_ELEMENT:
          var vertex = new GraphsService.Vertex({
            x: svgPoint.x,
            y: svgPoint.y,
          });
          vm.graph.vertices.push(vertex);

          var selectedVertices = vm.graph.getSelectedVertices();
          for (var i = 0; i < selectedVertices.length; ++i) {
            vm.graph.edges.push(new GraphsService.Edge({
              from: selectedVertices[i],
              to: vertex
            }));
            selectedVertices[i].isSelected = false;
          }
          break;
        case Tool.ADD_CAPTION:
          break;
        case Tool.SCISSORS:
          break;
        case Tool.PAINTBRUSH:
          break;
      }
    }

    function onVertexMousedown(vertex, e) {
      switch (vm.tool) {
        case Tool.CURSOR:
          if (!e.shiftKey) {
            vm.graph.deselectAll();
          }
          vertex.isSelected = true;
          e.stopPropagation();
          break;
        case Tool.ADD_ELEMENT:
          if (!vm.graph.hasSelectedVertices()) {
            vertex.isSelected = true;
            e.stopPropagation();
          }
          break;
        case Tool.SCISSORS:
          vm.graph.vertices.splice(vm.graph.vertices.indexOf(vertex), 1);
          e.stopPropagation();
          break;
      }
    }

    function onVertexMouseup(vertex, e) {
      switch (vm.tool) {
        case Tool.ADD_ELEMENT:
          var selectedVertices = vm.graph.getSelectedVertices();
          if (selectedVertices.length == 1 && selectedVertices[0] == vertex) {
            // Do nothing.
          } else {
            for (var i = 0; i < selectedVertices.length; ++i) {
              vm.graph.edges.push(new GraphsService.Edge({
                from: selectedVertices[i],
                to: vertex
              }));
              selectedVertices[i].isSelected = false;
            }
          }
          e.stopPropagation();
          break;
      }
    }

    function onDblClick(e) {
      var viewportEl = e.target.closest('.viewport');
      var mousePoint = { x: e.offsetX, y: e.offsetY };
      panEndPoint = invertPoint(vm.transform, mousePoint.x, mousePoint.y);      

      $interval.cancel(panInterval);
      panInterval = $interval(function() {
        var panStartPoint = invertPoint(vm.transform, viewportEl.offsetWidth / 2,
            viewportEl.offsetHeight / 2)
        var xDelta = (panEndPoint.x - panStartPoint.x) * PAN_SPEED_FACTOR;
        var yDelta = (panEndPoint.y - panStartPoint.y) * PAN_SPEED_FACTOR;

        if (Math.abs(xDelta) < 0.1 && Math.abs(yDelta) < 0.1) {
          $interval.cancel(panInterval);
        } else {
          translate(vm.transform, -xDelta, -yDelta);
        }
      }, 30);
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
