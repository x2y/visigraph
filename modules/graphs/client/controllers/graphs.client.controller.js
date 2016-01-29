(function () {
  'use strict';

  angular
    .module('graphs')
    .controller('GraphsController', GraphsController);

  GraphsController.$inject = ['$scope', '$state', 'graphResolve', 'Authentication'];

  function GraphsController($scope, $state, graph, Authentication) {
    var vm = this;

    vm.graph = graph;
    vm.authentication = Authentication;
    vm.error = null;
    vm.form = {};
    vm.remove = remove;
    vm.save = save;

    // Remove existing Graph
    function remove() {
      if (confirm('Are you sure you want to delete?')) {
        vm.graph.$remove($state.go('graphs.list'));
      }
    }

    // Save Graph
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
        $state.go('graphs.view', {
          graphId: res._id
        });
      }

      function errorCallback(res) {
        vm.error = res.data.message;
      }
    }
  }
})();
