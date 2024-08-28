const tokenInputElement = document.getElementById('input-token')
const verifyBtn = document.getElementById('verify-token')
const errorText = document.getElementById('error')


async function verifyTokenHandler() {
	const token = tokenInputElement.value;

	const response = await fetch('/2fa/verify', {
	  method: 'POST',
	  headers: { 'Content-Type': 'application/json' },
	  body: JSON.stringify({ token: token * 1 }),
	});

	const data = await response.json();

	if (data.status === 'success') {
	  window.location.href = '/';
	} else {
		errorText.innerText = data.message;
	}
}


verifyBtn.addEventListener('click', verifyTokenHandler)