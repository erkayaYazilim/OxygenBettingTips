(async function () {
    const categories = ['Free', 'Paid', 'Live Tips', 'Sure', 'HT-FT', 'Coupon of the Day', 'Multi Combine', '10+ Odds', 'Editor’s Definitive Coupons', 'Artificial Intelligence', 'Correct Score', 'Over-Under'];
    const predictionTypes = ['Match Winner', 'Home/Away', 'Second Half Winner', 'Goals Over/Under', 'Goals Over/Under First Half', 'Goals Over/Under - Second Half', 'HT/FT Double', 'Both Teams Score', 'Win to Nil - Home', 'Win to Nil - Away', 'Exact Score', 'Highest Scoring Half', 'Correct Score - First Half', 'Double Chance', 'First Half Winner', 'Total - Home', 'Total - Away', 'Both Teams Score - First Half', 'Both Teams To Score - Second Half', 'Odd/Even', 'Exact Goals Number', 'Home Team Exact Goals Number', 'Away Team Exact Goals Number', 'Home Team Score a Goal', 'Away Team Score a Goal', 'Exact Goals Number - First Half', 'Home team will score in both halves', 'Away team will score in both halves', 'To Score in Both Halves', 'Winning Margin'];

    let selectedCategory = null; // Seçilen kategori

    // Maçları yükleyen fonksiyon
    window.loadSavedMatches = async function () {
        const contentDiv = document.getElementById('content');
        contentDiv.innerHTML = `
            <h2>Kayıt Edilmiş Maçlar</h2>
            <div id="savedCategoryContainer" class="button-container"></div>
            <div id="savedMatchContainer"></div>
            <div id="winnersContainer"></div>
        `;

        // Kategori butonlarını görüntüle
        displaySavedCategoryButtons();

        // Tüm maçları yükle
        await loadMatchesForAllCategories();

        // Winners bölümünü yükle
        await loadWinners();
    };

    // Kategori butonlarını görüntüleyen fonksiyon
    function displaySavedCategoryButtons() {
        const categoryContainer = document.getElementById('savedCategoryContainer');
        categoryContainer.innerHTML = '';

        categories.forEach(category => {
            const button = document.createElement('button');
            button.className = 'category-btn btn btn-secondary m-1';
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
        allButton.className = 'category-btn btn btn-secondary m-1';
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
                button.classList.add('btn-primary');
                button.classList.remove('btn-secondary');
            } else if (selectedCategory === null && button.innerText === 'All') {
                button.classList.add('btn-primary');
                button.classList.remove('btn-secondary');
            } else {
                button.classList.remove('btn-primary');
                button.classList.add('btn-secondary');
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

            // Tüm tarihleri alalım
            const datesToGet = Object.keys(datesData);

            const matchesToShow = {};

            datesToGet.forEach(date => {
                matchesToShow[date] = datesData[date];
            });

            if (Object.keys(matchesToShow).length === 0) {
                console.warn('Maç bulunamadı.');
                matchContainer.innerHTML = '<p>Maç bulunamadı.</p>';
                return;
            }

            allMatchesData = []; // Tüm maç verilerini saklamak için

            for (const date in matchesToShow) {
                const categoriesInDate = matchesToShow[date];
                for (const category in categoriesInDate) {
                    const matches = categoriesInDate[category];
                    for (const matchId in matches) {
                        const match = matches[matchId];

                        // Maç verilerini sakla
                        allMatchesData.push({
                            date: date,
                            category: category,
                            matchId: matchId, // matchId ekliyoruz
                            matchData: match
                        });
                    }
                }
            }

            // Maçları tarihe ve saate göre sıralama (En yeni tarih ve zaman üstte)
            allMatchesData.sort((a, b) => {
                const dateTimeA = new Date(`${a.date} ${a.matchData.time || '00:00'}`);
                const dateTimeB = new Date(`${b.date} ${b.matchData.time || '00:00'}`);
                return dateTimeB - dateTimeA; // Ters sıralama
            });

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

        // Maçları benzersiz hale getir
        const uniqueMatches = [];
        matchesArray.forEach(item => {
            if (!uniqueMatches.some(match => match.matchData.matchId === item.matchData.matchId && match.category === item.category && match.date === item.date)) {
                uniqueMatches.push(item);
            }
        });

        if (uniqueMatches.length === 0) {
            matchContainer.innerHTML = '<p>Seçilen kategori için maç bulunamadı.</p>';
            return;
        }

        // Maçları tablo şeklinde göster
        const table = document.createElement('table');
        table.className = 'matches-table table table-striped table-bordered';

        // Tablo başlık satırı
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        const headers = ['Tarih', 'Kategori', 'Lig', 'Saat', 'Ev', 'Konuk', 'Tahmin', 'Oran', 'Coin', 'İY', 'MS', 'Sonuç', 'Durum', 'Düzenle', 'Sil'];

        headers.forEach(headerText => {
            const th = document.createElement('th');
            th.textContent = headerText;
            headerRow.appendChild(th);
        });

        thead.appendChild(headerRow);
        table.appendChild(thead);

        // Tablo gövdesi
        const tbody = document.createElement('tbody');

        uniqueMatches.forEach(item => {
            const { date, category, matchId, matchData } = item;

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

            // Coin
            const coinCell = document.createElement('td');
            coinCell.textContent = matchData.coinAmount || '-';
            row.appendChild(coinCell);

            // İlk Yarı Skoru (İY)
            const halftimeScoreCell = document.createElement('td');
            halftimeScoreCell.textContent = matchData.halftimeScore || '-';
            row.appendChild(halftimeScoreCell);

            // Maç Sonu Skoru (MS)
            const fulltimeScoreCell = document.createElement('td');
            fulltimeScoreCell.textContent = matchData.fulltimeScore || '-';
            row.appendChild(fulltimeScoreCell);

            // Tahmin Sonucu (Manuel Giriş)
            const resultCell = document.createElement('td');
            const resultSelect = document.createElement('select');
            resultSelect.className = 'form-control form-control-sm';
            resultSelect.innerHTML = `
                <option value="">Seçiniz</option>
                <option value="won" ${matchData.userResult === 'won' ? 'selected' : ''}>Tuttu</option>
                <option value="lost" ${matchData.userResult === 'lost' ? 'selected' : ''}>Tutmadı</option>
            `;
            const statusCell = document.createElement('td');
            statusCell.textContent = matchData.status || '-';

            resultSelect.addEventListener('change', () => {
                updateMatchResult(item, resultSelect.value, statusCell);
            });
            resultCell.appendChild(resultSelect);
            row.appendChild(resultCell);

            // Durum Gösterimi
            row.appendChild(statusCell);

            // Düzenle butonu için hücre
            const editCell = document.createElement('td');
            const editButton = document.createElement('button');
            editButton.className = 'btn btn-primary btn-sm';
            editButton.textContent = 'Düzenle';
            editButton.addEventListener('click', () => {
                // Düzenleme formunu göster
                toggleEditForm(row, item);
            });
            editCell.appendChild(editButton);
            row.appendChild(editCell);

            // Silme butonu için hücre
            const deleteCell = document.createElement('td');
            const deleteButton = document.createElement('button');
            deleteButton.className = 'btn btn-danger btn-sm';
            deleteButton.textContent = 'Sil';
            deleteButton.addEventListener('click', async () => {
                const confirmDelete = confirm('Bu maçı silmek istediğinize emin misiniz?');
                if (confirmDelete) {
                    try {
                        // Firebase'den sil
                        await firebase.database().ref(`predictions/${date}/${category}/${matchId}`).remove();

                        // allMatchesData'dan sil
                        allMatchesData = allMatchesData.filter(m => !(m.date === date && m.category === category && m.matchId === matchId));

                        // Arayüzü güncelle
                        displayMatches(allMatchesData);
                    } catch (error) {
                        console.error('Maç silinirken hata oluştu:', error);
                        alert('Maç silinirken bir hata oluştu.');
                    }
                }
            });
            deleteCell.appendChild(deleteButton);
            row.appendChild(deleteCell);

            tbody.appendChild(row);
        });

        table.appendChild(tbody);
        matchContainer.appendChild(table);

        // Bootstrap CSS ekleyelim
        addBootstrapCSS();
    }

    // Tahmin sonucunu güncelleyen fonksiyon
    function updateMatchResult(item, result, statusCell) {
        const { date, category, matchId } = item;
        let updates = {
            userResult: result
        };

        // Eğer 'won' veya 'lost' ise 'status' alanını 'tamamlandı' yap
        if (result === 'won' || result === 'lost') {
            updates.status = 'tamamlandı';

            // Eğer kategori 'Free' ve sonuç 'won' ise 'winners' bölümüne ekle
            if (category !== 'Free' && result === 'won') {
                const winnerData = {
                    ...item.matchData,
                    date: date,
                    category: category,
                    matchId: matchId
                };
                firebase.database().ref(`winners/${date}/${matchId}`).set(winnerData);
            }
        }

        firebase.database().ref(`predictions/${date}/${category}/${matchId}`).update(updates).then(() => {
            // allMatchesData'daki veriyi güncelle
            const matchToUpdate = allMatchesData.find(m => m.date === date && m.category === category && m.matchId === matchId);
            if (matchToUpdate) {
                matchToUpdate.matchData.userResult = result;
                if (result === 'won' || result === 'lost') {
                    matchToUpdate.matchData.status = 'tamamlandı';
                }
            }
            // Sadece ilgili hücreyi güncelle
            statusCell.textContent = matchToUpdate.matchData.status || '-';
        }).catch(error => {
            console.error('Sonuç güncellenirken hata oluştu:', error);
            alert('Sonuç güncellenirken bir hata oluştu.');
        });
    }

    // Düzenleme formunu gösteren fonksiyon
    function toggleEditForm(row, item) {
        // Eğer form zaten açıksa gizle/göster
        if (row.nextSibling && row.nextSibling.classList.contains('edit-form-row')) {
            if (row.nextSibling.style.display === 'none') {
                row.nextSibling.style.display = 'table-row';
            } else {
                row.nextSibling.style.display = 'none';
            }
        } else {
            // Düzenleme formunu oluştur
            const editFormRow = document.createElement('tr');
            editFormRow.className = 'edit-form-row';

            const editFormCell = document.createElement('td');
            editFormCell.colSpan = 15; // Sütun sayısına göre ayarlayın

            // Formu oluştur
            const editForm = document.createElement('form');
            editForm.className = 'edit-form';

            // Tahmin Türü
            const predictionTypeLabel = document.createElement('label');
            predictionTypeLabel.textContent = 'Tahmin Türü:';
            const predictionTypeSelect = document.createElement('select');
            predictionTypeSelect.className = 'form-control';
            predictionTypes.forEach(pt => {
                const option = document.createElement('option');
                option.value = pt;
                option.textContent = pt;
                if (pt === item.matchData.predictionType) {
                    option.selected = true;
                }
                predictionTypeSelect.appendChild(option);
            });

            // Tahmin Değeri
            const predictionValueLabel = document.createElement('label');
            predictionValueLabel.textContent = 'Tahmin Değeri:';
            const predictionValueInput = document.createElement('input');
            predictionValueInput.type = 'text';
            predictionValueInput.className = 'form-control';
            predictionValueInput.value = item.matchData.predictionValue || '';

            // Oran
            const oddsLabel = document.createElement('label');
            oddsLabel.textContent = 'Oran:';
            const oddsInput = document.createElement('input');
            oddsInput.type = 'text';
            oddsInput.className = 'form-control';
            oddsInput.value = item.matchData.odds || '';

            // Coin Miktarı
            const coinLabel = document.createElement('label');
            coinLabel.textContent = 'Coin Miktarı:';
            const coinInput = document.createElement('input');
            coinInput.type = 'number';
            coinInput.className = 'form-control';
            coinInput.value = item.matchData.coinAmount || '';

            // Kaydet Butonu
            const saveButton = document.createElement('button');
            saveButton.type = 'button';
            saveButton.className = 'btn btn-success mt-2';
            saveButton.textContent = 'Kaydet';
            saveButton.addEventListener('click', () => {
                saveEditForm(item, predictionTypeSelect.value, predictionValueInput.value, oddsInput.value, coinInput.value, row);
                // Formu gizle
                editFormRow.style.display = 'none';
            });

            // Form elemanlarını ekle
            editForm.appendChild(predictionTypeLabel);
            editForm.appendChild(predictionTypeSelect);
            editForm.appendChild(document.createElement('br'));

            editForm.appendChild(predictionValueLabel);
            editForm.appendChild(predictionValueInput);
            editForm.appendChild(document.createElement('br'));

            editForm.appendChild(oddsLabel);
            editForm.appendChild(oddsInput);
            editForm.appendChild(document.createElement('br'));

            editForm.appendChild(coinLabel);
            editForm.appendChild(coinInput);
            editForm.appendChild(document.createElement('br'));

            editForm.appendChild(saveButton);

            editFormCell.appendChild(editForm);
            editFormRow.appendChild(editFormCell);

            // Form satırını mevcut satırın altına ekle
            row.parentNode.insertBefore(editFormRow, row.nextSibling);
        }
    }

    // Düzenleme formunu kaydeden fonksiyon
    function saveEditForm(item, predictionType, predictionValue, odds, coinAmount, row) {
        const { date, category, matchId } = item;

        // Mevcut veriyi güncelle
        firebase.database().ref(`predictions/${date}/${category}/${matchId}`).update({
            predictionType: predictionType,
            predictionValue: predictionValue,
            odds: odds,
            coinAmount: coinAmount
        }).then(() => {
            // allMatchesData'daki veriyi güncelle
            item.matchData.predictionType = predictionType;
            item.matchData.predictionValue = predictionValue;
            item.matchData.odds = odds;
            item.matchData.coinAmount = coinAmount;

            // Tablodaki satırı güncelle
            const cells = row.getElementsByTagName('td');
            // Tahmin hücresi (index 6)
            cells[6].textContent = `${predictionType || '-'} - ${predictionValue || '-'}`;
            // Oran hücresi (index 7)
            cells[7].textContent = odds || '-';
            // Coin hücresi (index 8)
            cells[8].textContent = coinAmount || '-';

        }).catch(error => {
            console.error('Maç güncellenirken hata oluştu:', error);
            alert('Maç güncellenirken bir hata oluştu.');
        });
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

    // Winners bölümünü yükleyen fonksiyon
    async function loadWinners() {
      
    }



    window.addEventListener('load', loadSavedMatches);
})();
