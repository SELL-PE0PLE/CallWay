
'use strict';

// ==========================================
// CALLWAY — MAIN SCRIPT
// ==========================================

// Элементы страницы
const createRoomButton = document.getElementById('createRoomButton');
const joinRoomForm = document.getElementById('joinRoomForm');
const roomCodeInput = document.getElementById('roomCode');
const notification = document.getElementById('notification');

const roomResult = document.getElementById('roomResult');
const resultEyebrow = document.getElementById('resultEyebrow');
const resultTitle = document.getElementById('resultTitle');
const resultDescription = document.getElementById('resultDescription');
const resultCode = document.getElementById('resultCode');
const copyRoomCodeButton = document.getElementById('copyRoomCode');

const maskButtons = document.querySelectorAll('.mask[data-mask]');

let selectedMask = 'dog';
let currentRoomCode = '';
let notificationTimeout = null;

// ==========================================
// NOTIFICATIONS
// ==========================================

function showNotification(message) {
  if (!notification) return;

  notification.textContent = message;
  notification.classList.add('show');

  clearTimeout(notificationTimeout);

  notificationTimeout = setTimeout(() => {
    notification.classList.remove('show');
  }, 3500);
}

// ==========================================
// MASK SELECTION
// ==========================================

function selectMask(mask, notify = true) {
  if (!['dog', 'cat'].includes(mask)) return;

  selectedMask = mask;

  maskButtons.forEach(button => {
    const isSelected = button.dataset.mask === mask;

    button.classList.toggle('selected', isSelected);
    button.setAttribute('aria-pressed', String(isSelected));
  });

  if (notify) {
    showNotification(
      mask === 'dog'
        ? 'Выбрана маска: Собака'
        : 'Выбрана маска: Кошка'
    );
  }
}

maskButtons.forEach(button => {
  button.addEventListener('click', () => {
    selectMask(button.dataset.mask);
  });
});

// ==========================================
// ROOM CODE GENERATOR
// Format: abc-abcd-abc
// ==========================================

function generateRoomCode() {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz';
  const randomValues = new Uint8Array(10);

  if (!window.crypto || !window.crypto.getRandomValues) {
    throw new Error('Secure random generator is unavailable');
  }

  window.crypto.getRandomValues(randomValues);

  const letters = Array.from(randomValues, value => {
    return alphabet[value % alphabet.length];
  }).join('');

  return (
    letters.slice(0, 3) +
    '-' +
    letters.slice(3, 7) +
    '-' +
    letters.slice(7, 10)
  );
}

// ==========================================
// ROOM URL
// ==========================================

function updateRoomUrl(roomCode, mask) {
  const url = new URL(window.location.href);

  url.searchParams.set('room', roomCode);
  url.searchParams.set('mask', mask);

  window.history.pushState(
    { room: roomCode, mask },
    '',
    url
  );
}

// ==========================================
// ROOM RESULT
// ==========================================

function displayRoom(roomCode, type) {
  if (!roomResult) return;

  currentRoomCode = roomCode;

  roomResult.hidden = false;

  if (type === 'created') {
    resultEyebrow.textContent = 'КОМНАТА СОЗДАНА';
    resultTitle.textContent = 'Отправь приглашение другу';
    resultDescription.textContent =
      'Скопируй код комнаты и отправь его другу.';
  } else {
    resultEyebrow.textContent = 'КОД ПРИНЯТ';
    resultTitle.textContent = 'Приглашение открыто';
    resultDescription.textContent =
      'Код введён. Для реального подключения нужна проверка комнаты через сервер.';
  }

  resultCode.textContent = roomCode;

  roomResult.scrollIntoView({
    behavior: 'smooth',
    block: 'center'
  });
}

// ==========================================
// CREATE ROOM
// ==========================================

if (createRoomButton) {
  createRoomButton.addEventListener('click', () => {
    try {
      createRoomButton.disabled = true;

      const roomCode = generateRoomCode();

      updateRoomUrl(roomCode, selectedMask);
      displayRoom(roomCode, 'created');

      showNotification('Комната создана!');
    } catch (error) {
      console.error('CallWay room creation error:', error);
      showNotification('Не удалось создать комнату.');
    } finally {
      createRoomButton.disabled = false;
    }
  });
}

// ==========================================
// JOIN ROOM
// ==========================================

if (joinRoomForm) {
  joinRoomForm.addEventListener('submit', event => {
    event.preventDefault();

    const roomCode = roomCodeInput.value
      .trim()
      .toLowerCase();

    const pattern = /^[a-z]{3}-[a-z]{4}-[a-z]{3}$/;

    if (!pattern.test(roomCode)) {
      showNotification(
        'Код должен быть в формате abc-abcd-abc.'
      );

      roomCodeInput.focus();
      return;
    }

    updateRoomUrl(roomCode, selectedMask);
    displayRoom(roomCode, 'joined');

    showNotification('Код принят!');
  });
}

// ==========================================
// COPY ROOM CODE
// ==========================================

async function copyText(text) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return true;
  }

  const textarea = document.createElement('textarea');

  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';

  document.body.appendChild(textarea);
  textarea.select();

  const successful = document.execCommand('copy');

  textarea.remove();

  if (!successful) {
    throw new Error('Copy failed');
  }

  return true;
}

if (copyRoomCodeButton) {
  copyRoomCodeButton.addEventListener('click', async () => {
    if (!currentRoomCode) {
      showNotification('Нет кода для копирования.');
      return;
    }

    try {
      await copyText(currentRoomCode);

      showNotification('Код скопирован!');

      copyRoomCodeButton.textContent = 'Скопировано ✓';

      setTimeout(() => {
        copyRoomCodeButton.textContent = 'Копировать';
      }, 2000);
    } catch (error) {
      console.error('CallWay clipboard error:', error);
      showNotification('Не удалось скопировать код.');
    }
  });
}

// ==========================================
// RESTORE ROOM FROM URL
// ==========================================

function restoreRoomFromUrl() {
  const params = new URLSearchParams(window.location.search);

  const roomCode = params.get('room');
  const mask = params.get('mask');

  if (mask === 'dog' || mask === 'cat') {
    selectMask(mask, false);
  }

  if (!roomCode) return;

  const normalizedCode = roomCode.toLowerCase();
  const pattern = /^[a-z]{3}-[a-z]{4}-[a-z]{3}$/;

  if (!pattern.test(normalizedCode)) {
    showNotification('Ссылка содержит неправильный код комнаты.');
    return;
  }

  if (roomCodeInput) {
    roomCodeInput.value = normalizedCode;
  }

  displayRoom(normalizedCode, 'joined');

  showNotification('Ссылка-приглашение открыта.');
}

// ==========================================
// BROWSER NAVIGATION
// ==========================================

window.addEventListener('popstate', () => {
  restoreRoomFromUrl();
});

// ==========================================
// INPUT NORMALIZATION
// ==========================================

if (roomCodeInput) {
  roomCodeInput.addEventListener('input', () => {
    let value = roomCodeInput.value
      .toLowerCase()
      .replace(/[^a-z]/g, '')
      .slice(0, 10);

    if (value.length > 7) {
      value =
        value.slice(0, 3) +
        '-' +
        value.slice(3, 7) +
        '-' +
        value.slice(7);
    } else if (value.length > 3) {
      value =
        value.slice(0, 3) +
        '-' +
        value.slice(3);
    }

    roomCodeInput.value = value;
  });
}

// ==========================================
// INITIALIZATION
// ==========================================

restoreRoomFromUrl();

console.log('CallWay initialized successfully.');
