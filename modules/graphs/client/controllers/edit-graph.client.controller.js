(function () {
  'use strict';

  angular
    .module('graphs')
    .controller('EditGraphController', EditGraphController);

  EditGraphController.$inject = ['$scope', '$state', 'graphResolve', 'GraphsService', 'Authentication'];

  function EditGraphController($scope, $state, graph, GraphsService, Authentication) {
    var vm = this;

    vm.graph = graph;
    vm.authentication = Authentication;
    vm.onClick = onClick;
    vm.save = save;


    function onClick(e) {
      vm.graph.vertices.push(new GraphsService.Vertex({
        x: e.offsetX,
        y: e.offsetY,
      }));
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
})();
