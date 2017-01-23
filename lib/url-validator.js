var async = require("async");
var config = require("../config");
var wreck = require("wreck");
var validUrl = require("valid-url");

var internals = {
  /**
   * Callback for validateUrlsList
   * @callback validateUrlsListCb
   * @public
   * @param {?object} err - null on success, otherwise contains error object
   * @param {?array} badUrls - null if all URLs arevalid, otherwise contains bad URLs and a description
   * of the problem found with them, along with a statusCode if applicable. {url, statusCode, error}
   */

  /**
   * @func validateUrlList
   * @public
   * @desc The function must accept a list of URLs and return a subset of those links that are
   * either written incorrectly or do not return a success status code, along with a way to identify
   * what was wrong with each link.
   *
   * @param {array} urls
   * @param {validateUrlsListCb} callback - function(err, badUrls)
   */
  validateUrlList: function(urls, callback) {
    var badUrls = [];
    async.each(
      urls,
      function(url, eachCb) {
        internals.validateUrl(url, function(err, failedUrl) {
          // This should never happen with the current implementation of validateUrl,
          // but best practices say to follow cb(err, ...) format and always check err
          if (err) {
            return eachCb(err);
          } else if (failedUrl) {
            badUrls.push(failedUrl);
          }
          return eachCb();
        })
      },
      function(err) {
        if (err) {
          callback(err);
        }
        callback(null, badUrls);
      }
    );
  },

  /**
   * Callback for validateUrl
   * @callback validateUrlCb
   * @protected
   * @param {?object} err - null on success, otherwise contains error object
   * @param {?object} failedUrl - null if URL is valid, otherwise contains the URL and a description
   * of the problem found with it, along with a statusCode if applicable. {url, statusCode, error}
   */

  /**
   * @func validateUrl
   * @protected
   * @desc Validate a single URL by both format and by status code. Returns info about the URL
   * only if a step of validation fails.
   *
   * @param {string} url
   * @param {validateUrlCb} callback - function (err, failedUrl)
   */
  validateUrl: function(url, callback) {
   if (! internals.validateUrlFormat(url)) {
      return callback(null, {"url": url, "error": config.reusableErrMsgs.format});
    } else {
      internals.getUrlStatus(url, function(err, statusCode) {
        if (err) {
          // In real life, log the underlying error for later debugging.
          return callback(null, {"url": url, "error": config.reusableErrMsgs.validator});
        } else if (config.successCodes.indexOf(statusCode) === -1) {
          return callback(null,
            {"url": url, "statusCode": statusCode, "error": config.errorMessages[statusCode]});
        } else {
          return callback(null, null);
        }
      });
    }
  },

  /**
   * @func validateUrlFormat
   * @protected
   * @desc <pre>Take a single URL and check if it is valid _by format only_.
   * Simple wrapper function to allow alternate URL validation libraries to be used.
   *
   * Assumption: We want a practical url, i.e. HTTP[S], rather then any URL that is
   * technically standards compliant.
   *
   * Assumption: As the context of this problem is an email marketing campaign, all URLs must be
   * fully-qualified to be considered valid. </pre>
   *
   * @param {string} url
   * @returns {boolean} - true if the URL is a valid HTTP or HTTPS url, false otherwise
   */
  validateUrlFormat: function(url) {
    // Library does not gracefully handle non-strings
    if (typeof url !== "string") {
      return false;
    } else if (validUrl.isWebUri(url)) {
      return true;
    } else return false;
  },

  /**
   * Callback for getUrlStatus
   * @callback urlStatusCb
   * @protected
   * @param {?object} err - null on success, otherwise contains error object
   * @param {?number} statusCode - if no err, the HTTP status code returned by a GET attempt on the
   * URL
   */

  /**
   * @func getUrlStatus
   * @protected
   * @desc <pre>Get the status code of an attempted connection to the URL
   *
   * Note: Wreck seems to return HTTP 502 on all invalid URLs. This makes format validation
   * potentially redundant, but format validation allows us to fail fast without making a connection
   * and gives an extra layer of security should Wreck change its error handling or a different
   * http library is desired.
   *
   * Assumption: Links will be clicked from an email, so only test the GET HTTP method, ignoring
   * for now POST etc.</pre>
   *
   * @param {string} url
   * @param {urlStatusCb} callback - function(err, statusCode)
   */
  getUrlStatus: function(url, callback) {
    wreck.get(url, function(err, res) {
      if (err) {
        try {
          return callback(null, err.output.statusCode);
        } catch(e) {
          return callback(err);
        }
      }
      return callback(null, res.statusCode);
    });
  }
};

module.exports.validateUrlList = internals.validateUrlList;
