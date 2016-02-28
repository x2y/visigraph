(function () {
  'use strict';

  angular
    .module('graphs')
    .controller('ZoomGraphController', ZoomGraphController);

  ZoomGraphController.$inject = ['$scope', '$state'];


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
      // TODO
    }
    
    function zoomIn() {
      // TODO
    }
    
    function zoomOut() {
      // TODO
    }
  }
})();
