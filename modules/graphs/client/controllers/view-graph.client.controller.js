(function () {
  'use strict';

  angular
    .module('graphs')
    .controller('ViewGraphController', ViewGraphController);

  ViewGraphController.$inject = ['$scope', '$state', 'graphResolve', 'GraphsService', 'Authentication'];

  function ViewGraphController($scope, $state, graph, GraphsService, Authentication) {
    var vm = this;

    vm.graph = graph;
    vm.authentication = Authentication;
    vm.remove = remove;


    function remove() {
      if (confirm('Are you sure you want to delete?')) {
        vm.graph.$remove($state.go('graphs.list'));
      }
    }
  }
})();
