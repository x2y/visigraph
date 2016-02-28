(function () {
  'use strict';

  angular
    .module('graphs')
    .controller('ScaleGraphController', ScaleGraphController);

  ScaleGraphController.$inject = ['$scope', '$state'];


  function ScaleGraphController($scope, $state) {
    var graph = $scope.vm.graph;

    var vm = this;
    vm.contract = contract;
    vm.expand = expand;


    function contract() {
      // TODO
    }
    
    function expand() {
      // TODO
    }
  }
})();
