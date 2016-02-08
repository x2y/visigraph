(function () {
  'use strict';

  angular
    .module('graphs')
    .controller('EditGraphController', EditGraphController);

  EditGraphController.$inject = ['$scope', '$state', '$interval', 'graphResolve', 'GraphsService', 'Authentication'];


  var PAN_SPEED_FACTOR = 0.15;
  var VIEWPORT_HEIGHT = 500;
  var VIEWPORT_WIDTH = 500;
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
    vm.onClick = onClick;
    vm.onDblClick = onDblClick;
    vm.onVertexClick = onVertexClick;
    vm.onWheel = onWheel;
    vm.save = save;

    EditGraphController.Tool = Tool;


    function onClick(e) {
      var mousePoint = { x: e.offsetX, y: e.offsetY };
      var svgPoint = invertPoint(vm.transform, mousePoint.x, mousePoint.y);
      switch (vm.tool) {
        case Tool.CURSOR:
          break;
        case Tool.ADD_ELEMENT:
          vm.graph.vertices.push(new GraphsService.Vertex({
            x: svgPoint.x,
            y: svgPoint.y,
          }));
          break;
        case Tool.ADD_CAPTION:
          break;
        case Tool.SCISSORS:
          break;
        case Tool.PAINTBRUSH:
          break;
      }
    }

    function onDblClick(e) {
      var mousePoint = { x: e.offsetX, y: e.offsetY };
      panEndPoint = invertPoint(vm.transform, mousePoint.x, mousePoint.y);      

      $interval.cancel(panInterval);
      panInterval = $interval(function() {
        var panStartPoint = invertPoint(vm.transform, VIEWPORT_WIDTH / 2, VIEWPORT_HEIGHT / 2);
        var xDelta = (panEndPoint.x - panStartPoint.x) * PAN_SPEED_FACTOR;
        var yDelta = (panEndPoint.y - panStartPoint.y) * PAN_SPEED_FACTOR;

        if (Math.abs(xDelta) < 0.1 && Math.abs(yDelta) < 0.1) {
          $interval.cancel(panInterval);
        } else {
          translate(vm.transform, -xDelta, -yDelta);
        }
      }, 30);
    }

    function onVertexClick(vertex, e) {
      switch (vm.tool) {
        case Tool.SCISSORS:
          vm.graph.vertices.splice(vm.graph.vertices.indexOf(vertex), 1);
          e.stopPropagation();
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
