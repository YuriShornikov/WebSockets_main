const WebSocket = require('ws');

// Создаем новый WebSocket-сервер на порту 8080
const wss = new WebSocket.Server({ port: 5050 });

// Хранилище для отслеживания имен пользователей
// const users = {};
const users = [];

// Вешаем обработчик на событие подключения клиента
wss.on('connection', function connection(ws) {
  console.log('Новое соединение установлено!');
  console.log(users);

  // Отправляем список всех участников чата новому пользователю
  const participants = Object.values(users);
  const participantsMessage = {
    type: 'participants',
    value: participants
  };
  ws.send(JSON.stringify(participantsMessage));

  // Вешаем обработчик на событие приема сообщений от клиента
  ws.on('message', function incoming(message) {
    console.log('Получено сообщение от клиента: %s', message);
    
    // Пытаемся распарсить сообщение
    try {
      const data = JSON.parse(message);
      if (data.type === 'username') {

        console.log('Пользователь с именем', data.value, 'подключился');
        if (users.includes(data.value)) {
          const usernameTakenMessage = {
            type: 'usernameTaken',
            value: data.value
          };
          ws.send(JSON.stringify(usernameTakenMessage));
        } else {
          users.push(data.value);
          const usernameMessage = {
            type: 'username',
            value: data.value
          };
          wss.clients.forEach(function each(client) {
            if (client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify(usernameMessage));
            }
          });
        }

      } else if (data.type === 'message') {

        const messageData = {
          sender: data.sender,
          date: new Date().toLocaleString(),
          text: data.text
        };
        // Пересылаем сообщение всем клиентам
        wss.clients.forEach(function each(client) {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(messageData));
          }
        });
      } else if (data.type === 'getParticipants') {

        const participantsMessage = {
          type: 'participants',
          value: users
        };
        ws.send(JSON.stringify(participantsMessage));

      } else if (data.type === 'disconnect') {
        console.log('dis')
        console.log(data.value);
        // Удалить пользователя из списка
        const index = users.indexOf(data.value);
        if (index !== -1) {
          users.splice(index, 1);
        }

        // Отправить обновленный список участников чата всем клиентам
        const participantsMessage = {
          type: 'participants',
          value: users
        };
        wss.clients.forEach(function each(client) {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(participantsMessage));
          }
        });
      } 

    } catch (error) {
      console.error('Ошибка обработки сообщения:', error);
    }
    console.log(users);
  });

  // Вешаем обработчик на событие закрытия соединения клиентом
  ws.on('close', function close() {
    console.log('Соединение закрыто');


    // // Удаление пользователя из списка
    // const index = users.indexOf(ws.username);
    // if (index !== -1) {
    //   users.splice(index, 1);


    //   console.log(users)
    //   // Отправляем обновленный список участников всем клиентам
    //   const participantsMessage = {
    //     type: 'participants',
    //     value: users
    //   };
    //   wss.clients.forEach(function each(client) {
    //     if (client.readyState === WebSocket.OPEN) {
    //       client.send(JSON.stringify(participantsMessage));
    //     }
    //   });
    // }
  });
});