const socket = new WebSocket('ws://localhost:5050');

const auth = document.querySelector('.auth');
const block = document.querySelector('.block');
const login = document.getElementById('login');
const contact = document.querySelector('.contact');
const inputMes = document.querySelector('.inp.mes');
const message = document.querySelector('.message');
const btnLog = document.querySelector('.btn.log');

let username = '';

let contactList = [];

socket.onopen = function() {
  console.log('Соединение установлено');
  
  // Запрос на получение списка текущих участников чата
  socket.send(JSON.stringify({ type: 'getParticipants' }));
};

socket.onmessage = function(event) {
  console.log('Получено сообщение от сервера:', event.data);
  const messageData = JSON.parse(event.data);

  // Получение пользователя от сервера
  if (messageData.type === 'username') {

    // Проверка пользователя на You
    const contactName = (messageData.value === username) ? 'You' : messageData.value;

    // Если данного пользователя нет в списке, то добавляем
    if (!contactList.includes(messageData.value)) {
      const youIndex = contactList.indexOf(username);
      const newContact = document.createElement('li');
      newContact.textContent = contactName;
      if (youIndex !== -1) {
        const youElement = contact.children[youIndex];
        contact.insertBefore(newContact, youElement);
      } else {
          // Если "You" не найден, добавляем новый контакт в конец списка
          contact.appendChild(newContact);
      }
      // contact.appendChild(newContact);
      contactList.push(messageData.value);

      // Если текущий пользователь совпадает с ответом сервера, добавляем блок
      if (messageData.value === username) {
        auth.style.display = 'none';
        block.style.display = 'flex';
      }
    }

  // Получение списка контактов от сервера
  } else if (messageData.type === 'participants') {

    // Обновляем список контактов
    contactList = messageData.value;

    // Проверка контакта на You
    contactList.forEach((contact, index) => {
      if (contact === username) {
        contactList[index] = 'You';
      }
    })

    // Переносим "You" в конец списка контактов
    const index = contactList.indexOf('You');
    if (index !== -1) {
      contactList.splice(index, 1);
      contactList.push('You');
    }

    // Очищаем список контактов на странице
    contact.innerHTML = '';

    // Добавляем новых участников чата
    contactList.forEach(participant => {
      const newContact = document.createElement('li');
      newContact.textContent = participant;
      contact.appendChild(newContact);
    });

  // Проверка от сервера на используемый никнейм
  } else if (messageData.type === 'usernameTaken') {
    alert('Этот никнейм уже занят. Пожалуйста, выберите другой.');
  
  // Вызов функции чата
  } else {
    displayMessage(event.data);
  }
};

socket.onclose = function() {
  console.log('Соединение закрыто');
};

window.addEventListener('unload', function() {
  socket.send(JSON.stringify({ type: 'disconnect', value: username }));
  socket.close();
});

window.addEventListener('beforeunload', function() {
  socket.send(JSON.stringify({ type: 'disconnect', value: username }));
  socket.close();
});

// Обработчик события по клику отправить
btnLog.addEventListener('click', (e) => {
  e.preventDefault();
  const loginVal = login.value.trim();
  if (loginVal === '') {
    alert('Введите nickname');
  } else {
    username = loginVal;
    socket.send(JSON.stringify({ type: 'username', value: username }));
  }
})

// Обработчик события по кнопке enter
inputMes.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    const messageVal = inputMes.value;
    if (messageVal !== '') {
      socket.send(JSON.stringify({ type: 'message', sender: username, text: messageVal }));
      inputMes.value = '';
    }
  }
})

// Функция чата
function displayMessage(mes) {
  const messageData = JSON.parse(mes);
  
  // Создаем div для каждого сообщения
  const messageDiv = document.createElement('div');
  const messageHeader = document.createElement('div');
  messageHeader.textContent = (messageData.sender === username) ? 'You' : messageData.sender;
  messageHeader.textContent += ', ' + messageData.date;

  messageHeader.style.fontWeight = 'bold';
  messageDiv.appendChild(messageHeader);

  const messageText = document.createElement('div');
  messageText.textContent = messageData.text;
  messageDiv.appendChild(messageText);

  messageDiv.classList.add('message-item');

  // Проверяем, отправлено ли сообщение текущим пользователем
  if (messageData.sender === username) {
    messageDiv.classList.add('right');
  } else {
    messageDiv.classList.add('left');
  }

  message.appendChild(messageDiv);
}

