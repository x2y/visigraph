(function () {
  'use strict';

  angular
    .module('graphs')
    .controller('AlignGraphController', AlignGraphController);

  AlignGraphController.$inject = ['$scope', '$state'];


  function AlignGraphController($scope, $state) {
    var graph = $scope.vm.graph;

    var vm = this;
    vm.alignHorizontally = alignHorizontally;
    vm.alignVertically = alignVertically;
    vm.distributeHorizontally = distributeHorizontally;
    vm.distributeVertically = distributeVertically;


    function alignHorizontally() {
      // TODO
    }
    
    function alignVertically() {
      // TODO
    }
    
    function distributeHorizontally() {
      // TODO
    }
    
    function distributeVertically() {
      // TODO
    }
  }
})();
