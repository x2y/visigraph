(function () {
  'use strict';

  angular
    .module('graphs')
    .controller('RotateGraphController', RotateGraphController);

  RotateGraphController.$inject = ['$scope', '$state'];


  function RotateGraphController($scope, $state) {
    var graph = $scope.vm.graph;

    var vm = this;
    vm.rotateLeft = rotateLeft;
    vm.rotateRight = rotateRight;
    vm.flipHorizontally = flipHorizontally;
    vm.flipVertically = flipVertically;


    function rotateLeft() {
      // TODO
    }
    
    function rotateRight() {
      // TODO
    }
    
    function flipHorizontally() {
      // TODO
    }
    
    function flipVertically() {
      // TODO
    }
  }
})();
