var _ = require("lodash");
var assert = require("assert");
var config = require("../config.js")
var sinon = require("sinon");
var wreck = require("wreck");

var urlValidator = require('../lib/url-validator.js');

describe("url-validator integ tests", function() {
  describe("validateUrlList", function() {
    var sandbox;

    beforeEach(function () {
      sandbox = sinon.sandbox.create();
    });

    afterEach(function () {
      sandbox.restore();
    });

    it("Returns invalid URLs with explanations", function(done) {
      var urls = ["http://www.google.com", "https://www.google.com", "bla",
        "https://www.google.com/kjkljkj"];
      var blaResponse = {"url": urls[2], "error": config.reusableErrMsgs.format};
      var notFoundResponse = {"url": urls[3], "statusCode": 404, "error": config.errorMessages[404]};

      var mock = sandbox.mock(wreck);
      mock.expects("get").withArgs(urls[0]).once().yields(null, { statusCode: 200 }, null);
      mock.expects("get").withArgs(urls[1]).once().yields(null, { statusCode: 200 }, null);
      mock.expects("get").withArgs(urls[3]).once().yields(null, { statusCode: 404 }, null);

      urlValidator.validateUrlList(urls, function(err, badUrls) {
        mock.verify();
        assert.strictEqual(err, null, "Err should be null");
        assert.strictEqual(badUrls.length, 2, "Two bad URLs should be returned");
        assert((_.isEqual(badUrls[0], blaResponse) || _.isEqual(badUrls[1], blaResponse)),
          "badUrls should contain format error for url \"bla\"");
        assert((_.isEqual(badUrls[0], notFoundResponse) || _.isEqual(badUrls[1], notFoundResponse)),
          "badUrls should contain 404 error for url \"https://www.google.com/kjkljkj\"");
        done();
      });
    });

    // This isn't stricly an integ test, and normally would be in a separate "live" test file
    // and be called with a different test script. However, I thought it would be fun to show
    // everything actually working.
    it("LIVE TEST - Returns invalid URLs with explanations", function(done) {
      var urls = ["http://www.google.com", "https://www.google.com", "bla",
        "https://www.google.com/kjkljkj"];
      var blaResponse = {"url": urls[2], "error": config.reusableErrMsgs.format};
      var notFoundResponse = {"url": urls[3], "statusCode": 404, "error": config.errorMessages[404]};

      urlValidator.validateUrlList(urls, function(err, badUrls) {
        assert.strictEqual(err, null, "Err should be null");
        assert.strictEqual(badUrls.length, 2, "Two bad URLs should be returned");
        assert((_.isEqual(badUrls[0], blaResponse) || _.isEqual(badUrls[1], blaResponse)),
          "badUrls should contain format error for url \"bla\"");
        assert((_.isEqual(badUrls[0], notFoundResponse) || _.isEqual(badUrls[1], notFoundResponse)),
          "badUrls should contain 404 error for url \"https://www.google.com/kjkljkj\"");
        done();
      });
    });
  });
});
