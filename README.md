antbutter
=========

An UCI instant search application, powered by a RESTful API. 
Provides UCI courses, instructors, and building locations to the public. Everything is in Javascript.

Installation
-------------
Coming soon...

How does it work?
-----------------
The whole thing consists of a few scrapers feeding a database, a search API which accesses the database, and a client-side
script which interfaces that API.

1. [Zotscrape](https://github.com/blaisebaileyfinnegan/zotscrape) constantly pulls course catalog data from UCI's WebSOC, 
and inserts/updates the parsed data into a MySQL database.
2. To add building locations, I reverse engineered the official UCI interactive map to see how they asynchronously provide
map locations (coordinates, building information, etc.). 
After obtaining a list of building IDs and a route which describes what they do, I built another 
[scraper](https://github.com/blaisebaileyfinnegan/ucimapscraper) which requests that same data from the backend.
3. This actually ended up being more difficult since the official UCI map uses its own custom map type (the locations provided
were not up to scale). So, the coordinates I got were useless, but the building names I got were all correct.
So in my determination to be as lazy as possible, I made another script to automate coordinate 
retrieval Google's geocoding service. Afterwards, coordinates were verified and then inserted into my database.
4. For each quarter that exists in the database, an API is mounted with the quarter as the base path (see below).
5. A complete Angular front-end uses API routes to perform all operations.

Unit Tests
----------
Client-side services and filters are covered in Jasmine. These are run using Karma.
[Zotscrape](https://github.com/blaisebaileyfinnegan/zotscrape) also has its own Mocha unit tests.

Difficulties
------------
- Primarily callback horror inside server/api/providers/loader.js (and by extension websoc.provider.js).
In an attempt to eliminate callback pyramids, I tried using async to alleviate it but I think it's still hard to read.
I should investigate using promises in the future. Q.all() would be perfect in the situation where I need to asynchronously 
search multiple categories.
- Database design. Oh god. The proliferation of migrations is testament to how my requirements kept changing for the database.
As I added more features like instructor searching, I realized that more and more things needed to be normalized
(and still do!) Not to mention the complexity grew as more and more tables kept getting piled on.

Verbs
-----
- `GET /F13/search/:query`
- `GET /F13/courses/:department_id`
- `GET /F13/sections/:course_id`
- `GET /F13/meetings/:section_id`
- `GET /F13/final/:section_id`
- `GET /F13/section/:ccode`
- `GET /F13/instructors/:section_id`

**F13** can be substituted with the quarter of your choice
