var assert = require("assert");
var config = require("../config.js")
var sinon = require("sinon");
var rewire = require('rewire');
var wreck = require("wreck");

var urlValidator = rewire('../lib/url-validator.js').__get__('internals');

describe("url-validator unit tests", function() {
  describe("validateUrlFormat", function() {
    it("Should fail on null", function() {
      assert(!urlValidator.validateUrlFormat(null));
    });

    it("Should fail (gracefully) on non-string input", function() {
      assert(!urlValidator.validateUrlFormat(42));
    });

    it("Should fail on empty string", function() {
      assert(!urlValidator.validateUrlFormat(""));
    });

    it("Should fail on bad url", function() {
      assert(!urlValidator.validateUrlFormat("not.a.real.uri"));
    });

    it("Should work on http://www.example.com", function() {
      assert(urlValidator.validateUrlFormat("http://www.example.com"));
    });

    it("Should work on https://www.example.com", function() {
      assert(urlValidator.validateUrlFormat("https://www.example.com"));
    });
  });

  describe("getUrlStatus", function() {
    var sandbox;

    beforeEach(function () {
      sandbox = sinon.sandbox.create();
    });

    afterEach(function () {
      sandbox.restore();
    });

    it("Should handle 200", function(done) {
      var mock = sandbox.mock(wreck);
      mock.expects('get').once().yields(null, { statusCode: 200 }, null);
      var url = "http://www.google.com";

      urlValidator.getUrlStatus(url, function(err, statusCode) {
        assert((err === null), "Error should be null");
        assert((statusCode === 200), "Status code should be 200");
        mock.verify();
        done();
      });
    });

    it("Should handle 404", function(done) {
      var mock = sandbox.mock(wreck);
      mock.expects('get').once().yields(null, { statusCode: 404 }, null);
      var url = "http://www.google.com";

      urlValidator.getUrlStatus(url, function(err, statusCode) {
        assert((err === null), "Error should be null");
        assert((statusCode === 404), "Status code should be 404");
        mock.verify();
        done();
      });
    });

    it("Should handle 503", function(done) {
      var mock = sandbox.mock(wreck);
      mock.expects('get').once().yields(null, { statusCode: 503 }, null);
      var url = "http://www.google.com";

      urlValidator.getUrlStatus(url, function(err, statusCode) {
        assert((err === null), "Error should be null");
        assert((statusCode === 503), "Status code should be 503");
        mock.verify();
        done();
      });
    });

    it("Should handle status code in http lib's err", function(done) {
      var mock = sandbox.mock(wreck);
      mock.expects('get').once().yields({output: { statusCode: 502} }, null, null);
      var url = "http://www.google.com";

      urlValidator.getUrlStatus(url, function(err, statusCode) {
        assert((err === null), "Error should be null");
        assert((statusCode === 502), "Status code should be 502");
        mock.verify();
        done();
      });
    });

    it("Should return http lib's err if no status code present", function(done) {
      var mock = sandbox.mock(wreck);
      mock.expects('get').once().yields("It's broke", null, null);
      var url = "http://www.google.com";

      urlValidator.getUrlStatus(url, function(err, statusCode) {
        assert((err == "It's broke"), "Error should be null");
        assert((statusCode === undefined), "Status code should be undefined");
        mock.verify();
        done();
      });
    });
  });

  describe("validateUrl", function() {
    var sandbox;

    beforeEach(function () {
      sandbox = sinon.sandbox.create();
    });

    afterEach(function () {
      sandbox.restore();
    });

    it("Should fail early for format error", function(done) {
      var url = "abc";
      var mock = sandbox.mock(urlValidator);
      mock.expects("validateUrlFormat").withArgs(url).once().returns(false);
      var stub = sandbox.stub(urlValidator, "getUrlStatus");
      stub.yields("Error, should not be called");
      urlValidator.getUrlStatus = stub;

      urlValidator.validateUrl(url, function(err, failedUrl) {
        mock.verify();
        assert(stub.notCalled, "Status code should not be checked on invalid URL");
        assert.strictEqual(err, null, "No error should be returned");
        assert.strictEqual(failedUrl.url, url, "Returned url should equal passed url");
        assert.strictEqual(failedUrl.error, config.reusableErrMsgs.format,
          "Format err msg should be returned");
        done();
      });
    });

    it("Should succeed on good URL", function(done) {
      var url = "abc";
      var mock = sandbox.mock(urlValidator);
      mock.expects("validateUrlFormat").withArgs(url).once().returns(true);
      mock.expects("getUrlStatus").withArgs(url).once().yields(null, 200);

      urlValidator.validateUrl(url, function(err, failedUrl) {
        mock.verify();
        assert.strictEqual(err, null, "No error should be returned");
        assert.strictEqual(failedUrl, null, "No url and info should be returned");
        done();
      });
    });

    it("Should return explanation of 404", function(done) {
      var url = "abc";
      var mock = sandbox.mock(urlValidator);
      mock.expects("validateUrlFormat").withArgs(url).once().returns(true);
      mock.expects("getUrlStatus").withArgs(url).once().yields(null, 404);

      urlValidator.validateUrl(url, function(err, failedUrl) {
        mock.verify();
        assert.strictEqual(err, null, "No error should be returned");
        assert.strictEqual(failedUrl.url, url, "Passed url should be returned");
        assert.strictEqual(failedUrl.statusCode, 404, "Status code should be returned");
        assert.strictEqual(failedUrl.error, config.errorMessages[404],
          "404 explanation should be returned");
        done();
      });
    });

    it("Should return explanation of 503", function(done) {
      var url = "abc";
      var mock = sandbox.mock(urlValidator);
      mock.expects("validateUrlFormat").withArgs(url).once().returns(true);
      mock.expects("getUrlStatus").withArgs(url).once().yields(null, 503);

      urlValidator.validateUrl(url, function(err, failedUrl) {
        mock.verify();
        assert.strictEqual(err, null, "No error should be returned");
        assert.strictEqual(failedUrl.url, url, "Passed url should be returned");
        assert.strictEqual(failedUrl.statusCode, 503, "Status code should be returned");
        assert.strictEqual(failedUrl.error, config.errorMessages[503],
          "404 explanation should be returned");
        done();
      });
    });

    it("Should gracefully handle unexpected error", function(done) {
      var url = "abc";
      var mock = sandbox.mock(urlValidator);
      mock.expects("validateUrlFormat").withArgs(url).once().returns(true);
      mock.expects("getUrlStatus").withArgs(url).once().yields("unexpected error");

      urlValidator.validateUrl(url, function(err, failedUrl) {
        mock.verify();
        assert.strictEqual(err, null, "No error should be returned");
        assert.strictEqual(failedUrl.url, url, "Passed url should be returned");
        assert.strictEqual(failedUrl.error, config.reusableErrMsgs.validator,
          "validator error explanation should be returned");
        done();
      });
    });
  });

  describe("validateUrlList", function() {
    var sandbox;

    beforeEach(function () {
      sandbox = sinon.sandbox.create();
    });

    afterEach(function () {
      sandbox.restore();
    });

    it("Should return info on all bad URLs", function(done) {
      var urls = ["http://www.google.com", "https://www.google.com", "bla",
        "https://www.google.com/kjkljkj"];

      var blaResponse = {"url": urls[2], "error": config.reusableErrMsgs.format};
      var notFoundResponse = {"url": urls[3], "error": config.errorMessages[404]};
      var mock = sandbox.mock(urlValidator);
      // Each URL should be validated
      mock.expects("validateUrl").withArgs(urls[0]).once().yields(null, null);
      mock.expects("validateUrl").withArgs(urls[1]).once().yields(null, null);
      mock.expects("validateUrl").withArgs(urls[2]).once().yields(null, blaResponse);
      mock.expects("validateUrl").withArgs(urls[3]).once().yields(null, notFoundResponse);

      urlValidator.validateUrlList(urls, function(err, badUrls) {
        mock.verify();
        assert.strictEqual(err, null, "Err should be null");
        assert.strictEqual(badUrls.length, 2, "Two bad URLs should be returned");
        assert(badUrls.indexOf(blaResponse) > -1,
          "badUrls should contain format error for url \"bla\"");
        assert(badUrls.indexOf(blaResponse) > -1,
          "badUrls should contain 404 error for url \"https://www.google.com/kjkljkj\"");
        done();
      });
    });

    it("Should return err if a URL validation returns an err", function(done) {
      var urls = ["bla"];
      var errMsg = "Impossible";
      var mock = sandbox.mock(urlValidator);
      mock.expects("validateUrl").withArgs(urls[0]).once().yields(errMsg);

      urlValidator.validateUrlList(urls, function(err) {
        mock.verify();
        assert.strictEqual(err, errMsg, "Error should be propogated to caller");
        done();
      });
    });

  });
});
