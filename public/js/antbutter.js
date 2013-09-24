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
            var letter = element.quarter[0];
            var name = map[letter];
            var year = '20' + element.quarter.slice(1);

            return {
                quarter: element.quarter,
                fullName: name + ' ' + year,
                yearTerm: element.yearTerm
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
    service.instructors = mapQuery('instructors');

    return service;
});

// Main query results
app.factory('resultsService', function ($http) {
    var service = {};

    service.results = [];
    service.query = undefined;
    
    return service;
});

app.factory('externalLinksService', function () {
    var service = {};

    service.getCourseWebsoc = function(yearTerm, short_name, number) {
        return "http://websoc.reg.uci.edu/perl/WebSoc?YearTerm=" + yearTerm + "&Dept=" + encodeURIComponent(short_name) + "&CourseNum=" + number;
    }

    service.getInstructorEvaluations = function (name) {
        return "https://eaterevals.eee.uci.edu/browse/instructor#" + encodeURIComponent(name.slice(0, -4));
    }

    service.getRateMyProfessor = function(name) {
        return "http://ratemyprofessors.com/SelectTeacher.jsp?searchName=" + encodeURIComponent(name.slice(0, -4)) + "&search_submit1=Search&sid=1074#ratingTable";
    }

    return service
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
            $scope.name = 'results';

            $scope.$on('teardown', function (event) {
                $scope.departments = [];
                $scope.courses = [];
                $scope.instructors = [];
            });

            $scope.$on('search', function (event) {
                $scope.showError = false;

                $scope.departments = resultsService.results.departments;
                $scope.courses = resultsService.results.courses;
                $scope.instructors = resultsService.results.instructors;

                $scope.$broadcast('results');
            });

            $scope.$on('empty', function(event) {
                $scope.departments = [];
                $scope.courses = []
                $scope.instructors = [];
                $scope.showError = true;
            });

        },
        template:
            '<div class="results">' +
                '<div ng-show="showError" class="results">No results were found for <span ng-bind="query"></span></div>' +
                '<div class="list-group">' +
                    '<category title="Departments" use="departments">' +
                        '<department ng-repeat="dept in departments"></department>' +
                    '</category>' +
                    '<category title="Courses" use="courses">' +
                        '<course ng-repeat="course in courses"></course>' +
                    '</category>' +
                    '<category title="Instructors" use="instructors">' +
                        '<instructor ng-repeat="instructor in instructors"></course>' +
                    '</category>' +
                '</div>' +
            '</div>'
    }
});

app.directive('category', function () {
    return {
        transclude: true,
        restrict: 'E',
        scope: {
            title: '@title',
            collection: '=use'
        },
        controller: function ($scope, $element, $attrs) {
            $scope.expand = false;

            $scope.$watch('collection', function() {
                $scope.expand = $scope.collection && $scope.collection.length < 5;
            });
        },
        template:
            '<div ng-show="collection" class="page-header">' +
                '<a href="" ng-click="expand = !expand">' +
                    '<h1 class="category">[[title]]</h1>' +
                '</a>' +
                '<span class="results_count">' +
                    '[[collection.length]] results' +
                '</span>' +
            '</div>' +
            '<div ng-show="expand" ng-transclude>' +
            '</div>'
    }
});

app.directive('department', function (searchService) {
    return {
        transclude: false,
        restrict: 'E',
        controller: function ($scope, $element, $attrs) {
            $scope.dept_courses = [];
            $scope.name = 'department';

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
                '<div class="clickable dept-title" ng-click="loadCourses(dept.dept_id)">' +
                    '<h3 style="display: inline;" class="list-group-item-heading dept-heading">[[dept.dept_title]]</h3>' +
                    '<span style="margin-left: 8px;" class="list-group-item-text">[[dept.short_name]]</span>' +
                '</div>' +
                '<course ng-repeat="course in dept_courses"></course>' +
            '</div>'
    }
});

app.directive('instructor', function (searchService, resultsService, externalLinksService) {
    return {
        transclude: false,
        restrict: 'E',
        controller: function ($scope, $element, $attrs) {
            $scope.name = 'instructor';
            $scope.evaluation = externalLinksService.getInstructorEvaluations($scope.instructor.name);
            $scope.ratemyprofessor = externalLinksService.getRateMyProfessor($scope.instructor.name);
        },
        template:
            '<div class="list-group-item no-border">' +
                '<div class="clickable">' +
                    '<div class="course-title">' +
                        '[[instructor.name]]' +
                    '</div>' +
                    '<div class="websoc"><a href="[[evaluation]]" target="_blank">EaterEvals</a></div>' +
                    '<div class="websoc"><a href="[[ratemyprofessor]]" target="_blank">Rate My Professor</a></div>' +
                    '<div class="clearer"><!-- --></div>' +
                '</div>' +
            '</div>'
    }
});

app.directive('course', function (externalLinksService, searchService, resultsService) {
    return {
        transclude: false,
        restrict: 'E',
        controller: function ($scope, $element, $attrs) {
            $scope.name = 'course';
            $scope.course_sections = [];

            $scope.isCcodeQuery = ($scope.$parent.name != 'department');
            $scope.show_dept_name = $scope.$parent.name == 'results';

            if (!$scope.course.short_name) {
                $scope.course.short_name = $scope.dept.short_name;
            }

            $scope.course.websoc = externalLinksService.getCourseWebsoc(resultsService.quarter.yearTerm, $scope.course.short_name, $scope.course.number);

            $scope.loadSections = function (course_id) {
                if ($scope.course_sections.length == 0) {
                    $scope.course_sections = searchService.sections(course_id).then(function (section) {
                        return section;
                    });
                } else {
                    $scope.course_sections = [];
                }
            }

            $scope.$on('teardown', function (event) {
                $scope.course_sections = [];
            });

            if (resultsService.results.courses && resultsService.results.courses.length == 1) {
                $scope.loadSections($scope.course.course_id);
            }
        },
        template:
            '<div class="list-group-item no-border">' +
                '<div class="clickable">' +
                    '<div class="course-title" ng-click="loadSections(course.course_id)">' +
                        '<span><h4 class="inline-dept-name" ng-if="show_dept_name">[[course.short_name]]&nbsp;</h4><h4 style="font-weight: normal; display:inline">[[course.number]]</h4>&nbsp;&nbsp;&nbsp;[[course.title]] - <span class="section_count">[[course.section_count]] sections</span></span>' +
                    '</div>' +
                    '<div class="websoc"><a href="[[course.websoc]]" target="_blank">View in Websoc</a></div>' +
                    '<div class="clearer"><!-- --></div>' +
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

app.directive('section', function(externalLinksService, searchService, resultsService) {
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

            $scope.section.instructors = searchService.instructors($scope.section.section_id).then(function(instructors) {
                instructors = instructors.map(function(element) {
                    element.evaluations = externalLinksService.getInstructorEvaluations(element.name);
                    element.rateMyProfessor = externalLinksService.getRateMyProfessor(element.name);
                    element.showLinks = false;
                    return element;
                });
                return instructors;
            }).catch(function (){
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
                '<div ng-repeat="instructor in section.instructors">' +
                    '<a href="" ng-click="instructor.showLinks = !instructor.showLinks" target="_blank">' +
                        '[[instructor.name]]' +
                    '</a>' +
                    '<div ng-if="instructor.showLinks">' +
                        '<div><a href="[[instructor.rateMyProfessor]]" target="_blank">' +
                            'Rate My Professor' +
                        '</a></div>' +
                        '<div><a href="[[instructor.evaluations]]" target="_blank">' +
                            'EaterEvals' +
                        '</a></div>' +
                    '</div>' +
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
