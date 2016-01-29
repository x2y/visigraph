(function () {
  'use strict';

  angular
    .module('graphs')
    .controller('GraphsListController', GraphsListController);

  GraphsListController.$inject = ['GraphsService'];

  function GraphsListController(GraphsService) {
    var vm = this;

    vm.graphs = GraphsService.query();
  }
})();
