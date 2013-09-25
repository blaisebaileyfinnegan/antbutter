var filters = angular.module('antbutter.filters', ['antbutter.services']);

filters.filter('meeting', function(timeService) {
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

filters.filter('final', function(timeService) {
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

