  // Configure error messages to have different content, language, etc. here.
var reusableErrMsgs = {
  serverErr: "Link not working due to their server error. Try again later, and/or contact the owner of the page",
  auth: "Not allowed to access this page. Perhaps a username/password is required.",
  badUrl: "The link seems to be to something that doesn't exist. Double-check the link.",
  format: "This does not appear to be a valid URL. Double-check the link"
}

module.exports = {
  successCodes: [200, 201, 202, 203, 204, 205, 206, 207, 208, 226],

  // For time's sake, handling a subset of error codes I deem most likely to occur
  errorMessages: {
    400: reusableErrMsgs.badUrl,
    401: reusableErrMsgs.auth,
    403: reusableErrMsgs.auth,
    404: reusableErrMsgs.badUrl,
    418: "You tried to link to a teapot",
    429: "Too many requests to this site. Try waiting, or contacting the site owner.",
    451: "https://en.wikipedia.org/wiki/Gag_order",
    500: reusableErrMsgs.serverErr,
    501: reusableErrMsgs.serverErr,
    502: reusableErrMsgs.serverErr,
    503: reusableErrMsgs.serverErr,
    504: reusableErrMsgs.serverErr,
    511: "You probably need to make sure you're signed in to the wifi"
  },

  reusableErrMsgs: reusableErrMsgs
}
