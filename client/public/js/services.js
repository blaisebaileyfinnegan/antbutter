var services = angular.module('antbutter.services', []);

services.factory('quarterService', function ($http) {
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
            return mapQuarters(result.data).reverse();
        });
    }

    return service;
});

services.factory('timeService', function () {
    var service = {};

    service.convertMilitaryTimeToReadable = function(time, isEnd) {
        var time = time.split(':');

        var hours = parseInt(time[0]);
        var minutes = parseInt(time[1]);

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

services.factory('searchService', function ($http) {
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

services.factory('externalLinksService', function () {
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

    service.getMapLink = function(place) {
        return "http://maps.google.com/?q=" + place.latitude + "," + place.longitude;
    }

    service.getMapImage = function(place) {
        return "http://maps.googleapis.com/maps/api/staticmap?center=" + place.latitude + "," + place.longitude + "&zoom=17&visual_refresh=true&size=800x600&sensor=false&markers=" + encodeURIComponent("color:red|size:mid|" + place.latitude + "," + place.longitude);
    }

    return service
});


