(async function () {
    const categories = ['Free', 'Paid', 'Live Tips', 'Sure', 'HT-FT', 'Coupon of the Day', 'Multi Combine', '10+ Odds', 'Editor’s Definitive Coupons', 'Artificial Intelligence', 'Correct Score', 'Over-Under'];
    const predictionTypes = ['Match Winner', 'Home/Away', 'Second Half Winner', 'Goals Over/Under', 'Goals Over/Under First Half', 'Goals Over/Under - Second Half', 'HT/FT Double', 'Both Teams Score', 'Win to Nil - Home', 'Win to Nil - Away', 'Exact Score', 'Highest Scoring Half', 'Correct Score - First Half', 'Double Chance', 'First Half Winner', 'Total - Home', 'Total - Away', 'Both Teams Score - First Half', 'Both Teams To Score - Second Half', 'Odd/Even', 'Exact Goals Number', 'Home Team Exact Goals Number', 'Away Team Exact Goals Number', 'Home Team Score a Goal', 'Away Team Score a Goal', 'Exact Goals Number - First Half', 'Home team will score in both halves', 'Away team will score in both halves', 'To Score in Both Halves', 'Winning Margin'];

    const rapidApiConfig = {
        host: "api-football-v1.p.rapidapi.com",
        key: "d4ac606f77mshefcba8ce9e6a37fp1bbe62jsne88a4b40c369" // Geçerli API anahtarınızı buraya ekleyin
    };

    let selectedCategory = null; // Seçilen kategori

    // Maçları yükleyen fonksiyon
    window.loadSavedMatches = async function () {
        const contentDiv = document.getElementById('content');
        contentDiv.innerHTML = `
            <h2>Kayıt Edilmiş Maçlar</h2>
            <div id="savedCategoryContainer" class="button-container"></div>
            <div id="savedMatchContainer"></div>
        `;

        // Kategori butonlarını görüntüle
        displaySavedCategoryButtons();

        // Tüm maçları yükle ve sonuçları kontrol et
        await loadMatchesForAllCategories();
    };

    // Kategori butonlarını görüntüleyen fonksiyon
    function displaySavedCategoryButtons() {
        const categoryContainer = document.getElementById('savedCategoryContainer');
        categoryContainer.innerHTML = '';

        categories.forEach(category => {
            const button = document.createElement('button');
            button.className = 'category-btn';
            button.innerText = category;
            button.addEventListener('click', () => {
                selectedCategory = category;
                updateCategoryButtons();
                // Seçilen kategoriye göre maçları filtrele
                filterMatchesByCategory();
            });
            categoryContainer.appendChild(button);
        });

        // Tümünü Göster butonu ekleyelim
        const allButton = document.createElement('button');
        allButton.className = 'category-btn';
        allButton.innerText = 'All';
        allButton.addEventListener('click', () => {
            selectedCategory = null;
            updateCategoryButtons();
            filterMatchesByCategory();
        });
        categoryContainer.appendChild(allButton);
    }

    // Kategori butonlarının aktifliğini güncelleyen fonksiyon
    function updateCategoryButtons() {
        const buttons = document.querySelectorAll('.category-btn');
        buttons.forEach(button => {
            if (button.innerText === selectedCategory) {
                button.classList.add('active-category');
            } else if (selectedCategory === null && button.innerText === 'All') {
                button.classList.add('active-category');
            } else {
                button.classList.remove('active-category');
            }
        });
    }

    let allMatchesData = []; // Tüm maçları saklayacağımız dizi

    // Tüm kategorilerdeki maçları yükleyen fonksiyon
    async function loadMatchesForAllCategories() {
        const matchContainer = document.getElementById('savedMatchContainer');
        matchContainer.innerHTML = '';

        try {
            const snapshot = await firebase.database().ref('predictions').once('value');
            const datesData = snapshot.val();

            if (!datesData) {
                console.warn('Kayıtlı herhangi bir maç bulunamadı.');
                matchContainer.innerHTML = '<p>Kayıtlı maç bulunamadı.</p>';
                return;
            }

            // Dün, bugün ve yarın için tarihleri alalım
            const datesToGet = [];
            const today = new Date();

            // Dün
            const yesterday = new Date(today);
            yesterday.setDate(today.getDate() - 1);
            datesToGet.push(yesterday.toISOString().split('T')[0]);

            // Bugün
            datesToGet.push(today.toISOString().split('T')[0]);

            // Yarın
            const tomorrow = new Date(today);
            tomorrow.setDate(today.getDate() + 1);
            datesToGet.push(tomorrow.toISOString().split('T')[0]);

            const matchesToShow = {};

            datesToGet.forEach(date => {
                if (datesData[date]) {
                    matchesToShow[date] = datesData[date];
                }
            });

            if (Object.keys(matchesToShow).length === 0) {
                console.warn('Belirtilen tarihler için maç bulunamadı.');
                matchContainer.innerHTML = '<p>Belirtilen tarihler için maç bulunamadı.</p>';
                return;
            }

            allMatchesData = []; // Tüm maç verilerini saklamak için

            // Maçları al ve sonuçları güncelle
            let totalMatches = 0;
            for (const date in matchesToShow) {
                const categoriesInDate = matchesToShow[date];
                for (const category in categoriesInDate) {
                    const matches = categoriesInDate[category];
                    totalMatches += Object.keys(matches).length;
                }
            }

            let processedMatches = 0;

            // Progress bar oluştur
            createProgressBar();

            for (const date in matchesToShow) {
                const categoriesInDate = matchesToShow[date];
                for (const category in categoriesInDate) {
                    const matches = categoriesInDate[category];
                    for (const matchId in matches) {
                        const match = matches[matchId];

                        // Maç verilerini güncelle (skorlar ve saat dahil)
                        const latestMatchData = await getLatestMatchScores(match.matchId, match);
                        if (latestMatchData) {
                            // Maç verilerini güncelle
                            await firebase.database().ref(`predictions/${date}/${category}/${matchId}`).update({
                                halftimeScore: latestMatchData.halftimeScore,
                                fulltimeScore: latestMatchData.fulltimeScore,
                                apiResult: latestMatchData.apiResult,
                                time: latestMatchData.matchTime,
                                status: latestMatchData.matchStatus,
                                userResult: latestMatchData.userResult // 'won' or 'lost'
                            });

                            // Eğer maç kazandıysa ve kategori "Free" değilse, maçı "winners" kısmına taşı
                            if (latestMatchData.userResult === 'won' && category !== 'Free') {
                                // Önce kontrol edelim, 'winners' kısmında zaten varsa tekrar eklemeyelim
                                const winnerSnapshot = await firebase.database().ref(`winners/${date}/${matchId}`).once('value');
                                if (!winnerSnapshot.exists()) {
                                    await firebase.database().ref(`winners/${date}/${matchId}`).set({
                                        ...match,
                                        halftimeScore: latestMatchData.halftimeScore,
                                        fulltimeScore: latestMatchData.fulltimeScore,
                                        apiResult: latestMatchData.apiResult,
                                        time: latestMatchData.matchTime,
                                        status: latestMatchData.matchStatus,
                                        userResult: latestMatchData.userResult,
                                        category: category
                                    });
                                }

                                // Orijinal kategoriden sil
                               
                            }

                            // Yerel değişkene verileri ekle
                            match.halftimeScore = latestMatchData.halftimeScore;
                            match.fulltimeScore = latestMatchData.fulltimeScore;
                            match.apiResult = latestMatchData.apiResult;
                            match.time = latestMatchData.matchTime;
                            match.status = latestMatchData.matchStatus;
                            match.userResult = latestMatchData.userResult;
                        }

                        // Maç verilerini sakla
                        allMatchesData.push({
                            date: date,
                            category: category,
                            matchData: match
                        });

                        // İşlenen maç sayısını güncelle ve progress bar'ı güncelle
                        processedMatches++;
                        updateProgressBar(processedMatches, totalMatches);
                    }
                }
            }

            // Progress bar'ı kaldır
            removeProgressBar();

            // Maçları görüntüle
            displayMatches(allMatchesData);

        } catch (error) {
            console.error('Veri alınırken hata oluştu:', error);
        }
    }

    // Maçları görüntüleyen fonksiyon
    function displayMatches(matchesArray) {
        const matchContainer = document.getElementById('savedMatchContainer');
        matchContainer.innerHTML = '';

        const uniqueMatches = [];
        matchesArray.forEach(item => {
            if (!uniqueMatches.some(match => match.matchData.matchId === item.matchData.matchId)) {
                uniqueMatches.push(item);
            }
        });
    
        if (uniqueMatches.length === 0) {
            matchContainer.innerHTML = '<p>Seçilen kategori için maç bulunamadı.</p>';
            return;
        }
        if (matchesArray.length === 0) {
            matchContainer.innerHTML = '<p>Seçilen kategori için maç bulunamadı.</p>';
            return;
        }

        // Maçları tablo şeklinde göster
        const table = document.createElement('table');
        table.className = 'matches-table';

        // Tablo başlık satırı
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        const headers = ['Tarih', 'Kategori', 'Lig', 'Saat', 'Ev', 'Konuk', 'Tahmin', 'Oran', 'İY', 'MS', 'Sonuç', 'Tahmin'];

        headers.forEach(headerText => {
            const th = document.createElement('th');
            th.textContent = headerText;
            headerRow.appendChild(th);
        });

        thead.appendChild(headerRow);
        table.appendChild(thead);

        // Tablo gövdesi
        const tbody = document.createElement('tbody');

        matchesArray.forEach(item => {
            const { date, category, matchData } = item;

            const row = document.createElement('tr');

            // Tarih
            const dateCell = document.createElement('td');
            dateCell.textContent = date;
            row.appendChild(dateCell);

            // Kategori
            const categoryCell = document.createElement('td');
            categoryCell.textContent = category;
            row.appendChild(categoryCell);

            // Lig
            const leagueCell = document.createElement('td');
            leagueCell.textContent = matchData.league;
            row.appendChild(leagueCell);

            // Saat
            const timeCell = document.createElement('td');
            timeCell.textContent = matchData.time || '-';
            row.appendChild(timeCell);

            // Ev Sahibi
            const homeTeamCell = document.createElement('td');
            homeTeamCell.textContent = matchData.homeTeam;
            row.appendChild(homeTeamCell);

            // Konuk
            const awayTeamCell = document.createElement('td');
            awayTeamCell.textContent = matchData.awayTeam;
            row.appendChild(awayTeamCell);

            // Tahmin
            const predictionCell = document.createElement('td');
            predictionCell.textContent = `${matchData.predictionType || '-'} - ${matchData.predictionValue || '-'}`;
            row.appendChild(predictionCell);

            // Oran
            const oddsCell = document.createElement('td');
            oddsCell.textContent = matchData.odds || '-';
            row.appendChild(oddsCell);

            // İlk Yarı Skoru (İY)
            const halftimeScoreCell = document.createElement('td');
            halftimeScoreCell.textContent = matchData.halftimeScore || '-';
            row.appendChild(halftimeScoreCell);

            // Maç Sonu Skoru (MS)
            const fulltimeScoreCell = document.createElement('td');
            fulltimeScoreCell.textContent = matchData.fulltimeScore || '-';
            row.appendChild(fulltimeScoreCell);

            // Sonuç (API'den)
            const resultCell = document.createElement('td');
            resultCell.textContent = matchData.apiResult || '-';
            row.appendChild(resultCell);

            // Tahmin Sonucu
            const actionCell = document.createElement('td');

            // Sonucu göster
            if (matchData.userResult === 'won') {
                actionCell.textContent = 'Tuttu';
            } else if (matchData.userResult === 'lost') {
                actionCell.textContent = 'Tutmadı';
            } else {
                actionCell.textContent = '-';
            }

            row.appendChild(actionCell);

            tbody.appendChild(row);
        });

        table.appendChild(tbody);
        matchContainer.appendChild(table);

        // Responsive tasarım için CSS ekleyelim
        addResponsiveStyles();
    }

    // Seçilen kategoriye göre maçları filtreleyen fonksiyon
    function filterMatchesByCategory() {
        if (selectedCategory) {
            const filteredMatches = allMatchesData.filter(item => item.category === selectedCategory);
            displayMatches(filteredMatches);
        } else {
            displayMatches(allMatchesData);
        }
    }

    // Maç skorlarını ve saatini API'den alan fonksiyon
    async function getLatestMatchScores(matchId, match) {
        const url = `https://${rapidApiConfig.host}/v3/fixtures?id=${matchId}`;

        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'X-RapidAPI-Key': rapidApiConfig.key,
                    'X-RapidAPI-Host': rapidApiConfig.host
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (!data.response || data.response.length === 0) {
                console.warn(`API'den geçerli bir yanıt alınamadı: ${JSON.stringify(data)}`);
                return null;
            }

            const fixture = data.response[0];

            // Skorları al
            const halftimeScore = fixture.score.halftime.home !== null && fixture.score.halftime.away !== null
                ? `${fixture.score.halftime.home}-${fixture.score.halftime.away}`
                : '-';

            const fulltimeScore = fixture.goals.home !== null && fixture.goals.away !== null
                ? `${fixture.goals.home}-${fixture.goals.away}`
                : '-';

            // Maç saati
            const matchDateTime = fixture.fixture.date; // ISO tarih stringi
            const matchTime = new Date(matchDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            // Maç durumu
            const matchStatus = fixture.fixture.status.short;

            // Maç sonucunu belirleme (tahmin türüne göre)
            const resultData = checkPredictionResult(fixture, match);

            return {
                halftimeScore: halftimeScore,
                fulltimeScore: fulltimeScore,
                apiResult: resultData.apiResult,
                userResult: resultData.userResult,
                matchTime: matchTime,
                matchStatus: matchStatus
            };
        } catch (error) {
            console.error(`Maç skorları alınırken hata oluştu: ${error}`);
            return null;
        }
    }

// Tahmin sonucunu belirleyen fonksiyon (daha önceki mesajlardaki gibi)
function checkPredictionResult(fixture, match) {
    const predictionType = match.predictionType;
    const predictionValue = match.predictionValue;
  
    const matchStatus = fixture.fixture.status.short.toLowerCase();
  
    if (matchStatus === 'ft' || matchStatus === 'aet' || matchStatus === 'pen') {
        const homeGoals = fixture.goals.home;
        const awayGoals = fixture.goals.away;
        const halftimeHomeGoals = fixture.score.halftime.home;
        const halftimeAwayGoals = fixture.score.halftime.away;
  
        let apiResult = 'Maç Sonucu Belirlenemedi';
        let userResult = 'lost';
  
        // Match Winner
        if (predictionType === 'Match Winner') {
            if (homeGoals > awayGoals) {
                apiResult = 'Ev Kazandı';
                userResult = (predictionValue === 'Home') ? 'won' : 'lost';
            } else if (homeGoals < awayGoals) {
                apiResult = 'Konuk Kazandı';
                userResult = (predictionValue === 'Away') ? 'won' : 'lost';
            } else {
                apiResult = 'Berabere';
                userResult = (predictionValue === 'Draw') ? 'won' : 'lost';
            }
        }
        // Home/Away
        else if (predictionType === 'Home/Away') {
            if (homeGoals > awayGoals) {
                apiResult = 'Ev Kazandı';
                userResult = (predictionValue === 'Home') ? 'won' : 'lost';
            } else if (homeGoals < awayGoals) {
                apiResult = 'Konuk Kazandı';
                userResult = (predictionValue === 'Away') ? 'won' : 'lost';
            } else {
                apiResult = 'Berabere';
                userResult = 'lost'; // Beraberlik seçeneği yok
            }
        }
        // Second Half Winner
        else if (predictionType === 'Second Half Winner') {
            const secondHalfHomeGoals = homeGoals - halftimeHomeGoals;
            const secondHalfAwayGoals = awayGoals - halftimeAwayGoals;
  
            if (secondHalfHomeGoals > secondHalfAwayGoals) {
                apiResult = 'İkinci Yarı Ev Kazandı';
                userResult = (predictionValue === 'Home') ? 'won' : 'lost';
            } else if (secondHalfHomeGoals < secondHalfAwayGoals) {
                apiResult = 'İkinci Yarı Konuk Kazandı';
                userResult = (predictionValue === 'Away') ? 'won' : 'lost';
            } else {
                apiResult = 'İkinci Yarı Berabere';
                userResult = (predictionValue === 'Draw') ? 'won' : 'lost';
            }
        }
        // Goals Over/Under
        else if (predictionType === 'Goals Over/Under') {
            const overUnderValue = parseFloat(predictionValue.split(' ')[1]);
  
            if (predictionValue.startsWith('Over')) {
                apiResult = `Toplam ${homeGoals + awayGoals} Gol`;
                userResult = (homeGoals + awayGoals > overUnderValue) ? 'won' : 'lost';
            } else if (predictionValue.startsWith('Under')) {
                apiResult = `Toplam ${homeGoals + awayGoals} Gol`;
                userResult = (homeGoals + awayGoals < overUnderValue) ? 'won' : 'lost';
            }
        }
        // Goals Over/Under First Half
        else if (predictionType === 'Goals Over/Under First Half') {
            const firstHalfGoals = halftimeHomeGoals + halftimeAwayGoals;
            const overUnderValue = parseFloat(predictionValue.split(' ')[1]);
  
            if (predictionValue.startsWith('Over')) {
                apiResult = `İlk Yarı Toplam ${firstHalfGoals} Gol`;
                userResult = (firstHalfGoals > overUnderValue) ? 'won' : 'lost';
            } else if (predictionValue.startsWith('Under')) {
                apiResult = `İlk Yarı Toplam ${firstHalfGoals} Gol`;
                userResult = (firstHalfGoals < overUnderValue) ? 'won' : 'lost';
            }
        }
        // Goals Over/Under - Second Half
        else if (predictionType === 'Goals Over/Under - Second Half') {
            const secondHalfHomeGoals = homeGoals - halftimeHomeGoals;
            const secondHalfAwayGoals = awayGoals - halftimeAwayGoals;
            const secondHalfGoals = secondHalfHomeGoals + secondHalfAwayGoals;
            const overUnderValue = parseFloat(predictionValue.split(' ')[1]);
  
            if (predictionValue.startsWith('Over')) {
                apiResult = `İkinci Yarı Toplam ${secondHalfGoals} Gol`;
                userResult = (secondHalfGoals > overUnderValue) ? 'won' : 'lost';
            } else if (predictionValue.startsWith('Under')) {
                apiResult = `İkinci Yarı Toplam ${secondHalfGoals} Gol`;
                userResult = (secondHalfGoals < overUnderValue) ? 'won' : 'lost';
            }
        }
        // First Half Winner
        else if (predictionType === 'First Half Winner') {
            if (halftimeHomeGoals > halftimeAwayGoals) {
                apiResult = 'İlk Yarı Ev Kazandı';
                userResult = (predictionValue === 'Home') ? 'won' : 'lost';
            } else if (halftimeHomeGoals < halftimeAwayGoals) {
                apiResult = 'İlk Yarı Konuk Kazandı';
                userResult = (predictionValue === 'Away') ? 'won' : 'lost';
            } else {
                apiResult = 'İlk Yarı Berabere';
                userResult = (predictionValue === 'Draw') ? 'won' : 'lost';
            }
        }
        // HT/FT Double
        else if (predictionType === 'HT/FT Double') {
            const htResult = halftimeHomeGoals > halftimeAwayGoals ? 'Home' :
                halftimeHomeGoals < halftimeAwayGoals ? 'Away' : 'Draw';
            const ftResult = homeGoals > awayGoals ? 'Home' :
                homeGoals < awayGoals ? 'Away' : 'Draw';
  
            const expectedResults = predictionValue.split('/');
  
            apiResult = `İY ${htResult} / MS ${ftResult}`;
            userResult = (expectedResults[0] === htResult && expectedResults[1] === ftResult) ? 'won' : 'lost';
        }
        // Both Teams Score
        else if (predictionType === 'Both Teams Score') {
            const homeScored = homeGoals > 0;
            const awayScored = awayGoals > 0;
            if (homeScored && awayScored) {
                apiResult = 'Her İki Takım Gol Attı';
                userResult = (predictionValue === 'Yes') ? 'won' : 'lost';
            } else {
                apiResult = 'Her İki Takım Gol Atmadı';
                userResult = (predictionValue === 'No') ? 'won' : 'lost';
            }
        }
        // Win to Nil - Home
        else if (predictionType === 'Win to Nil - Home') {
            if (homeGoals > awayGoals && awayGoals === 0) {
                apiResult = 'Ev Kazandı ve Gol Yemediler';
                userResult = (predictionValue === 'Yes') ? 'won' : 'lost';
            } else {
                apiResult = 'Gol Yediler veya Kazanamadılar';
                userResult = 'lost';
            }
        }
        // Win to Nil - Away
        else if (predictionType === 'Win to Nil - Away') {
            if (awayGoals > homeGoals && homeGoals === 0) {
                apiResult = 'Konuk Kazandı ve Gol Yemediler';
                userResult = (predictionValue === 'Yes') ? 'won' : 'lost';
            } else {
                apiResult = 'Gol Yediler veya Kazanamadılar';
                userResult = 'lost';
            }
        }
        // Exact Score
        else if (predictionType === 'Exact Score') {
            const predictedScore = predictionValue.trim();
            const actualScore = `${homeGoals}-${awayGoals}`;
            apiResult = `Maç Skoru ${actualScore}`;
            userResult = (predictedScore === actualScore) ? 'won' : 'lost';
        }
        // Highest Scoring Half
        else if (predictionType === 'Highest Scoring Half') {
            const firstHalfGoals = halftimeHomeGoals + halftimeAwayGoals;
            const secondHalfGoals = (homeGoals - halftimeHomeGoals) + (awayGoals - halftimeAwayGoals);
  
            if (firstHalfGoals > secondHalfGoals) {
                apiResult = 'En Gollü Yarı: İlk Yarı';
                userResult = (predictionValue === 'First Half') ? 'won' : 'lost';
            } else if (firstHalfGoals < secondHalfGoals) {
                apiResult = 'En Gollü Yarı: İkinci Yarı';
                userResult = (predictionValue === 'Second Half') ? 'won' : 'lost';
            } else {
                apiResult = 'Yarılar Eşit Gollü';
                userResult = (predictionValue === 'Equal') ? 'won' : 'lost';
            }
        }
        // Correct Score - First Half
        else if (predictionType === 'Correct Score - First Half') {
            const predictedScore = predictionValue.trim();
            const actualScore = `${halftimeHomeGoals}-${halftimeAwayGoals}`;
            apiResult = `İlk Yarı Skoru ${actualScore}`;
            userResult = (predictedScore === actualScore) ? 'won' : 'lost';
        }
        // Double Chance
        else if (predictionType === 'Double Chance') {
            const ftResult = homeGoals > awayGoals ? 'Home' :
                homeGoals < awayGoals ? 'Away' : 'Draw';
            const options = predictionValue.split('/'); // E.g., ['Home', 'Draw']
            if (options.includes(ftResult)) {
                apiResult = `Maç Sonucu ${ftResult}`;
                userResult = 'won';
            } else {
                apiResult = `Maç Sonucu ${ftResult}`;
                userResult = 'lost';
            }
        }
        // Total - Home
        else if (predictionType === 'Total - Home') {
            const homeTotalGoals = homeGoals;
            const overUnderValue = parseFloat(predictionValue.split(' ')[1]);
  
            if (predictionValue.startsWith('Over')) {
                apiResult = `Ev Toplam ${homeTotalGoals} Gol`;
                userResult = (homeTotalGoals > overUnderValue) ? 'won' : 'lost';
            } else if (predictionValue.startsWith('Under')) {
                apiResult = `Ev Toplam ${homeTotalGoals} Gol`;
                userResult = (homeTotalGoals < overUnderValue) ? 'won' : 'lost';
            }
        }
        // Total - Away
        else if (predictionType === 'Total - Away') {
            const awayTotalGoals = awayGoals;
            const overUnderValue = parseFloat(predictionValue.split(' ')[1]);
  
            if (predictionValue.startsWith('Over')) {
                apiResult = `Konuk Toplam ${awayTotalGoals} Gol`;
                userResult = (awayTotalGoals > overUnderValue) ? 'won' : 'lost';
            } else if (predictionValue.startsWith('Under')) {
                apiResult = `Konuk Toplam ${awayTotalGoals} Gol`;
                userResult = (awayTotalGoals < overUnderValue) ? 'won' : 'lost';
            }
        }
        // Both Teams Score - First Half
        else if (predictionType === 'Both Teams Score - First Half') {
            const homeScoredFirstHalf = halftimeHomeGoals > 0;
            const awayScoredFirstHalf = halftimeAwayGoals > 0;
            if (homeScoredFirstHalf && awayScoredFirstHalf) {
                apiResult = 'İlk Yarı Her İki Takım Gol Attı';
                userResult = (predictionValue === 'Yes') ? 'won' : 'lost';
            } else {
                apiResult = 'İlk Yarı Her İki Takım Gol Atmadı';
                userResult = (predictionValue === 'No') ? 'won' : 'lost';
            }
        }
        // Both Teams To Score - Second Half
        else if (predictionType === 'Both Teams To Score - Second Half') {
            const secondHalfHomeGoals = homeGoals - halftimeHomeGoals;
            const secondHalfAwayGoals = awayGoals - halftimeAwayGoals;
            const homeScoredSecondHalf = secondHalfHomeGoals > 0;
            const awayScoredSecondHalf = secondHalfAwayGoals > 0;
            if (homeScoredSecondHalf && awayScoredSecondHalf) {
                apiResult = 'İkinci Yarı Her İki Takım Gol Attı';
                userResult = (predictionValue === 'Yes') ? 'won' : 'lost';
            } else {
                apiResult = 'İkinci Yarı Her İki Takım Gol Atmadı';
                userResult = (predictionValue === 'No') ? 'won' : 'lost';
            }
        }
        // Odd/Even
        else if (predictionType === 'Odd/Even') {
            const totalGoals = homeGoals + awayGoals;
            const isEven = totalGoals % 2 === 0;
            apiResult = `Toplam Gol Sayısı: ${totalGoals}`;
            if (predictionValue === 'Odd') {
                userResult = (!isEven) ? 'won' : 'lost';
            } else if (predictionValue === 'Even') {
                userResult = (isEven) ? 'won' : 'lost';
            }
        }
        // Exact Goals Number
        else if (predictionType === 'Exact Goals Number') {
            const totalGoals = homeGoals + awayGoals;
            const predictedGoals = parseInt(predictionValue.trim());
            apiResult = `Toplam Gol Sayısı: ${totalGoals}`;
            userResult = (totalGoals === predictedGoals) ? 'won' : 'lost';
        }
        // Home Team Exact Goals Number
        else if (predictionType === 'Home Team Exact Goals Number') {
            const predictedGoals = parseInt(predictionValue.trim());
            apiResult = `Ev Takımı Gol Sayısı: ${homeGoals}`;
            userResult = (homeGoals === predictedGoals) ? 'won' : 'lost';
        }
        // Away Team Exact Goals Number
        else if (predictionType === 'Away Team Exact Goals Number') {
            const predictedGoals = parseInt(predictionValue.trim());
            apiResult = `Konuk Takım Gol Sayısı: ${awayGoals}`;
            userResult = (awayGoals === predictedGoals) ? 'won' : 'lost';
        }
        // Exact Goals Number - First Half
        else if (predictionType === 'Exact Goals Number - First Half') {
            const firstHalfGoals = halftimeHomeGoals + halftimeAwayGoals;
            const predictedGoals = parseInt(predictionValue.trim());
            apiResult = `İlk Yarı Toplam Gol Sayısı: ${firstHalfGoals}`;
            userResult = (firstHalfGoals === predictedGoals) ? 'won' : 'lost';
        }
        // Home team will score in both halves
        else if (predictionType === 'Home team will score in both halves') {
            const homeScoredFirstHalf = halftimeHomeGoals > 0;
            const homeScoredSecondHalf = (homeGoals - halftimeHomeGoals) > 0;
            if (homeScoredFirstHalf && homeScoredSecondHalf) {
                apiResult = 'Ev Takımı Her İki Yarıda Gol Attı';
                userResult = (predictionValue === 'Yes') ? 'won' : 'lost';
            } else {
                apiResult = 'Ev Takımı Her İki Yarıda Gol Atmadı';
                userResult = (predictionValue === 'No') ? 'won' : 'lost';
            }
        }
        // Away team will score in both halves
        else if (predictionType === 'Away team will score in both halves') {
            const awayScoredFirstHalf = halftimeAwayGoals > 0;
            const awayScoredSecondHalf = (awayGoals - halftimeAwayGoals) > 0;
            if (awayScoredFirstHalf && awayScoredSecondHalf) {
                apiResult = 'Konuk Takım Her İki Yarıda Gol Attı';
                userResult = (predictionValue === 'Yes') ? 'won' : 'lost';
            } else {
                apiResult = 'Konuk Takım Her İki Yarıda Gol Atmadı';
                userResult = (predictionValue === 'No') ? 'won' : 'lost';
            }
        }
        // To Score in Both Halves
        else if (predictionType === 'To Score in Both Halves') {
            const team = predictionValue.trim();
            let scoredFirstHalf = false;
            let scoredSecondHalf = false;
  
            if (team === 'Home') {
                scoredFirstHalf = halftimeHomeGoals > 0;
                scoredSecondHalf = (homeGoals - halftimeHomeGoals) > 0;
            } else if (team === 'Away') {
                scoredFirstHalf = halftimeAwayGoals > 0;
                scoredSecondHalf = (awayGoals - halftimeAwayGoals) > 0;
            }
  
            if (scoredFirstHalf && scoredSecondHalf) {
                apiResult = `${team} Takım Her İki Yarıda Gol Attı`;
                userResult = 'won';
            } else {
                apiResult = `${team} Takım Her İki Yarıda Gol Atmadı`;
                userResult = 'lost';
            }
        }
        // Winning Margin
        else if (predictionType === 'Winning Margin') {
            const predictedMargin = parseInt(predictionValue.split(' ')[0]);
            const goalDifference = Math.abs(homeGoals - awayGoals);
            apiResult = `Maç Gol Farkı: ${goalDifference}`;
            if (homeGoals !== awayGoals && goalDifference === predictedMargin) {
                userResult = 'won';
            } else {
                userResult = 'lost';
            }
        }
        // Desteklenmeyen tahmin tipi kalmadı
        else {
            apiResult = 'Desteklenmeyen Tahmin Tipi';
            userResult = '-';
        }
  
        return {
            apiResult: apiResult,
            userResult: userResult
        };
    } else {
        return {
            apiResult: 'Oynanmadı',
            userResult: '-'
        };
    }
  }
  
    // Progress bar oluşturma fonksiyonları
    function createProgressBar() {
        const progressBarContainer = document.createElement('div');
        progressBarContainer.id = 'progressBarContainer';
        progressBarContainer.style.width = '100%';
        progressBarContainer.style.backgroundColor = '#ccc';

        const progressBar = document.createElement('div');
        progressBar.id = 'progressBar';
        progressBar.style.width = '0%';
        progressBar.style.height = '20px';
        progressBar.style.backgroundColor = '#4caf50';

        progressBarContainer.appendChild(progressBar);
        const matchContainer = document.getElementById('savedMatchContainer');
        matchContainer.appendChild(progressBarContainer);
    }

    function updateProgressBar(processed, total) {
        const progressBar = document.getElementById('progressBar');
        const percentage = Math.round((processed / total) * 100);
        progressBar.style.width = percentage + '%';
    }

    function removeProgressBar() {
        const progressBarContainer = document.getElementById('progressBarContainer');
        if (progressBarContainer) {
            progressBarContainer.parentNode.removeChild(progressBarContainer);
        }
    }



    window.addEventListener('load', loadSavedMatches);
})();
