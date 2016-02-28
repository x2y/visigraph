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
      $scope.vm.areVertexLabelsShown = !$scope.vm.areVertexLabelsShown;
    }

    function toggleVertexWeights() {
      $scope.vm.areVertexWeightsShown = !$scope.vm.areVertexWeightsShown;
    }

    function toggleEdgeHandles() {
      $scope.vm.areEdgeHandlesShown = !$scope.vm.areEdgeHandlesShown;
    }

    function toggleEdgeLabels() {
      $scope.vm.areEdgeLabelsShown = !$scope.vm.areEdgeLabelsShown;
    }

    function toggleEdgeWeights() {
      $scope.vm.areEdgeWeightsShown = !$scope.vm.areEdgeWeightsShown;
    }

    function toggleCaptionHandles() {
      $scope.vm.areCaptionHandlesShown = !$scope.vm.areCaptionHandlesShown;
    }
  }
})();
