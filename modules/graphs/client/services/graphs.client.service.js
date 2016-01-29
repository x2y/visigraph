(function () {
  'use strict';

  angular
    .module('graphs.services')
    .factory('GraphsService', GraphsService);

  GraphsService.$inject = ['$resource'];

  function GraphsService($resource) {
    return $resource('api/graphs/:graphId', {
      graphId: '@_id'
    }, {
      update: {
        method: 'PUT'
      }
    });
  }
})();
