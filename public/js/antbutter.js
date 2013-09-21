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

    service.query = '';

    service.search = function (query) {
        return $http.get('/' + this.currentQuarter.quarter + '/search/' + query).success(function(data) {
            return data;
        }).error(function() {
            return undefined;
        });
    }

    service.sections = function (course_id) {
        return $http.get('/' + this.currentQuarter.quarter + '/sections/' + course_id).then(function(result) {
            return result.data;
        });
    }

    service.courses = function (dept_id) {
        return $http.get('/' + this.currentQuarter.quarter +'/courses/' + dept_id).then(function(result) {
            return result.data;
        });
    }

    return service;
});

// Main query results
app.factory('resultsService', function ($http) {
    var service = {};

    service.results = [];
    service.query = undefined;
    service.queryType = 0;

    service.storeResult = function(data) {
        service.queryType = data.data.shift();
        service.results = data.data;
    }
    
    return service;
});

app.controller('SearchController', function ($scope, $timeout, searchService, quarterService, resultsService) {
    $scope.quarters = quarterService.getQuarters().then(function(data) {
        searchService.currentQuarter = data[0];
        return data;
    });

    currentSearch = undefined;
    $scope.search = function (query) {
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
                resultsService.storeResult(results);
                $scope.$broadcast('search');
            }).catch(function() {
                resultsService.results = false;
                $scope.$broadcast('empty');
            });

        }, 700);
    }

    $scope.changeQuarter = function (quarter) {
       searchService.currentQuarter = quarter;
    }

    $scope.currentQuarter = function () {
        return searchService.currentQuarter;
    }
});

app.directive('results', function (resultsService, searchService) {
    return {
        transclude: true,
        restrict: 'E',
        controller: function ($scope, $element) {
            $scope.query = searchService.query;

            $scope.departments = [];
            $scope.courses = []

            $scope.$on('search', function (event) {
                $scope.showError = false;

                switch(resultsService.queryType) {
                    case 0:
                        $scope.departments = resultsService.results;
                        break;
                    case 1:
                    case 2:
                        $scope.courses = resultsService.results;
                        break;
                }
            });

            $scope.$on('empty', function(event) {
                $scope.departments = [];
                $scope.courses = []
                $scope.showError = true;
            });


        },
        template:
            '<div class="results">' +
                '<div ng-show="showError" class="alert alert-danger results">No results were found for <span ng-bind="query"></span></div>' +
                '<div class="list-group">' +
                    '<department ng-repeat="dept in departments" ng-show="courses.length == 0"></department>' +
                    '<course ng-repeat="course in courses" ng-show="courses.length > 0"></course>' +
                '</div>' +
            '</div>'
    }
});

app.directive('department', function (searchService) {
    return {
        transclude: false,
        restrict: 'E',
        controller: function ($scope, $element, $attrs) {
            $scope.dept_courses = [];

            $scope.loadCourses = function (dept_id) {
                if ($scope.dept_courses.length == 0) {
                    $scope.dept_courses = searchService.courses($scope.dept.dept_id);
                } else {
                    $scope.dept_courses = [];
                }
            }

        },
        template:
            '<a href="" class="list-group-item" ng-click="loadCourses(dept.dept_id)">' +
                '<h4 class="list-group-item-heading dept-heading">[[dept.dept_title]]</h4>' +
            '</a>' +
            '<div class="list-group">' +
                '<course ng-repeat="course in dept_courses"></course>' +
            '</div>'
    }
});

app.directive('course', function (searchService) {
    return {
        transclude: false,
        restrict: 'E',
        controller: function ($scope, $element, $attrs) {
            $scope.course_sections = [];

            $scope.indent = false;
            if ($scope.$parent.dept) {
                $scope.indent = true;
            }

            $scope.loadSections = function (course_id) {
                if ($scope.course_sections.length == 0) {
                    $scope.course_sections = searchService.sections(course_id);
                } else {
                    $scope.course_sections = [];
                }
            }
        },
        template:
            '<a href="" ng-click="loadSections(course.course_id)" class="list-group-item">' +
                '<span class="course-title"><strong>[[course.number]]</strong>&nbsp;[[course.title]] - [[course.section_count]] sections</span>' +
            '</a>' +
            '<table ng-if="course_sections.length > 0" class="table">' +
                '<thead>' +
                    '<tr>' +
                        '<th>Code</th>' +
                        '<th>Type</th>' +
                        '<th>Section</th>' +
                        '<th>Units</th>' +
                        '<th>Instructor</th>' +
                        '<th>Max</th>' +
                        '<th>Enrolled</th>' +
                        '<th>Req</th>' +
                        '<th>Restrictions</th>' +
                        '<th>Status</th>' +
                    '</tr>' +
                '</thead>' +
                '<tbody>' +
                    '<tr class="section" ng-repeat="section in course_sections"></tr>' +
                '</tbody>' +
            '</table>'
    }
});

app.directive('section', function() {
    return {
        transclude: false,
        restrict: 'C',
        controller: function ($scope, $element, $attrs) {
        },
        template:
            '<td>' +
                '[[section.ccode]]' +
            '</td>' +
            '<td>' +
                '[[section.type]]' +
            '</td>' +
            '<td>' +
                '[[section.section]]' +
            '</td>' +
            '<td>' +
                '[[section.units]]' +
            '</td>' +
            '<td>' +
                '[[section.instructor]]' +
            '</td>' +
            '<td>' +
                '[[section.max]]' +
            '</td>' +
            '<td>' +
                '[[section.enrolled]]' +
            '</td>' +
            '<td>' +
                '[[section.req]]' +
            '</td>' +
            '<td>' +
                '[[section.restrictions]]' +
            '</td>' +
            '<td>' +
                '[[section.status]]' +
            '</td>'
    }
});
