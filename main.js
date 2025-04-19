// Initialize the app when the DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Tab functionality
    const tabs = document.querySelectorAll('.tab');
    const contents = document.querySelectorAll('.content');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabId = tab.getAttribute('data-tab');
            
            // Remove active class from all tabs and contents
            tabs.forEach(t => t.classList.remove('active'));
            contents.forEach(c => c.classList.remove('active'));
            
            // Add active class to selected tab and content
            tab.classList.add('active');
            document.getElementById(tabId).classList.add('active');

            // Update UI based on the selected tab
            if (tabId === 'study') {
                updateStudyView();
            } else if (tabId === 'manage') {
                renderFlashcardsList();
            }
        });
    });

    // Flashcard functionality
    let flashcards = JSON.parse(localStorage.getItem('equationFlashcards')) || [];
    let currentCardIndex = 0;
    let studyDeck = [];

    // Form submission - Create new flashcard
    const flashcardForm = document.getElementById('flashcard-form');
    flashcardForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const equation = document.getElementById('equation').value.trim();
        const solution = document.getElementById('solution').value.trim();
        
        if (equation && solution) {
            const newFlashcard = {
                id: Date.now(),
                equation: equation,
                solution: solution
            };
            
            flashcards.push(newFlashcard);
            saveFlashcards();
            flashcardForm.reset();
            
            // Show feedback
            alert('Flashcard created successfully!');
        }
    });

    // Edit Form Submission
    const editForm = document.getElementById('edit-form');
    editForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const id = parseInt(document.getElementById('edit-id').value);
        const equation = document.getElementById('edit-equation').value.trim();
        const solution = document.getElementById('edit-solution').value.trim();
        
        if (equation && solution) {
            const cardIndex = flashcards.findIndex(card => card.id === id);
            if (cardIndex !== -1) {
                flashcards[cardIndex] = {
                    id: id,
                    equation: equation,
                    solution: solution
                };
                
                saveFlashcards();
                closeModal();
                renderFlashcardsList();
                
                // Show feedback
                alert('Flashcard updated successfully!');
            }
        }
    });

    // Study functionality
    const flashcardElement = document.getElementById('current-flashcard');
    const frontElement = document.getElementById('flashcard-front');
    const backElement = document.getElementById('flashcard-back');
    const cardCounter = document.getElementById('card-counter');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const flipBtn = document.getElementById('flip-btn');
    const startStudyBtn = document.getElementById('start-study-btn');
    const shuffleBtn = document.getElementById('shuffle-btn');
    const studyContent = document.getElementById('study-content');
    const noCardsMessage = document.getElementById('no-cards-message');

    flipBtn.addEventListener('click', function() {
        flashcardElement.classList.toggle('flipped');
    });

    startStudyBtn.addEventListener('click', function() {
        if (flashcards.length > 0) {
            // Create a copy of the flashcards for studying
            studyDeck = [...flashcards];
            currentCardIndex = 0;
            
            updateCardDisplay();
            flashcardElement.classList.remove('flipped');
        } else {
            alert('You need to create flashcards first!');
        }
    });

    shuffleBtn.addEventListener('click', function() {
        if (studyDeck.length > 0) {
            // Shuffle the study deck
            studyDeck = shuffleArray([...studyDeck]);
            currentCardIndex = 0;
            
            updateCardDisplay();
            flashcardElement.classList.remove('flipped');
            
            alert('Cards shuffled!');
        } else {
            alert('Start studying first to shuffle the cards!');
        }
    });

    prevBtn.addEventListener('click', function() {
        if (studyDeck.length > 0) {
            currentCardIndex = (currentCardIndex - 1 + studyDeck.length) % studyDeck.length;
            updateCardDisplay();
            flashcardElement.classList.remove('flipped');
        }
    });

    nextBtn.addEventListener('click', function() {
        if (studyDeck.length > 0) {
            currentCardIndex = (currentCardIndex + 1) % studyDeck.length;
            updateCardDisplay();
            flashcardElement.classList.remove('flipped');
        }
    });

    // Edit Modal functionality
    const modal = document.getElementById('edit-modal');
    const closeBtn = document.querySelector('.close');
    const cancelBtn = document.getElementById('cancel-edit');

    closeBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);

    window.addEventListener('click', function(event) {
        if (event.target === modal) {
            closeModal();
        }
    });

    // Functions
    function saveFlashcards() {
        localStorage.setItem('equationFlashcards', JSON.stringify(flashcards));
    }

    function updateStudyView() {
        if (flashcards.length > 0) {
            studyContent.style.display = 'block';
            noCardsMessage.style.display = 'none';
        } else {
            studyContent.style.display = 'none';
            noCardsMessage.style.display = 'block';
        }
    }

    function renderFlashcardsList() {
        const flashcardsList = document.getElementById('flashcards-list');
        const noCardsManageMessage = document.getElementById('no-cards-manage-message');
        
        // Clear the list
        flashcardsList.innerHTML = '';
        
        if (flashcards.length > 0) {
            noCardsManageMessage.style.display = 'none';
            
            // Add each flashcard to the list
            flashcards.forEach(card => {
                const li = document.createElement('li');
                li.className = 'flashcard-item';
                
                const contentDiv = document.createElement('div');
                contentDiv.className = 'flashcard-content';
                
                const equation = document.createElement('p');
                equation.textContent = `Equation: ${card.equation}`;
                
                const solution = document.createElement('p');
                solution.textContent = `Solution: ${card.solution}`;
                
                contentDiv.appendChild(equation);
                contentDiv.appendChild(solution);
                
                const actionsDiv = document.createElement('div');
                actionsDiv.className = 'flashcard-item-actions';
                
                const editBtn = document.createElement('button');
                editBtn.className = 'btn';
                editBtn.textContent = 'Edit';
                editBtn.addEventListener('click', () => openEditModal(card));
                
                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'btn btn-danger';
                deleteBtn.textContent = 'Delete';
                deleteBtn.addEventListener('click', () => deleteFlashcard(card.id));
                
                actionsDiv.appendChild(editBtn);
                actionsDiv.appendChild(deleteBtn);
                
                li.appendChild(contentDiv);
                li.appendChild(actionsDiv);
                
                flashcardsList.appendChild(li);
            });
        } else {
            noCardsManageMessage.style.display = 'block';
        }
    }

    function updateCardDisplay() {
        if (studyDeck.length > 0) {
            const currentCard = studyDeck[currentCardIndex];
            frontElement.innerHTML = `<p>${currentCard.equation}</p>`;
            backElement.innerHTML = `<p>${currentCard.solution}</p>`;
            cardCounter.textContent = `Card ${currentCardIndex + 1} of ${studyDeck.length}`;
        }
    }

    function openEditModal(card) {
        document.getElementById('edit-id').value = card.id;
        document.getElementById('edit-equation').value = card.equation;
        document.getElementById('edit-solution').value = card.solution;
        
        modal.style.display = 'block';
    }

    function closeModal() {
        modal.style.display = 'none';
    }

    function deleteFlashcard(id) {
        if (confirm('Are you sure you want to delete this flashcard?')) {
            flashcards = flashcards.filter(card => card.id !== id);
            saveFlashcards();
            renderFlashcardsList();
            
            // Update study view if we're in study mode
            updateStudyView();
        }
    }

    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    // Initial render
    renderFlashcardsList();
    updateStudyView();
});