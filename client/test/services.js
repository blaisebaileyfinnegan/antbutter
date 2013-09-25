
describe('Services:', function() {
    var $httpBackend;

    beforeEach(function() {
        module('antbutter.services');
        inject(function(_$httpBackend_) {
            $httpBackend = _$httpBackend_;
        });
    });

    describe('Quarter Service', function() {
        var service;

        beforeEach(function(){
            inject(function(quarterService, _$httpBackend_) {
                service = quarterService
            });
        });

        it('should exist',
            function() {
                expect(service).toBeDefined();
                expect(service.getQuarters).toBeDefined();
        });

        describe('getQuarters', function() {
            it('should map quarters correctly',
                function() {
                    var payload = [
                        {
                            "quarter": "S13",
                            "yearTerm": "2013-14"
                        },
                        {
                            "quarter": "F13",
                            "yearTerm": "2013-92"
                        },
                        {
                            "quarter": "Z11",
                            "yearTerm": "2011-76"
                        },
                        {
                            "quarter": "M05",
                            "yearTerm": "2005-39"
                        }
                    ];

                    var answers = ['Spring 2013', 'Fall 2013', 'Summer Session II 2011', 'Summer 10wk 2005'].reverse();

                    $httpBackend.whenGET('/quarters').respond(payload);
                    $httpBackend.expectGET('/quarters');

                    service.getQuarters().then(function(data) {
                        var names = data.map(function(element) {
                            return element.fullName;
                        });

                        expect(names).toEqual(answers);
                    });

                    $httpBackend.flush();
                });
        });
    });

    describe('Time Service', function() {
        var service;

        beforeEach(inject(function(timeService) {
            service = timeService;
        }));
        
        it('should exist', function() {
            expect(service).toBeDefined();
        });

        describe('convertMilitaryTimeToReadable', function() {
            it('should convert MySQL military time including the trailing am/pm', function() {
                expect(service.convertMilitaryTimeToReadable('12:00:00', true)).toEqual('12:00pm');
                expect(service.convertMilitaryTimeToReadable('23:59:59', true)).toEqual('11:59pm');
                expect(service.convertMilitaryTimeToReadable('01:00')).toEqual('1:00');
                expect(service.convertMilitaryTimeToReadable('10:00')).toEqual('10:00');
                expect(service.convertMilitaryTimeToReadable('07:30:00', true)).toEqual('7:30am');
            });
        });
    });

    describe('Search Service', function() {
        var service;

        beforeEach(inject(function(searchService) {
            service = searchService;
        }));

        it('should exist', function() {
            expect(service).toBeDefined();
        });
        
        /**
         * Not much to describe here. The client merely retrieves the data.
         * This should be tested server-side, where the data gets fetched and organized
         */

        it('should be able to search, get sections, courses, meetings, finals, or instructors, and nothing else',
            function() {
                expect(service.query).toBeDefined();
                expect(service.search).toBeDefined();
                expect(service.sections).toBeDefined();
                expect(service.courses).toBeDefined();
                expect(service.meetings).toBeDefined();
                expect(service.final).toBeDefined();
                expect(service.instructors).toBeDefined();

                var length = Object.keys(service).length;
                expect(length).toBe(7);
        });
    });

    describe('externalLinksService', function() {
        var service;

        beforeEach(inject(function(externalLinksService) {
            service = externalLinksService;
        }));

        describe('getCourseWebsoc', function() {
            it('should be able to point a year term, short name, and number to a websoc link', function() {
                expect(service.getCourseWebsoc('2013-92', 'IN4MTX', '500C')).toEqual(
                    "http://websoc.reg.uci.edu/perl/WebSoc?YearTerm=2013-92&Dept=IN4MTX&CourseNum=500C");
            });
        });

        describe('getInstructorEvaluations', function() {
            it('should return a link to EaterEvals', function() {
                expect(service.getInstructorEvaluations("O'DOWD, M.")).toEqual(
                    "https://eaterevals.eee.uci.edu/browse/instructor#O'DOWD");
            });
        });

        describe('getRateMyProfessor', function() {
            it('should return a link to Rate My Professor', function() {
                expect(service.getRateMyProfessor('Edinger, A.')).toEqual(
                    'http://ratemyprofessors.com/SelectTeacher.jsp?searchName=Edinger&search_submit1=Search&sid=1074#ratingTable');
            });
        });
    });
});
