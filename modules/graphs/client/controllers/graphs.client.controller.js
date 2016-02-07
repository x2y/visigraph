(function () {
  'use strict';

  angular
    .module('graphs')
    .controller('GraphsController', GraphsController);

  GraphsController.$inject = ['$scope', '$state', 'graphResolve', 'GraphsService', 'Authentication'];

  function GraphsController($scope, $state, graph, GraphsService, Authentication) {
    var vm = this;

    vm.graph = graph;
    vm.authentication = Authentication;
    vm.error = null;
    vm.form = {};
    vm.enforceRuleValidity = enforceRuleValidity;
    vm.remove = remove;
    vm.save = save;


    vm.foobar = function(e) {
      vm.graph.vertices.push(new GraphsService.Vertex({
        x: e.offsetX,
        y: e.offsetY,
      }));
    };

    function enforceRuleValidity() {
      if (!vm.graph.allowCycles) {
        vm.graph.allowLoops = false;
        if (!vm.graph.allowDirectedEdges) {
          vm.graph.allowMultiEdges = false;
        }
      }
    }

    function remove() {
      if (confirm('Are you sure you want to delete?')) {
        vm.graph.$remove($state.go('graphs.list'));
      }
    }

    function save(isValid) {
      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'vm.form.graphForm');
        return false;
      }

      // TODO: move create/update logic to service
      if (vm.graph._id) {
        vm.graph.$update(successCallback, errorCallback);
      } else {
        vm.graph.$save(successCallback, errorCallback);
      }


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
