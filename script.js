
const createRoomButton = document.getElementById('createRoomButton');
const joinRoomForm = document.getElementById('joinRoomForm');
const roomCodeInput = document.getElementById('roomCode');
const notification = document.getElementById('notification');

let selectedMask = 'dog';

function showNotification(message) {
  notification.textContent = message;
  notification.hidden = false;

  window.clearTimeout(showNotification.timeout);
  showNotification.timeout = window.setTimeout(() => {
    notification.hidden = true;
  }, 3500);
}

// Выбор маски
document.querySelectorAll('.mask-card').forEach((card) => {
  card.addEventListener('click', () => {
    selectedMask = card.dataset.mask;

    document.querySelectorAll('.mask-card').forEach((item) => {
      item.style.borderColor = '';
    });

    card.style.borderColor = 'var(--accent)';
    showNotification(
      selectedMask === 'dog'
        ? 'Выбрана маска Dog'
        : 'Выбрана маска Cat'
    );
  });
});

// Создание кода комнаты
function generateRoomCode() {
  const first = Math.random().toString(36).slice(2, 5);
  const second = Math.random().toString(36).slice(2, 6);
  const third = Math.random().toString(36).slice(2, 5);

  return `${first}-${second}-${third}`;
}

// Создание комнаты
createRoomButton.addEventListener('click', () => {
  const roomCode = generateRoomCode();

  const roomUrl = new URL(window.location.href);
  roomUrl.searchParams.set('room', roomCode);
  roomUrl.searchParams.set('mask', selectedMask);

  window.history.pushState({}, '', roomUrl);

  showNotification(`Комната создана: ${roomCode}`);

  // Позже здесь подключим Supabase и WebRTC.
  window.setTimeout(() => {
    showNotification('Следующий этап — подключение звонка');
  }, 1800);
});

// Подключение по коду
joinRoomForm.addEventListener('submit', (event) => {
  event.preventDefault();

  const roomCode = roomCodeInput.value
    .trim()
    .toLowerCase();

  const roomCodePattern = /^[a-z0-9]{3}-[a-z0-9]{4}-[a-z0-9]{3}$/;

  if (!roomCodePattern.test(roomCode)) {
    showNotification('Проверь код комнаты. Пример: abc-defg-hij');
    return;
  }

  const roomUrl = new URL(window.location.href);
  roomUrl.searchParams.set('room', roomCode);
  roomUrl.searchParams.set('mask', selectedMask);

  window.history.pushState({}, '', roomUrl);

  showNotification(`Код комнаты принят: ${roomCode}`);

  // Позже здесь подключим проверку комнаты через Supabase.
});

// Автоматическое заполнение, если пользователь открыл ссылку комнаты
const params = new URLSearchParams(window.location.search);
const existingRoom = params.get('room');
const existingMask = params.get('mask');

if (existingRoom) {
  roomCodeInput.value = existingRoom;
  showNotification(`Открыта ссылка комнаты: ${existingRoom}`);
}

if (existingMask === 'dog' || existingMask === 'cat') {
  selectedMask = existingMask;

  const selectedCard = document.querySelector(
    `.mask-card[data-mask="${selectedMask}"]`
  );

  if (selectedCard) {
    selectedCard.style.borderColor = 'var(--accent)';
  }
    }
