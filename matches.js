(function () {
    // Kategorileri tanımla
    const categories = ['Free', 'Paid', 'Live Tips', 'Sure', 'HT-FT', 'Coupon of the Day', 'Multi Combine', '10+ Odds', 'Editor’s Definitive Coupons', 'Artificial Intelligence', 'Correct Score', 'Over-Under'];
    const predictionTypes = ['Match Winner', 'Home/Away', 'Second Half Winner', 'Goals Over/Under', 'Goals Over/Under First Half', 'Goals Over/Under - Second Half',
        'HT/FT Double','Both Teams Score','Win to Nil - Home','Win to Nil - Away','Exact Score','Highest Scoring Half','Correct Score - First Half',
        'Double Chance','First Half Winner','Total - Home','Total - Away','Both Teams Score - First Half','Both Teams To Score - Second Half','Odd/Even',
        'Exact Goals Number','Home Team Exact Goals Number','Away Team Exact Goals Number','Home Team Score a Goal','Away Team Score a Goal',
        'Exact Goals Number - First Half','Home team will score in both halves','Away team will score in both halves','To Score in Both Halves','Winning Margin'
    ]; // Tahmin türleri kategorileri
    const predictionValues = {
        'Match Winner': ['Home', 'Draw', 'Away'],
        'Home/Away': ['Home', 'Away'],
        'Second Half Winner': ['Home', 'Draw', 'Away'],
        'Goals Over/Under': ['Over 0.5', 'Under 0.5', 'Over 1.5', 'Under 1.5', 'Over 2.5', 'Under 2.5', 'Over 3.5', 'Under 3.5', 'Over 4.5', 'Under 4.5'],
        'Goals Over/Under First Half': ['Over 0.5', 'Under 0.5', 'Over 1.5', 'Under 1.5'],
        'Goals Over/Under - Second Half': ['Over 0.5', 'Under 0.5', 'Over 1.5', 'Under 1.5'],
       'HT/FT Double': [
    'Home/Home',         // İlk yarı ev sahibi, maç sonu ev sahibi kazanır
    'Home/Draw',         // İlk yarı ev sahibi, maç sonu beraberlik
    'Home/Away',         // İlk yarı ev sahibi, maç sonu deplasman takımı kazanır
    'Draw/Home',         // İlk yarı beraberlik, maç sonu ev sahibi kazanır
    'Draw/Draw',         // İlk yarı beraberlik, maç sonu beraberlik
    'Draw/Away',         // İlk yarı beraberlik, maç sonu deplasman takımı kazanır
    'Away/Home',         // İlk yarı deplasman, maç sonu ev sahibi kazanır
    'Away/Draw',         // İlk yarı deplasman, maç sonu beraberlik
    'Away/Away'          // İlk yarı deplasman, maç sonu deplasman takımı kazanır
],

        'Both Teams Score': ['Yes', 'No'],
        'Win to Nil - Home': ['Yes', 'No'],
        'Win to Nil - Away': ['Yes', 'No'],
        'Exact Score': ['1-0', '2-0', '2-1', '3-0', '3-1', '1-1', '0-0', '0-1', '0-2', '1-2'],
        'Highest Scoring Half': ['First Half', 'Second Half', 'Equal'],
        'Correct Score - First Half': ['1-0', '2-0', '1-1', '0-0', '0-1'],
        'Double Chance': ['Home/Draw', 'Home/Away', 'Away/Draw'],
        'First Half Winner': ['Home', 'Draw', 'Away'],
        'Total - Home': ['Over 0.5', 'Under 0.5', 'Over 1.5', 'Under 1.5', 'Over 2.5', 'Under 2.5'],
        'Total - Away': ['Over 0.5', 'Under 0.5', 'Over 1.5', 'Under 1.5', 'Over 2.5', 'Under 2.5'],
        'Both Teams Score - First Half': ['Yes', 'No'],
        'Both Teams To Score - Second Half': ['Yes', 'No'],
        'Odd/Even': ['Odd', 'Even'],
        'Exact Goals Number': ['0', '1', '2', '3', '4', '5', '6+'],
        'Home Team Exact Goals Number': ['0', '1', '2', '3', '4', '5'],
        'Away Team Exact Goals Number': ['0', '1', '2', '3', '4', '5'],
        'Home Team Score a Goal': ['Yes', 'No'],
        'Away Team Score a Goal': ['Yes', 'No'],
        'Exact Goals Number - First Half': ['0', '1', '2', '3', '4'],
        'Home team will score in both halves': ['Yes', 'No'],
        'Away team will score in both halves': ['Yes', 'No'],
        'To Score in Both Halves': ['Home', 'Away', 'Both Teams'],
        'Winning Margin': ['1 Goal', '2 Goals', '3 Goals', '4+ Goals']
    };
    let selectedCategory = 'Free';
    let currentMatches = [];
    let currentDate = '';
    const apiKey = 'd4ac606f77mshefcba8ce9e6a37fp1bbe62jsne88a4b40c369'; // Kendi API anahtarınızı buraya ekleyin
    const apiHost = 'api-football-v1.p.rapidapi.com'; // API host adresi

    // Maçları yükleme fonksiyonu
    window.loadMatches = function () {
        const contentDiv = document.getElementById('content');
        contentDiv.innerHTML = `
            <div id="categoryContainer" class="button-container"></div>
            <div id="searchContainer" class="search-container">
                <input type="text" id="searchInput" placeholder="Maçları ara...">
            </div>
            <div id="dateButtonsContainer" class="button-container"></div>
            <div id="matchContainer"></div>
        `;
        loadCategory('Free');

        // Arama kutusu için event listener
        const searchInput = document.getElementById('searchInput');
        searchInput.addEventListener('input', () => {
            displayMatches(); // Arama yapıldığında maçları yeniden göster
        });
    };

    window.loadCategory = function (category) {
        selectedCategory = category;
        const dates = getDateRange();
        displayDateButtons(dates);
        document.getElementById('matchContainer').innerHTML = '';
    };

    function getTurkeyDate() {
        const now = new Date();
        // Türkiye UTC+3 saat diliminde
        const turkeyOffset = 3 * 60 * 60 * 1000; // 3 saat
        const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
        const turkeyTime = new Date(utc + turkeyOffset);
        return turkeyTime;
    }

    // Dün, bugün ve yarın için tarihleri döndüren fonksiyon
    function getDateRange() {
        const today = getTurkeyDate();
        const dates = [];

        for (let i = -1; i <= 1; i++) { // Dün, bugün, yarın
            const date = new Date(today);
            date.setDate(today.getDate() + i);
            // YYYY-MM-DD formatında tarih
            const dateString = date.toISOString().split('T')[0];
            dates.push(dateString);
        }

        return dates;
    }

    // Tarih butonlarını oluştur
    function displayDateButtons(dates) {
        const dateButtonsContainer = document.getElementById('dateButtonsContainer');
        dateButtonsContainer.innerHTML = '';

        dates.forEach(date => {
            const button = document.createElement('button');
            button.className = 'date-btn';
            button.innerText = date;
            button.addEventListener('click', () => fetchMatches(date));
            dateButtonsContainer.appendChild(button);
        });
    }

    // Maçları API'den çekmek ve ekranda göstermek
    function fetchMatches(date) {
        currentDate = date;
        const url = `https://${apiHost}/v3/fixtures?date=${date}`;
        const options = {
            method: 'GET',
            headers: {
                'X-RapidAPI-Key': apiKey,
                'X-RapidAPI-Host': apiHost
            }
        };

        fetch(url, options)
            .then(response => response.json())
            .then(data => {
                if (data.errors && Object.keys(data.errors).length > 0) {
                    console.error('API Hatası:', data.errors);
                    alert('API isteği sırasında bir hata oluştu: ' + JSON.stringify(data.errors));
                    return;
                }

                if (data.message) {
                    console.error('API Mesajı:', data.message);
                    alert('API isteği sırasında bir hata oluştu: ' + data.message);
                    return;
                }

                if (!data.response) {
                    console.error('API Yanıtı Beklenmedik Biçimde:', data);
                    alert('API yanıtı beklenmedik bir biçimde geldi.');
                    return;
                }

                console.log("Fixture Yanıtı: ", data);
                currentMatches = data.response;
                displayMatches();
            })
            .catch(error => {
                console.error('Hata:', error);
                alert('Bir hata oluştu: ' + error.message);
            });
    }

    // Maçları ekranda göster
    function displayMatches() {
        const matchContainer = document.getElementById('matchContainer');
        matchContainer.innerHTML = '';

        if (!currentMatches || currentMatches.length === 0) {
            matchContainer.innerHTML = '<p>Maç bulunamadı.</p>';
            return;
        }

        // Arama sorgusunu al
        const searchInput = document.getElementById('searchInput');
        const searchQuery = searchInput.value.toLowerCase();

        // Maçları arama sorgusuna göre filtrele
        const filteredMatches = currentMatches.filter(matchData => {
            const homeTeam = matchData.teams.home.name.toLowerCase();
            const awayTeam = matchData.teams.away.name.toLowerCase();
            return homeTeam.includes(searchQuery) || awayTeam.includes(searchQuery);
        });

        if (filteredMatches.length === 0) {
            matchContainer.innerHTML = '<p>Maç bulunamadı.</p>';
            return;
        }

        // Tablo oluştur
        const table = document.createElement('table');
        table.className = 'matches-table';

        // Tablo başlık satırını oluştur
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        const headers = ['Tarih', 'Lig', 'Ev Sahibi', 'Konuk', 'İlk Yarı', 'Maç Sonu', 'Tahmin Yap'];

        headers.forEach(headerText => {
            const th = document.createElement('th');
            th.textContent = headerText;
            headerRow.appendChild(th);
        });

        thead.appendChild(headerRow);
        table.appendChild(thead);

        // Tablo gövdesini oluştur
        const tbody = document.createElement('tbody');

        filteredMatches.forEach(matchData => {
            const fixture = matchData.fixture;
            const teams = matchData.teams;
            const league = matchData.league;
            const score = matchData.score;

            const row = document.createElement('tr');

            // Tarih sütunu
            const dateCell = document.createElement('td');
            dateCell.textContent = new Date(fixture.date).toLocaleString();
            row.appendChild(dateCell);

            // Lig sütunu
            const leagueCell = document.createElement('td');
            leagueCell.textContent = league.name;
            row.appendChild(leagueCell);

            // Ev Sahibi takım sütunu
            const homeTeamCell = document.createElement('td');
            const homeLogo = document.createElement('img');
            homeLogo.src = teams.home.logo;
            homeLogo.alt = teams.home.name + ' Logo';
            homeLogo.className = 'team-logo';
            homeTeamCell.appendChild(homeLogo);
            const homeTeamName = document.createElement('span');
            homeTeamName.textContent = teams.home.name;
            homeTeamCell.appendChild(homeTeamName);
            row.appendChild(homeTeamCell);
    
            // Konuk takım sütunu (Logo ile birlikte)
            const awayTeamCell = document.createElement('td');
            const awayLogo = document.createElement('img');
            awayLogo.src = teams.away.logo;
            awayLogo.alt = teams.away.name + ' Logo';
            awayLogo.className = 'team-logo';
            awayTeamCell.appendChild(awayLogo);
            const awayTeamName = document.createElement('span');
            awayTeamName.textContent = teams.away.name;
            awayTeamCell.appendChild(awayTeamName);
            row.appendChild(awayTeamCell);

            // İlk yarı sonucu
            const firstHalfCell = document.createElement('td');
            if (score.halftime && score.halftime.home !== null && score.halftime.away !== null) {
                firstHalfCell.textContent = `${score.halftime.home} - ${score.halftime.away}`;
            } else {
                firstHalfCell.textContent = '-';
            }
            row.appendChild(firstHalfCell);

            // Maç sonu sonucu
            const fullTimeCell = document.createElement('td');
            if (score.fulltime && score.fulltime.home !== null && score.fulltime.away !== null) {
                fullTimeCell.textContent = `${score.fulltime.home} - ${score.fulltime.away}`;
            } else {
                fullTimeCell.textContent = '-';
            }
            row.appendChild(fullTimeCell);

            // Aksiyon butonları için hücre
            const actionCell = document.createElement('td');

            // TE (Tahmin Et) butonu
            const toggleFormBtn = document.createElement('button');
            toggleFormBtn.className = 'toggleFormBtn';
            toggleFormBtn.textContent = 'TE';

            // MTE (Manuel Tahmin Et) butonu
            const manualFormBtn = document.createElement('button');
            manualFormBtn.className = 'manualFormBtn';
            manualFormBtn.textContent = 'MTE';

            // Her maç için form takip değişkenlerini burada tanımlıyoruz
            let predictionForm = null; // Tahmin formunu takip etmek için
            let manualForm = null; // Manuel tahmin formunu takip etmek için

            // TE Butonuna tıklama olayı
            toggleFormBtn.addEventListener('click', () => {
                // Daha önce açılmış form varsa kapat
                const openForms = tbody.querySelectorAll('.prediction-form');
                openForms.forEach(form => {
                    if (form !== predictionForm) {
                        form.style.display = 'none';
                    }
                });

                if (!predictionForm) {
                    // Tahmin formu yoksa oluştur ve ekle
                    predictionForm = createPredictionForm(fixture.id, fixture.date, teams, league);
                    const formRow = document.createElement('tr');
                    const formCell = document.createElement('td');
                    formCell.colSpan = 5;
                    formCell.appendChild(predictionForm);
                    formRow.appendChild(formCell);
                    tbody.insertBefore(formRow, row.nextSibling);
                } else {
                    // Tahmin formu varsa göster/gizle
                    predictionForm.style.display = predictionForm.style.display === 'none' ? 'block' : 'none';
                }
            });

            // MTE Butonuna tıklama olayı (Manuel tahmin formunu açmak için)
            manualFormBtn.addEventListener('click', () => {
                // Daha önce açılmış manuel tahmin formları varsa kapat
                const openManualForms = tbody.querySelectorAll('.manual-prediction-form');
                openManualForms.forEach(form => {
                    if (form !== manualForm) {
                        form.style.display = 'none';
                    }
                });

                if (!manualForm) {
                    // Manuel tahmin formu yoksa oluştur ve ekle
                    manualForm = createManualPredictionForm(fixture.id, fixture.date, teams, league);
                    const formRow = document.createElement('tr');
                    const formCell = document.createElement('td');
                    formCell.colSpan = 5;
                    formCell.appendChild(manualForm);
                    formRow.appendChild(formCell);
                    tbody.insertBefore(formRow, row.nextSibling);
                } else {
                    // Manuel tahmin formu varsa göster/gizle
                    manualForm.style.display = manualForm.style.display === 'none' ? 'block' : 'none';
                }
            });

            actionCell.appendChild(toggleFormBtn);
            actionCell.appendChild(manualFormBtn); // MTE butonunu ekliyoruz
            row.appendChild(actionCell);

            tbody.appendChild(row);
        });

        table.appendChild(tbody);
        matchContainer.appendChild(table);
    }

    // Manuel tahmin formunu oluşturma fonksiyonu
    function createManualPredictionForm(fixtureId, fixtureDate, teams, league) {
        const manualForm = document.createElement('div');
        manualForm.className = 'manual-prediction-form'; // CSS sınıfı
    
        // Kategori seçimi
        const categoryLabel = document.createElement('h4');
        categoryLabel.textContent = 'Kategori:';
        const categorySelect = document.createElement('select');
        categorySelect.className = 'categorySelect';
        categorySelect.innerHTML = `<option value="">Kategori Seçin</option>
            ${categories.map(category => `<option value="${category}">${category}</option>`).join('')}`;
    
        // Tahmin Türü seçimi
        const predictionTypeLabel = document.createElement('h4');
        predictionTypeLabel.textContent = 'Tahmin Türü:';
        const predictionTypeSelect = document.createElement('select');
        predictionTypeSelect.className = 'predictionTypeSelect';
        predictionTypeSelect.innerHTML = `<option value="">Tahmin Türü Seçin</option>
            ${predictionTypes.map(type => `<option value="${type}">${type}</option>`).join('')}`;
    
        // Tahmin Değeri seçimi
        const predictionValueLabel = document.createElement('h4');
        predictionValueLabel.textContent = 'Tahmin Değeri:';
        const predictionValueSelect = document.createElement('select');
        predictionValueSelect.className = 'predictionValueSelect';
        predictionValueSelect.innerHTML = '<option value="">Önce Tahmin Türünü Seçin</option>';
        predictionValueSelect.disabled = true;
    
        // Oran girişi
        const oddsLabel = document.createElement('h4');
        oddsLabel.textContent = 'Oran:';
        const oddsInput = document.createElement('input');
        oddsInput.type = 'number';
        oddsInput.step = '0.01';
        oddsInput.placeholder = 'Oran girin';
    
        // Coin miktarı girişi
        const coinAmountLabel = document.createElement('h4');
        coinAmountLabel.textContent = 'Coin Miktarı:';
        const coinAmountInput = document.createElement('input');
        coinAmountInput.type = 'number';
        coinAmountInput.step = '0.01';
        coinAmountInput.placeholder = 'Coin miktarı girin';
    
        // Kaydet butonu
        const saveBtn = document.createElement('button');
        saveBtn.className = 'saveManualBtn';
        saveBtn.textContent = 'Kaydet';
    
        // Form elemanlarını ekle
        manualForm.appendChild(categoryLabel);
        manualForm.appendChild(categorySelect);
        manualForm.appendChild(predictionTypeLabel);
        manualForm.appendChild(predictionTypeSelect);
        manualForm.appendChild(predictionValueLabel);
        manualForm.appendChild(predictionValueSelect);
        manualForm.appendChild(oddsLabel);
        manualForm.appendChild(oddsInput);
        manualForm.appendChild(coinAmountLabel);
        manualForm.appendChild(coinAmountInput);
        manualForm.appendChild(saveBtn);
    
        // Tahmin türü seçildiğinde tahmin değerlerini güncelle
        predictionTypeSelect.addEventListener('change', () => {
            const selectedType = predictionTypeSelect.value;
            if (selectedType && predictionValues[selectedType]) {
                predictionValueSelect.innerHTML = `<option value="">Tahmin Değeri Seçin</option>
                    ${predictionValues[selectedType].map(value => `<option value="${value}">${value}</option>`).join('')}`;
                predictionValueSelect.disabled = false;
            } else {
                predictionValueSelect.innerHTML = '<option value="">Tahmin Türü Seçin</option>';
                predictionValueSelect.disabled = true;
            }
        });

        // Kaydet butonuna tıklama olayı
        saveBtn.addEventListener('click', () => {
            const selectedCategory = categorySelect.value;
            const predictionType = predictionTypeSelect.value;
            const predictionValue = predictionValueSelect.value;
            const odds = oddsInput.value;
            let coinAmount = coinAmountInput.value;

            if (!selectedCategory || !predictionType || !predictionValue || !odds) {
                alert('Lütfen tüm alanları doldurun.');
                return;
            }

            // Coin miktarını zorunlu kıl
            if (selectedCategory === 'Paid' && !coinAmount) {
                alert('Paid kategorisi için coin miktarı girmek zorunludur.');
                return;
            }

            // Coin miktarı boşsa 0 olarak ayarla
            if (!coinAmount) {
                coinAmount = 0;
            }

            // Maçı manuel olarak veritabanına kaydet
            const manualPredictionData = {
                matchId: fixtureId,
                homeTeam: teams.home.name,
                awayTeam: teams.away.name,
                homeLogo: teams.home.logo,
                awayLogo: teams.away.logo,
                date: fixtureDate,
                league: league.name,
                category: selectedCategory, // Seçilen kategori altında kaydedilecek
                predictionType: predictionType,
                predictionValue: predictionValue,
                odds: parseFloat(odds),
                coinAmount: parseFloat(coinAmount),
                status: 'manual'
            };

            const dateKey = currentDate;
            const newMatchKey = firebase.database().ref().child('predictions').push().key;

            const updates = {};
            updates[`/predictions/${dateKey}/${selectedCategory}/${newMatchKey}`] = manualPredictionData;

            firebase.database().ref().update(updates)
                .then(() => {
                    alert('Manuel tahmin kaydedildi.');
                    manualForm.style.display = 'none';
                })
                .catch(error => {
                    console.error('Manuel tahmin kaydedilirken hata oluştu:', error);
                    alert('Manuel tahmin kaydedilirken bir hata oluştu.');
                });
        });

        return manualForm;
    }

    // Tahmin formunu oluşturma fonksiyonu
    function createPredictionForm(fixtureId, fixtureDate, teams, league) {
        const predictionForm = document.createElement('div');
    predictionForm.className = 'prediction-form'; // CSS sınıfı

    // Kategori seçimi
    const categoryLabel = document.createElement('h4');
    categoryLabel.textContent = 'Kategori:';
    const categorySelect = document.createElement('select');
    categorySelect.className = 'categorySelect';
    categorySelect.innerHTML = `<option value="">Kategori Seçin</option>
        ${categories.map(category => `<option value="${category}">${category}</option>`).join('')}`;

    // Tahmin türü seçimi
    const predictionTypeLabel = document.createElement('h4');
    predictionTypeLabel.textContent = 'Tahmin Türü:';
    const predictionTypeSelect = document.createElement('select');
    predictionTypeSelect.className = 'predictionType';
    predictionTypeSelect.innerHTML = '<option value="">Yükleniyor...</option>';
    predictionTypeSelect.disabled = true;

    // Tahmin değeri seçimi
    const predictionValueLabel = document.createElement('h4');
    predictionValueLabel.textContent = 'Tahmin:';
    const predictionValueSelect = document.createElement('select');
    predictionValueSelect.className = 'predictionValueSelect';
    predictionValueSelect.innerHTML = '<option value="">Tahmin Türü Seçin</option>';
    predictionValueSelect.disabled = true;

    // Oran girişi
    const oddsLabel = document.createElement('h4');
    oddsLabel.textContent = 'Oran:';
    const oddsInput = document.createElement('input');
    oddsInput.type = 'number';
    oddsInput.className = 'odds';
    oddsInput.placeholder = 'Oran';
    oddsInput.step = '0.01';

    // Coin miktarı girişi
    const coinAmountLabel = document.createElement('h4');
    coinAmountLabel.textContent = 'Coin Miktarı:';
    const coinAmountInput = document.createElement('input');
    coinAmountInput.type = 'number';
    coinAmountInput.className = 'coinAmount';
    coinAmountInput.placeholder = 'Coin miktarı girin';
    coinAmountInput.step = '0.01';

    // Kaydet butonu
    const saveBtn = document.createElement('button');
    saveBtn.className = 'saveBtn';
    saveBtn.textContent = 'Kaydet';
    saveBtn.disabled = true; // Oranlar yüklenene kadar devre dışı

    // Form elemanlarını ekle
    predictionForm.appendChild(categoryLabel);
    predictionForm.appendChild(categorySelect);
    predictionForm.appendChild(predictionTypeLabel);
    predictionForm.appendChild(predictionTypeSelect);
    predictionForm.appendChild(predictionValueLabel);
    predictionForm.appendChild(predictionValueSelect);
    predictionForm.appendChild(oddsLabel);
    predictionForm.appendChild(oddsInput);
    predictionForm.appendChild(coinAmountLabel);
    predictionForm.appendChild(coinAmountInput);
    predictionForm.appendChild(saveBtn);

    // Tahmin türlerini yükle
    fetchPredictionTypes(fixtureId, predictionTypeSelect, predictionValueSelect, oddsInput, saveBtn);

    // Tahmin türü seçildiğinde tahmin seçeneklerini ve oranı güncelle
    predictionTypeSelect.addEventListener('change', () => {
        const selectedType = predictionTypeSelect.value;
        const bets = predictionTypeSelect.bets || [];
        const selectedBet = bets.find(bet => bet.name === selectedType);

        // Tahmin seçeneklerini temizle
        predictionValueSelect.innerHTML = '<option value="">Tahmin Seçin</option>';
        oddsInput.value = '';
        predictionValueSelect.disabled = false;

        if (selectedBet && selectedBet.values) {
            selectedBet.values.forEach(value => {
                const option = document.createElement('option');
                option.value = value.value;
                option.text = `${value.value} (Oran: ${value.odd})`;
                predictionValueSelect.appendChild(option);
            });
        } else {
            predictionValueSelect.disabled = true;
        }
    });

    // Tahmin seçildiğinde oranı doldur
    predictionValueSelect.addEventListener('change', () => {
        const selectedType = predictionTypeSelect.value;
        const selectedValue = predictionValueSelect.value;
        const bets = predictionTypeSelect.bets || [];
        const selectedBet = bets.find(bet => bet.name === selectedType);

        if (selectedBet && selectedBet.values) {
            const selectedPrediction = selectedBet.values.find(value => value.value === selectedValue);
            if (selectedPrediction) {
                oddsInput.value = selectedPrediction.odd;
            } else {
                oddsInput.value = '';
            }
        } else {
            oddsInput.value = '';
        }
    });
        saveBtn.addEventListener('click', () => {
            const selectedCategory = categorySelect.value;
            const predictionType = predictionTypeSelect.value;
            const predictionValue = predictionValueSelect.value;
            const odds = oddsInput.value;
            let coinAmount = coinAmountInput.value;

            if (!selectedCategory || !predictionType || !predictionValue || !odds) {
                alert('Lütfen tüm alanları doldurun.');
                return;
            }

            // Coin miktarını zorunlu kıl
            if (selectedCategory === 'Paid' && !coinAmount) {
                alert('Paid kategorisi için coin miktarı girmek zorunludur.');
                return;
            }

            // Coin miktarı boşsa 0 olarak ayarla
            if (!coinAmount) {
                coinAmount = 0;
            }

            // Maçı veritabanına kaydet
            const matchDataToSave = {
                matchId: fixtureId,
                homeTeam: teams.home.name,
                awayTeam: teams.away.name,
                homeLogo: teams.home.logo,
                awayLogo: teams.away.logo,
                date: fixtureDate,
                league: league.name,
                category: selectedCategory,
                predictionType: predictionType,
                predictionValue: predictionValue,
                odds: parseFloat(odds),
                coinAmount: parseFloat(coinAmount),
                status: 'ongoing'
            };

            const dateKey = currentDate;

            const newMatchKey = firebase.database().ref().child('predictions').push().key;

            const updates = {};
            updates[`/predictions/${dateKey}/${selectedCategory}/${newMatchKey}`] = matchDataToSave;

            firebase.database().ref().update(updates)
                .then(() => {
                    alert('Maç tahmini kaydedildi.');

                    // Eğer kategori "Live Tips" ise bildirim gönder
                    if (selectedCategory === 'Live Tips') {
                        sendNotificationToAllUsers('Yeni bir Live Tips tahmini eklendi!');
                    }

                    predictionForm.style.display = 'none';
                })
                .catch(error => {
                    console.error('Maç kaydedilirken hata oluştu:', error);
                    alert('Maç kaydedilirken bir hata oluştu.');
                });
        });

        return predictionForm;
    }

    // Tahmin türlerini API'den çekmek ve formu doldurmak için fonksiyon
    function fetchPredictionTypes(fixtureId, predictionTypeSelect, predictionValueSelect, oddsInput, saveBtn) {
        const url = `https://${apiHost}/v3/odds?fixture=${fixtureId}`;
        const options = {
            method: 'GET',
            headers: {
                'X-RapidAPI-Key': apiKey,
                'X-RapidAPI-Host': apiHost
            }
        };

        fetch(url, options)
            .then(response => response.json())
            .then(data => {
                if (data.errors && Object.keys(data.errors).length > 0) {
                    console.error('API Hatası:', data.errors);
                    alert('API isteği sırasında bir hata oluştu: ' + JSON.stringify(data.errors));
                    predictionTypeSelect.innerHTML = '<option value="">Tahmin Türü Bulunamadı</option>';
                    predictionTypeSelect.disabled = true;
                    saveBtn.disabled = true;
                    return;
                }

                if (!data.response || data.response.length === 0) {
                    console.warn('Bu maç için oran türü bulunamadı.');
                    updatePredictionTypes([], predictionTypeSelect, predictionValueSelect, oddsInput);
                    predictionTypeSelect.innerHTML = '<option value="">Tahmin Türü Bulunamadı</option>';
                    predictionTypeSelect.disabled = true;
                    saveBtn.disabled = true;
                    return;
                }

                let validBookmaker = null;
                for (const bookmaker of data.response[0].bookmakers) {
                    if (bookmaker.bets && bookmaker.bets.length > 0) {
                        validBookmaker = bookmaker;
                        break;
                    }
                }

                if (validBookmaker) {
                    console.log('Geçerli Bookmaker:', validBookmaker);
                    updatePredictionTypes(validBookmaker.bets, predictionTypeSelect, predictionValueSelect, oddsInput);
                    predictionTypeSelect.disabled = false;
                    saveBtn.disabled = false;
                } else {
                    console.warn('Bu maç için geçerli oranlar bulunamadı.');
                    predictionTypeSelect.innerHTML = '<option value="">Tahmin Türü Bulunamadı</option>';
                    predictionTypeSelect.disabled = true;
                    saveBtn.disabled = true;
                }
            })
            .catch(error => {
                console.error('Tahmin türleri yüklenirken hata oluştu:', error);
                alert('Tahmin türleri yüklenirken bir hata oluştu.');
                predictionTypeSelect.innerHTML = '<option value="">Tahmin Türü Bulunamadı</option>';
                predictionTypeSelect.disabled = true;
                saveBtn.disabled = true;
            });
    }

    // Tahmin türlerini formda günceller
    function updatePredictionTypes(bets, predictionTypeSelect, predictionValueSelect, oddsInput) {
        predictionTypeSelect.innerHTML = '<option value="">Tahmin Türü Seçin</option>';
        predictionValueSelect.innerHTML = '<option value="">Tahmin Seçin</option>';
        oddsInput.value = ''; // Oran giriş alanını temizle

        if (!bets || bets.length === 0) {
            const option = document.createElement('option');
            option.value = '';
            option.text = 'Tahmin Türü Bulunamadı';
            predictionTypeSelect.appendChild(option);
            predictionTypeSelect.disabled = true;
        } else {
            // Tahmin türlerini ekle (örneğin Match Winner, Total Goals)
            bets.forEach(bet => {
                const option = document.createElement('option');
                option.value = bet.name;
                option.text = bet.name;
                predictionTypeSelect.appendChild(option);
            });
            predictionTypeSelect.disabled = false;
        }

        // Tahmin türü değiştiğinde, ilgili tahmin seçeneklerini ekle
        predictionTypeSelect.bets = bets; // Bu satır, seçim yapıldığında kullanılacak
    }
})();

function sendNotificationToAllUsers(messageContent) {
    const usersRef = firebase.database().ref('/users');

    usersRef.once('value')
        .then(snapshot => {
            const users = snapshot.val();

            if (users) {
                const updates = {};
                const timestamp = new Date().toISOString();

                Object.keys(users).forEach(userId => {
                    const newNotificationKey = firebase.database().ref().child('users').child(userId).child('notifications').push().key;

                    const notificationData = {
                        title: "Maç Bildirimi",         // Bildirim başlığı
                        body: messageContent,          // Bildirim içeriği
                        isDisplayed: true,             // Bildirim gösterildi mi?
                        isRead: false,                 // Bildirim okundu mu?
                        timestamp: timestamp           // Bildirim zamanı
                    };

                    // Kullanıcının "notifications" düğümüne yeni bildirim ekle
                    updates[`/users/${userId}/notifications/${newNotificationKey}`] = notificationData;
                });

                return firebase.database().ref().update(updates);
            } else {
                console.warn('Kullanıcı bulunamadı.');
            }
        })
        .then(() => {
            console.log('Tüm kullanıcılara bildirim gönderildi.');
        })
        .catch(error => {
            console.error('Bildirim gönderilirken hata oluştu:', error);
        });
}
