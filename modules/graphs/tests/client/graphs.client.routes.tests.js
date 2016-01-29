(function () {
  'use strict';

  describe('Graphs Route Tests', function () {
    // Initialize global variables
    var $scope,
      GraphsService;

    //We can start by loading the main application module
    beforeEach(module(ApplicationConfiguration.applicationModuleName));

    // The injector ignores leading and trailing underscores here (i.e. _$httpBackend_).
    // This allows us to inject a service but then attach it to a variable
    // with the same name as the service.
    beforeEach(inject(function ($rootScope, _GraphsService_) {
      // Set a new global scope
      $scope = $rootScope.$new();
      GraphsService = _GraphsService_;
    }));

    describe('Route Config', function () {
      describe('Main Route', function () {
        var mainstate;
        beforeEach(inject(function ($state) {
          mainstate = $state.get('graphs');
        }));

        it('Should have the correct URL', function () {
          expect(mainstate.url).toEqual('/graphs');
        });

        it('Should be abstract', function () {
          expect(mainstate.abstract).toBe(true);
        });

        it('Should have template', function () {
          expect(mainstate.template).toBe('<ui-view/>');
        });
      });

      describe('View Route', function () {
        var viewstate,
          GraphsController,
          mockGraph;

        beforeEach(inject(function ($controller, $state, $templateCache) {
          viewstate = $state.get('graphs.view');
          $templateCache.put('modules/graphs/client/views/view-graph.client.view.html', '');

          // create mock graph
          mockGraph = new GraphsService({
            _id: '525a8422f6d0f87f0e407a33',
            name: 'An Graph about MEAN',
            data: 'MEAN rocks!'
          });

          //Initialize Controller
          GraphsController = $controller('GraphsController as vm', {
            $scope: $scope,
            graphResolve: mockGraph
          });
        }));

        it('Should have the correct URL', function () {
          expect(viewstate.url).toEqual('/:graphId');
        });

        it('Should have a resolve function', function () {
          expect(typeof viewstate.resolve).toEqual('object');
          expect(typeof viewstate.resolve.graphResolve).toEqual('function');
        });

        it('should respond to URL', inject(function ($state) {
          expect($state.href(viewstate, {
            graphId: 1
          })).toEqual('/graphs/1');
        }));

        it('should attach a graph to the controller scope', function () {
          expect($scope.vm.graph._id).toBe(mockGraph._id);
        });

        it('Should not be abstract', function () {
          expect(viewstate.abstract).toBe(undefined);
        });

        it('Should have templateUrl', function () {
          expect(viewstate.templateUrl).toBe('modules/graphs/client/views/view-graph.client.view.html');
        });
      });

      describe('Create Route', function () {
        var createstate,
          GraphsController,
          mockGraph;

        beforeEach(inject(function ($controller, $state, $templateCache) {
          createstate = $state.get('graphs.create');
          $templateCache.put('modules/graphs/client/views/form-graph.client.view.html', '');

          // create mock graph
          mockGraph = new GraphsService();

          //Initialize Controller
          GraphsController = $controller('GraphsController as vm', {
            $scope: $scope,
            graphResolve: mockGraph
          });
        }));

        it('Should have the correct URL', function () {
          expect(createstate.url).toEqual('/create');
        });

        it('Should have a resolve function', function () {
          expect(typeof createstate.resolve).toEqual('object');
          expect(typeof createstate.resolve.graphResolve).toEqual('function');
        });

        it('should respond to URL', inject(function ($state) {
          expect($state.href(createstate)).toEqual('/graphs/create');
        }));

        it('should attach a graph to the controller scope', function () {
          expect($scope.vm.graph._id).toBe(mockGraph._id);
          expect($scope.vm.graph._id).toBe(undefined);
        });

        it('Should not be abstract', function () {
          expect(createstate.abstract).toBe(undefined);
        });

        it('Should have templateUrl', function () {
          expect(createstate.templateUrl).toBe('modules/graphs/client/views/form-graph.client.view.html');
        });
      });

      describe('Edit Route', function () {
        var editstate,
          GraphsController,
          mockGraph;

        beforeEach(inject(function ($controller, $state, $templateCache) {
          editstate = $state.get('graphs.edit');
          $templateCache.put('modules/graphs/client/views/form-graph.client.view.html', '');

          // create mock graph
          mockGraph = new GraphsService({
            _id: '525a8422f6d0f87f0e407a33',
            name: 'An Graph about MEAN',
            data: 'MEAN rocks!'
          });

          //Initialize Controller
          GraphsController = $controller('GraphsController as vm', {
            $scope: $scope,
            graphResolve: mockGraph
          });
        }));

        it('Should have the correct URL', function () {
          expect(editstate.url).toEqual('/:graphId/edit');
        });

        it('Should have a resolve function', function () {
          expect(typeof editstate.resolve).toEqual('object');
          expect(typeof editstate.resolve.graphResolve).toEqual('function');
        });

        it('should respond to URL', inject(function ($state) {
          expect($state.href(editstate, {
            graphId: 1
          })).toEqual('/graphs/1/edit');
        }));

        it('should attach a graph to the controller scope', function () {
          expect($scope.vm.graph._id).toBe(mockGraph._id);
        });

        it('Should not be abstract', function () {
          expect(editstate.abstract).toBe(undefined);
        });

        it('Should have templateUrl', function () {
          expect(editstate.templateUrl).toBe('modules/graphs/client/views/form-graph.client.view.html');
        });

        xit('Should go to unauthorized route', function () {

        });
      });

    });
  });
})();
