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

app.factory('timeService', function () {
    var service = {};

    service.convertMilitaryTimeToReadable = function(time, isEnd) {
        time = time.slice(0, 5);

        var hours = parseInt(time.slice(0, 2));
        var minutes = parseInt(time.slice(3, 5));

        var isPm;
        if (hours >= 12) {
            isPm = true;

            if (hours >= 13)
                hours -= 12;

        } else {
            isPm = false;
        }

        hours = hours.toString();
        minutes = minutes.toString();

        if (minutes.length == 1) {
            minutes = '0' + minutes;
        }

        time = hours + ':' + minutes;

        if (isEnd) {
            time += (isPm ? 'pm' : 'am');
        }

        return time;
    }

    return service;
});

app.factory('searchService', function ($http) {
    var service = {};

    service.query = '';

    var mapQuery = function (route) {
        return function (query) {
            return $http.get('/' + this.currentQuarter.quarter + '/' + route + '/' + query, { cache: true }).then(function(result) {
                return result.data;
            });
        };
    }

    service.search = mapQuery('search');
    service.sections = mapQuery('sections'); 
    service.courses = mapQuery('courses');
    service.meetings = mapQuery('meetings');
    service.final = mapQuery('final');

    return service;
});

// Main query results
app.factory('resultsService', function ($http) {
    var service = {};

    service.results = [];
    service.query = undefined;
    service.queryType = 0;

    service.storeResult = function(data) {
        if (data.length > 0) {
            service.queryType = data.shift();
        } else {
            service.queryType = [];
        }

        service.results = data;
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
                resultsService.storeResult(results);

                if (results.length == 0 ) {
                    $scope.$broadcast('empty');
                } else {
                    $scope.$broadcast('search');
                }
            });

        }, 200);
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

            $scope.$on('teardown', function (event) {
                $scope.departments = [];
                $scope.courses = [];
            });

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

            $scope.$on('teardown', function (event) {
                $scope.dept_courses = [];
            });

        },
        template:
            '<div href="" class="list-group-item no-border">' +
                '<div class="clickable" ng-click="loadCourses(dept.dept_id)" class="course-title">' +
                    '<h3 style="display: inline;" class="list-group-item-heading dept-heading">[[dept.dept_title]]</h3>' +
                    '<span style="margin-left: 8px;" class="list-group-item-text">[[dept.short_name]]</span>' +
                '</div>' +
                '<course ng-repeat="course in dept_courses"></course>' +
            '</div>'
    }
});

app.directive('course', function (searchService, resultsService) {
    return {
        transclude: false,
        restrict: 'E',
        controller: function ($scope, $element, $attrs) {
            $scope.course_sections = [];

            $scope.isCcodeQuery = (resultsService.queryType == 2);
            $scope.show_dept_name = (resultsService.queryType == 1) || $scope.isCcodeQuery;

            $scope.loadSections = function (course_id) {
                if ($scope.course_sections.length == 0) {
                    $scope.course_sections = searchService.sections(course_id).then(function (section) {
                        // In case of multiple instructors
                        section.forEach(function(element) {
                            var regex = /\.(?=\w|\s)/;
                            var index = element.instructor.search(regex);
                            if (index > -1) {
                                element.instructor = [element.instructor.slice(0, index + 1), element.instructor.slice(index + 1)];
                            } else {
                                element.instructor = [element.instructor];
                            }
                        });

                        return section;
                    });
                } else {
                    $scope.course_sections = [];
                }
            }

            $scope.$on('teardown', function (event) {
                $scope.course_sections = [];
            });

            if ($scope.isCcodeQuery) {
                $scope.loadSections($scope.course.course_id);
            }
        },
        template:
            '<div class="list-group-item no-border">' +
                '<div class="clickable" ng-click="loadSections(course.course_id)"class="course-title">' +
                    '<span><h4 class="inline-dept-name" ng-if="show_dept_name">[[course.short_name]]&nbsp;</h4><h4 style="font-weight: normal; display:inline">[[course.number]]</h4>&nbsp;&nbsp;&nbsp;[[course.title]] - <span class="section_count">[[course.section_count]] sections</span></span>' +
                '</div>' +
                '<table ng-if="course_sections.length > 0" class="table">' +
                    '<thead>' +
                        '<tr>' +
                            '<th>Code</th>' +
                            '<th>Type</th>' +
                            '<th>Section</th>' +
                            '<th>Units</th>' +
                            '<th>Instructor</th>' +
                            '<th class="time">Meetings</th>' +
                            '<th class="time">Final</th>' +
                            '<th>Enrolled</th>' +
                            '<th>Max</th>' +
                            '<th>Req</th>' +
                            '<th>Restrictions</th>' +
                            '<th>Status</th>' +
                        '</tr>' +
                    '</thead>' +
                    '<tbody>' +
                        '<tr class="section" ng-repeat="section in course_sections"></tr>' +
                    '</tbody>' +
                '</table>' +
            '</div>' 
    }
});

app.directive('section', function(searchService, resultsService) {
    return {
        transclude: false,
        restrict: 'C',
        controller: function ($scope, $element, $attrs) {
            $scope.isLecture = ($scope.section.type == 'Lecture');

            $scope.section.meetings = searchService.meetings($scope.section.section_id).catch(function (){
                return undefined;
            });

            $scope.finalLoaded = false;
            $scope.section.final = searchService.final($scope.section.section_id).catch(function (){
                return undefined;
            });

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
                '<div ng-repeat="instructor in section.instructor">' +
                    '<a href="https://eaterevals.eee.uci.edu/browse/instructor#[[instructor.slice(0, -4)]]" target="_blank">' +
                        '[[instructor]]' +
                    '</a>' +
                '</div>' +
            '</td>' +
            '<td>' +
                '<div ng-repeat="meeting in section.meetings" class="time">[[meeting | meeting]]</div>' +
                '<div ng-if="!section.meetings">TBA</div>' +
            '</td>' +
            '<td>' +
                '<div ng-repeat="final in section.final" class="time">[[final | final]]</div>' +
                '<div ng-if="!section.final">TBA</div>' +
            '<td>' +
                '[[section.enrolled]]' +
            '</td>' +
            '<td>' +
                '[[section.max]]' +
            '</td>' +
            '<td>' +
                '[[section.req]]' +
            '</td>' +
            '<td>' +
                '[[section.restrictions]]' +
            '</td>' +
            '<td ng-switch="section.status">' +
                '<span ng-switch-when="open" class="open">[[section.status]]</span>' +
                '<span ng-switch-when="waitl" class="waitl">[[section.status]]</span>' +
                '<span ng-switch-when="full" class="full">[[section.status]]</span>' +
                '<span ng-switch-when="newonly" class="newonly">[[section.status]]</span>' +
            '</td>'
    }
});

app.filter('meeting', function(timeService) {
    return function(input) {
        if (!input || (input == 'TBA')) {
            return 'TBA';
        } else {
            var time ='';
            if (input.sunday) {
                time += 'Su';
            }

            if (input.monday) {
                time += 'M';
            }

            if (input.tuesday) {
                time += 'Tu';
            }

            if (input.wednesday) {
                time += 'W';
            }

            if (input.thursday) {
                time += 'Th';
            }

            if (input.friday) {
                time += 'F';
            }

            if (input.saturday) {
                time += 'Sa';
            }

            time += ' ';

            time +=
                timeService.convertMilitaryTimeToReadable(input.start) + ' - ' +
                timeService.convertMilitaryTimeToReadable(input.end, true) +
                ' at ' + (input.place ? input.place : 'TBA');

            return time;
        }
    }
});

app.filter('final', function(timeService) {
    return function(input) {
        if (!input || input.length == 0 || (input == 'TBA')) {
            return 'TBA';
        } else {
            var time = '';
            time +=
            input.day + ', ' +
            timeService.convertMilitaryTimeToReadable(input.start) + ' - ' +
            timeService.convertMilitaryTimeToReadable(input.end, true);

            return time;
        }
    }
});

app.filter('eatereval', function() {
    return function(input) {
    }
});
