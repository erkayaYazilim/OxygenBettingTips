function showUsers() {
    const contentDiv = document.getElementById('content');
    contentDiv.innerHTML = '<h2>Kullanıcılar</h2><div id="users-container">Yükleniyor...</div>';

    const usersRef = database.ref('users');
    usersRef.once('value').then(snapshot => {
        const usersContainer = document.getElementById('users-container');
        usersContainer.innerHTML = ''; // Clear the loading message

        snapshot.forEach(userSnapshot => {
            const userId = userSnapshot.key;
            const userData = userSnapshot.val();

            // Create user element
            const userDiv = document.createElement('div');
            userDiv.className = 'user';

            // Display email
            const email = userData.email || 'E-posta yok';
            const emailP = document.createElement('p');
            emailP.innerText = 'Email: ' + email;
            userDiv.appendChild(emailP);

            // Display coins
            const coins = userData.coins || 0;
            const coinsP = document.createElement('p');
            coinsP.innerText = 'Coins: ' + coins;
            userDiv.appendChild(coinsP);

            // Input to edit coins
            const coinsInput = document.createElement('input');
            coinsInput.type = 'number';
            coinsInput.value = coins;
            coinsInput.style.marginRight = '10px';
            userDiv.appendChild(coinsInput);

            // Button to save coins
            const saveCoinsBtn = document.createElement('button');
            saveCoinsBtn.innerText = 'Coins\'i Kaydet';
            saveCoinsBtn.addEventListener('click', function() {
                const newCoins = parseInt(coinsInput.value, 10) || 0;
                database.ref('users/' + userId + '/coins').set(newCoins)
                    .then(() => {
                        alert('Coins başarıyla güncellendi');
                        coinsP.innerText = 'Coins: ' + newCoins;
                    })
                    .catch(error => {
                        console.error('Coins güncellenirken hata oluştu:', error);
                    });
            });
            userDiv.appendChild(saveCoinsBtn);

            // Button to send a message
            const messageBtn = document.createElement('button');
            messageBtn.innerText = 'Mesaj Gönder';
            messageBtn.style.marginLeft = '10px';
            messageBtn.addEventListener('click', function() {
                // Show message input and send button
                if (!userDiv.querySelector('.message-container')) {
                    const messageContainer = document.createElement('div');
                    messageContainer.className = 'message-container';

                    const messageInput = document.createElement('textarea');
                    messageInput.placeholder = 'Mesajınızı buraya girin';
                    messageInput.rows = 3;
                    messageInput.cols = 50;
                    messageContainer.appendChild(messageInput);

                    const sendBtn = document.createElement('button');
                    sendBtn.innerText = 'Gönder';
                    sendBtn.addEventListener('click', function() {
                        const messageText = messageInput.value;
                        if (messageText.trim() !== '') {
                            // Save the message to Firebase under the user's messages
                            database.ref('users/' + userId + '/messages').push({
                                message: messageText,
                                timestamp: new Date().toISOString()
                            })
                            .then(() => {
                                alert('Mesaj başarıyla gönderildi');
                                messageInput.value = '';
                            })
                            .catch(error => {
                                console.error('Mesaj gönderilirken hata oluştu:', error);
                            });
                        } else {
                            alert('Lütfen bir mesaj girin');
                        }
                    });
                    messageContainer.appendChild(sendBtn);

                    userDiv.appendChild(messageContainer);
                }
            });
            userDiv.appendChild(messageBtn);

            // Add the userDiv to usersContainer
            usersContainer.appendChild(userDiv);
        });
    })
    .catch(error => {
        console.error('Kullanıcılar çekilirken hata oluştu:', error);
        const usersContainer = document.getElementById('users-container');
        usersContainer.innerText = 'Kullanıcılar yüklenemedi.';
    });
}
