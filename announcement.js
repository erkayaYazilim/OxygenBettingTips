// Firebase yapılandırması ve veritabanı bağlantısı
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
const app = firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// Duyuru metnini Firebase'e kaydetme fonksiyonu
function updateAnnouncement() {
    const announcement = document.getElementById("announcement-input").value;
    if (announcement !== "") {
        // Firebase veritabanına duyuru güncelle
        database.ref('announcement').set({
            text: announcement
        }).then(() => {
            alert("Duyuru başarıyla güncellendi!");
            displayAnnouncement();
        }).catch(error => {
            console.error("Hata: ", error);
        });
    } else {
        alert("Lütfen bir metin girin!");
    }
}

// Firebase'den duyuruyu çekip ekranda gösterme fonksiyonu
function displayAnnouncement() {
    database.ref('announcement').once('value').then(snapshot => {
        const announcement = snapshot.val().text;
        document.getElementById("scrolling-text").innerHTML = announcement || "Güncel Duyuru Yok";
    }).catch(error => {
        console.error("Duyuru çekilemedi: ", error);
    });
}

// Sayfa yüklendiğinde duyuruyu görüntüle
window.onload = function () {
    displayAnnouncement();
};
