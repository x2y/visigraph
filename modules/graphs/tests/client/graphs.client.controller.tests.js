(function () {
  'use strict';

  describe('Graphs Controller Tests', function () {
    // Initialize global variables
    var GraphsController,
      $scope,
      $httpBackend,
      $state,
      Authentication,
      GraphsService,
      mockGraph;

    // The $resource service augments the response object with methods for updating and deleting the resource.
    // If we were to use the standard toEqual matcher, our tests would fail because the test values would not match
    // the responses exactly. To solve the problem, we define a new toEqualData Jasmine matcher.
    // When the toEqualData matcher compares two objects, it takes only object properties into
    // account and ignores methods.
    beforeEach(function () {
      jasmine.addMatchers({
        toEqualData: function (util, customEqualityTesters) {
          return {
            compare: function (actual, expected) {
              return {
                pass: angular.equals(actual, expected)
              };
            }
          };
        }
      });
    });

    // Then we can start by loading the main application module
    beforeEach(module(ApplicationConfiguration.applicationModuleName));

    // The injector ignores leading and trailing underscores here (i.e. _$httpBackend_).
    // This allows us to inject a service but then attach it to a variable
    // with the same name as the service.
    beforeEach(inject(function ($controller, $rootScope, _$state_, _$httpBackend_, _Authentication_, _GraphsService_) {
      // Set a new global scope
      $scope = $rootScope.$new();

      // Point global variables to injected services
      $httpBackend = _$httpBackend_;
      $state = _$state_;
      Authentication = _Authentication_;
      GraphsService = _GraphsService_;

      // create mock graph
      mockGraph = new GraphsService({
        _id: '525a8422f6d0f87f0e407a33',
        name: 'An Graph about MEAN',
        data: 'MEAN rocks!'
      });

      // Mock logged in user
      Authentication.user = {
        roles: ['user']
      };

      // Initialize the Graphs controller.
      GraphsController = $controller('GraphsController as vm', {
        $scope: $scope,
        graphResolve: {}
      });

      //Spy on state go
      spyOn($state, 'go');
    }));

    describe('vm.save() as create', function () {
      var sampleGraphPostData;

      beforeEach(function () {
        // Create a sample graph object
        sampleGraphPostData = new GraphsService({
          name: 'An Graph about MEAN',
          data: 'MEAN rocks!'
        });

        $scope.vm.graph = sampleGraphPostData;
      });

      it('should send a POST request with the form input values and then locate to new object URL', inject(function (GraphsService) {
        // Set POST response
        $httpBackend.expectPOST('api/graphs', sampleGraphPostData).respond(mockGraph);

        // Run controller functionality
        $scope.vm.save(true);
        $httpBackend.flush();

        // Test URL redirection after the graph was created
        expect($state.go).toHaveBeenCalledWith('graphs.view', {
          graphId: mockGraph._id
        });
      }));

      it('should set $scope.vm.error if error', function () {
        var errorMessage = 'this is an error message';
        $httpBackend.expectPOST('api/graphs', sampleGraphPostData).respond(400, {
          message: errorMessage
        });

        $scope.vm.save(true);
        $httpBackend.flush();

        expect($scope.vm.error).toBe(errorMessage);
      });
    });

    describe('vm.save() as update', function () {
      beforeEach(function () {
        // Mock graph in $scope
        $scope.vm.graph = mockGraph;
      });

      it('should update a valid graph', inject(function (GraphsService) {
        // Set PUT response
        $httpBackend.expectPUT(/api\/graphs\/([0-9a-fA-F]{24})$/).respond();

        // Run controller functionality
        $scope.vm.save(true);
        $httpBackend.flush();

        // Test URL location to new object
        expect($state.go).toHaveBeenCalledWith('graphs.view', {
          graphId: mockGraph._id
        });
      }));

      it('should set $scope.vm.error if error', inject(function (GraphsService) {
        var errorMessage = 'error';
        $httpBackend.expectPUT(/api\/graphs\/([0-9a-fA-F]{24})$/).respond(400, {
          message: errorMessage
        });

        $scope.vm.save(true);
        $httpBackend.flush();

        expect($scope.vm.error).toBe(errorMessage);
      }));
    });

    describe('vm.remove()', function () {
      beforeEach(function () {
        //Setup graphs
        $scope.vm.graph = mockGraph;
      });

      it('should delete the graph and redirect to graphs', function () {
        //Return true on confirm message
        spyOn(window, 'confirm').and.returnValue(true);

        $httpBackend.expectDELETE(/api\/graphs\/([0-9a-fA-F]{24})$/).respond(204);

        $scope.vm.remove();
        $httpBackend.flush();

        expect($state.go).toHaveBeenCalledWith('graphs.list');
      });

      it('should should not delete the graph and not redirect', function () {
        //Return false on confirm message
        spyOn(window, 'confirm').and.returnValue(false);

        $scope.vm.remove();

        expect($state.go).not.toHaveBeenCalled();
      });
    });
  });
})();
