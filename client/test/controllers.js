describe('Controllers:', function() {
  beforeEach(function() {
    module('antbutter.controllers');
  });

  describe('SearchController', function() {
    var mocks = {};
    var $scope;
    var searchController;
    var searchService;
    var realTimeout;

    inject(function($timeout) {
      realTimeout = $timeout;
    });

    /**
     * Since $timeout is not an object method, it's impossible to spy on it
     * without creating our own mock object
     */
    angular.module('TimeoutMock', []).factory('$timeout', function() {
      $timeout = jasmine.createSpy();
      $timeout.cancel = jasmine.createSpy();

      mocks.$timeout = $timeout;
      mocks.$timeout.cancel = $timeout.cancel;

      return $timeout;
    });

    beforeEach(module('TimeoutMock'));

    beforeEach(inject(function($rootScope, $controller, _$timeout_, _searchService_) {
      $scope = $rootScope;
      $timeout = _$timeout_;
      searchService = _searchService_;
      searchController = $controller('SearchController', {
        $scope: $scope,
        $timeout: $timeout
      });
    }));

    it('should not search immediately when the user starts typing',
      function() {
        $scope.search('Buttermilk');
        expect(searchService.query).not.toEqual('Buttermilk');
      });

    it('instead, it should activate after a period of time as a sort of debouncing technique', function () {
      $scope.search('Buttermilk');
      expect(mocks.$timeout).toHaveBeenCalled();
    });

    it('should tear down the current results', function () {
      var listener = jasmine.createSpy();
      $scope.$on('teardown', listener);

      $scope.search('hahahaha');
      expect(listener).toHaveBeenCalled();
    });

    describe('changeQuarter', function () {
      it('should change the current quarter', function() {
        $scope.changeQuarter('wee');
        expect(searchService.currentQuarter).toEqual('wee');
      });
    });
  });
});