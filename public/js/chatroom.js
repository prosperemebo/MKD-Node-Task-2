const messageInput = document.getElementById('input-message');
const sendBtn = document.getElementById('send-message');
const saveBtn = document.getElementById('save-chat');
const chatsContainer = document.getElementById('chats');

async function fetchMessages() {
  const TEMPLATE = `
    <div class="block bg-white rounded mb-4 w-64 p-4 text-center border-solid border-2 border-gray-400 hover--bg-gray-200 ease-in-out cursor-pointer duration-500">
      <h2 class="text-lg text-black-700 font-bold mb-2">:MESSAGE</h2>
    </div>
  `;

  const response = await fetch('/chats/all');
  const data = await response.json();

  chatsContainer.innerHTML = '';

  data.messages.forEach((msg) => {
	let messageElement = TEMPLATE.replace(':MESSAGE', msg)

	chatsContainer.insertAdjacentHTML("afterbegin", messageElement)
  });
}

async function startPollingUpdates() {
  try {
    const response = await fetch('/chats/poll');

    if (response.status === 200) {
      await fetchMessages();
    }

    setTimeout(startPollingUpdates, 500);
  } catch (error) {
    console.error('Polling error:', error);

    setTimeout(startPollingUpdates, 5000);
  }
}

async function sendMessage() {
  await fetch('/chats/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: messageInput.value }),
  });

  messageInput.value = '';
}

async function saveMessageBoard() {
  await fetch('/chats/save', { method: 'POST' });
}

function init() {
  fetchMessages();
  startPollingUpdates();

  sendBtn.addEventListener('click', sendMessage);
  saveBtn.addEventListener('click', saveMessageBoard);
}

init();
