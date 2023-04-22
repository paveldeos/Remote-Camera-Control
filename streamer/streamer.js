const WebSocket = require('ws');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;

ffmpeg.setFfmpegPath(ffmpegPath);

const ws = new WebSocket('ws://34.118.123.12:3000');

ws.on('open', () => {
    console.log('Connected to server');

    const chunks = [];
    const videoStream = ffmpeg()
        .input('video=HDR webcam') // Replace with your USB webcam's name
        .inputFormat('dshow')
        .videoCodec('libx264')
        .format('flv') // Make sure this is set to 'flv'
        .size('1280x720') // Set resolution to 720p
        .fps(30) // Set the framerate to 30
        .outputOptions([
            '-preset ultrafast',
            '-tune zerolatency',
            '-pix_fmt yuv420p',
            '-g 60', // Keyframe interval
            '-b:v 2000k', // Video bitrate
        ])
        .on('error', (err) => console.error(err))
        .on('data', (chunk) => {
            chunks.push(chunk);
        }).pipe();

        setInterval(() => {
            if (chunks.length > 0) {
              const data = Buffer.concat(chunks);
              chunks.length = 0;
              ws.send(data, { binary: true }, (err) => {
                if (err) console.error('Error sending data:', err);
              });
            }
          }, 50); 

    videoStream.on('data', (data) => {
        ws.send(data, { binary: true }, (err) => {
        if (err) console.error('Error sending data:', err);
        });
    });
});

ws.on('error', (err) => {
  console.error('WebSocket error:', err);
});

ws.on('close', () => {
  console.log('Disconnected from server');
});
