(function () {
  'use strict';

  angular
    .module('graphs')
    .controller('EditGraphController', EditGraphController);

  EditGraphController.$inject = ['$scope', '$state', 'graphResolve', 'GraphsService', 'Authentication'];

  function EditGraphController($scope, $state, graph, GraphsService, Authentication) {
    var vm = this;

    vm.graph = graph;
    vm.tool = Tool.ADD_ELEMENT;

    vm.authentication = Authentication;
    vm.onClick = onClick;
    vm.save = save;

    EditGraphController.Tool = Tool;


    function onClick(e) {
      switch (vm.tool) {
        case Tool.CURSOR:
          break;
        case Tool.ADD_ELEMENT:
          vm.graph.vertices.push(new GraphsService.Vertex({
            x: e.offsetX,
            y: e.offsetY,
          }));
          break;
        case Tool.ADD_CAPTION:
          break;
        case Tool.SCISSORS:
          break;
        case Tool.PAINTBRUSH:
          break;
      }
    };

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


  var Tool = {
    CURSOR: 'cursor',
    ADD_ELEMENT: 'add_element',
    ADD_CAPTION: 'add_caption',
    SCISSORS: 'scissors',
    PAINTBRUSH: 'paintbrush',
  };
})();
