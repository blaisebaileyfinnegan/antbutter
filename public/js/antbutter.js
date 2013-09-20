var app = angular.module('antbutter', [], function($interpolateProvider) {
    $interpolateProvider.startSymbol('[[');
    $interpolateProvider.endSymbol(']]');
});

app.factory('quarterService', function ($http) {
    var service = {};

    var map = {
        F: 'Fall',
        W: 'Winter',
        S: 'Spring',
        Y: 'Summer Session I',
        M: 'Summer 10wk',
        Z: 'Summer Session II'
    };

    var mapQuarters = function (quarters) {
        return quarters.map(function (element) {
            var letter = element[0];
            var name = map[letter];
            var year = '20' + element.slice(1);

            return {
                quarter: element,
                fullName: name + ' ' + year
            }
        })
    }

    service.getQuarters = function() {
        return $http.get('/quarters').then(function (result) {
            return mapQuarters(result.data);
        });
    }

    return service;
});

app.factory('searchService', function ($http) {
    var service = {};

    service.search = function (quarter, query) {
        return $http.get('/' + quarter + '/search/' + query);
    }

    return service;
});

app.controller('SearchController', function ($scope, searchService, quarterService) {
    $scope.quarters = quarterService.getQuarters().then(function(data) {
        $scope.currentQuarter = data[0];
        return data;
    });

    $scope.search = function (query) {
        query = query.trim();

        if (query.length == 0) {
            return;
        }

        $scope.results = searchService.search($scope.currentQuarter.quarter, query);
    }

    $scope.changeQuarter = function (quarter) {
        $scope.currentQuarter = quarter;
    }
});
