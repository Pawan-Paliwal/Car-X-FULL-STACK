const authmiddleware = require("../middleware/is-auth");
const expect = require("chai").expect;

it("should thorow an error if no authorization headeris persent", function () {
  const req = {
    get: function (headername) {
      return null;
    },
  };
  expect(authmiddleware(req, {}, () => {})).to.throw;
});
