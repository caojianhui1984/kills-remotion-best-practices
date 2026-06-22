import http from 'node:http';
import { spawn } from 'node:child_process';

const RTSP_URL = process.env.RTSP_URL || 'rtsp://admin:admin@192.168.1.168:554/live/main_stream';
const PORT = Number(process.env.PORT || 8090);
const BOUNDARY = 'ffmpeg-mjpeg-boundary';

const server = http.createServer((req, res) => {
  if (req.url !== '/stream.mjpeg') {
    res.writeHead(200, { 'content-type': 'text/plain; charset=utf-8' });
    res.end('Use /stream.mjpeg to view the Hikvision RTSP bridge.');
    return;
  }

  res.writeHead(200, {
    'Cache-Control': 'no-store, no-cache, must-revalidate, private',
    Pragma: 'no-cache',
    Connection: 'close',
    'Content-Type': `multipart/x-mixed-replace; boundary=${BOUNDARY}`,
  });

  const ffmpeg = spawn('ffmpeg', [
    '-rtsp_transport', 'tcp',
    '-i', RTSP_URL,
    '-an',
    '-vf', 'fps=8,scale=1280:-1',
    '-q:v', '5',
    '-f', 'mpjpeg',
    '-boundary_tag', BOUNDARY,
    'pipe:1',
  ], { stdio: ['ignore', 'pipe', 'pipe'] });

  ffmpeg.stdout.pipe(res);
  ffmpeg.stderr.on('data', (chunk) => process.stderr.write(chunk));
  req.on('close', () => ffmpeg.kill('SIGTERM'));
});

server.listen(PORT, () => {
  console.log(`RTSP bridge listening on http://localhost:${PORT}/stream.mjpeg`);
  console.log(`Source: ${RTSP_URL}`);
});
