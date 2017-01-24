# Emma Inc. Code Challenge.
## Problem A: Back-end
### Getting Started
+ This assumes you have node and NPM installed. Project built with Node v.4.2.1 and NPM v.3.7.5
+ Clone the repository
+ `npm install`
+ Run tests with `npm run test`
+ Generate a coverage report with `npm run cov`, view in html with `open coverage/lcove_report/index.html`
+ View jsdoc output at `open docs/index.html`
  + Fresh JSDOC can be generated with a global install of JSDOC: 
    + `npm install -g jsdoc`
    + `jsdoc lib/url-validator.js`
    + `open out/index.html`

### Usage
+ In a JS file, `var urlValidator = require([relative path]/lib/url-validator.js);`
+ `urlValidator.validateUrlsList([urls....], function(err, badUrls) { .... });`

### Bonus questions
+ Could the function be improved if the same list of links is being passed in many times, and what are the tradeoffs?
  + Yes, local caching could be used to save results. One basic method would be to keep an in-memory hash of the URL (key) and its status. An expiration time should also be included so the freshness of the results can be adjusted. For a larger-scale distributed system, a DB or NoSQL key store could contain the data. Pros: faster responses, especially for remote calls. Reduce overall network traffic. Less likely to be rate-limited from frequently checking remote sites. Cons: additional code complexity, requires storage, additional maintenance & points of failure, data is not as fresh as it could be.
  
+ How might the function be written to process arbitrarily long lists of links?
  + Some options: Use Node streams to stream input/output. If hooked up as an API paginate input/results. For very long lists, workload can be split between different workers to add parellelism.
  
+ How might this function be exposed as an HTTP API to be used by a front-end application?
  + Pretty easily with an HTTP server library. I like Wreck; it's very easy to set up. In fact, I might just hook it up now.
    + `npm run server` to run a server on localhost:3000
    + Go ahead and try [this](http://localhost:3000/validateUrls?urls=%5B%22http%3A%2F%2Fwww.google.com%22%2C%20%22https%3A%2F%2Fwww.google.com%22%2C%20%22bla%22%2C%20%22http%3A%2F%2Fwww.google.com%2Fkjkj%22%5D)
