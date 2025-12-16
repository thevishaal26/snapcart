
import { v2 as cloudinary } from 'cloudinary'


cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Accept either a Blob (from formData) or a base64 data URL string
const uploadOnCloudinary=async (file: Blob | string | null): Promise<string | null> => {
    if(!file){
        return null
    }
    try {
        let buffer: Buffer

        if (typeof file === 'string') {
            // data URL: data:<mime>;base64,<data>
            const base64 = file.split(',')[1]
            if (!base64) return null
            buffer = Buffer.from(base64, 'base64')
        } else {
            const arrayBuffer = await file.arrayBuffer()
            buffer = Buffer.from(arrayBuffer)
        }

        return await new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                { resource_type: 'auto' },
                (error, result) => {
                    if (error) { reject(error) }
                    else { resolve(result?.secure_url ?? null) }
                }
            )
            uploadStream.end(buffer)
        })
    } catch (error) {
        console.log(error)
        return null
    }
}

export default uploadOnCloudinary