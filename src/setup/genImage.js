import imageSearch from 'image-search-google';
import cloudinary from 'cloudinary';

async function getImageUrl(query){
    // Configuration 
    cloudinary.config({
        cloud_name: "dv17kz61z",
        api_key: "637653134346876",
        api_secret: "46llmCbx6ObdDp2AoO1rrRta_98"
    });
    
    
    const client = new imageSearch('141e92719bab94a1c','AIzaSyDG7M8Y7oSIjAAlbJ_WLHkBAlBbc6XSVXA');
    const options = {size: 'large', num:1};
    client.search(query, options)
        .then(images => {
            
            // [{
            //     'url': item.link,
            //     'thumbnail':item.image.thumbnailLink,
            //     'snippet':item.title,
            //     'context': item.image.contextLink
            // }]
            
            let imageUrl = images[0].url

            // Upload
            const res = cloudinary.uploader.upload(imageUrl, {public_id: "testMynd"})

            res.then((data) => {
            console.log(data);
            console.log(data.secure_url);
            }).catch((err) => {
            console.log(err);
            });

            const url = cloudinary.url("testMynd", {
            width: 1000,
            height: 1000,
            Crop: 'fill'
            });

            // The output url
            console.log(url);
        })
        .catch(error => console.log(error));
}






