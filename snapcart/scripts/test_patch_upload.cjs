require('dotenv').config({ path: 'snapcart/.env.local' })
const mongoose = require('mongoose')
const { v2: cloudinary } = require('cloudinary')

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
})

const tinyPng = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII='

function uploadDataUrlDirect(dataUrl){
  return new Promise((resolve,reject)=>{
    const base64 = dataUrl.split(',')[1]
    const buffer = Buffer.from(base64, 'base64')
    const uploadStream = cloudinary.uploader.upload_stream({resource_type:'image'}, (err,result)=>{
      if(err) return reject(err)
      resolve(result.secure_url)
    })
    uploadStream.end(buffer)
  })
}

async function main(){
  console.log('Uploading tiny image to Cloudinary...')
  const url = await uploadDataUrlDirect(tinyPng)
  console.log('Uploaded URL:', url)

  await mongoose.connect(process.env.MONGODB_URL)
  const Grocery = mongoose.model('Grocery', new mongoose.Schema({}, { strict: false }), 'groceries')
  const id = process.argv[2] || ''
  if(!id){
    console.log('No id supplied to update. Exiting.')
    process.exit(0)
  }
  const updated = await Grocery.findByIdAndUpdate(id, { image: url }, { new: true })
  console.log('Update result:', updated? 'ok' : 'not found')
  process.exit(0)
}

main().catch(err=>{console.error(err);process.exit(1)})