
describe('Filters:', function() {
    beforeEach(function() {
        module('antbutter.filters');
    });

    describe('meeting', function() {
        var meeting;

        beforeEach(function() {
            inject(function ($filter) {
                meeting = $filter('meeting');
            });
        });

        var input = {
            meeting_id: 94,
            section_id: 96,
            start: "15:00:00",
            end: "16:20:00",
            place: "HH 207",
            sunday: 1,
            monday: 1,
            tuesday: 1,
            wednesday: 1,
            thursday: 1,
            friday: 1,
            saturday: 1
        }

        it('should return a formatted meeting time such as MWF 12:00-12:50pm at DBH', function() {
            expect(meeting(input)).toEqual('SuMTuWThFSa 3:00 - 4:20pm at HH 207');
        });
    });

    describe('final', function() {
        var final;

        beforeEach(function() {
            inject(function ($filter) {
                final = $filter('final');
            });
        });

        it('should return a formatted final time', function() {
            var input = {
                final_id: 781,
                section_id: 5558,
                day: "Dec 10",
                start: "13:30:00",
                end: "15:30:00"
            }

            expect(final(input)).toEqual('Dec 10, 1:30 - 3:30pm');
        });

        it('should also work for AM times', function() {
            var input = {
                final_id: 781,
                section_id: 5558,
                day: "Jan 5",
                start: "01:30:00",
                end: "05:30:00"
            }

            expect(final(input)).toEqual('Jan 5, 1:30 - 5:30am');
        });


    });
});
