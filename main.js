const state = {
    studySets: [],
    currentSetId: null,
    cards: [],
    studyDeck: [],
    currentIndex: 0,
    studiedToday: 0,
    isStudying: false,
    selectedDifficulty: 'easy',
    editDifficulty: 'easy',
    theme: 'light',
    history: [],
    historyIndex: -1,
    maxHistorySize: 50
};

function init() {
    loadFromStorage();
    loadTheme();
    setupEventListeners();
    showHomePage();
}

function loadTheme() {
    const savedTheme = localStorage.getItem('recallTheme') || 'light';
    state.theme = savedTheme;
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon();
}

function toggleTheme() {
    state.theme = state.theme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', state.theme);
    localStorage.setItem('recallTheme', state.theme);
    updateThemeIcon();
}

function updateThemeIcon() {
    const icon = state.theme === 'light' ? '☀' : '☾';
    document.getElementById('theme-toggle').textContent = icon;
}

function loadFromStorage() {
    const savedSets = localStorage.getItem('recallStudySets');
    if (savedSets) {
        state.studySets = JSON.parse(savedSets);
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

    const savedHistory = localStorage.getItem('recallHistory');
    if (savedHistory) {
        const historyData = JSON.parse(savedHistory);
        state.history = historyData.history || [];
        state.historyIndex = historyData.index !== undefined ? historyData.index : -1;
    }
}

function saveToStorage() {
    localStorage.setItem('recallStudySets', JSON.stringify(state.studySets));
    localStorage.setItem('studiedToday', state.studiedToday.toString());
    localStorage.setItem('recallHistory', JSON.stringify({
        history: state.history,
        index: state.historyIndex
    }));
}

function addToHistory(action) {
    if (state.historyIndex < state.history.length - 1) {
        state.history = state.history.slice(0, state.historyIndex + 1);
    }

    state.history.push(action);
    
    if (state.history.length > state.maxHistorySize) {
        state.history.shift();
    } else {
        state.historyIndex++;
    }

    saveToStorage();
    updateUndoRedoButtons();
}

function undo() {
    if (state.historyIndex < 0) return;

    const action = state.history[state.historyIndex];
    
    if (action.type === 'delete') {
        state.cards.push(action.card);
        showNotification('Card restored', false);
    } else if (action.type === 'create') {
        state.cards = state.cards.filter(c => c.id !== action.card.id);
    } else if (action.type === 'edit') {
        const index = state.cards.findIndex(c => c.id === action.cardId);
        if (index !== -1) {
            state.cards[index] = action.oldCard;
        }
    }

    state.historyIndex--;
    updateCurrentSet();
    saveToStorage();
    updateStats();
    renderLibrary();
    updateUndoRedoButtons();
}

function redo() {
    if (state.historyIndex >= state.history.length - 1) return;

    state.historyIndex++;
    const action = state.history[state.historyIndex];
    
    if (action.type === 'delete') {
        state.cards = state.cards.filter(c => c.id !== action.card.id);
    } else if (action.type === 'create') {
        state.cards.push(action.card);
    } else if (action.type === 'edit') {
        const index = state.cards.findIndex(c => c.id === action.cardId);
        if (index !== -1) {
            state.cards[index] = action.newCard;
        }
    }

    updateCurrentSet();
    saveToStorage();
    updateStats();
    renderLibrary();
    updateUndoRedoButtons();
}

function updateUndoRedoButtons() {
    const undoBtn = document.getElementById('undo-btn');
    const redoBtn = document.getElementById('redo-btn');
    
    if (undoBtn) undoBtn.disabled = state.historyIndex < 0;
    if (redoBtn) redoBtn.disabled = state.historyIndex >= state.history.length - 1;
}

function showNotification(message, showUndoButton = true) {
    const notification = document.getElementById('undo-notification');
    const notificationText = document.getElementById('notification-text');
    const undoButton = document.getElementById('notification-undo');
    
    notificationText.textContent = message;
    undoButton.style.display = showUndoButton ? 'block' : 'none';
    
    notification.classList.add('show');
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 4000);
}

function setupEventListeners() {
    document.getElementById('theme-toggle').addEventListener('click', toggleTheme);

    document.getElementById('set-form').addEventListener('submit', handleCreateSet);
    document.getElementById('close-set-modal').addEventListener('click', closeSetModal);
    document.getElementById('cancel-set').addEventListener('click', closeSetModal);

    document.getElementById('back-to-home').addEventListener('click', showHomePage);

    document.getElementById('search-sets').addEventListener('input', renderStudySets);

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

    document.getElementById('undo-btn').addEventListener('click', undo);
    document.getElementById('redo-btn').addEventListener('click', redo);
    document.getElementById('notification-undo').addEventListener('click', () => {
        undo();
        document.getElementById('undo-notification').classList.remove('show');
    });

    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
            e.preventDefault();
            undo();
        } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
            e.preventDefault();
            redo();
        }
    });
}

function showHomePage() {
    document.getElementById('home-page').classList.add('active');
    document.getElementById('set-page').classList.remove('active');
    document.getElementById('back-to-home').style.display = 'none';
    state.currentSetId = null;
    renderStudySets();
    updateGlobalStats();
}

function showSetPage(setId) {
    state.currentSetId = setId;
    const studySet = state.studySets.find(s => s.id === setId);
    if (!studySet) return;

    state.cards = studySet.cards || [];
    
    document.getElementById('home-page').classList.remove('active');
    document.getElementById('set-page').classList.add('active');
    document.getElementById('back-to-home').style.display = 'block';
    
    document.getElementById('set-title').textContent = studySet.name;
    document.getElementById('set-description').textContent = studySet.description || '';
    
    switchTab('create');
    updateStats();
    renderLibrary();
    checkStudyAvailability();
}

function renderStudySets() {
    const grid = document.getElementById('study-sets-grid');
    const empty = document.getElementById('empty-sets');
    const searchTerm = document.getElementById('search-sets').value.toLowerCase();

    let filtered = state.studySets.filter(set => {
        return set.name.toLowerCase().includes(searchTerm) || 
               (set.description && set.description.toLowerCase().includes(searchTerm));
    });

    if (filtered.length === 0 && state.studySets.length === 0) {
        grid.innerHTML = '';
        empty.style.display = 'block';
        return;
    }

    if (filtered.length === 0 && state.studySets.length > 0) {
        grid.innerHTML = '<div class="empty-state"><div class="empty-icon">🔍</div><h3>No matching study sets</h3><p>Try a different search term</p></div>';
        empty.style.display = 'none';
        return;
    }

    empty.style.display = 'none';
    
    const setsHtml = filtered.map(set => {
        const cardCount = set.cards ? set.cards.length : 0;
        const avgMastery = cardCount > 0 
            ? Math.round((set.cards.reduce((sum, c) => sum + c.mastery, 0) / (cardCount * 5)) * 100)
            : 0;
        
        return `
            <div class="study-set-card" onclick="showSetPage(${set.id})">
                <div class="study-set-header">
                    <div>
                        <div class="study-set-title">${escapeHtml(set.name)}</div>
                        <div class="study-set-count">${cardCount} card${cardCount !== 1 ? 's' : ''}</div>
                    </div>
                    <div class="study-set-actions" onclick="event.stopPropagation()">
                        <button class="btn" onclick="editStudySet(${set.id})">Edit</button>
                        <button class="btn" onclick="deleteStudySet(${set.id})">Delete</button>
                    </div>
                </div>
                ${set.description ? `<div class="study-set-description">${escapeHtml(set.description)}</div>` : ''}
                <div class="study-set-meta">
                    <span>Mastery: ${avgMastery}%</span>
                    <span>${set.lastStudied ? formatDate(set.lastStudied) : 'Not studied yet'}</span>
                </div>
            </div>
        `;
    }).join('');

    grid.innerHTML = setsHtml;
}

function openCreateSetModal() {
    document.getElementById('set-modal-title').textContent = 'Create Study Set';
    document.getElementById('set-id').value = '';
    document.getElementById('set-name').value = '';
    document.getElementById('set-desc').value = '';
    document.getElementById('set-modal').classList.add('active');
}

function editStudySet(setId) {
    const set = state.studySets.find(s => s.id === setId);
    if (!set) return;

    document.getElementById('set-modal-title').textContent = 'Edit Study Set';
    document.getElementById('set-id').value = set.id;
    document.getElementById('set-name').value = set.name;
    document.getElementById('set-desc').value = set.description || '';
    document.getElementById('set-modal').classList.add('active');
}

function deleteStudySet(setId) {
    const set = state.studySets.find(s => s.id === setId);
    const cardCount = set && set.cards ? set.cards.length : 0;
    const message = cardCount > 0 
        ? `Delete "${set.name}" and all ${cardCount} flashcard${cardCount !== 1 ? 's' : ''}?`
        : `Delete "${set.name}"?`;
    
    if (confirm(message)) {
        state.studySets = state.studySets.filter(s => s.id !== setId);
        saveToStorage();
        renderStudySets();
        updateGlobalStats();
        showNotification('Study set deleted', false);
    }
}

function handleCreateSet(e) {
    e.preventDefault();
    
    const name = document.getElementById('set-name').value.trim();
    const description = document.getElementById('set-desc').value.trim();
    const setId = document.getElementById('set-id').value;

    if (setId) {
        const index = state.studySets.findIndex(s => s.id === parseInt(setId));
        if (index !== -1) {
            state.studySets[index].name = name;
            state.studySets[index].description = description;
        }
    } else {
        const newSet = {
            id: Date.now(),
            name,
            description,
            cards: [],
            created: Date.now(),
            lastStudied: null
        };
        state.studySets.push(newSet);
    }

    saveToStorage();
    renderStudySets();
    updateGlobalStats();
    closeSetModal();
}

function closeSetModal() {
    document.getElementById('set-modal').classList.remove('active');
}

function updateGlobalStats() {
    const totalCards = state.studySets.reduce((sum, set) => sum + (set.cards ? set.cards.length : 0), 0);
    document.getElementById('total-sets').textContent = state.studySets.length;
    document.getElementById('total-cards-all').textContent = totalCards;
    document.getElementById('studied-today-all').textContent = state.studiedToday;
}

function updateCurrentSet() {
    if (!state.currentSetId) return;
    const set = state.studySets.find(s => s.id === state.currentSetId);
    if (set) {
        set.cards = state.cards;
        set.lastStudied = Date.now();
    }
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
        updateUndoRedoButtons();
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
    addToHistory({
        type: 'create',
        card: { ...card }
    });
    updateCurrentSet();
    updateStats();
    
    e.target.reset();
    state.selectedDifficulty = 'easy';
    document.querySelector('.difficulty-btn[data-difficulty="easy"]').classList.add('active');
    
    showNotification('Card added successfully', false);
}

function handleEdit(e) {
    e.preventDefault();
    
    const id = parseInt(document.getElementById('edit-id').value);
    const equation = document.getElementById('edit-equation').value.trim();
    const solution = document.getElementById('edit-solution').value.trim();
    
    const index = state.cards.findIndex(c => c.id === id);
    if (index !== -1) {
        const oldCard = { ...state.cards[index] };
        const newCard = {
            ...state.cards[index],
            equation,
            solution,
            difficulty: state.editDifficulty
        };
        
        state.cards[index] = newCard;
        
        addToHistory({
            type: 'edit',
            cardId: id,
            oldCard: oldCard,
            newCard: { ...newCard }
        });
        
        updateCurrentSet();
        renderLibrary();
        updateStats();
        closeModal();
        showNotification('Card updated', false);
    }
}

function deleteCard(id) {
    if (confirm('Delete this flashcard?')) {
        const index = state.cards.findIndex(c => c.id === id);
        if (index !== -1) {
            const deletedCard = { ...state.cards[index] };
            state.cards = state.cards.filter(c => c.id !== id);
            
            addToHistory({
                type: 'delete',
                card: deletedCard
            });
            
            updateCurrentSet();
            renderLibrary();
            updateStats();
            showNotification('Card deleted');
        }
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
    document.getElementById('card-counter').textContent = `Card ${state.currentIndex + 1} of ${state.studyDeck.length}`;
    
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
    updateCurrentSet();
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
    updateCurrentSet();
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

    document.getElementById('card-question').textContent = 'Session complete! 🎉';
    document.getElementById('card-answer').textContent = 'Great work! Click start to study again';
    document.getElementById('card-counter').textContent = 'All cards reviewed';
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
            <h4>Term / Question</h4>
            <p>${escapeHtml(card.equation)}</p>
            <h4>Definition / Answer</h4>
            <p>${escapeHtml(card.solution)}</p>
            <div class="card-meta">
                <span class="difficulty-tag">${card.difficulty}</span>
                <div class="mastery-dots">
                    ${Array(5).fill(0).map((_, i) => `
                        <div class="mastery-dot ${i < card.mastery ? 'filled' : ''}"></div>
                    `).join('')}
                </div>
                <div class="item-actions">
                    <button class="btn" onclick="editCard(${card.id})">Edit</button>
                    <button class="btn" onclick="deleteCard(${card.id})">Delete</button>
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

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
}

init();