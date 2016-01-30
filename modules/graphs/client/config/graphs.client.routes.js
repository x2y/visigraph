(function () {
  'use strict';

  angular
    .module('graphs.routes')
    .config(routeConfig);

  routeConfig.$inject = ['$stateProvider'];

  function routeConfig($stateProvider) {
    $stateProvider
      .state('graphs', {
        abstract: true,
        url: '/graphs',
        template: '<ui-view/>'
      })
      .state('graphs.list', {
        url: '',
        templateUrl: 'modules/graphs/client/views/list-graphs.client.view.html',
        controller: 'GraphsListController',
        controllerAs: 'vm',
        data: {
          pageTitle: 'Graphs List'
        }
      })
      .state('graphs.create', {
        url: '/create',
        templateUrl: 'modules/graphs/client/views/create-graph.client.view.html',
        controller: 'GraphsController',
        controllerAs: 'vm',
        resolve: {
          graphResolve: newGraph
        },
        data: {
          roles: ['user', 'admin'],
          pageTitle: 'Graphs Create'
        }
      })
      .state('graphs.edit', {
        url: '/:graphId/edit',
        templateUrl: 'modules/graphs/client/views/edit-graph.client.view.html',
        controller: 'GraphsController',
        controllerAs: 'vm',
        resolve: {
          graphResolve: getGraph
        },
        data: {
          roles: ['user', 'admin'],
          pageTitle: 'Edit Graph {{ graphResolve.title }}'
        }
      })
      .state('graphs.view', {
        url: '/:graphId',
        templateUrl: 'modules/graphs/client/views/view-graph.client.view.html',
        controller: 'GraphsController',
        controllerAs: 'vm',
        resolve: {
          graphResolve: getGraph
        },
        data: {
          pageTitle: 'Graph {{ graphResolve.title }}'
        }
      });
  }

  getGraph.$inject = ['$stateParams', 'GraphsService'];

  function getGraph($stateParams, GraphsService) {
    return GraphsService.get({
      graphId: $stateParams.graphId
    }).$promise;
  }

  newGraph.$inject = ['GraphsService'];

  function newGraph(GraphsService) {
    return new GraphsService();
  }
})();
