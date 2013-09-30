var controllers = angular.module('antbutter.controllers', ['antbutter.services']);

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


