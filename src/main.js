import './styles.css';

const fields = ['poleTopPx', 'poleBottomPx', 'poleHeightCm', 'cameraTiltDeg', 'subjectDistanceCm', 'referenceDistanceCm'];
const frame = document.querySelector('#frame');
const image = document.querySelector('#cameraFrame');
const streamUrl = document.querySelector('#streamUrl');
const topGuide = document.querySelector('#topGuide');
const bottomGuide = document.querySelector('#bottomGuide');
const heightResult = document.querySelector('#heightResult');
const detailResult = document.querySelector('#detailResult');
let points = [];

const value = (id) => Number(document.querySelector(`#${id}`).value);
const calibration = () => Object.fromEntries(fields.map((id) => [id, value(id)]));

function renderGuides() {
  const { poleTopPx, poleBottomPx } = calibration();
  topGuide.style.top = `${(poleTopPx / 720) * 100}%`;
  bottomGuide.style.top = `${(poleBottomPx / 720) * 100}%`;
}

function renderMarkers() {
  frame.querySelectorAll('.marker').forEach((node) => node.remove());
  points.forEach((point, index) => {
    const marker = document.createElement('span');
    marker.className = `marker ${index === 0 ? 'head' : 'foot'}`;
    marker.textContent = index === 0 ? '头顶' : '脚底';
    marker.style.left = `${(point.x / (image.naturalWidth || 1280)) * 100}%`;
    marker.style.top = `${(point.y / (image.naturalHeight || 720)) * 100}%`;
    frame.appendChild(marker);
  });
}

function measure() {
  renderGuides();
  renderMarkers();
  const data = calibration();
  const refPx = Math.abs(data.poleBottomPx - data.poleTopPx);
  const pxPerCm = refPx / data.poleHeightCm;
  if (points.length < 2 || !Number.isFinite(pxPerCm) || pxPerCm <= 0) {
    heightResult.textContent = '--';
    detailResult.textContent = '等待选择头顶和脚底';
    return;
  }
  const pixelHeight = Math.abs(points[1].y - points[0].y);
  const perspectiveFactor = data.subjectDistanceCm / data.referenceDistanceCm;
  const tiltFactor = Math.cos((data.cameraTiltDeg * Math.PI) / 180);
  const heightCm = (pixelHeight / pxPerCm) * perspectiveFactor * tiltFactor;
  const confidence = heightCm > 80 && heightCm < 230 ? '有效' : '需复核';
  heightResult.textContent = `${heightCm.toFixed(1)} cm`;
  detailResult.textContent = `像素高度 ${pixelHeight.toFixed(0)} px，状态：${confidence}`;
}

frame.addEventListener('click', (event) => {
  const rect = image.getBoundingClientRect();
  const x = (event.clientX - rect.left) * ((image.naturalWidth || rect.width) / rect.width);
  const y = (event.clientY - rect.top) * ((image.naturalHeight || rect.height) / rect.height);
  points = points.length >= 2 ? [{ x, y }] : [...points, { x, y }];
  measure();
});

document.querySelector('#clearPoints').addEventListener('click', () => { points = []; measure(); });
streamUrl.addEventListener('change', () => { image.src = streamUrl.value; });
fields.forEach((id) => document.querySelector(`#${id}`).addEventListener('input', measure));
renderGuides();
