(function () {
  'use strict';

  angular
    .module('graphs')
    .controller('ZoomGraphController', ZoomGraphController);

  ZoomGraphController.$inject = ['$scope', '$state'];


  var SCALE_FACTOR = 1.25;


  function ZoomGraphController($scope, $state) {
    var graph = $scope.vm.graph;

    var vm = this;
    vm.fitGraph = fitGraph;
    vm.resetZoom = resetZoom;
    vm.zoomIn = zoomIn;
    vm.zoomOut = zoomOut;


    function fitGraph() {
      // TODO
    }
    
    function resetZoom() {
      $scope.vm.scaleViewportAroundCenter(1 / $scope.vm.transform[0][0]);
    }
    
    function zoomIn() {
      $scope.vm.scaleViewportAroundCenter(SCALE_FACTOR);
    }
    
    function zoomOut() {
      $scope.vm.scaleViewportAroundCenter(1 / SCALE_FACTOR);
    }
  }
})();
