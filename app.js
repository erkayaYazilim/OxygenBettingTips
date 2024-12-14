const firebaseConfig = {
    apiKey: "AIzaSyCHXVyPNknC2e-vMugP36y9HBuqE4tDiGs",
    authDomain: "oxygenpro-ed923.firebaseapp.com",
    databaseURL: "https://oxygenpro-ed923-default-rtdb.firebaseio.com",
    projectId: "oxygenpro-ed923",
    storageBucket: "oxygenpro-ed923.firebasestorage.app",
    messagingSenderId: "282301344210",
    appId: "1:282301344210:web:881aed45f625d1889d400b",
    measurementId: "G-66X1W238L8"
  };
// Firebase'i başlat
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// Ana menü fonksiyonları
function showHome() {
    const contentDiv = document.getElementById('content');
    contentDiv.innerHTML = "<h2>Ana Sayfa İçeriği</h2><p>Günlük kayıtlar ve toplam kayıt sayısı:</p><p id='daily-record'>Günlük Kayıtlar Yükleniyor...</p><p id='total-record'>Toplam Kayıt Sayısı Yükleniyor...</p>";

    // Firebase veritabanından günlük kayıt ve toplam kayıt sayısını çekme
    const today = new Date().toISOString().split('T')[0];  // Bugünün tarihini YYYY-MM-DD formatında al
    const kayıtOlanlarRef = database.ref('KayıtOlanlar');

    // Günlük kaydı göster
    kayıtOlanlarRef.child(today).once('value').then(snapshot => {
        const dailyCount = snapshot.val()?.sayi || 0;  // Eğer bugünün kaydı yoksa 0 göster
        document.getElementById('daily-record').innerHTML = `Bugün (${today}) Kayıt Olanlar: ${dailyCount}`;
    }).catch(error => {
        console.error("Günlük kayıt bilgisi çekilemedi: ", error);
        document.getElementById('daily-record').innerHTML = "Günlük kayıt bilgisi çekilemedi.";
    });

    // Toplam kayıt sayısını göster
    kayıtOlanlarRef.child('toplamKayıt').once('value').then(snapshot => {
        const totalCount = snapshot.val() || 0;  // Eğer toplam kayıt yoksa 0 göster
        document.getElementById('total-record').innerHTML = `Toplam Kayıt Sayısı: ${totalCount}`;
    }).catch(error => {
        console.error("Toplam kayıt bilgisi çekilemedi: ", error);
        document.getElementById('total-record').innerHTML = "Toplam kayıt bilgisi çekilemedi.";
    });
}


function showMatches() {
    loadMatches();
}

function showSavedMatches() {
    loadSavedMatches();
}

function showPurchase() {
    const contentDiv = document.getElementById('content');
    contentDiv.innerHTML = "<h2>Satın Alma İçeriği</h2><p>Premium üyelik ve diğer satın alma seçeneklerini buradan görebilirsiniz.</p>";
}




function showCoins() {
    const contentDiv = document.getElementById('content');
    contentDiv.innerHTML = "<h2>Coinler İçeriği</h2><p>Kazanılan coinleri ve ödülleri buradan görüntüleyebilir ve kullanabilirsiniz.</p>";
}

function showSettings() {
    const contentDiv = document.getElementById('content');
    contentDiv.innerHTML = "<h2>Ayarlar İçeriği</h2><p>Uygulama ayarlarını buradan yapabilirsiniz.</p>";
}
function showUsers() {
    // İçerik divini güncelle
    const contentDiv = document.getElementById('content');
    contentDiv.innerHTML = `
        <h2>Kullanıcılar</h2>
        <div class="search-container">
            <input type="text" id="user-search-input" placeholder="E-posta ile ara..." class="search-box">
            <button id="user-search-btn" class="btn btn-primary">Ara</button>
        </div>
        <div id="users-container" class="user-table">
            <div class="table-header">
                <span>Email</span>
                <span>Coins</span>
                <span>Mesaj Gönder</span>
                <span>Abonelik Durumları</span>
            </div>
        </div>
    `;

    // Abonelik paketlerini tanımla
    const vipPackages = [
        "Live Tips", "Sure", "HT-FT", "Coupon of the Day", "Multi Combine",
        "10+ Odds", "Editor’s Definitive Coupons", "Artificial Intelligence",
        "Correct Score", "Over-Under", "Diamond Package"
    ];

    // Firebase'den kullanıcıları çek
    const usersRef = database.ref('users');
    usersRef.once('value').then(snapshot => {
        const usersContainer = document.getElementById('users-container');
        usersContainer.innerHTML = ''; // Yükleniyor mesajını temizle

        const allUsers = [];
        snapshot.forEach(userSnapshot => {
            const userId = userSnapshot.key;
            const userData = userSnapshot.val();
            userData.userId = userId; // userId'yi userData'ya ekle
            allUsers.push(userData);
        });

        // Kullanıcıları gösteren fonksiyon
        function displayUsers(users) {
            usersContainer.innerHTML = ''; // Önceki içeriği temizle

            users.forEach(userData => {
                const userRow = document.createElement('div');
                userRow.className = 'user-row';

                // Email alanı
                const email = userData.email || 'E-posta yok';
                const emailCell = document.createElement('span');
                emailCell.innerText = email;
                userRow.appendChild(emailCell);

                // Coin miktarı
                const coins = userData.coins || 0;
                const coinsCell = document.createElement('span');
                const coinsInput = document.createElement('input');
                coinsInput.type = 'number';
                coinsInput.value = coins;
                coinsInput.className = 'coins-input';
                coinsCell.appendChild(coinsInput);

                // Coin güncelleme butonu
                const saveCoinsBtn = document.createElement('button');
                saveCoinsBtn.className = 'btn btn-primary';
                saveCoinsBtn.innerText = 'Kaydet';
                saveCoinsBtn.addEventListener('click', () => {
                    const newCoins = parseInt(coinsInput.value, 10) || 0;
                    database.ref('users/' + userData.userId + '/coins').set(newCoins)
                        .then(() => {
                            alert('Coins başarıyla güncellendi');
                        })
                        .catch(error => {
                            console.error('Coins güncellenirken hata oluştu:', error);
                        });
                });
                coinsCell.appendChild(saveCoinsBtn);
                userRow.appendChild(coinsCell);

                // Mesaj Gönderme Alanı
                const messageCell = document.createElement('span');
                const messageBtn = document.createElement('button');
                messageBtn.className = 'btn btn-primary';
                messageBtn.innerText = 'Mesaj';
                messageBtn.addEventListener('click', function () {
                    if (!userRow.querySelector('.message-container')) {
                        const messageContainer = document.createElement('div');
                        messageContainer.className = 'message-container';

                        const messageInput = document.createElement('textarea');
                        messageInput.placeholder = 'Mesajınızı buraya girin';
                        messageInput.rows = 2;
                        messageInput.cols = 30;
                        messageInput.style.marginRight = '5px';
                        messageContainer.appendChild(messageInput);

                        const sendBtn = document.createElement('button');
                        sendBtn.className = 'btn btn-primary';
                        sendBtn.innerText = 'Gönder';
                        sendBtn.addEventListener('click', function () {
                            const messageText = messageInput.value.trim();
                            if (messageText !== '') {
                                database.ref('users/' + userData.userId + '/messages').push({
                                    message: messageText,
                                    timestamp: new Date().toISOString(),
                                    isRead: false
                                })
                                .then(() => {
                                    alert('Mesaj başarıyla gönderildi');
                                    messageInput.value = '';

                                    // Mesaj gönderildikten sonra kullanıcıya bildirim ekle
                                    const notificationData = {
                                        title: "Yeni Mesaj",
                                        body: "Bir mesajınız var.",
                                        timestamp: new Date().toISOString(),
                                        isRead: false,
                                        isDisplayed: false
                                    };

                                    // Kullanıcıya bildirim ekleme
                                    database.ref('users/' + userData.userId + '/notifications').push(notificationData)
                                        .then(() => {
                                            console.log('Bildirim başarıyla eklendi');
                                        })
                                        .catch(error => {
                                            console.error('Bildirim eklenirken hata oluştu:', error);
                                        });
                                })
                                .catch(error => {
                                    console.error('Mesaj gönderilirken hata oluştu:', error);
                                });
                            } else {
                                alert('Lütfen bir mesaj girin');
                            }
                        });
                        messageContainer.appendChild(sendBtn);
                        messageCell.appendChild(messageContainer);
                    }
                });
                messageCell.appendChild(messageBtn);
                userRow.appendChild(messageCell);

                // Abonelik durumları
                const subscriptions = userData.subscriptions || {};
                const statusCell = document.createElement('span');
                const showSubscriptionsBtn = document.createElement('button');
                showSubscriptionsBtn.className = 'btn btn-primary';
                showSubscriptionsBtn.innerText = 'Abonelikler';
                showSubscriptionsBtn.addEventListener('click', () => {
                    statusCell.innerHTML = ''; // Önceki içerikleri temizle
                    const subscriptionRow = document.createElement('div');
                    subscriptionRow.className = 'subscription-row';

                    vipPackages.forEach(vipTitle => {
                        const packageDiv = document.createElement('div');
                        packageDiv.className = 'package-cell';
                        packageDiv.innerText = vipTitle + ': ';

                        const status = document.createElement('span');
                        status.innerText = subscriptions[vipTitle] ?
                            `Durum: ${subscriptions[vipTitle].status}, Bitiş: ${subscriptions[vipTitle].endDate || 'Yok'}` :
                            'false';
                        packageDiv.appendChild(status);

                        // Tarih seçici ekleme
                        const dateInput = document.createElement('input');
                        dateInput.type = 'date';
                        dateInput.value = subscriptions[vipTitle]?.endDate?.split(' ')[0] || ''; // Mevcut tarihi göster
                        dateInput.className = 'date-input';
                        packageDiv.appendChild(dateInput);

                        // Güncelleme butonu
                        const updateBtn = document.createElement('button');
                        updateBtn.className = 'btn btn-primary';
                        updateBtn.innerText = 'Güncelle';
                        updateBtn.addEventListener('click', () => {
                            if (dateInput.value) {
                                const selectedDate = dateInput.value + " 23:59:59"; // Gün sonu saatini ekle
                                updateSubscriptionDate(userData.userId, vipTitle, selectedDate);
                            } else {
                                alert('Lütfen bir tarih seçin.');
                            }
                        });
                        packageDiv.appendChild(updateBtn);

                        subscriptionRow.appendChild(packageDiv);
                    });

                    statusCell.appendChild(subscriptionRow);
                });
                statusCell.appendChild(showSubscriptionsBtn);
                userRow.appendChild(statusCell);

                // userRow'u usersContainer'a ekle
                usersContainer.appendChild(userRow);
            });
        }

        // Tüm kullanıcıları başlangıçta göster
        displayUsers(allUsers);

        // Arama butonuna tıklama olayı
        document.getElementById('user-search-btn').addEventListener('click', function() {
            const searchTerm = document.getElementById('user-search-input').value.trim().toLowerCase();
            if (searchTerm === '') {
                displayUsers(allUsers);
            } else {
                const filteredUsers = allUsers.filter(user => (user.email || '').toLowerCase().includes(searchTerm));
                displayUsers(filteredUsers);
            }
        });

        // Arama kutusunda Enter tuşuna basıldığında arama yap
        document.getElementById('user-search-input').addEventListener('keyup', function(event) {
            if (event.key === 'Enter') {
                document.getElementById('user-search-btn').click();
            }
        });
    })
    .catch(error => {
        console.error('Kullanıcılar çekilirken hata oluştu:', error);
        const usersContainer = document.getElementById('users-container');
        usersContainer.innerText = 'Kullanıcılar yüklenemedi.';
    });
}

function updateSubscriptionDate(userId, vipTitle, newEndDate) {
    database.ref(`users/${userId}/subscriptions/${vipTitle}`).update({
        endDate: newEndDate,
        status: "active"
    }).then(() => {
        alert(`Abonelik bitiş tarihi başarıyla güncellendi: ${newEndDate}`);
    }).catch(error => {
        console.error('Tarih güncellenirken hata oluştu:', error);
    });
}






// Duyuru güncelleme ve dil seçme formu ekle
function showAnnouncementPage() {
    const contentDiv = document.getElementById('content');
    contentDiv.innerHTML = `
        <div class="announcement-container">
            <h2>Duyuru Güncelleme</h2>
            <div>
                <label for="announcement-input">Yeni Duyuru:</label>
                <input type="text" id="announcement-input" placeholder="Duyuru metnini buraya girin..." class="input-text">
            </div>
            <div>
                <label for="language-select">Dili Seçin:</label>
                <select id="language-select">
                    <option value="tr">Türkçe</option>
                    <option value="en">İngilizce</option>
                    <option value="fr">Fransızca</option>
                    <option value="pt">Portekizce</option>
                </select>
            </div>
            <button onclick="updateAnnouncement()">Duyuruyu Kaydet</button>
            <br>
            <h3>Güncel Duyuru:</h3>
            <p id="current-announcement">Duyuru yükleniyor...</p>
        </div>
    `;

    // Sayfa yüklendiğinde mevcut duyuruyu seçilen dile göre göster
    const languageSelect = document.getElementById("language-select");
    languageSelect.addEventListener('change', function () {
        displayAnnouncement(languageSelect.value);
    });

    displayAnnouncement(languageSelect.value);
}

// Kullanıcıdan girilen duyuruyu Firebase'e kaydetme fonksiyonu
function updateAnnouncement() {
    const announcement = document.getElementById("announcement-input").value;
    const selectedLanguage = document.getElementById("language-select").value;

    if (announcement !== "") {
        // Firebase'de seçilen dilin altına duyuru metnini kaydet
        database.ref('announcement/' + selectedLanguage).set({
            text: announcement
        }).then(() => {
            alert("Duyuru başarıyla kaydedildi!");
            displayAnnouncement(selectedLanguage);  // Güncel duyuruyu göster
        }).catch(error => {
            console.error("Hata: ", error);
        });
    } else {
        alert("Lütfen bir metin girin!");
    }
}

// Firebase'den duyuruyu seçilen dile göre çekip ekranda gösterme fonksiyonu
function displayAnnouncement(language) {
    const announcementRef = database.ref('announcement/' + language);
    announcementRef.once('value').then(snapshot => {
        const announcement = snapshot.val()?.text || "Güncel duyuru bulunamadı.";
        document.getElementById("current-announcement").innerText = announcement;
    }).catch(error => {
        console.error("Duyuru çekilemedi: ", error);
    });
}

// DOM yüklendikten sonra menü tıklama olaylarını tanımla
document.addEventListener('DOMContentLoaded', function () {
    document.querySelector('a[onclick="showHome()"]').addEventListener('click', showHome);
    document.querySelector('a[onclick="showMatches()"]').addEventListener('click', showMatches);
    document.querySelector('a[onclick="showSavedMatches()"]').addEventListener('click', showSavedMatches);
    document.querySelector('a[onclick="showPurchase()"]').addEventListener('click', showPurchase);
    document.querySelector('a[onclick="showUsers()"]').addEventListener('click', showUsers);
    document.querySelector('a[onclick="sendNotification()"]').addEventListener('click', sendNotification);
    document.querySelector('a[onclick="showCoins()"]').addEventListener('click', showCoins);
    document.querySelector('a[onclick="showSettings()"]').addEventListener('click', showSettings);
    document.querySelector('a[onclick="showAnnouncementPage()"]').addEventListener('click', showAnnouncementPage);
});

// Sayfa yüklendiğinde varsayılan dili (Türkçe) göster
window.onload = function () {
    displayAnnouncement("tr");
};


function showNotificationForm() {
    // Bildirim Gönderme Formunu sayfaya ekle
    const contentDiv = document.getElementById('content');
    contentDiv.innerHTML = `
        <div class="notification-form">
            <h2>Bildirim Gönderme Formu</h2>
            <div class="form-group">
                <label for="notification-title">Başlık:</label>
                <input type="text" id="notification-title" placeholder="Bildirim başlığını girin...">
            </div>
            <div class="form-group">
                <label for="notification-body">Açıklama:</label>
                <textarea id="notification-body" placeholder="Bildirim açıklamasını girin..."></textarea>
            </div>
            <div class="form-group">
                <button id="send-notification-btn">Bildirim Gönder</button>
            </div>
            <p id="status-message" style="text-align: center;"></p>
        </div>
    `;

    // Form yüklendikten sonra butona tıklama olayını ekleyin
    document.getElementById('send-notification-btn').addEventListener('click', sendNotification);
}

// Bildirim Gönderme İşlemi
function sendNotification() {

    
    // Bildirim formu elemanlarını al
    const titleElement = document.getElementById('notification-title');
    const bodyElement = document.getElementById('notification-body');

    // Elemanların var olup olmadığını kontrol edin
    if (!titleElement || !bodyElement) {
        console.error("Bildirim başlığı veya açıklama elemanı bulunamadı!");
        return;
    }

    const title = titleElement.value;
    const body = bodyElement.value;

    if (!title || !body) {
        alert('Lütfen başlık ve açıklama alanlarını doldurun.');
        return;
    }

    // Bildirim verisi
    const notificationData = {
        title: title,
        body: body,
        timestamp: new Date().toISOString(),
        isRead: false,
        isDisplayed: false  // Ekstra bir alan ekliyoruz
    };

    // Tüm kullanıcıların veritabanı referansını al
    const usersRef = database.ref('users');

    // Tüm kullanıcılara bildirimi kaydet
    usersRef.once('value')
        .then(snapshot => {
            snapshot.forEach(userSnapshot => {
                const userId = userSnapshot.key; // Kullanıcı ID'sini al
                // Bildirimi bu kullanıcının 'notifications' altına ekle
                database.ref(`users/${userId}/notifications`).push(notificationData);
            });
            // Başarılı mesaj göster
            document.getElementById('status-message').innerText = 'Bildirim başarıyla tüm kullanıcılara gönderildi!';
        })
        .catch(error => {
            console.error('Bildirim gönderme hatası:', error);
            document.getElementById('status-message').innerText = 'Bildirimi gönderirken bir hata oluştu.';
        });

    // Formu sıfırla
    titleElement.value = '';
    bodyElement.value = '';
}

function showPurchase() {
    const contentDiv = document.getElementById('content');
    contentDiv.innerHTML = "<h2>Satın Alma Bilgilendirmeleri</h2><div id='purchase-container'></div>";

    // Firebase'den bilgilendirme verilerini çek
    const bilgilendirmeRef = database.ref('Bilgilendirme');

    bilgilendirmeRef.once('value').then(snapshot => {
        const purchaseContainer = document.getElementById('purchase-container');
        purchaseContainer.innerHTML = ''; // Önceki içerikleri temizle

        // Firebase'den gelen verileri bir diziye çevir ve ters sırada göster
        const purchaseList = [];
        snapshot.forEach(purchaseSnapshot => {
            purchaseList.push({
                id: purchaseSnapshot.key,     // Bildirimin benzersiz ID'sini al
                message: purchaseSnapshot.val() // Mesaj içeriğini al
            });
        });

        // Listeyi tersine çevir (en son eklenen en başta)
        purchaseList.reverse();

        // Ters sırada verileri ekrana yazdır
        purchaseList.forEach((purchaseInfo, index) => {
            // Her bildirim için bir div oluştur ve stil ekle
            const purchaseItem = document.createElement('div');
            purchaseItem.className = 'purchase-item';
            purchaseItem.style.padding = '10px';
            purchaseItem.style.border = '1px solid #ccc';
            purchaseItem.style.borderRadius = '5px';
            purchaseItem.style.marginBottom = '10px';
            purchaseItem.style.backgroundColor = '#f9f9f9';

            // Bildirim ID ve içerik
            const idSpan = document.createElement('span');
            idSpan.style.fontWeight = 'bold';
            idSpan.style.color = '#007bff';
            idSpan.innerText = `ID: ${purchaseInfo.id}`;

            const messageSpan = document.createElement('span');
            messageSpan.style.marginLeft = '10px';
            messageSpan.style.display = 'block';
            messageSpan.innerText = `Mesaj: ${purchaseInfo.message}`;

            // Sıra numarasını ekle
            const indexSpan = document.createElement('span');
            indexSpan.style.marginRight = '10px';
            indexSpan.style.fontWeight = 'bold';
            indexSpan.innerText = `${index + 1}. `;

            // ID ve içerik span'lerini purchaseItem içine ekle
            purchaseItem.appendChild(indexSpan);
            purchaseItem.appendChild(idSpan);
            purchaseItem.appendChild(messageSpan);

            // Container'a ekle
            purchaseContainer.appendChild(purchaseItem);
        });
    }).catch(error => {
        console.error("Bilgilendirme verileri çekilemedi: ", error);
        const purchaseContainer = document.getElementById('purchase-container');
        purchaseContainer.innerHTML = '<p>Bilgilendirme verileri yüklenemedi.</p>';
    });
}

function showSettings() {
    const contentDiv = document.getElementById('content');
    contentDiv.innerHTML = `
        <h2>Ayarlar İçeriği</h2>
        <div class="settings-form">
            <label for="settings-email">E-posta Adresi:</label>
            <input type="email" id="settings-email" placeholder="E-posta adresinizi girin..." class="input-text">
            <br>
            <label for="settings-telegram">Telegram Kanalı:</label>
            <input type="text" id="settings-telegram" placeholder="Telegram kanalını girin..." class="input-text">
            <br>
            <button id="save-settings-btn" class="btn btn-primary">Kaydet</button>
            <p id="settings-status" style="text-align: center;"></p>
        </div>
    `;

    // Firebase'den mevcut ayar verilerini çek
    const settingsRef = database.ref('appSettings');
    settingsRef.once('value').then(snapshot => {
        const settingsData = snapshot.val();

        // Eğer veritabanında ayar bilgisi varsa, input alanlarını güncelle
        if (settingsData) {
            document.getElementById('settings-email').value = settingsData.email || '';
            document.getElementById('settings-telegram').value = settingsData.telegram || '';
        }
    }).catch(error => {
        console.error("Ayar verileri yüklenemedi: ", error);
        document.getElementById('settings-status').innerText = 'Ayar verileri yüklenemedi.';
    });

    // Kaydet butonuna tıklama olayı
    document.getElementById('save-settings-btn').addEventListener('click', () => {
        const emailValue = document.getElementById('settings-email').value.trim();
        const telegramValue = document.getElementById('settings-telegram').value.trim();

        if (emailValue === '' || telegramValue === '') {
            alert('Lütfen tüm alanları doldurun.');
            return;
        }

        // Firebase'e ayar verilerini kaydet
        settingsRef.set({
            email: emailValue,
            telegram: telegramValue
        }).then(() => {
            document.getElementById('settings-status').innerText = 'Ayarlar başarıyla kaydedildi!';
            document.getElementById('settings-status').style.color = 'green';
        }).catch(error => {
            console.error("Ayarlar kaydedilirken hata oluştu: ", error);
            document.getElementById('settings-status').innerText = 'Ayarlar kaydedilirken hata oluştu.';
            document.getElementById('settings-status').style.color = 'red';
        });
    });
}

function showVipAbonelikler() {
    const contentDiv = document.getElementById('content');
    contentDiv.innerHTML = '<h2>VIP Abonelikler</h2><div id="vipList"></div>';

    // Firebase verilerini çek
    const vipListDiv = document.getElementById('vipList');
    const dbRef = firebase.database().ref('VipAbonelikler');

    dbRef.once('value', (snapshot) => {
        const abonelikler = snapshot.val();
        if (abonelikler) {
            Object.keys(abonelikler).forEach(key => {
                const abonelik = abonelikler[key];
                const abonelikDiv = document.createElement('div');
                
                abonelikDiv.innerHTML = `
                    <p><strong>${key}</strong>: ${abonelik.aboneler} aboneler</p>
                    <button onclick="updateAbonelik('${key}', 'increase')">Abone Sayısını Arttır</button>
                    <button onclick="updateAbonelik('${key}', 'decrease')">Abone Sayısını Azalt</button>
                    <br>
                    <label for="manualInput_${key}">Manuel Abone Sayısı Gir:</label>
                    <input type="number" id="manualInput_${key}" value="${abonelik.aboneler}">
                    <button onclick="setManualAbonelik('${key}')">Manuel Olarak Güncelle</button>
                `;
                vipListDiv.appendChild(abonelikDiv);
            });
        } else {
            vipListDiv.innerHTML = '<p>VIP Abonelik bulunamadı.</p>';
        }
    });
}

// Abonelik sayısını güncelleme fonksiyonu
function updateAbonelik(key, action) {
    const dbRef = firebase.database().ref('VipAbonelikler/' + key);

    dbRef.once('value', (snapshot) => {
        const abonelik = snapshot.val();
        let currentCount = abonelik.aboneler;

        if (action === 'increase') {
            currentCount += 1;
        } else if (action === 'decrease' && currentCount > 0) {
            currentCount -= 1;
        }

        // Yeni abone sayısını Firebase'e kaydet
        dbRef.update({ aboneler: currentCount })
            .then(() => {
                alert(`${key} için abone sayısı güncellendi: ${currentCount}`);
                showVipAbonelikler(); // Sayfayı güncellemek için tekrar yükle
            })
            .catch((error) => {
                console.error('Abone sayısı güncellenirken hata oluştu:', error);
            });
    });
}

// Manuel abone sayısını güncelleme fonksiyonu
function setManualAbonelik(key) {
    const inputField = document.getElementById(`manualInput_${key}`);
    const newCount = parseInt(inputField.value);

    if (isNaN(newCount) || newCount < 0) {
        alert('Geçerli bir abone sayısı girin.');
        return;
    }

    const dbRef = firebase.database().ref('VipAbonelikler/' + key);

    // Yeni abone sayısını Firebase'e kaydet
    dbRef.update({ aboneler: newCount })
        .then(() => {
            alert(`${key} için abone sayısı manuel olarak güncellendi: ${newCount}`);
            showVipAbonelikler(); // Sayfayı güncellemek için tekrar yükle
        })
        .catch((error) => {
            console.error('Abone sayısı güncellenirken hata oluştu:', error);
        });
}

async function loadWinnersMatches() {
    // 'content' div'ini temizleyelim
    const contentDiv = document.getElementById('content');
    contentDiv.innerHTML = '';  // Mevcut içeriği temizle

    // matchContainer oluştur ve content div'ine ekle
    let matchContainer = document.createElement('div');
    matchContainer.id = 'savedMatchContainer';
    contentDiv.appendChild(matchContainer);

    matchContainer.innerHTML = '<p>Veriler yükleniyor...</p>'; // İlk başta yükleniyor mesajı

    try {
        const snapshot = await firebase.database().ref('winners').once('value');
        const datesData = snapshot.val();

        if (!datesData) {
            console.warn('Winners kategorisinde kayıtlı maç bulunamadı.');
            matchContainer.innerHTML = '<p>Winners kategorisinde maç bulunamadı.</p>';
            return;
        }

        // Tüm tarihleri al ve en yeni tarihler en üstte olacak şekilde sırala
        const dates = Object.keys(datesData);
        dates.sort((a, b) => new Date(b) - new Date(a)); // Yeni tarihler önce

        const allMatches = [];

        dates.forEach(date => {
            const matches = datesData[date];
            for (const matchId in matches) {
                allMatches.push({
                    date: date,
                    matchId: matchId,
                    ...matches[matchId]  // Tüm maç verilerini ekle
                });
            }
        });

        if (allMatches.length === 0) {
            matchContainer.innerHTML = '<p>Winners kategorisinde maç bulunamadı.</p>';
            return;
        }

        displayMatches(allMatches, dates);

    } catch (error) {
        console.error('Veri alınırken hata oluştu:', error);
        matchContainer.innerHTML = '<p>Veri yüklenirken bir hata oluştu.</p>';
    }
}

function displayMatches(matchesArray, dates) {
    const matchContainer = document.getElementById('savedMatchContainer');
    matchContainer.innerHTML = '';

    if (matchesArray.length === 0) {
        matchContainer.innerHTML = '<p>Maç bulunamadı.</p>';
        return;
    }

    const table = document.createElement('table');
    table.className = 'matches-table';

    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    const headers = ['Lig', 'Saat', 'Ev', 'Konuk', 'Kategori', 'Sil'];

    headers.forEach(headerText => {
        const th = document.createElement('th');
        th.textContent = headerText;
        headerRow.appendChild(th);
    });

    thead.appendChild(headerRow);
    table.appendChild(thead);

    const tbody = document.createElement('tbody');

    dates.forEach(date => {
        const dateMatches = matchesArray.filter(match => match.date === date);

        if (dateMatches.length > 0) {
            // Tarih başlığı ekle
            const dateRow = document.createElement('tr');
            const dateCell = document.createElement('td');
            dateCell.colSpan = headers.length;  // Tüm sütunları kapsasın
            dateCell.textContent = `Tarih: ${date}`;
            dateCell.style.fontWeight = 'bold';
            dateCell.style.backgroundColor = '#f2f2f2';
            dateRow.appendChild(dateCell);
            tbody.appendChild(dateRow);

            dateMatches.forEach(match => {
                const row = document.createElement('tr');

                const leagueCell = document.createElement('td');
                leagueCell.textContent = match.league || '-';
                row.appendChild(leagueCell);

                const timeCell = document.createElement('td');
                timeCell.textContent = match.time || '-';
                row.appendChild(timeCell);

                const homeTeamCell = document.createElement('td');
                homeTeamCell.textContent = match.homeTeam || '-';
                row.appendChild(homeTeamCell);

                const awayTeamCell = document.createElement('td');
                awayTeamCell.textContent = match.awayTeam || '-';
                row.appendChild(awayTeamCell);

                const categoryCell = document.createElement('td');
                categoryCell.textContent = match.category || '-';
                row.appendChild(categoryCell);

                // Sil butonu ekle
                const deleteCell = document.createElement('td');
                const deleteButton = document.createElement('button');
                deleteButton.textContent = 'Sil';
                deleteButton.className = 'btn btn-danger';
                deleteButton.addEventListener('click', () => {
                    deleteMatch(match.date, match.matchId);
                });
                deleteCell.appendChild(deleteButton);
                row.appendChild(deleteCell);

                tbody.appendChild(row);
            });
        }
    });

    table.appendChild(tbody);
    matchContainer.appendChild(table);
}

function deleteMatch(date, matchId) {
    if (confirm('Bu maçı silmek istediğinizden emin misiniz?')) {
        firebase.database().ref(`winners/${date}/${matchId}`).remove()
            .then(() => {
                alert('Maç başarıyla silindi.');
                // Maç silindikten sonra listeyi güncelle
                loadWinnersMatches();
            })
            .catch((error) => {
                console.error('Maç silinirken hata oluştu:', error);
                alert('Maç silinirken bir hata oluştu.');
            });
    }
}



// Giriş yapma fonksiyonu
function login() {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    firebase.auth().signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            // Giriş başarılı
            document.getElementById('login-container').style.display = 'none';
            document.getElementById('app-container').style.display = 'block';
            // Ana sayfayı yükle
            showHome();
        })
        .catch((error) => {
            var errorMessage = error.message;
            alert('Hata: ' + errorMessage);
        });
}

// Çıkış yapma fonksiyonu
function logout() {
    firebase.auth().signOut().then(() => {
        // Çıkış başarılı
        document.getElementById('app-container').style.display = 'none';
        document.getElementById('login-container').style.display = 'block';
    }).catch((error) => {
        alert('Hata: ' + error.message);
    });
}

// Kullanıcının oturum durumunu izleme
firebase.auth().onAuthStateChanged((user) => {
    if (user) {
        // Kullanıcı giriş yapmış
        document.getElementById('login-container').style.display = 'none';
        document.getElementById('app-container').style.display = 'block';
        // Ana sayfayı yükle
        showHome();
    } else {
        // Kullanıcı giriş yapmamış
        document.getElementById('login-container').style.display = 'block';
        document.getElementById('app-container').style.display = 'none';
    }
});

// Giriş butonuna tıklama olayı ekleme
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('login-btn').addEventListener('click', login);

    // Menü kapatma fonksiyonu
    function closeMenu() {
        document.getElementById('menu-toggle-checkbox').checked = false;
    }

    // Tüm menü öğelerine tıklama olayları ekle
    const menuItems = document.querySelectorAll('.nav-links li a');
    menuItems.forEach(menuItem => {
        menuItem.addEventListener('click', () => {
            closeMenu();
        });
    });

    // Ana içeriğe tıklanınca menüyü kapat
    document.getElementById('main-content').addEventListener('click', (e) => {
        const sidebar = document.getElementById('sidebar');
        const menuToggleCheckbox = document.getElementById('menu-toggle-checkbox');
        
        // Tıklanan yer menü değilse ve menü açıksa kapat
        if (!sidebar.contains(e.target) && menuToggleCheckbox.checked) {
            closeMenu();
        }
    });

    // Menü açma/kapama butonuna tıklanınca menüyü kapat
    document.querySelector('.menu-toggle-label').addEventListener('click', () => {
        const menuToggleCheckbox = document.getElementById('menu-toggle-checkbox');
        menuToggleCheckbox.checked = !menuToggleCheckbox.checked;
    });
});