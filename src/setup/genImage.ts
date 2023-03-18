import cloudinary from 'cloudinary';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import imageSearch from 'image-search-google';
import slugify from 'slugify';

export function getImageUrl(queryParam: string): string {
  // Configuration
  cloudinary.v2.config({
    cloud_name: 'dv17kz61z',
    api_key: '637653134346876',
    api_secret: '46llmCbx6ObdDp2AoO1rrRta_98',
  });

  // eslint-disable-next-line new-cap
  const client = new imageSearch(
    '141e92719bab94a1c',
    'AIzaSyDG7M8Y7oSIjAAlbJ_WLHkBAlBbc6XSVXA'
  );

  // const options = { size: 'large', num: 1 };
  let url = client
    .search(queryParam, { size: 'large', num: 1 })
    .then((images: any) => {
      const imageUrl = images[0].url;
      // console.log(`fyrsta urlið er : ${imageUrl}`);
      // Upload
      const query = slugify(queryParam);
      const res = cloudinary.v2.uploader.upload(imageUrl, {
        public_id: query,
      });

      return res
        .then((data) => {
          // data í then ef við viljum ekki croppa
          // console.log(data);
          url = data.secure_url;

          // url = cloudinary.v2.url(query, {
          //   width: 1000,
          //   height: 1000,
          //   Crop: 'lfill',
          // });
          return url;
        })
        .catch((err) => {
          console.error(err);
        });
    })
    .catch((error: Error) => console.error(error));

  return url;
}
