const admin = require('firebase-admin');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

// Firebase Admin'i başlat
var serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://oxygen-6b822-default-rtdb.firebaseio.com"
});

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Bildirim gönderme fonksiyonu
app.post('/sendNotification', (req, res) => {
    const { title, body } = req.body;

    // Tüm kullanıcıların tokenlarını çekmek için veritabanı referansı
    const db = admin.database();
    const usersRef = db.ref('users'); // `users` referansını güncelledim
    usersRef.once('value', (snapshot) => {
        const tokens = [];
        snapshot.forEach((childSnapshot) => {
            const userData = childSnapshot.val();
            if (userData && userData.fcmToken) {  // fcmToken alanını kontrol et
                tokens.push(userData.fcmToken);
            }
        });

        if (tokens.length === 0) {
            return res.status(400).send({ success: false, message: 'Hiçbir kullanıcı tokenı bulunamadı.' });
        }

        // FCM Bildirim Mesajı
        const message = {
            notification: {
                title: title,
                body: body
            },
            tokens: tokens
        };

        // Toplu mesaj gönderme
        admin.messaging().sendMulticast(message)
            .then((response) => {
                console.log(`${response.successCount} mesaj başarıyla gönderildi, ${response.failureCount} hata oluştu.`);
                res.status(200).send({ success: true, response: response });
            })
            .catch((error) => {
                console.error('Mesaj gönderme hatası:', error);
                res.status(500).send({ success: false, error: error });
            });
    });
});

// Sunucuyu çalıştır
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Sunucu ${PORT} portunda çalışıyor.`);
});
