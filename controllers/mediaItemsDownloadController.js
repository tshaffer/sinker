// const fs = require('fs')
// const path = require('path')
// const axios = require('axios')
const Fs = require('fs')  
const Path = require('path')  
const Axios = require('axios')

var MediaItem = require('../models/mediaItem');
var pug = require('pug');
const WebSocket = require('ws')

const baseDir = '/Users/brightsign/Documents/mediaItems';

exports.downloadMediaItems = function (request, response) {
    const wss = new WebSocket.Server({ port: 8080 })

    console.log('setup wss');
    wss.on('connection', ws => {
        ws.on('message', message => {
            console.log(`Received message => ${message}`)
        })
        console.log('connection on');
        ws.send('Preparing download...')

        MediaItem.find({ 'downloaded': false }, 'id productUrl baseUrl fileName', (err, cloudMediaItems) => {
            ws.send('Remaining media items to download: ' + cloudMediaItems.length.toString());

            const mediaItem = cloudMediaItems[0];

            downloadImage(mediaItem).then(() => {
                console.log('downloaded complete');
                debugger;
            }).catch((err) => {
                console.log(err);
                debugger;
            })

            // downloadMediaItem(mediaItem).then(() => {
            //     console.log('downloaded complete');
            //     debugger;
            // }).catch((err) => {
            //     console.log(err);
            //     debugger;
            // })
        });
    })

    console.log('render mediaItemsDownloader');
    response.render('mediaItemsDownloader');
}

// function downloadMediaItem(mediaItem) {

//     return new Promise((resolve, reject) => {

//         var url = mediaItem.baseUrl;
//         console.log('baseUrl');
//         console.log(url);

//         var fileName = mediaItem.fileName;
//         console.log('filename');
//         console.log(fileName);

//         // const filePath = Path.join(baseDir, fileName);
//         const filePath = Path.resolve(__dirname, 'images', fileName);

//         const writer = fs.createWriteStream(filePath)

//         axios({
//             method: 'get',
//             url,
//             responseType: 'stream'
//         }).then((response) => {
//             response.data.pipe(writer);
//             writer.on('finish', resolve)
//             writer.on('error', reject)
//         });
//     });
// }

async function downloadImage(downloadedFile) {
    var url = downloadedFile.baseUrl;
    url = 'https://lh3.googleusercontent.com/lr/AJ-Ewvm5-YWrH-PGIkKc1MSZ5OSCh565LzGYtmyzRdSHxmQ2EROq-p3T0fwdUtomSCpsQTfiAD4QgD5fyLpzL4Qluaa3fTVcbf7HZmpwdUF3ZERQ94dTTcvdjeprIrzp6czp78g3aZojZxhBGDIocYmGx4IE7TOguosNR4d-Q6Lh1cCUJPm7ix4l37_RaLpqFXQWnTX5QRyyOTIBknDBjOHKzCAszbtgyvx45Cu_d7nKc89oIcPcZ9jdOIRm8ehOMdxlVc4lWslXE4pivaajsS0Prrj1sNQmzGp5jxJ_HOM8QRrCSnMPwRovYMcD6K43P12QZ9C3BK72x2Qg6gT8sBLiIfw3o0SAp-bgtzzo9BnlZbdN3_v4RSTSq33-8PsILEmeqTaNGDcyiKA8IMdSA7QHbCaAanh2B3aU7QpRDNWcRSHnXxlUIkiXlqcwBgBpX0N1u8afK2cTFt6avc45qJNkgk1yAKbuJyMWni1WWt2B0RdBL4zJG5rU3NNEkBXQ7deGHTolbJNc-zg-qKjKxlGp30WqHS9-dmt7xJsgqBll5UDJbA3hezceVD3i-42hllooNtbtUT-VQmPxnr6tIUSmmOCHC2p10yHp8Q6P_wJDkSLE6nrAMDzujEdV7a_7fEHPM6vO-fKDXF-lctGruHYPTncqT77YbWIvMRQ_DxAtyxR2saIhjYPSI44rfo8OMP4CaqHqdm8MQTU6bDvq-Af5qYSRHwiatNyi8aD6Fb1EglZcPxo05MT1eomUaiIvdy1K1RgEI3Usz-N4syPLGR1HgKm5FS18FfXLNy2_a54xPMxPjX7r95IWGV12kmLSWUIRIg4Qj_ApEvVfrdJltk6lyS2nkz7NxWZ9AuYiVBOoMR450LXwhnDhfI0rqLIaYcY9raGe';
    url = 'https://lh3.googleusercontent.com/lr/AJ-EwvnTGn3-10A1disoCjjRmG3xm444HSSI40IkZ_FPPE5yRlfzQeRX1STT6yGDGfjpwBO5ivIk-0kl8Hwfc5w_NDgOquT7P_CTpiVL9N0myweZ4v1ZE_8bws5aMJRBcnsmerE5r8EGubRBZ8dV_D1w58ftuxGf73HV4u-5peqGKJqvnoXCQPjytW66ekJnIoXFppP9MSuYsR7snFOp2XjIHsGvyPiwV-iNO7kj22Ek1XoEnbkYi7eA3KbFxEneStUILEWdBuxYFnLiazr4UtkaURpBcIW5u3yNRR6XdpPt0xihrvazABHLt6ErUuzz-VbqzSvMFltB_XwhNdC8l3wouh9AsobmLaSe8orNc88tdXg-crEHJYZay38NWIkS40YYZZD7Rpgduk_oBZb_JFj5SUjSO8ZM9dmBcvsnyJz5QtAgYRYAf4CHcOKIqCA7k6ZYbmcrMDBGsWqcD5Hsn4IXL68Vm45tphDe6vW9x3DXUezCVdFdxYbo0TMnF9Zm9_CNHrn_yyZbbHlx0O_q7xzy4fdWBc8pvwbotzENzOYy3-uqWF0mW4riTMnSXfO80e1FIyezyyxV-XQZeqaqJpT9ZKUX3pSFrNa2i3uDqzbQWQjLOXF9U0gH5yJrhkTIo1HdaryUw0cL-4vKVDV-FHtfovC-QsKSVN_vTZ-d-0HdQpsonHKp4rz0EB8o6ILpu52z6TYygyOU3kZUR_p0mq0rgtLFdchTPhdNO4Vs1g5ARHUy2Br5-A7-5vp5Wwfl_f-Urw8ar_5pCmeuZYvkdo7lMCYAWGfvpZhYvO8k0R7G87BC0soBaMMLNRbyoRrIG-qcs8GG1ZaU3F1Dx9U7q5tMKe_BJFNq3aJd-wWE8CiexPbI-kpxqc0EJ-AGQWEr4VGG_LRc'
    url = 'https://lh3.googleusercontent.com/lr/AJ-Ewvm5t3SsgJKaCwpI3jr3EEXv88NOPlcZC6_CYZRGqj-GnqwSGSxm_RiR9bh3wfcFKdT_YUCbux5wV3Z1-8Cu_zjbnT8ct8Zfj1MRZH9yRLkaPICrdNrA1HmlMay10noce_VojLHTcbG2lQiPsZVNrB9MV8AeI9q__0u-hTLcXzmftqRIQKXBf9enfa_1XdGLNvh4_tQjdlDvnuH5okTLP9HKrmZmf4Hok8MVVHQAdlh2yYysrrJI6PfaoYJMuxkcPDKnEZXZP3pn39b9-Gq43lE4bfZOjRI4vJPVMKr_vqQHFGd3F-jQnDjAfD216rn1bkxKaUg16MXC_tYiML6NiVDT-deHsctpeEAS8AIBAh6q8yVaHBWJRNtvAWyxCbS23TiIx8D0FQACOAFau5vHqSg3ldJDh1umEus7k51dQ0bge9Z4Z7-ulX0k4QakqSP0DCczKOVFY3kkoBQppP4_STISE6dnoi98AxOpOe6tau_PsX8eBv649Zj6OkdIqur5GINlsuEaZnG4RH7CiTiP0nJt-oiX4nO_icyD6692ranZkoJPyFVjftN9i61uIrB1HI8GPPAqFRaTLme-hHgVaQe14c8bpry2ES5ywFLpUESsDCmfN57I3vJZlviK7Li2zjGbTt1gnbs33qenYRRU3EU1TtOxiCY5sxWJ7psrAXnBKtnD_Pk_GFYQHBiNzUOGTh47OW8kM61KsOb4twNYuMzsxE7SZYUWAqtXgbBVp2RI5rDvG6eI9fyD4NBMgl09VYlRXnIOBuA-VtCbFrhRfw7JkQAKA5R9Y2DcYk5Yf-aahvJjSZK1fSzZ0797l5EVlmONDhuck5PSycRhYUw-Jy-LA4kOKm2E9H2DrHg1W4iQVgdip1lNLvI3pUSZIQJUSD31';
    console.log('baseUrl');
    console.log(url);

    var fileName = downloadedFile.fileName;
    console.log('fileName');
    console.log(fileName);

    // const filePath = Path.join(baseDir, fileName);
    // const writer = Fs.createWriteStream(filePath)

    const path = Path.resolve(__dirname, 'images', fileName)
    const writer = Fs.createWriteStream(path)

    const response = await Axios({
        url,
        method: 'GET',
        responseType: 'stream'
    })

    response.data.pipe(writer)

    return new Promise((resolve, reject) => {
        // writer.on('finish', resolve)
        // writer.on('error', reject)
    })
}
