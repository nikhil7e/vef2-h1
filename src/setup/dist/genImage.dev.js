"use strict";

var _imageSearchGoogle = _interopRequireDefault(require("image-search-google"));

var _cloudinary = _interopRequireDefault(require("cloudinary"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function getImageUrl(query) {
  var client, options;
  return regeneratorRuntime.async(function getImageUrl$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          // Configuration 
          _cloudinary["default"].config({
            cloud_name: "dv17kz61z",
            api_key: "637653134346876",
            api_secret: "46llmCbx6ObdDp2AoO1rrRta_98"
          });

          client = new _imageSearchGoogle["default"]('141e92719bab94a1c', 'AIzaSyDG7M8Y7oSIjAAlbJ_WLHkBAlBbc6XSVXA');
          options = {
            size: 'large',
            num: 1
          };
          client.search(query, options).then(function (images) {
            // [{
            //     'url': item.link,
            //     'thumbnail':item.image.thumbnailLink,
            //     'snippet':item.title,
            //     'context': item.image.contextLink
            // }]
            var imageUrl = images[0].url; // Upload

            var res = _cloudinary["default"].uploader.upload(imageUrl, {
              public_id: "testMynd"
            });

            res.then(function (data) {
              console.log(data);
              console.log(data.secure_url);
            })["catch"](function (err) {
              console.log(err);
            });

            var url = _cloudinary["default"].url("testMynd", {
              width: 1000,
              height: 1000,
              Crop: 'fill'
            }); // The output url


            console.log(url);
          })["catch"](function (error) {
            return console.log(error);
          });

        case 4:
        case "end":
          return _context.stop();
      }
    }
  });
}