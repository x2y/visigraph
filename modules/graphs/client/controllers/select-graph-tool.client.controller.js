(function () {
  'use strict';

  angular
    .module('graphs')
    .controller('SelectGraphToolController', SelectGraphToolController);

  SelectGraphToolController.$inject = ['$scope', '$state'];


  function SelectGraphToolController($scope, $state) {
    var graph = $scope.vm.graph;

    var vm = this;
    vm.selectTool = selectTool;


    function selectTool(tool) {
      $scope.vm.tool = tool;
    }
  }
})();
