var controllers = angular.module('antbutter.controllers', ['antbutter.services', 'ui.bootstrap']);

var RegisterController = function($scope, $rootScope, $modalInstance, authService) {
  $scope.input = {};
  $scope.close = function() {
    $modalInstance.close();
  }

  $scope.error = function(message) {
    $scope.message = message;
  }

  $scope.register = function() {
    authService.register(
      $scope.input.email,
      $scope.input.password,
      $scope.input.firstname,
      $scope.input.lastname
    ).then(function(user) {
      $rootScope.user = user;
      $modalInstance.close();
    }, function(error) {
      $scope.error(error.message);
    });
  }
}

var LoginController = function($scope, $rootScope, $modalInstance, authService) {
  $scope.input = {};

  $scope.close = function() {
    $modalInstance.close();
  }

  $scope.error = function(message) {
    $scope.message = message;
  }

  $scope.login = function() {
    authService.login(
      $scope.input.email,
      $scope.input.password
    ).then(function(user) {
      $modalInstance.close(user);
    }, function(error) {
      $scope.error('Invalid username/password combination.');
    });
  }
}

controllers.controller('HeaderController', function($scope, $rootScope, $modal, $window, authService) {
  var windowElement = angular.element($window);

  $scope.shouldFade = false;
  $scope.scrollPosition = windowElement.scrollTop();

  $scope.checkScroll = function(event) {
    $scope.scrollPosition = windowElement.scrollTop();
    $scope.shouldFade = $scope.scrollPosition > 20;
    if (event && event.type == 'scroll') {
      $scope.$apply();
    }
  }

  windowElement.on('scroll', $scope.checkScroll);

  var refresh = function() {
    $scope.authStatus = authService.status().then(function(user) {
      $scope.firstRefresh = true;
      return user;
    });
  }

  refresh();

  $scope.loginModal = function() {
    var instance = $modal.open({
      templateUrl: 'partials/login.html',
      controller: LoginController,
      keyboard: true
    });

    instance.result.finally(refresh);
  }


  $scope.registerModal = function() {
    var instance = $modal.open({
      templateUrl: 'partials/register.html',
      controller: RegisterController,
      keyboard: true
    });

   instance.result.finally(refresh);
  }


  $scope.logout = function() {
    authService.logout().then(refresh);
  }
});


controllers.controller('SearchController', function ($scope, $timeout, searchService, quarterService, resultsService) {
  $scope.quarters = quarterService.getQuarters().then(function(data) {
    searchService.currentQuarter = data[0];
    return data;
  });

  currentSearch = undefined;
  $scope.search = function (query) {
    $scope.$broadcast('teardown');

    if (currentSearch) {
      $timeout.cancel(currentSearch);
    }

    currentSearch = $timeout(function () {
      query = query.trim();

      if (query.length == 0) {
        return;
      }

      searchService.query = query;
      searchService.search(query).then(function(results) {
        resultsService.results = results;
        resultsService.quarter = searchService.currentQuarter;

        var empty = true;
        for (var key in resultsService.results) {
          if (resultsService.results[key].length > 0) {
            empty = false;

            break;
          }
        }

        if (empty) {
          $scope.$broadcast('empty');
        } else {
          $scope.$broadcast('search');
        }
      });

    }, 200);
  }

  $scope.changeQuarter = function (quarter) {
    searchService.currentQuarter = quarter;
    $scope.$broadcast('teardown');
  }

  $scope.currentQuarter = function () {
    return searchService.currentQuarter;
  }
});


