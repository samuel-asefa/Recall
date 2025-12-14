const state = {
    cards: [],
    studyDeck: [],
    currentIndex: 0,
    studiedToday: 0,
    isStudying: false,
    selectedDifficulty: 'easy',
    editDifficulty: 'easy'
};

function init() {
    loadFromStorage();
    setupEventListeners();
    updateStats();
    renderLibrary();
}

function loadFromStorage() {
    const saved = localStorage.getItem('recallCards');
    if (saved) {
        state.cards = JSON.parse(saved);
    }
    const studied = localStorage.getItem('studiedToday');
    const lastDate = localStorage.getItem('lastStudyDate');
    const today = new Date().toDateString();
    
    if (lastDate === today && studied) {
        state.studiedToday = parseInt(studied);
    } else {
        state.studiedToday = 0;
        localStorage.setItem('lastStudyDate', today);
    }
}

function saveToStorage() {
    localStorage.setItem('recallCards', JSON.stringify(state.cards));
    localStorage.setItem('studiedToday', state.studiedToday.toString());
}

function setupEventListeners() {
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => switchTab(tab.dataset.tab));
    });

    document.getElementById('create-form').addEventListener('submit', handleCreate);
    document.getElementById('edit-form').addEventListener('submit', handleEdit);
    
    document.querySelectorAll('.difficulty-btn').forEach(btn => {
        btn.addEventListener('click', () => selectDifficulty(btn));
    });

    document.querySelectorAll('.edit-difficulty-btn').forEach(btn => {
        btn.addEventListener('click', () => selectEditDifficulty(btn));
    });

    document.getElementById('start-btn').addEventListener('click', startStudy);
    document.getElementById('shuffle-btn').addEventListener('click', shuffleDeck);
    document.getElementById('flip-btn').addEventListener('click', flipCard);
    document.getElementById('prev-btn').addEventListener('click', prevCard);
    document.getElementById('next-btn').addEventListener('click', nextCard);
    document.getElementById('know-btn').addEventListener('click', markKnown);
    document.getElementById('learning-btn').addEventListener('click', markLearning);

    document.getElementById('search').addEventListener('input', renderLibrary);
    document.getElementById('filter-difficulty').addEventListener('change', renderLibrary);

    document.getElementById('close-modal').addEventListener('click', closeModal);
    document.getElementById('cancel-edit').addEventListener('click', closeModal);

    document.getElementById('flashcard').addEventListener('click', flipCard);
}

function switchTab(tabName) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.content').forEach(c => c.classList.remove('active'));
    
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    document.getElementById(tabName).classList.add('active');

    if (tabName === 'study') {
        checkStudyAvailability();
    } else if (tabName === 'manage') {
        renderLibrary();
    }
}

function selectDifficulty(btn) {
    document.querySelectorAll('.difficulty-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.selectedDifficulty = btn.dataset.difficulty;
}

function selectEditDifficulty(btn) {
    document.querySelectorAll('.edit-difficulty-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.editDifficulty = btn.dataset.difficulty;
}

function handleCreate(e) {
    e.preventDefault();
    
    const equation = document.getElementById('equation').value.trim();
    const solution = document.getElementById('solution').value.trim();
    
    const card = {
        id: Date.now(),
        equation,
        solution,
        difficulty: state.selectedDifficulty,
        mastery: 0,
        lastStudied: null,
        timesStudied: 0
    };

    state.cards.push(card);
    saveToStorage();
    updateStats();
    
    e.target.reset();
    state.selectedDifficulty = 'easy';
    document.querySelector('.difficulty-btn[data-difficulty="easy"]').classList.add('active');
}

function handleEdit(e) {
    e.preventDefault();
    
    const id = parseInt(document.getElementById('edit-id').value);
    const equation = document.getElementById('edit-equation').value.trim();
    const solution = document.getElementById('edit-solution').value.trim();
    
    const index = state.cards.findIndex(c => c.id === id);
    if (index !== -1) {
        state.cards[index] = {
            ...state.cards[index],
            equation,
            solution,
            difficulty: state.editDifficulty
        };
        saveToStorage();
        renderLibrary();
        updateStats();
        closeModal();
    }
}

function deleteCard(id) {
    if (confirm('delete this flashcard?')) {
        state.cards = state.cards.filter(c => c.id !== id);
        saveToStorage();
        renderLibrary();
        updateStats();
    }
}

function editCard(id) {
    const card = state.cards.find(c => c.id === id);
    if (!card) return;

    document.getElementById('edit-id').value = card.id;
    document.getElementById('edit-equation').value = card.equation;
    document.getElementById('edit-solution').value = card.solution;
    state.editDifficulty = card.difficulty;
    
    document.querySelectorAll('.edit-difficulty-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.difficulty === card.difficulty);
    });

    document.getElementById('edit-modal').classList.add('active');
}

function closeModal() {
    document.getElementById('edit-modal').classList.remove('active');
}

function checkStudyAvailability() {
    if (state.cards.length === 0) {
        document.getElementById('study-content').style.display = 'none';
        document.getElementById('empty-study').style.display = 'block';
    } else {
        document.getElementById('study-content').style.display = 'block';
        document.getElementById('empty-study').style.display = 'none';
    }
}

function startStudy() {
    if (state.cards.length === 0) return;

    state.studyDeck = [...state.cards];
    state.currentIndex = 0;
    state.isStudying = true;

    document.getElementById('start-btn').style.display = 'none';
    document.getElementById('shuffle-btn').style.display = 'none';
    document.getElementById('flip-btn').style.display = 'inline-block';
    document.getElementById('prev-btn').style.display = 'inline-block';
    document.getElementById('next-btn').style.display = 'inline-block';
    document.getElementById('know-btn').style.display = 'inline-block';
    document.getElementById('learning-btn').style.display = 'inline-block';

    showCard();
}

function shuffleDeck() {
    if (state.cards.length === 0) return;
    
    state.studyDeck = [...state.cards].sort(() => Math.random() - 0.5);
    state.currentIndex = 0;
    state.isStudying = true;

    document.getElementById('start-btn').style.display = 'none';
    document.getElementById('shuffle-btn').style.display = 'none';
    document.getElementById('flip-btn').style.display = 'inline-block';
    document.getElementById('prev-btn').style.display = 'inline-block';
    document.getElementById('next-btn').style.display = 'inline-block';
    document.getElementById('know-btn').style.display = 'inline-block';
    document.getElementById('learning-btn').style.display = 'inline-block';

    showCard();
}

function showCard() {
    if (state.studyDeck.length === 0) return;

    const card = state.studyDeck[state.currentIndex];
    document.getElementById('card-question').textContent = card.equation;
    document.getElementById('card-answer').textContent = card.solution;
    document.getElementById('card-counter').textContent = `${state.currentIndex + 1} of ${state.studyDeck.length}`;
    
    const progress = ((state.currentIndex + 1) / state.studyDeck.length) * 100;
    document.getElementById('progress-fill').style.width = `${progress}%`;

    document.getElementById('flashcard').classList.remove('flipped');
}

function flipCard() {
    if (!state.isStudying) return;
    document.getElementById('flashcard').classList.toggle('flipped');
}

function prevCard() {
    if (state.currentIndex > 0) {
        state.currentIndex--;
        showCard();
    }
}

function nextCard() {
    if (state.currentIndex < state.studyDeck.length - 1) {
        state.currentIndex++;
        showCard();
    } else {
        endStudySession();
    }
}

function markKnown() {
    const card = state.studyDeck[state.currentIndex];
    const originalCard = state.cards.find(c => c.id === card.id);
    
    if (originalCard) {
        originalCard.mastery = Math.min(5, originalCard.mastery + 1);
        originalCard.lastStudied = Date.now();
        originalCard.timesStudied++;
    }

    state.studiedToday++;
    saveToStorage();
    updateStats();

    if (state.currentIndex < state.studyDeck.length - 1) {
        nextCard();
    } else {
        endStudySession();
    }
}

function markLearning() {
    const card = state.studyDeck[state.currentIndex];
    const originalCard = state.cards.find(c => c.id === card.id);
    
    if (originalCard) {
        originalCard.lastStudied = Date.now();
        originalCard.timesStudied++;
    }

    state.studiedToday++;
    saveToStorage();
    updateStats();

    if (state.currentIndex < state.studyDeck.length - 1) {
        nextCard();
    } else {
        endStudySession();
    }
}

function endStudySession() {
    state.isStudying = false;
    
    document.getElementById('start-btn').style.display = 'inline-block';
    document.getElementById('shuffle-btn').style.display = 'inline-block';
    document.getElementById('flip-btn').style.display = 'none';
    document.getElementById('prev-btn').style.display = 'none';
    document.getElementById('next-btn').style.display = 'none';
    document.getElementById('know-btn').style.display = 'none';
    document.getElementById('learning-btn').style.display = 'none';

    document.getElementById('card-question').textContent = 'session complete';
    document.getElementById('card-answer').textContent = 'click start to study again';
    document.getElementById('card-counter').textContent = 'great work';
    document.getElementById('flashcard').classList.remove('flipped');
}

function renderLibrary() {
    const grid = document.getElementById('flashcards-grid');
    const empty = document.getElementById('empty-library');
    const searchTerm = document.getElementById('search').value.toLowerCase();
    const filterDiff = document.getElementById('filter-difficulty').value;

    let filtered = state.cards.filter(card => {
        const matchesSearch = card.equation.toLowerCase().includes(searchTerm) || 
                            card.solution.toLowerCase().includes(searchTerm);
        const matchesDiff = filterDiff === 'all' || card.difficulty === filterDiff;
        return matchesSearch && matchesDiff;
    });

    if (filtered.length === 0) {
        grid.innerHTML = '';
        empty.style.display = 'block';
        return;
    }

    empty.style.display = 'none';
    grid.innerHTML = filtered.map(card => `
        <div class="flashcard-item">
            <h4>question</h4>
            <p>${card.equation}</p>
            <h4>answer</h4>
            <p>${card.solution}</p>
            <div class="card-meta">
                <span class="difficulty-tag">${card.difficulty}</span>
                <div class="mastery-dots">
                    ${Array(5).fill(0).map((_, i) => `
                        <div class="mastery-dot ${i < card.mastery ? 'filled' : ''}"></div>
                    `).join('')}
                </div>
                <div class="item-actions">
                    <button class="btn" onclick="editCard(${card.id})">edit</button>
                    <button class="btn" onclick="deleteCard(${card.id})">delete</button>
                </div>
            </div>
        </div>
    `).join('');
}

function updateStats() {
    document.getElementById('total-cards').textContent = state.cards.length;
    document.getElementById('studied-today').textContent = state.studiedToday;
    
    const avgMastery = state.cards.length > 0 
        ? Math.round((state.cards.reduce((sum, c) => sum + c.mastery, 0) / (state.cards.length * 5)) * 100)
        : 0;
    document.getElementById('mastery-level').textContent = `${avgMastery}%`;
}

init();