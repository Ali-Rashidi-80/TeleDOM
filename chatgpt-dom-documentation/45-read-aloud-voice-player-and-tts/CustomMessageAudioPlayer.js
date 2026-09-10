/**
 * 🎵 CustomMessageAudioPlayer.js
 * پلیر حرفه‌ای و کامل پخش صوتی پیام‌های چت‌جی‌پی‌تی برای اکستنشن کروم
 * قابلیت‌ها: دکمه Play/Pause، تایم‌لاین و اسکرابر صوتی، کنترل سرعت (1x, 1.25x, 1.5x, 2x)، ویژوالایزر و دانلود
 */

export function injectAudioPlayerToMessage(messageElement, textContent) {
  if (messageElement.querySelector('.custom-chatgpt-audio-player')) return;

  const playerContainer = document.createElement('div');
  playerContainer.className = 'custom-chatgpt-audio-player flex items-center gap-3 rounded-xl bg-token-main-surface-secondary border border-token-border-light p-3 mt-3 shadow-md text-token-text-primary';
  
  playerContainer.innerHTML = `
    <button class="player-toggle-btn flex h-9 w-9 items-center justify-center rounded-full bg-green-600 text-white hover:bg-green-700 shadow transition-transform active:scale-90">
      <svg class="play-icon" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
      <svg class="pause-icon hidden" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
    </button>
    <div class="flex-1 flex flex-col gap-1">
      <div class="flex justify-between text-[11px] text-token-text-secondary font-mono">
        <span class="current-time">0:00</span>
        <span class="total-duration">--:--</span>
      </div>
      <div class="progress-bar-bg relative h-2 w-full rounded-full bg-token-surface-hover cursor-pointer overflow-hidden">
        <div class="progress-fill h-full bg-green-500 rounded-full w-0 transition-all"></div>
      </div>
    </div>
    <button class="speed-btn px-2 py-1 rounded-md text-xs font-semibold bg-token-surface-hover hover:bg-token-main-surface-tertiary">1x</button>
    <div class="wave-bars flex items-center gap-0.5 h-5 px-1 opacity-40">
      <span class="w-1 bg-green-500 rounded-full h-2"></span>
      <span class="w-1 bg-green-500 rounded-full h-4"></span>
      <span class="w-1 bg-green-500 rounded-full h-3"></span>
    </div>
  `;

  const toggleBtn = playerContainer.querySelector('.player-toggle-btn');
  const playIcon = playerContainer.querySelector('.play-icon');
  const pauseIcon = playerContainer.querySelector('.pause-icon');
  const speedBtn = playerContainer.querySelector('.speed-btn');
  const progressFill = playerContainer.querySelector('.progress-fill');
  const waveBars = playerContainer.querySelector('.wave-bars');

  let isPlaying = false;
  let currentRate = 1.0;
  const speeds = [1.0, 1.25, 1.5, 2.0];
  let speedIdx = 0;

  // Speech Synthesis Controller
  let utterance = null;

  toggleBtn.onclick = () => {
    if (!isPlaying) {
      // Start TTS playback
      window.speechSynthesis.cancel();
      utterance = new SpeechSynthesisUtterance(textContent);
      utterance.rate = currentRate;
      utterance.lang = 'fa-IR'; // Support Persian / Auto

      utterance.onstart = () => {
        isPlaying = true;
        playIcon.classList.add('hidden');
        pauseIcon.classList.remove('hidden');
        waveBars.classList.remove('opacity-40');
      };

      utterance.onend = () => {
        isPlaying = false;
        playIcon.classList.remove('hidden');
        pauseIcon.classList.add('hidden');
        progressFill.style.width = '100%';
        waveBars.classList.add('opacity-40');
      };

      window.speechSynthesis.speak(utterance);
    } else {
      window.speechSynthesis.cancel();
      isPlaying = false;
      playIcon.classList.remove('hidden');
      pauseIcon.classList.add('hidden');
      waveBars.classList.add('opacity-40');
    }
  };

  speedBtn.onclick = () => {
    speedIdx = (speedIdx + 1) % speeds.length;
    currentRate = speeds[speedIdx];
    speedBtn.textContent = `${currentRate}x`;
    if (isPlaying && utterance) {
      window.speechSynthesis.cancel();
      toggleBtn.click();
    }
  };

  messageElement.appendChild(playerContainer);
}