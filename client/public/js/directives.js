var directives = angular.module('antbutter.directives', []);

directives.directive('results', function (resultsService, searchService) {
    return {
        transclude: true,
        restrict: 'E',
        controller: function ($scope, $element) {
            $scope.query = searchService.query;
            $scope.name = 'results';

            var clear = function() {
                $scope.departments = [];
                $scope.courses = [];
                $scope.instructors = [];
                $scope.places = [];
            }

            $scope.$on('teardown', function (event) {
                clear();
            });

            $scope.$on('search', function (event) {
                $scope.showError = false;

                $scope.departments = resultsService.results.departments;
                $scope.courses = resultsService.results.courses;
                $scope.instructors = resultsService.results.instructors;
                $scope.places = resultsService.results.places;

                $scope.$broadcast('results');
            });

            $scope.$on('empty', function(event) {
                clear();
                $scope.showError = true;
            });

        },
        template:
            '<div class="results">' +
                '<div ng-show="showError" class="results">No results were found for <span ng-bind="query"></span></div>' +
                '<div class="list-group">' +
                    '<category title="Places" use="places">' +
                        '<place ng-repeat="place in places"></place>' +
                    '</category>' +
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

directives.directive('category', function () {
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
                $scope.expand = $scope.collection && $scope.collection.length < 10;
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

directives.directive('place', function(externalLinksService) {
    return {
        transclude: false,
        restrict: 'E',
        controller: function ($scope, $element, $attrs) {
            $scope.image = externalLinksService.getMapImage($scope.place);
            $scope.link = externalLinksService.getMapLink($scope.place);
            $scope.shouldExpand = false;

            $scope.expand = function() {
                $scope.shouldExpand = !$scope.shouldExpand;
            }
        },
        template:
            '<div class="list-group-item no-border">' +
                '<div class="clickable dept-title" ng-click="expand()">' +
                    '<h3 style="display: inline;" class="list-group-item-heading dept-heading">' +
                        '[[place.name]]' +
                    '</h3>' +
                    '<div class="clearer"><!-- --></div>' +
                '</div>' +
                '<a href="[[link]]" target="_blank">' +
                    '<img ng-src="[[image]]" ng-if="shouldExpand">' +
                '</a>' +
            '</div>'
    }
});


directives.directive('department', function (searchService) {
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

directives.directive('instructor', function (searchService, resultsService, externalLinksService) {
    return {
        transclude: false,
        restrict: 'E',
        controller: function ($scope, $element, $attrs) {
            $scope.instructor_courses = [];
            $scope.name = 'instructor';

            $scope.evaluation = externalLinksService.getInstructorEvaluations($scope.instructor.name);
            $scope.ratemyprofessor = externalLinksService.getRateMyProfessor($scope.instructor.name);
            $scope.loadCourses = function (instructorId) {
                if ($scope.instructor_courses.length == 0) {
                    $scope.instructor_courses = searchService.instructor.courses(instructorId);
                } else {
                    $scope.instructor_courses = [];
                }
            }

            $scope.$on('teardown', function (event) {
                $scope.instructor_courses = [];
            });
        },
        template:
            '<div class="list-group-item no-border">' +
                '<div class="clickable" ng-click="loadCourses(instructor.instructor_id)">' +
                    '<div class="course-title">' +
                        '[[instructor.name]]' +
                    '</div>' +
                    '<div class="websoc">' +
                        '<a href="[[evaluation]]" class="external-link" target="_blank">EaterEvals</a>' +
                        '<a href="[[ratemyprofessor]]" class="external-link" target="_blank">Rate My Professor</a>' +
                    '</div>' +
                    '<div class="clearer"><!-- --></div>' +
                '</div>' +
                '<course ng-repeat="course in instructor_courses"></course>' +
            '</div>'
    }
});

directives.directive('course', function (externalLinksService, searchService, resultsService) {
    return {
        transclude: false,
        restrict: 'E',
        controller: function ($scope, $element, $attrs) {
            $scope.name = 'course';
            $scope.course_sections = [];

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
                        '<span><h4 class="inline-dept-name" ng-if="show_dept_name">[[course.short_name]]&nbsp;</h4><h4 style="font-weight: normal; display:inline">[[course.number]]</h4>&nbsp;&nbsp;&nbsp;[[course.title]]<span class="section_count" ng-if="course.section_count"> - [[course.section_count]] sections</span></span>' +
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

directives.directive('section', function(externalLinksService, searchService, resultsService) {
    return {
        transclude: false,
        restrict: 'C',
        controller: function ($scope, $element, $attrs) {
            $scope.isLecture = ($scope.section.type == 'Lecture');

            $scope.section.meetings = searchService.meetings($scope.section.section_id).catch(function (){
                return undefined;
            });

            if ($scope.section.status == 'full' || $scope.section.status == 'waitl') {
                $scope.enableSms = true;
            }

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
                '<div class="text-me" ng-if="enableSms">' +
                    'Text me when it opens! (Coming soon)' +
                '</div>' +
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

directives.directive('equals', function() {
  return {
    restrict: 'A',
    require: '?ngModel',
    link: function($scope, $elem, $attrs, ngModel) {
      $scope.$watch($attrs.ngModel, function() {
        validate();
      });

      $attrs.$observe('equals', function (val) {
        validate();
      });

      var validate = function() {
        var val1 = ngModel.$viewValue;
        var val2 = $attrs.equals;

        ngModel.$setValidity('equals', val1 === val2);
      };
    }
  }
});
