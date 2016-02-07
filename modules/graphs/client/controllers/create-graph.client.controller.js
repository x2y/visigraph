(function () {
  'use strict';

  angular
    .module('graphs')
    .controller('CreateGraphController', CreateGraphController);

  CreateGraphController.$inject = ['$scope', '$state', 'graphResolve', 'GraphsService', 'Authentication'];

  function CreateGraphController($scope, $state, graph, GraphsService, Authentication) {
    var vm = this;

    vm.graph = graph;
    vm.authentication = Authentication;
    vm.error = null;
    vm.form = {};
    vm.enforceRuleValidity = enforceRuleValidity;
    vm.save = save;


    function enforceRuleValidity() {
      if (!vm.graph.allowCycles) {
        vm.graph.allowLoops = false;
        if (!vm.graph.allowDirectedEdges) {
          vm.graph.allowMultiEdges = false;
        }
      }
    }

    function save(isValid) {
      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'vm.form.graphForm');
        return false;
      }

      vm.graph.$save(successCallback, errorCallback);


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
