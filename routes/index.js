var express = require('express');
var router = express.Router();
let ejs = require("ejs");
let pdf = require("html-pdf");
let path = require("path");
const S3 = require('aws-sdk/clients/s3')
const {v4 } = require('uuid')
const axios = require('axios')

let students = [
    {name: "sathsara",
        email: "sathsara@example.com",
        city: "New York",
        country: "USA"},
    ];


let s3 = new S3({
    region: 'us-east-1',
    accessKeyId: 'AKIAQHVZ3DDE6P2NGHEM',
    secretAccessKey: '2yIzjZ36xp6VlHmEAt3horN5SD5jLfTfkVimOlmU',
    signatureVersion: 'v4',
})


const getSignedUrl = async (key, type) => {
    const params = {
        Bucket: 'testpdfcode',
        Key: key,
        Expires: 60*5,
        ContentType: type
    };

    try{
        const url = await new Promise((resolve, reject)=> {
            s3.getSignedUrl('putObject', params, (err, _url)=>{
                console.log(err)
                if(err) return reject(err)
                return resolve(_url)
            })
        })
        return url
    }catch (e){
        throw e

    }

}


const fileName = v4()


/* GET home page. */

router.get("/", (req, res) => {
    ejs.renderFile(path.join(__dirname, '../views/', "index.ejs"), {students: students}, (err, data) => {
        if (err) {
            res.send(err);
            console.log(err)
        } else {
            let options = {
                "height": "15in",
                "width": "8.5in",
                "header": {
                    "height": "20mm"
                },
                "footer": {
                    "height": "20mm",
                },
            };
            pdf.create(data, options).toBuffer(async function (err, data) {
                if (err) {
                    res.send(err);
                } else {
                const preSignedUrl = await getSignedUrl(
                    `samplePdf/${fileName}.pdf`,
                    'application/pdf'
                );

                await axios.put(preSignedUrl, data, {
                    headers: {
                        'Content-Type': 'application/pdf'
                    }
                }).then(()=>{
                    res.status(200).json({
                        message:fileName
                    })
                })

                }
            });
        }
    });
})

router.get('/getUrl/:fileKey', function (req,res){
    let fileKey = req.params.fileKey

    console.log("Trying to download file", fileKey)
    let AWS = require('aws-sdk')
    AWS.config.update({
        accessKeyId: 'AKIAQHVZ3DDE6P2NGHEM',
        secretAccessKey: '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',
        region: 'us-east-1'
    });

    let s3 = new AWS.S3();
    let options ={
        Bucket : 'testpdfcode',
        Key: `samplePdf/${fileKey}`,

    }

    res.attachment(fileKey)
    let fileStream = s3.getObject(options).createReadStream()
    fileStream.pipe(res)



})



module.exports = router;
