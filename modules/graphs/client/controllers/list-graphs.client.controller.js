(function () {
  'use strict';

  angular
    .module('graphs')
    .controller('GraphListController', GraphListController);

  GraphListController.$inject = ['GraphsService'];

  function GraphListController(GraphsService) {
    var vm = this;

    vm.graphs = GraphsService.query();
  }
})();
