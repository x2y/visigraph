(function () {
  'use strict';

  angular
    .module('graphs')
    .controller('DecorateGraphController', DecorateGraphController);

  DecorateGraphController.$inject = ['$scope', '$state'];


  function DecorateGraphController($scope, $state) {
    var graph = $scope.vm.graph;

    var vm = this;
    vm.toggleVertexLabels = toggleVertexLabels;
    vm.toggleVertexWeights = toggleVertexWeights;
    vm.toggleEdgeHandles = toggleEdgeHandles;
    vm.toggleEdgeLabels = toggleEdgeLabels;
    vm.toggleEdgeWeights = toggleEdgeWeights;
    vm.toggleCaptionHandles = toggleCaptionHandles;


    function toggleVertexLabels() {
      // TODO
    }

    function toggleVertexWeights() {
      // TODO
    }

    function toggleEdgeHandles() {
      // TODO
    }

    function toggleEdgeLabels() {
      // TODO
    }

    function toggleEdgeWeights() {
      // TODO
    }

    function toggleCaptionHandles() {
      // TODO
    }
  }
})();
