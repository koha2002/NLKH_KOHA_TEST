document.addEventListener('DOMContentLoaded', () => {
            // --- DOM ELEMENTS ---
            const screens = { home: document.getElementById('home-screen'), playerName: document.getElementById('player-name-screen'), quiz: document.getElementById('quiz-screen'), end: document.getElementById('end-screen'), creator: document.getElementById('creator-screen') };
            const playerNameInput = document.getElementById('player-name');
            const startBtn = document.getElementById('start-btn');
            const backToHomeBtn = document.getElementById('back-to-home-btn');
            const backFromPlayerNameBtn = document.getElementById('back-from-player-name-btn');
            
            // Settings UI
            const gameModeRadios = document.querySelectorAll('input[name="game-mode"]');
            const timerSettingsDiv = document.getElementById('timer-settings');
            const timerEnabledCheckbox = document.getElementById('timer-enabled');
            const timerOptionsDiv = document.getElementById('timer-options');
            const timeValueInput = document.getElementById('time-value');
            const timeUnitSelect = document.getElementById('time-unit');
            const shuffleQuestionsCheckbox = document.getElementById('shuffle-questions-enabled');
            const shuffleAnswersCheckbox = document.getElementById('shuffle-answers-enabled');

            // Quiz UI
            const questionProgress = document.getElementById('question-progress');
            const scorePercentDisplay = document.getElementById('score-percent');
            const timerContainer = document.getElementById('timer-container');
            const timerBar = document.getElementById('timer-bar');
            const questionText = document.getElementById('question-text');
            const quizQuestionImage = document.getElementById('quiz-question-image');
            const answerButtonsContainer = document.getElementById('answer-buttons');
            const practiceRoundNotification = document.getElementById('practice-round-notification');
            const submitMultipleChoiceContainer = document.getElementById('submit-multiple-choice-container');
            const submitMultipleChoiceBtn = document.getElementById('submit-multiple-choice-btn');
            const endTitle = document.getElementById('end-title');
            const endMessage = document.getElementById('end-message');
            const playerNameFinal = document.getElementById('player-name-final');
            const finalScorePercentDisplay = document.getElementById('final-score-percent');
            const quizListContainer = document.getElementById('quiz-list');
            const wrongAnswersContainer = document.getElementById('wrong-answers-container');
            const wrongAnswersList = document.getElementById('wrong-answers-list');
            const exportWrongBtn = document.getElementById('export-wrong-btn');
            const correctCountDisplay = document.getElementById('correct-count');
            const wrongCountDisplay = document.getElementById('wrong-count');
            const endCountsContainer = document.getElementById('end-counts');
            const exportModal = document.getElementById('export-modal');
            const exportQuizTitle = document.getElementById('export-quiz-title');
            const exportPdfBtn = document.getElementById('export-pdf-btn');
            const exportDocBtn = document.getElementById('export-doc-btn');
            const exportJsonBtn = document.getElementById('export-json-btn');
            const cancelExportBtn = document.getElementById('cancel-export-btn');
            const randomQuestionCountInput = document.getElementById('random-question-count');
            const randomOptionsContainer = document.getElementById('random-options-container');

            // Creator UI
            const goToCreatorBtn = document.getElementById('go-to-creator-btn');
            const importQuizBtn = document.getElementById('import-quiz-btn');
            const importFileInput = document.getElementById('import-file-input');
            const creatorTitle = document.getElementById('creator-title');
            const quizTitleInput = document.getElementById('quiz-title');
            const questionEditorTitle = document.getElementById('question-editor-title');
            const newQuestionDiv = document.getElementById('new-question');
            const newQuestionImageInput = document.getElementById('new-question-image-input');
            const questionImagePreview = document.getElementById('question-image-preview');
            const removeImageBtn = document.getElementById('remove-image-btn');
            const answerEditorContainer = document.getElementById('answer-editor-container');
            const addAnswerBtn = document.getElementById('add-answer-btn');
            const addQuestionBtn = document.getElementById('add-question-btn');
            const questionsPreview = document.getElementById('questions-preview');
            const questionCount = document.getElementById('question-count');
            const saveQuizBtn = document.getElementById('save-quiz-btn');
            const cancelCreationBtn = document.getElementById('cancel-creation-btn');
            const importQuestionsBtn = document.getElementById('import-questions-btn');
            const importQuestionsInput = document.getElementById('import-questions-input');
            const richTextToolbar = document.querySelector('.rich-text-toolbar');

            const openWordConverterBtn = document.getElementById('open-word-converter-btn');
            const wordConverterModal = document.getElementById('word-converter-modal');
            const closeWordConverterBtn = document.getElementById('close-word-converter-btn');
            const wordQuizTitleInput = document.getElementById('word-quiz-title');
            const wordFileInput = document.getElementById('word-file-input');
            const wordRawInput = document.getElementById('word-raw-input');
            const wordDefaultFalse = document.getElementById('word-default-false');
            const wordColorPreset = document.getElementById('word-color-preset');
            const wordColorInput = document.getElementById('word-color-input');
            const wordConvertBtn = document.getElementById('word-convert-btn');
            const wordImportAsQuizBtn = document.getElementById('word-import-as-quiz-btn');
            const wordLoadIntoCreatorBtn = document.getElementById('word-load-into-creator-btn');
            const wordClearFileBtn = document.getElementById('word-clear-file-btn');
            const wordClearRawBtn = document.getElementById('word-clear-raw-btn');
            const wordQCount = document.getElementById('word-q-count');
            const wordACount = document.getElementById('word-a-count');
            const wordCorrectCount = document.getElementById('word-correct-count');
            const wordStatus = document.getElementById('word-status');
            const wordJsonPreview = document.getElementById('word-json-preview');

            let latestConvertedQuiz = null;

            // --- QUIZ DATA & STATE ---
            const defaultQuiz = [{ id: "default_quiz_1", title: "Kiến Thức Chung", questions: [ { question: "Đâu là thủ đô của Việt Nam?", multiple: false, answers: [{ text: "TP. Hồ Chí Minh", correct: false, image: null }, { text: "Đà Nẵng", correct: false, image: null }, { text: "Hà Nội", correct: true, image: null }, { text: "Hải Phòng", correct: false, image: null }] }, { question: "Hành tinh nào được biết đến với tên gọi 'Hành tinh Đỏ'?", multiple: false, answers: [{ text: "Sao Kim", correct: false, image: null }, { text: "Sao Hỏa", correct: true, image: null }, { text: "Sao Mộc", correct: false, image: null }, { text: "Sao Thổ", correct: false, image: null }] } ] }];
            let allQuizzes = [];
            let currentQuizData = [];
            let newQuizQuestions = [];
            let wronglyAnsweredQuestions = [];
            let initialWrongAnswers = [];
            let questionAttemptCounts;
            let correctAnswersCount, totalQuestionsInRound, originalTotalQuestions, firstRoundCorrectAnswers;
            let currentQuestionIndex, timerInterval, playerName, selectedQuizIndex, isInitialRound;
            let gameMode, isTimerEnabled, timePerQuestion, isShuffleQuestionsEnabled, isShuffleAnswersEnabled;
            let editingQuizIndex = null, editingQuestionIndex = null;
            let currentQuestionImageBase64 = null;
            let draggedItemIndex = null;
            let quizToExportIndex = null;
            const QUIZ_PROGRESS_PREFIX = 'quizProgress_';

            // --- CORE FUNCTIONS ---
            function requestHostResize() {
                requestAnimationFrame(() => requestAnimationFrame(() => {
                    window.parent.postMessage({ type: 'tool-frame:resize' }, '*');
                }));
            }

            function showScreen(screenName) {
                Object.values(screens).forEach(screen => screen.classList.add('hidden'));
                screens[screenName].classList.remove('hidden');
                window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
                requestHostResize();
            }
            function normalizeQuizTitle(title) {
                return String(title || '')
                    .trim()
                    .toLowerCase()
                    .replace(/\s+/g, ' ');
            }

            function generateQuizId() {
                return 'quiz_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
            }

            function ensureQuizHasId(quiz) {
                if (!quiz.id) {
                    quiz.id = generateQuizId();
                }
                return quiz;
            }

            function isDuplicateQuiz(importedQuiz, excludeIndex = null) {
                const importedId = importedQuiz?.id || null;
                const importedTitle = normalizeQuizTitle(importedQuiz?.title);

                return allQuizzes.some((quiz, index) => {
                    if (excludeIndex !== null && index === excludeIndex) return false;

                    const existingId = quiz?.id || null;
                    const existingTitle = normalizeQuizTitle(quiz?.title);

                    if (importedId && existingId && importedId === existingId) return true;
                    if (importedTitle && existingTitle && importedTitle === existingTitle) return true;

                    return false;
                });
            }

            function importQuizPayload(payload, sourceName = 'file JSON') {
                let candidates = [];
                if (Array.isArray(payload)) candidates = payload;
                else if (Array.isArray(payload?.quizzes)) candidates = payload.quizzes;
                else if (payload && typeof payload === 'object') candidates = [payload];

                const valid = candidates.filter((quiz) => quiz && typeof quiz.title === 'string' && Array.isArray(quiz.questions));
                if (!valid.length) {
                    alert('File JSON không hợp lệ. Cần có title và mảng questions.');
                    return { imported: 0, duplicate: 0 };
                }

                let imported = 0;
                let duplicate = 0;
                valid.forEach((quiz) => {
                    const safeQuiz = JSON.parse(JSON.stringify(quiz));
                    ensureQuizHasId(safeQuiz);
                    if (isDuplicateQuiz(safeQuiz)) {
                        duplicate += 1;
                        return;
                    }
                    allQuizzes.push(safeQuiz);
                    imported += 1;
                });

                if (imported) {
                    saveQuizzesToStorage();
                    renderQuizList();
                    showScreen('home');
                }
                const summary = `Đã nhập ${imported} quiz từ ${sourceName}` + (duplicate ? `; bỏ qua ${duplicate} quiz trùng.` : '.');
                alert(summary);
                requestHostResize();
                return { imported, duplicate };
            }

            function loadQuizzesFromStorage() {
                const storedQuizzes = localStorage.getItem('allQuizzes');
                try {
                    allQuizzes = storedQuizzes ? JSON.parse(storedQuizzes) : defaultQuiz;
                } catch (e) {
                    allQuizzes = defaultQuiz;
                }
                allQuizzes = allQuizzes.map(q => ensureQuizHasId(q));
                saveQuizzesToStorage();
                renderQuizList();
            }
            function saveQuizzesToStorage() { localStorage.setItem('allQuizzes', JSON.stringify(allQuizzes)); }

            function getQuizProgressKey(quizIdentifier) {
                return `${QUIZ_PROGRESS_PREFIX}${quizIdentifier}`;
            }

            function saveQuizProgress() {
                if (selectedQuizIndex === null || selectedQuizIndex === undefined) return;

                const progressData = {
                    selectedQuizIndex,
                    currentQuizData,
                    wronglyAnsweredQuestions,
                    initialWrongAnswers,
                    questionAttemptCounts,
                    correctAnswersCount,
                    totalQuestionsInRound,
                    originalTotalQuestions,
                    firstRoundCorrectAnswers,
                    currentQuestionIndex,
                    playerName,
                    isInitialRound,
                    gameMode,
                    isTimerEnabled,
                    timePerQuestion,
                    isShuffleQuestionsEnabled,
                    isShuffleAnswersEnabled,
                    savedAt: new Date().toISOString()
                };

                const quizId = allQuizzes[selectedQuizIndex]?.id;
                if (!quizId) return;
                localStorage.setItem(getQuizProgressKey(quizId), JSON.stringify(progressData));
            }

            function loadQuizProgress(quizIndex) {
                const quizId = allQuizzes[quizIndex]?.id;
                if (!quizId) return null;
                const raw = localStorage.getItem(getQuizProgressKey(quizId));
                if (!raw) return null;

                try {
                    return JSON.parse(raw);
                } catch (e) {
                    localStorage.removeItem(getQuizProgressKey(quizId));
                    return null;
                }
            }

            function clearQuizProgress(quizIndex) {
                const quizId = allQuizzes[quizIndex]?.id;
                if (!quizId) return;
                localStorage.removeItem(getQuizProgressKey(quizId));
            }

            function resumeQuizProgress(progress) {
                selectedQuizIndex = progress.selectedQuizIndex;
                currentQuizData = progress.currentQuizData || [];
                wronglyAnsweredQuestions = progress.wronglyAnsweredQuestions || [];
                initialWrongAnswers = progress.initialWrongAnswers || [];
                questionAttemptCounts = progress.questionAttemptCounts || {};
                correctAnswersCount = progress.correctAnswersCount || 0;
                totalQuestionsInRound = progress.totalQuestionsInRound || 0;
                originalTotalQuestions = progress.originalTotalQuestions || 0;
                firstRoundCorrectAnswers = progress.firstRoundCorrectAnswers || 0;
                currentQuestionIndex = progress.currentQuestionIndex || 0;
                playerName = progress.playerName || "Người chơi";
                isInitialRound = progress.isInitialRound ?? true;
                gameMode = progress.gameMode || 'test';
                isTimerEnabled = progress.isTimerEnabled ?? true;
                timePerQuestion = progress.timePerQuestion || 15;
                isShuffleQuestionsEnabled = progress.isShuffleQuestionsEnabled ?? true;
                isShuffleAnswersEnabled = progress.isShuffleAnswersEnabled ?? true;

                if (!currentQuizData.length || currentQuestionIndex >= currentQuizData.length) {
                    clearQuizProgress(progress.selectedQuizIndex);
                    selectedQuizIndex = progress.selectedQuizIndex;
                    showScreen('playerName');
                    return;
                }

                if (!isInitialRound) {
                    practiceRoundNotification.classList.remove('hidden');
                } else {
                    practiceRoundNotification.classList.add('hidden');
                }

                showScreen('quiz');
                showQuestion(currentQuizData[currentQuestionIndex]);
            }

            function showResumeProgressPopup(index, savedProgress) {
                let modal = document.getElementById('resume-progress-modal');

                if (!modal) {
                    modal = document.createElement('div');
                    modal.id = 'resume-progress-modal';
                    modal.className = 'hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
                    modal.innerHTML = `
                        <div class="bg-white p-6 rounded-2xl shadow-2xl w-11/12 max-w-md text-black">
                            <div class="flex items-start justify-between gap-4 mb-4">
                                <h2 class="text-2xl font-bold">Tiếp tục quiz?</h2>
                                <button id="close-resume-progress-btn" class="text-3xl leading-none text-gray-500 hover:text-red-500">&times;</button>
                            </div>
                            <p id="resume-progress-message" class="mb-6 text-gray-700"></p>
                            <div class="flex flex-col sm:flex-row gap-3 justify-end">
                                <button id="reset-resume-progress-btn" class="btn bg-red-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-600">Làm lại từ đầu</button>
                                <button id="continue-resume-progress-btn" class="btn bg-green-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700">Tiếp tục</button>
                            </div>
                        </div>
                    `;
                    document.body.appendChild(modal);

                    modal.addEventListener('click', (e) => {
                        if (e.target === modal) {
                            modal.classList.add('hidden');
                        }
                    });

                    document.addEventListener('keydown', (e) => {
                        if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
                            modal.classList.add('hidden');
                        }
                    });
                }

                const message = modal.querySelector('#resume-progress-message');
                const closeBtn = modal.querySelector('#close-resume-progress-btn');
                const continueBtn = modal.querySelector('#continue-resume-progress-btn');
                const resetBtn = modal.querySelector('#reset-resume-progress-btn');

                message.textContent = `Bạn đang làm dở quiz "${allQuizzes[index].title}". Chọn tiếp tục để làm tiếp, hoặc làm lại từ đầu để reset tiến trình.`;

                closeBtn.onclick = () => {
                    modal.classList.add('hidden');
                };

                continueBtn.onclick = () => {
                    modal.classList.add('hidden');
                    resumeQuizProgress(savedProgress);
                };

                resetBtn.onclick = () => {
                    modal.classList.add('hidden');
                    clearQuizProgress(index);
                    selectedQuizIndex = index;
                    showScreen('playerName');
                };

                modal.classList.remove('hidden');
            }

            function handleQuizSelection(index) {
                const savedProgress = loadQuizProgress(index);

                if (!savedProgress) {
                    selectedQuizIndex = index;
                    showScreen('playerName');
                    return;
                }

                showResumeProgressPopup(index, savedProgress);
            }

            function renderQuizList() {
                quizListContainer.innerHTML = '';
                if (allQuizzes.length === 0) { quizListContainer.innerHTML = `<p class="text-center text-gray-500 col-span-full">Chưa có quiz nào. Hãy tạo một cái!</p>`; return; }
                allQuizzes.forEach((quiz, index) => {
                    const quizCardContainer = document.createElement('div'); quizCardContainer.className = 'quiz-card-shell relative group';
                    const quizCard = document.createElement('div'); quizCard.className = 'quiz-card p-4 rounded-lg text-white text-center cursor-pointer btn h-full flex flex-col justify-center'; quizCard.style.background = `linear-gradient(45deg, hsl(${index*50}, 60%, 50%), hsl(${index*50 + 60}, 60%, 50%))`; quizCard.innerHTML = `<h3 class="text-xl font-bold">${quiz.title}</h3><p>${quiz.questions.length} câu hỏi</p>`;
                    quizCard.addEventListener('click', () => { handleQuizSelection(index); });
                    const controls = document.createElement('div'); controls.className = 'absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity';
                    
                    const exportDocBtn = document.createElement('button');
                    exportDocBtn.className = 'bg-teal-500 text-white rounded-full w-6 h-6 flex items-center justify-center btn';
                    exportDocBtn.innerHTML = '<i class="fas fa-file-alt fa-xs"></i>';
                    exportDocBtn.title = 'Xuất câu hỏi + đáp án làm tài liệu';
                    exportDocBtn.addEventListener('click', (e) => { e.stopPropagation(); showExportOptions(index); });

                    const editBtn = document.createElement('button'); editBtn.className = 'bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center btn'; editBtn.innerHTML = '<i class="fas fa-pencil-alt fa-xs"></i>'; editBtn.title = 'Sửa quiz này'; editBtn.addEventListener('click', (e) => { e.stopPropagation(); startEditingQuiz(index); });
                    
                    const deleteBtn = document.createElement('button'); deleteBtn.className = 'bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center btn'; deleteBtn.innerHTML = '<i class="fas fa-trash-alt fa-xs"></i>'; deleteBtn.title = 'Xóa quiz này'; deleteBtn.addEventListener('click', (e) => { e.stopPropagation(); if (confirm(`Bạn có chắc muốn xóa bộ câu hỏi "${quiz.title}" không?`)) { deleteQuiz(index); } });
                    
                    controls.appendChild(exportDocBtn);
                    controls.appendChild(editBtn);
                    controls.appendChild(deleteBtn);
                    quizCardContainer.appendChild(quizCard);
                    quizCardContainer.appendChild(controls);
                    quizListContainer.appendChild(quizCardContainer);
                });
            }

            function deleteQuiz(index) { 
                clearQuizProgress(index);
                allQuizzes.splice(index, 1); 
                saveQuizzesToStorage(); 
                renderQuizList(); 
            }
            function exportQuizToJson(quizData) { const dataStr = JSON.stringify(quizData, null, 2); const blob = new Blob([dataStr], {type: "application/json"}); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `${quizData.title.replace(/\s+/g, '_')}.json`; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url); }

            // --- QUIZ GAME LOGIC ---
            function startGame() {
                playerName = playerNameInput.value || "Người chơi";
                gameMode = document.querySelector('input[name="game-mode"]:checked').value;
                isTimerEnabled = timerEnabledCheckbox.checked;
                isShuffleQuestionsEnabled = shuffleQuestionsCheckbox.checked;
                isShuffleAnswersEnabled = shuffleAnswersCheckbox.checked;
                
                let timeValue = parseInt(timeValueInput.value) || 15;
                timePerQuestion = timeUnitSelect.value === 'minutes' ? timeValue * 60 : timeValue;

                let questionsToPlay = [...allQuizzes[selectedQuizIndex].questions];
                if (isShuffleQuestionsEnabled) {
                    questionsToPlay.sort(() => Math.random() - 0.5);
                }
                currentQuizData = questionsToPlay;
                
                originalTotalQuestions = currentQuizData.length;
                totalQuestionsInRound = currentQuizData.length; 
                
                wronglyAnsweredQuestions = [];
                initialWrongAnswers = [];
                isInitialRound = true;
                questionAttemptCounts = {};
                correctAnswersCount = 0;
                firstRoundCorrectAnswers = 0;
                currentQuestionIndex = 0;
                practiceRoundNotification.classList.add('hidden');

                currentQuizData.forEach(q => {
                    questionAttemptCounts[q.question] = 1;
                });

                saveQuizProgress();
                showScreen('quiz');
                setNextQuestion();
            }

            function setNextQuestion() {
                resetState();
                if (currentQuestionIndex < currentQuizData.length) {
                    saveQuizProgress();
                    showQuestion(currentQuizData[currentQuestionIndex]);
                } else {
                    if (isInitialRound) {
                        firstRoundCorrectAnswers = correctAnswersCount;
                    }
                    if (gameMode === 'practice' && wronglyAnsweredQuestions.length > 0) {
                        practiceRoundNotification.classList.remove('hidden');
                        isInitialRound = false;
                        currentQuizData = [...wronglyAnsweredQuestions];
                        
                        currentQuizData.forEach(q => {
                            questionAttemptCounts[q.question]++;
                        });

                        totalQuestionsInRound = currentQuizData.length;
                        wronglyAnsweredQuestions = [];
                        currentQuestionIndex = 0;
                        saveQuizProgress();
                        setNextQuestion();
                    } else {
                        endGame();
                    }
                }
            }
            
            function showQuestion(questionData) {
                questionProgress.textContent = `${currentQuestionIndex + 1}/${totalQuestionsInRound}`;
                
                const percent = originalTotalQuestions > 0 ? Math.round((correctAnswersCount / originalTotalQuestions) * 100) : 0;
                scorePercentDisplay.textContent = `${percent}%`;
                questionText.innerHTML = questionData.question;
                
                if (questionData.image) {
                    quizQuestionImage.src = questionData.image;
                    quizQuestionImage.classList.remove('hidden');
                } else {
                    quizQuestionImage.src = '';
                    quizQuestionImage.classList.add('hidden');
                }
                
                let answersToDisplay = [...questionData.answers];
                if (isShuffleAnswersEnabled) {
                    answersToDisplay.sort(() => Math.random() - 0.5);
                }

                answersToDisplay.forEach((answer, index) => {
                    const button = document.createElement('button');
                    button.className = `answer-btn w-full font-bold py-3 px-4 rounded-lg text-left flex flex-col items-center justify-center text-lg btn`;
                    button.dataset.originalIndex = questionData.answers.indexOf(answer);
                    
                    let content = '';
                    if (answer.image) {
                        content += `<img src="${answer.image}" class="max-h-24 rounded-md mb-2 object-contain pointer-events-none">`;
                    }
                    if (answer.text) {
                        content += `<span class="pointer-events-none">${answer.text}</span>`;
                    }
                    button.innerHTML = content;
                    
                    if (questionData.multiple) {
                        button.addEventListener('click', () => toggleMultipleChoiceAnswer(button));
                    } else {
                        button.addEventListener('click', () => selectSingleAnswer(button, answer.correct));
                    }
                    answerButtonsContainer.appendChild(button);
                });

                if (questionData.multiple) {
                    submitMultipleChoiceContainer.classList.remove('hidden');
                } else {
                    submitMultipleChoiceContainer.classList.add('hidden');
                }

                if (gameMode === 'test' && isTimerEnabled) {
                    timerContainer.classList.remove('hidden');
                    startTimer();
                } else {
                    timerContainer.classList.add('hidden');
                }
            }

            function resetState() {
                clearInterval(timerInterval);
                answerButtonsContainer.innerHTML = '';
                quizQuestionImage.classList.add('hidden');
                quizQuestionImage.src = '';
                submitMultipleChoiceContainer.classList.add('hidden');
            }

            function toggleMultipleChoiceAnswer(selectedBtn) {
                selectedBtn.classList.toggle('selected');
            }

            function selectSingleAnswer(selectedBtn, isCorrect) {
                checkAnswers([{ btn: selectedBtn, correct: isCorrect }]);
            }

            function submitMultipleAnswers() {
                const selectedButtons = answerButtonsContainer.querySelectorAll('.answer-btn.selected');
                const answers = Array.from(selectedButtons).map(btn => {
                    const originalIndex = parseInt(btn.dataset.originalIndex);
                    const originalAnswer = currentQuizData[currentQuestionIndex].answers[originalIndex];
                    return { btn, correct: originalAnswer.correct };
                });
                checkAnswers(answers, true);
            }

            function checkAnswers(selectedAnswers, isMultiple = false) {
                clearInterval(timerInterval);
                let allCorrect = true;
                const questionData = currentQuizData[currentQuestionIndex];
                const correctAnswers = questionData.answers.filter(a => a.correct);

                if (isMultiple) {
                    if (selectedAnswers.length !== correctAnswers.length) {
                        allCorrect = false;
                    } else {
                        allCorrect = selectedAnswers.every(ans => ans.correct);
                    }
                } else {
                    allCorrect = selectedAnswers.length === 1 && selectedAnswers[0].correct;
                }

                if (allCorrect) {
                    correctAnswersCount++;
                } else {
                    if (isInitialRound) {
                        initialWrongAnswers.push(questionData);
                    }
                    if (gameMode === 'practice') {
                        wronglyAnsweredQuestions.push(questionData);
                    }
                }

                saveQuizProgress();
                
                Array.from(answerButtonsContainer.children).forEach(button => {
                    const originalIndex = parseInt(button.dataset.originalIndex);
                    const originalAnswer = questionData.answers[originalIndex];
                    button.classList.remove('selected');
                    if (originalAnswer.correct) {
                        button.classList.add('correct');
                    }
                    button.disabled = true;
                });

                selectedAnswers.forEach(({ btn, correct }) => {
                    if (!correct) {
                        btn.classList.add('wrong');
                    }
                });

                setTimeout(() => {
                    currentQuestionIndex++;
                    setNextQuestion();
                }, 2200);
            }

            function startTimer() {
                let timeLeft = timePerQuestion;
                timerBar.style.width = '100%'; timerBar.style.backgroundPosition = '0%';
                timerInterval = setInterval(() => {
                    timeLeft--;
                    const widthPercentage = (timeLeft / timePerQuestion) * 100;
                    timerBar.style.width = `${widthPercentage}%`; timerBar.style.backgroundPosition = `${100 - widthPercentage}%`;
                    if (timeLeft <= 0) {
                        clearInterval(timerInterval);
                        if (currentQuizData[currentQuestionIndex].multiple) {
                            submitMultipleAnswers();
                        } else {
                            checkAnswers([]);
                        }
                    }
                }, 1000);
            }

            function endGame() {
                clearQuizProgress(selectedQuizIndex);
                showScreen('end');
                playerNameFinal.textContent = playerName;
                const finalPercent = originalTotalQuestions > 0 ? Math.round((firstRoundCorrectAnswers / originalTotalQuestions) * 100) : 0;
                const wrongCount = originalTotalQuestions - firstRoundCorrectAnswers;
                
                if (gameMode === 'practice' && initialWrongAnswers.length === 0) {
                    endTitle.textContent = "Luyện tập hoàn tất!";
                    endMessage.innerHTML = `Chúc mừng bạn đã trả lời đúng 100% tất cả các câu hỏi!`;
                    endCountsContainer.classList.add('hidden');
                } else {
                    endTitle.textContent = "Hoàn thành!";
                    endMessage.innerHTML = `Tỷ lệ đúng từ lần đầu: <span id="final-score-percent" class="font-bold text-green-500">${finalPercent}%</span>`;
                    endCountsContainer.classList.remove('hidden');
                    correctCountDisplay.textContent = firstRoundCorrectAnswers;
                    wrongCountDisplay.textContent = wrongCount;
                }

                wrongAnswersList.innerHTML = '';
                if (initialWrongAnswers.length > 0) {
                    wrongAnswersContainer.classList.remove('hidden');
                    exportWrongBtn.classList.remove('hidden');
                    initialWrongAnswers.forEach(q => {
                        const correctAnswers = q.answers.filter(a => a.correct);
                        const attempts = questionAttemptCounts[q.question] || 1;
                        const item = document.createElement('div');
                        item.className = 'text-left p-3 bg-red-100 dark:bg-red-900/50 rounded-lg shadow-sm';
                        let answersHtml = correctAnswers.map(ans => `
                            <div class="flex items-center gap-2">
                                ${ans.image ? `<img src="${ans.image}" class="max-h-16 rounded-md my-1">` : ''}
                                ${ans.text ? `<span>${ans.text}</span>` : ''}
                            </div>
                        `).join('');

                        item.innerHTML = `
                            <div class="flex justify-between items-start">
                                <div class="font-bold text-gray-800 dark:text-gray-200 flex-1 pr-2">${q.question}</div>
                                ${attempts > 1 ? `<span class="text-xs font-semibold text-white bg-red-500 rounded-full px-2 py-1 flex-shrink-0" title="Số lần làm lại">${attempts} lần</span>` : ''}
                            </div>
                            <div class="text-sm text-green-700 dark:text-green-400 font-semibold mt-1">
                                <b>Đáp án đúng:</b> ${answersHtml}
                            </div>
                        `;
                        wrongAnswersList.appendChild(item);
                    });
                } else {
                    wrongAnswersContainer.classList.add('hidden');
                    exportWrongBtn.classList.add('hidden');
                }
            }

            function exportWrongAnswersQuiz() {
                if (initialWrongAnswers.length === 0) return;
                const originalQuizTitle = allQuizzes[selectedQuizIndex].title;
                const wrongAnswersQuiz = {
                    title: `${originalQuizTitle} - Những câu sai`,
                    questions: initialWrongAnswers
                };
                exportQuizToJson(wrongAnswersQuiz);
            }

            // --- EXPORT DOCUMENT LOGIC ---
            function showExportOptions(index) {
                quizToExportIndex = index;
                exportQuizTitle.textContent = allQuizzes[index].title;
                const maxQuestions = allQuizzes[index].questions.length;
                randomQuestionCountInput.max = maxQuestions;
                if (parseInt(randomQuestionCountInput.value) > maxQuestions) {
                    randomQuestionCountInput.value = maxQuestions;
                }
                document.querySelector('input[name="export-type"][value="marked"]').checked = true;
                randomOptionsContainer.classList.add('hidden');
                exportJsonBtn.classList.add('hidden');
                exportModal.classList.remove('hidden');
            }

            async function generateExportHtml(quiz, options = {}) {
                const { markAnswers = false, includeAllAnswers = false } = options;
                let questions = JSON.parse(JSON.stringify(quiz.questions));
                
                questions.sort((a, b) => {
                    const textA = new DOMParser().parseFromString(a.question, "text/html").body.textContent || "";
                    const textB = new DOMParser().parseFromString(b.question, "text/html").body.textContent || "";
                    return textA.localeCompare(textB, 'vi');
                });

                let contentHtml = `<div style="font-family: Arial, sans-serif; line-height: 1.6;"><h1>${quiz.title}</h1>`;
                for (const q of questions) {
                    contentHtml += `<div style="margin-bottom: 20px; page-break-inside: avoid;">`;
                    contentHtml += `<div><b>${q.question}</b></div>`;
                    if (q.image) {
                        contentHtml += `<img src="${q.image}" style="max-width: 300px; margin-top: 10px; margin-bottom: 10px; border-radius: 8px;">`;
                    }

                    if (includeAllAnswers) {
                        contentHtml += '<ul>';
                        for (const ans of q.answers) {
                            const isCorrect = ans.correct;
                            const prefix = markAnswers && isCorrect ? '<span style="color: red;">* </span>' : '';
                            const style = markAnswers && isCorrect ? 'style="color: red;"' : '';
                            contentHtml += `<li ${style}>${prefix}${ans.text || ''}`;
                            if (ans.image) {
                                contentHtml += `<br><img src="${ans.image}" style="max-width: 150px; margin-left: 20px; border-radius: 4px;">`;
                            }
                            contentHtml += '</li>';
                        }
                        contentHtml += '</ul>';
                    } else {
                        const correctAnswers = q.answers.filter(a => a.correct);
                        let answersText = correctAnswers.map(ans => (ans.text || '') + (ans.image ? ` <img src="${ans.image}" style="max-width: 150px; vertical-align: middle; border-radius: 4px;">` : '')).join(', ');
                        contentHtml += `<div style="color: #28a745;"><b>&rArr;</b> ${answersText}</div>`;
                    }
                    
                    contentHtml += `</div><hr style="border: none; border-top: 1px solid #eee;">`;
                }
                contentHtml += `</div>`;
                return contentHtml;
            }

            function preloadImages(element) {
                const images = element.getElementsByTagName('img');
                const promises = [];
                for (let i = 0; i < images.length; i++) {
                    const img = images[i];
                    if (img.src && !img.complete) {
                        promises.push(new Promise((resolve) => {
                            img.onload = resolve;
                            img.onerror = resolve; 
                        }));
                    }
                }
                return Promise.all(promises);
            }

            async function exportAsDocument(format) {
                const quiz = allQuizzes[quizToExportIndex];
                const exportType = document.querySelector('input[name="export-type"]:checked').value;
                let quizToExport = quiz;
                let options = {};
                let fileName = quiz.title;

                switch(exportType) {
                    case 'marked':
                        options = { markAnswers: true, includeAllAnswers: true };
                        break;
                    case 'unmarked':
                        options = { markAnswers: false, includeAllAnswers: true };
                        break;
                    case 'qna':
                        options = { markAnswers: false, includeAllAnswers: false };
                        fileName += " - Đáp án";
                        break;
                    case 'random':
                        let count = parseInt(randomQuestionCountInput.value);
                        const maxCount = quiz.questions.length;
                        if (isNaN(count) || count <= 0) {
                           count = 1;
                        }
                        if (count > maxCount) {
                           count = maxCount;
                        }
                        randomQuestionCountInput.value = count;
                        
                        const randomQuestions = [...quiz.questions].sort(() => 0.5 - Math.random()).slice(0, count);
                        quizToExport = { title: `${quiz.title} - ${count} câu ngẫu nhiên`, questions: randomQuestions };
                        options = { markAnswers: false, includeAllAnswers: true };
                        fileName = quizToExport.title;
                        
                        if (format === 'json') {
                            exportQuizToJson(quizToExport);
                            return;
                        }
                        break;
                }

                const contentHtml = await generateExportHtml(quizToExport, options);
                
                if (format === 'pdf') {
                    const element = document.createElement('div');
                    element.innerHTML = contentHtml;
                    const pdfOptions = {
                        margin:       [0.5, 0.5, 0.5, 0.5],
                        filename:     `${fileName}.pdf`,
                        image:        { type: 'jpeg', quality: 0.98 },
                        html2canvas:  { scale: 2, useCORS: true },
                        jsPDF:        { unit: 'in', format: 'a4', orientation: 'portrait' }
                    };
                    html2pdf().from(element).set(pdfOptions).save();
                } else if (format === 'docx') {
                    const header = "<html xmlns:o='urn:schemas-microsoft-com:office:office' "+
                        "xmlns:w='urn:schemas-microsoft-com:office:word' "+
                        "xmlns='http://www.w3.org/TR/REC-html40'>"+
                        "<head><meta charset='utf-8'><title>Export HTML to Word</title></head><body>";
                    const footer = "</body></html>";
                    const sourceHTML = header + contentHtml + footer;

                    const source = 'data:application/vnd.ms-word;charset=utf-8,' + encodeURIComponent(sourceHTML);
                    const fileDownload = document.createElement("a");
                    document.body.appendChild(fileDownload);
                    fileDownload.href = source;
                    fileDownload.download = `${fileName}.doc`;
                    fileDownload.click();
                    document.body.removeChild(fileDownload);
                }
            }

            // --- QUIZ CREATOR LOGIC ---
            function setupAnswerEditors() {
                answerEditorContainer.innerHTML = '';
                for (let i=0; i<4; i++) {
                    addAnswerEditor();
                }
            }

            function addAnswerEditor(answer = { text: '', image: null, correct: false }) {
                const index = answerEditorContainer.querySelectorAll('.answer-editor-item').length;
                const editorDiv = document.createElement('div');
                editorDiv.className = 'p-3 border rounded-lg space-y-2 answer-editor-item bg-white flex flex-col';
                const answerType = document.querySelector('input[name="answer-type"]:checked').value === 'single' ? 'radio' : 'checkbox';
                
                editorDiv.innerHTML = `
                    <div class="flex items-start space-x-2">
                        <textarea name="answer-text" placeholder="Lựa chọn ${index + 1}" class="w-full px-3 py-2 rounded-lg border-2 border-gray-300 bg-white text-black focus:outline-none focus:ring-2 focus:ring-green-500" rows="3">${answer.text}</textarea>
                        <div class="flex flex-col gap-2 items-center">
                            <label class="custom-control ${answerType === 'radio' ? 'custom-radio' : 'custom-checkbox'} flex items-center p-1 cursor-pointer">
                                <input type="${answerType}" name="correct-answer" value="${index}" ${answer.correct ? 'checked' : ''}>
                                <span></span>
                            </label>
                            <button type="button" class="btn text-red-500 remove-answer-btn"><i class="fas fa-trash-alt"></i></button>
                        </div>
                    </div>
                    <div class="flex items-center gap-2 mt-auto pt-2">
                        <button type="button" class="btn text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded" data-answer-index="${index}"><i class="fas fa-image"></i></button>
                        <input type="file" class="hidden" name="answer-image-input" accept="image/*" data-answer-index="${index}">
                        <img src="${answer.image || ''}" class="${answer.image ? '' : 'hidden'} h-10 rounded" name="answer-image-preview">
                        <button type="button" class="${answer.image ? '' : 'hidden'} btn text-xs bg-red-100 text-red-700 px-2 py-1 rounded" name="remove-answer-image-btn">Xóa</button>
                    </div>
                `;
                answerEditorContainer.appendChild(editorDiv);

                const newEditor = answerEditorContainer.lastElementChild;
                newEditor.querySelector('.remove-answer-btn').addEventListener('click', () => newEditor.remove());
                newEditor.querySelector('button[data-answer-index]').addEventListener('click', (e) => {
                    newEditor.querySelector('input[name="answer-image-input"]').click();
                });
                newEditor.querySelector('input[name="answer-image-input"]').addEventListener('change', (e) => handleAnswerImageUpload(e, newEditor));
                newEditor.querySelector('button[name="remove-answer-image-btn"]').addEventListener('click', () => removeAnswerImage(newEditor));
            }

            function handleAnswerImageUpload(event, editorDiv) {
                const file = event.target.files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (e) => {
                    const preview = editorDiv.querySelector(`img[name="answer-image-preview"]`);
                    const removeBtn = editorDiv.querySelector(`button[name="remove-answer-image-btn"]`);
                    preview.src = e.target.result;
                    preview.dataset.base64 = e.target.result;
                    preview.classList.remove('hidden');
                    removeBtn.classList.remove('hidden');
                };
                reader.readAsDataURL(file);
            }

            function removeAnswerImage(editorDiv) {
                const input = editorDiv.querySelector(`input[name="answer-image-input"]`);
                const preview = editorDiv.querySelector(`img[name="answer-image-preview"]`);
                const removeBtn = editorDiv.querySelector(`button[name="remove-answer-image-btn"]`);
                input.value = '';
                preview.src = '';
                preview.dataset.base64 = '';
                preview.classList.add('hidden');
                removeBtn.classList.add('hidden');
            }

            function resetCreatorForm() { 
                editingQuizIndex = null;
                creatorTitle.textContent = 'Tạo Quiz Mới';
                saveQuizBtn.textContent = 'Lưu và Tải về';
                quizTitleInput.value = '';
                newQuizQuestions = [];
                updateQuestionPreview();
                resetQuestionForm();
            }
            
            function resetQuestionForm() {
                editingQuestionIndex = null;
                questionEditorTitle.textContent = 'Thêm câu hỏi mới';
                addQuestionBtn.textContent = 'Cập nhật câu hỏi';
                addQuestionBtn.classList.remove('bg-yellow-500', 'hover:bg-yellow-600');
                addQuestionBtn.classList.add('bg-blue-500', 'hover:bg-blue-600');
                addQuestionBtn.textContent = 'Thêm câu hỏi này';
                newQuestionDiv.innerHTML = '';
                
                newQuestionImageInput.value = '';
                questionImagePreview.classList.add('hidden');
                questionImagePreview.src = '';
                removeImageBtn.classList.add('hidden');
                currentQuestionImageBase64 = null;
                
                answerEditorContainer.innerHTML = '';
                for(let i=0; i<4; i++) addAnswerEditor();
                document.querySelector('input[name="answer-type"][value="single"]').checked = true;
            }
            
            function updateQuestionPreview() {
                questionsPreview.innerHTML = '';
                questionCount.textContent = newQuizQuestions.length;
                newQuizQuestions.forEach((q, index) => {
                    const item = document.createElement('div');
                    item.className = 'question-preview-item flex items-center justify-between p-2 bg-gray-200 rounded text-sm cursor-move';
                    item.draggable = true;
                    item.dataset.index = index;
                    let questionTextContent = new DOMParser().parseFromString(q.question, "text/html").body.textContent || "";
                    let previewText = `<span class="flex-1 mr-2 truncate"><i class="fas fa-grip-vertical mr-2 text-gray-400"></i>${index + 1}. `;
                    if (q.image) {
                        previewText += `<i class="fas fa-image text-blue-400 mr-1"></i>`;
                    }
                    previewText += `${questionTextContent}</span>`;
                    item.innerHTML = `${previewText}<div class="flex gap-2 flex-shrink-0"><button data-edit-question="${index}" class="text-blue-500 hover:text-blue-700"><i class="fas fa-pencil-alt fa-xs"></i></button><button data-delete-question="${index}" class="text-red-500 hover:text-red-700"><i class="fas fa-trash-alt fa-xs"></i></button></div>`;
                    questionsPreview.appendChild(item);
                });
            }
            
            questionsPreview.addEventListener('click', (e) => {
                const editBtn = e.target.closest('[data-edit-question]'); const deleteBtn = e.target.closest('[data-delete-question]');
                if (editBtn) { loadQuestionForEdit(parseInt(editBtn.dataset.editQuestion)); }
                if (deleteBtn) { if (confirm('Bạn có chắc muốn xóa câu hỏi này?')) { deleteQuestion(parseInt(deleteBtn.dataset.deleteQuestion)); } }
            });

            function loadQuestionForEdit(index) {
                resetQuestionForm();
                editingQuestionIndex = index;
                const questionData = newQuizQuestions[index];
                questionEditorTitle.textContent = `Sửa câu hỏi ${index + 1}`;
                addQuestionBtn.textContent = 'Cập nhật câu hỏi';
                addQuestionBtn.classList.remove('bg-blue-500', 'hover:bg-blue-600');
                addQuestionBtn.classList.add('bg-yellow-500', 'hover:bg-yellow-600');
                newQuestionDiv.innerHTML = questionData.question;
                
                if (questionData.image) {
                    questionImagePreview.src = questionData.image;
                    questionImagePreview.classList.remove('hidden');
                    removeImageBtn.classList.remove('hidden');
                    currentQuestionImageBase64 = questionData.image;
                }

                document.querySelector(`input[name="answer-type"][value="${questionData.multiple ? 'multiple' : 'single'}"]`).checked = true;
                answerEditorContainer.innerHTML = '';
                questionData.answers.forEach(ans => addAnswerEditor(ans));
            }
            
            function deleteQuestion(index) { newQuizQuestions.splice(index, 1); updateQuestionPreview(); if(editingQuestionIndex === index) { resetQuestionForm(); } }
            
            function startEditingQuiz(index) {
                resetCreatorForm();
                editingQuizIndex = index;
                const quizToEdit = allQuizzes[index];
                creatorTitle.textContent = `Chỉnh sửa Quiz: ${quizToEdit.title}`;
                saveQuizBtn.textContent = 'Lưu thay đổi và Tải về';
                quizTitleInput.value = quizToEdit.title;
                newQuizQuestions = JSON.parse(JSON.stringify(quizToEdit.questions));
                updateQuestionPreview();
                showScreen('creator');
            }

            addQuestionBtn.addEventListener('click', () => {
                const question = newQuestionDiv.innerHTML.trim();
                const isMultiple = document.querySelector('input[name="answer-type"]:checked').value === 'multiple';
                const answerItems = answerEditorContainer.querySelectorAll('.answer-editor-item');
                
                const answers = Array.from(answerItems).map(item => {
                    const text = item.querySelector('textarea[name="answer-text"]').value.trim();
                    const image = item.querySelector('img[name="answer-image-preview"]').dataset.base64 || null;
                    const correct = item.querySelector('input[name="correct-answer"]').checked;
                    return { text, image, correct };
                });

                if (!question || question === '<br>') {
                    alert('Vui lòng nhập nội dung câu hỏi.');
                    return;
                }
                if (answers.length < 2) {
                    alert('Vui lòng nhập ít nhất 2 lựa chọn trả lời.');
                    return;
                }
                if (answers.some(a => !a.text && !a.image)) {
                    alert('Mỗi lựa chọn phải có ít nhất văn bản hoặc hình ảnh.');
                    return;
                }
                if (!answers.some(a => a.correct)) {
                    alert('Vui lòng chọn ít nhất một đáp án đúng.');
                    return;
                }
                
                const questionData = {
                    question: question,
                    image: currentQuestionImageBase64,
                    multiple: isMultiple,
                    answers: answers
                };
                
                if (editingQuestionIndex !== null) {
                    newQuizQuestions[editingQuestionIndex] = questionData;
                } else {
                    newQuizQuestions.push(questionData);
                }
                updateQuestionPreview();
                resetQuestionForm();
                newQuestionDiv.focus();
            });

            saveQuizBtn.addEventListener('click', () => {
                const title = quizTitleInput.value.trim();
                if (!title) { alert('Vui lòng nhập tên cho bộ câu hỏi.'); return; }
                if (newQuizQuestions.length === 0) { alert('Vui lòng thêm ít nhất một câu hỏi.'); return; }
                const newQuiz = {
                    id: editingQuizIndex !== null ? allQuizzes[editingQuizIndex].id : null,
                    title: title,
                    questions: newQuizQuestions
                };
                ensureQuizHasId(newQuiz);

                if (isDuplicateQuiz(newQuiz, editingQuizIndex)) {
                    alert('Tên quiz hoặc ID quiz đã tồn tại. Vui lòng đổi tên khác.');
                    return;
                }

                if (editingQuizIndex !== null) {
                    allQuizzes[editingQuizIndex] = newQuiz;
                    clearQuizProgress(editingQuizIndex);
                    alert('Đã cập nhật quiz thành công!');
                } else {
                    allQuizzes.push(newQuiz);
                }
                exportQuizToJson(newQuiz);
                saveQuizzesToStorage();
                renderQuizList();
                showScreen('home');
            });
            
            importQuizBtn.addEventListener('click', () => importFileInput.click());
            importFileInput.addEventListener('change', (event) => {
                const file = event.target.files[0]; if (!file) return;
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const importedQuiz = JSON.parse(e.target.result);
                        importQuizPayload(importedQuiz, file.name || 'file JSON');
                    } catch (error) {
                        alert('Lỗi khi đọc file. Vui lòng kiểm tra lại file JSON.');
                    }
                };
                reader.readAsText(file);
                importFileInput.value = '';
            });

            window.addEventListener('message', (event) => {
                if (event.origin !== window.location.origin) return;
                if (event.data?.type !== 'nlkh-tool-import' || event.data?.target !== 'quiz') return;
                importQuizPayload(event.data.data, event.data.sourceName || 'Dữ liệu được cấp');
            });
            
            newQuestionImageInput.addEventListener('change', (event) => {
                const file = event.target.files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (e) => {
                    currentQuestionImageBase64 = e.target.result;
                    questionImagePreview.src = e.target.result;
                    questionImagePreview.classList.remove('hidden');
                    removeImageBtn.classList.remove('hidden');
                };
                reader.readAsDataURL(file);
            });
            
            removeImageBtn.addEventListener('click', (e) => {
                e.preventDefault();
                newQuestionImageInput.value = '';
                questionImagePreview.classList.add('hidden');
                questionImagePreview.src = '';
                removeImageBtn.classList.add('hidden');
                currentQuestionImageBase64 = null;
            });

            // --- DRAG AND DROP LOGIC ---
            questionsPreview.addEventListener('dragstart', e => {
                if (e.target.classList.contains('question-preview-item')) {
                    draggedItemIndex = parseInt(e.target.dataset.index);
                    e.target.classList.add('dragging');
                }
            });

            questionsPreview.addEventListener('dragend', e => {
                if (e.target.classList.contains('question-preview-item')) {
                    e.target.classList.remove('dragging');
                    draggedItemIndex = null;
                    document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
                }
            });

            questionsPreview.addEventListener('dragover', e => {
                e.preventDefault();
                const target = e.target.closest('.question-preview-item');
                if (target && parseInt(target.dataset.index) !== draggedItemIndex) {
                    document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
                    target.classList.add('drag-over');
                }
            });
            
            questionsPreview.addEventListener('dragleave', e => {
                 const target = e.target.closest('.question-preview-item');
                 if(target) {
                    target.classList.remove('drag-over');
                 }
            });

            questionsPreview.addEventListener('drop', e => {
                e.preventDefault();
                const target = e.target.closest('.question-preview-item');
                if (target) {
                    target.classList.remove('drag-over');
                    const droppedOnIndex = parseInt(target.dataset.index);
                    if (draggedItemIndex !== null && draggedItemIndex !== droppedOnIndex) {
                        const itemToMove = newQuizQuestions.splice(draggedItemIndex, 1)[0];
                        newQuizQuestions.splice(droppedOnIndex, 0, itemToMove);
                        updateQuestionPreview();
                    }
                }
            });
            
            // --- IMPORT QUESTIONS LOGIC ---
            importQuestionsBtn.addEventListener('click', () => importQuestionsInput.click());
            importQuestionsInput.addEventListener('change', (event) => {
                const file = event.target.files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const data = JSON.parse(e.target.result);
                        if (Array.isArray(data.questions)) {
                            newQuizQuestions.push(...data.questions);
                            updateQuestionPreview();
                            alert(`Đã bổ sung thành công ${data.questions.length} câu hỏi.`);
                        } else {
                            alert('File JSON không hợp lệ. Cần có một mảng "questions".');
                        }
                    } catch (error) {
                        alert('Lỗi khi đọc file. Vui lòng kiểm tra lại file JSON.');
                    }
                };
                reader.readAsText(file);
                importQuestionsInput.value = '';
            });


            function setWordStatus(text, type = 'normal') {
                wordStatus.className = 'text-sm ' + (type === 'ok' ? 'text-green-600' : type === 'warn' ? 'text-red-500' : 'text-gray-700');
                wordStatus.textContent = text;
            }

            function normalizeWordText(text) {
                return String(text || '')
                    .replace(/\r/g, '\n')
                    .replace(/\u00A0/g, ' ')
                    .replace(/[ \t]+/g, ' ')
                    .replace(/ ?\n ?/g, '\n')
                    .replace(/\n{3,}/g, '\n\n')
                    .trim();
            }

            function wordXmlChildrenByLocalName(node, localName) {
                return Array.from(node?.childNodes || []).filter(
                    n => n.nodeType === 1 && (n.localName === localName || String(n.nodeName).endsWith(':' + localName))
                );
            }

            function wordFirstChildByLocalName(node, localName) {
                return wordXmlChildrenByLocalName(node, localName)[0] || null;
            }

            function wordGetAttr(node, attrNames) {
                for (const name of attrNames) {
                    const value = node?.getAttribute?.(name);
                    if (value != null) return value;
                }
                return null;
            }

            function wordHexToRgb(hexValue) {
                const hex = String(hexValue || '').replace(/^#/, '').trim().toUpperCase();
                if (!/^[0-9A-F]{6}$/.test(hex)) return null;
                return {
                    r: parseInt(hex.slice(0, 2), 16),
                    g: parseInt(hex.slice(2, 4), 16),
                    b: parseInt(hex.slice(4, 6), 16)
                };
            }

            function wordIsTargetHex(value) {
                const source = wordHexToRgb(value);
                const target = wordHexToRgb(wordColorInput.value || '#FF0000');
                if (!source || !target) return false;

                const dr = source.r - target.r;
                const dg = source.g - target.g;
                const db = source.b - target.b;
                const distance = Math.sqrt(dr * dr + dg * dg + db * db);
                return distance <= 90;
            }

            function wordIsTargetTheme(themeName) {
                if (!themeName) return false;
                const t = String(themeName).toLowerCase();
                const selected = String(wordColorInput.value || '#FF0000').toLowerCase();
                const redLike = ['#c00000', '#ff0000', '#ee0000', '#dc143c'];
                if (redLike.includes(selected)) {
                    return t.includes('red') || t.includes('accent2') || t.includes('hyperlink') || t.includes('followedhyperlink');
                }
                return false;
            }

            function parseWordNumbering(xmlText) {
                const numbering = { numToAbstract: new Map(), abstractFormats: new Map() };
                if (!xmlText) return numbering;
                const doc = new DOMParser().parseFromString(xmlText, 'application/xml');

                const nums = Array.from(doc.getElementsByTagName('*')).filter(n => n.localName === 'num');
                for (const num of nums) {
                    const numId = wordGetAttr(num, ['w:numId', 'numId']);
                    const abs = wordFirstChildByLocalName(num, 'abstractNumId');
                    const absId = wordGetAttr(abs, ['w:val', 'val']);
                    if (numId && absId) numbering.numToAbstract.set(numId, absId);
                }

                const abstracts = Array.from(doc.getElementsByTagName('*')).filter(n => n.localName === 'abstractNum');
                for (const abs of abstracts) {
                    const absId = wordGetAttr(abs, ['w:abstractNumId', 'abstractNumId']);
                    const levels = wordXmlChildrenByLocalName(abs, 'lvl');
                    const map = new Map();
                    for (const lvl of levels) {
                        const ilvl = wordGetAttr(lvl, ['w:ilvl', 'ilvl']) || '0';
                        const numFmt = wordFirstChildByLocalName(lvl, 'numFmt');
                        const fmtVal = wordGetAttr(numFmt, ['w:val', 'val']) || '';
                        map.set(ilvl, fmtVal);
                    }
                    if (absId) numbering.abstractFormats.set(absId, map);
                }
                return numbering;
            }

            function parseWordStyles(xmlText) {
                const styles = new Map();
                if (!xmlText) return styles;
                const doc = new DOMParser().parseFromString(xmlText, 'application/xml');
                const styleNodes = Array.from(doc.getElementsByTagName('*')).filter(n => n.localName === 'style');
                for (const style of styleNodes) {
                    const styleId = wordGetAttr(style, ['w:styleId', 'styleId']);
                    const rPr = wordFirstChildByLocalName(style, 'rPr');
                    const colorNode = wordFirstChildByLocalName(rPr, 'color');
                    if (styleId) {
                        styles.set(styleId, {
                            colorVal: wordGetAttr(colorNode, ['w:val', 'val']),
                            themeColor: wordGetAttr(colorNode, ['w:themeColor', 'themeColor'])
                        });
                    }
                }
                return styles;
            }

            function resolveWordParagraphListFormat(p, numbering) {
                const pPr = wordFirstChildByLocalName(p, 'pPr');
                const numPr = wordFirstChildByLocalName(pPr, 'numPr');
                if (!numPr) return null;
                const numIdNode = wordFirstChildByLocalName(numPr, 'numId');
                const ilvlNode = wordFirstChildByLocalName(numPr, 'ilvl');
                const numId = wordGetAttr(numIdNode, ['w:val', 'val']);
                const ilvl = wordGetAttr(ilvlNode, ['w:val', 'val']) || '0';
                const absId = numbering.numToAbstract.get(numId);
                const formatMap = numbering.abstractFormats.get(absId);
                return formatMap?.get(ilvl) || null;
            }

            function wordRunMatchesColor(run, styleMap) {
                const rPr = wordFirstChildByLocalName(run, 'rPr');
                const colorNode = wordFirstChildByLocalName(rPr, 'color');
                const colorVal = wordGetAttr(colorNode, ['w:val', 'val']);
                const themeColor = wordGetAttr(colorNode, ['w:themeColor', 'themeColor']);
                if (wordIsTargetHex(colorVal) || wordIsTargetTheme(themeColor)) return true;

                const rStyle = wordFirstChildByLocalName(rPr, 'rStyle');
                const styleId = wordGetAttr(rStyle, ['w:val', 'val']);
                if (styleId && styleMap.has(styleId)) {
                    const style = styleMap.get(styleId);
                    if (wordIsTargetHex(style.colorVal) || wordIsTargetTheme(style.themeColor)) return true;
                }
                return false;
            }

            function extractWordTextFromRun(run) {
                let text = '';
                for (const child of Array.from(run.childNodes || [])) {
                    if (child.nodeType !== 1) continue;
                    const name = child.localName || child.nodeName;
                    if (name === 't' || String(name).endsWith(':t')) text += child.textContent || '';
                    else if (name === 'tab' || String(name).endsWith(':tab')) text += '\t';
                    else if (name === 'br' || String(name).endsWith(':br')) text += '\n';
                }
                return text;
            }

            function parseWordParagraph(p, numbering, styleMap) {
                const listFmt = resolveWordParagraphListFormat(p, numbering);
                const directRuns = wordXmlChildrenByLocalName(p, 'r');
                const hyperlinks = wordXmlChildrenByLocalName(p, 'hyperlink');
                const segments = [];

                for (const run of directRuns) {
                    const text = extractWordTextFromRun(run);
                    if (text) segments.push({ text, match: wordRunMatchesColor(run, styleMap) });
                }
                for (const hyperlink of hyperlinks) {
                    const linkedRuns = wordXmlChildrenByLocalName(hyperlink, 'r');
                    for (const run of linkedRuns) {
                        const text = extractWordTextFromRun(run);
                        if (text) segments.push({ text, match: wordRunMatchesColor(run, styleMap) });
                    }
                }

                let text = segments.map(s => s.text).join('');
                text = text.replace(/\s+/g, ' ').trim();
                if (!text) return null;

                if (listFmt === 'upperLetter' || listFmt === 'lowerLetter') {
                    const match = text.match(/^([A-Da-d])[\.)]\s*(.*)$/);
                    if (match) text = match[1].toUpperCase() + '.' + match[2].trim();
                }

                const isMatch = segments.some(s => s.match && s.text.trim());
                return { text, isMatch };
            }

            function looksLikeWordQuestionStart(text) {
                return /^Câu\s*\d+\s*:?$/i.test(text) || /^Câu\s*\d+\s*:/i.test(text);
            }

            function looksLikeWordAnswer(text) {
                return /^[A-D]\s*[\.)]/.test(text) || /^[A-D]\./.test(text);
            }

            function normalizeWordAnswerPrefix(text) {
                return String(text)
                    .replace(/^([A-D])\)/, '$1.')
                    .replace(/^([A-D])\s*\./, '$1.');
            }

            function finalizeWordQuestion(current, questions) {
                if (!current) return;
                current.question = normalizeWordText(current.question);
                current.answers = current.answers
                    .map(a => ({
                        text: normalizeWordText(normalizeWordAnswerPrefix(a.text)),
                        image: null,
                        correct: a.correct
                    }))
                    .filter(a => a.text);

                const hasTrue = current.answers.some(a => a.correct === true);
                current.answers = current.answers.map(a => ({
                    ...a,
                    correct: hasTrue ? a.correct === true : (wordDefaultFalse.checked ? false : null)
                }));

                questions.push({
                    question: current.question,
                    image: null,
                    multiple: false,
                    answers: current.answers
                });
            }

            function parseWordDocumentXml(xmlText, numbering, styleMap) {
                const doc = new DOMParser().parseFromString(xmlText, 'application/xml');
                const body = Array.from(doc.getElementsByTagName('*')).find(n => n.localName === 'body');
                const children = Array.from(body?.childNodes || []).filter(n => n.nodeType === 1);

                const questions = [];
                let current = null;
                let pendingQuestionLabel = false;

                for (const node of children) {
                    if (!(node.localName === 'p' || String(node.nodeName).endsWith(':p'))) continue;
                    const para = parseWordParagraph(node, numbering, styleMap);
                    if (!para || !para.text) continue;

                    if (looksLikeWordQuestionStart(para.text)) {
                        finalizeWordQuestion(current, questions);
                        current = { question: '', answers: [] };
                        pendingQuestionLabel = true;
                        continue;
                    }

                    if (!current) continue;

                    if (looksLikeWordAnswer(para.text)) {
                        current.answers.push({
                            text: normalizeWordAnswerPrefix(para.text),
                            image: null,
                            correct: para.isMatch
                        });
                        pendingQuestionLabel = false;
                        continue;
                    }

                    if (pendingQuestionLabel || current.answers.length === 0) {
                        current.question = current.question ? current.question + ' ' + para.text : para.text;
                    } else {
                        const last = current.answers[current.answers.length - 1];
                        last.text = last.text + ' ' + para.text;
                        if (para.isMatch) last.correct = true;
                    }
                }

                finalizeWordQuestion(current, questions);
                return questions;
            }

            function parseWordRawTextToSchema(text, title) {
                const normalized = normalizeWordText(text).replace(/(?:^|\n)Câu\s*(\d+)\s*:/g, '\n@@QUESTION_$1@@ ');
                const chunks = normalized.split(/\n@@QUESTION_\d+@@\s*/).map(s => s.trim()).filter(Boolean);

                const questions = chunks.map(chunk => {
                    const compact = chunk.replace(/\n+/g, ' ').trim();
                    const answerMatches = Array.from(compact.matchAll(/([A-D])\.(.*?)(?=\s+[A-D]\.|$)/g));
                    const answerStart = compact.search(/\bA\./);
                    const questionText = answerStart === -1 ? compact : compact.slice(0, answerStart).trim();
                    const answers = answerMatches.map(m => ({
                        text: m[1] + '.' + m[2].trim(),
                        image: null,
                        correct: wordDefaultFalse.checked ? false : null
                    }));

                    return { question: questionText, image: null, multiple: false, answers };
                });

                return { title: title?.trim() || 'Bộ câu hỏi chuyển đổi', questions };
            }

            async function readWordDocxToSchema(file, title) {
                const arrayBuffer = await file.arrayBuffer();
                const zip = await JSZip.loadAsync(arrayBuffer);

                const documentEntry = zip.file('word/document.xml');
                if (!documentEntry) throw new Error('Không tìm thấy word/document.xml trong file .docx.');

                const documentXml = await documentEntry.async('string');
                const numberingXml = await zip.file('word/numbering.xml')?.async('string');
                const stylesXml = await zip.file('word/styles.xml')?.async('string');

                const numbering = parseWordNumbering(numberingXml || '');
                const styleMap = parseWordStyles(stylesXml || '');
                const questions = parseWordDocumentXml(documentXml, numbering, styleMap);

                return {
                    title: title?.trim() || 'Bộ câu hỏi chuyển đổi',
                    questions
                };
            }

            function renderWordJson(data) {
                latestConvertedQuiz = data;
                wordJsonPreview.textContent = JSON.stringify(data, null, 2);
                const answerTotal = data.questions.reduce((sum, q) => sum + q.answers.length, 0);
                const detectedTotal = data.questions.reduce((sum, q) => sum + q.answers.filter(a => a.correct === true).length, 0);
                wordQCount.textContent = String(data.questions.length);
                wordACount.textContent = String(answerTotal);
                wordCorrectCount.textContent = String(detectedTotal);
            }

            async function runWordConvert() {
                try {
                    setWordStatus('Đang xử lý...');
                    const raw = wordRawInput.value.trim();
                    const file = wordFileInput.files?.[0];
                    let data;

                    if (file) {
                        if (!file.name.toLowerCase().endsWith('.docx')) throw new Error('Chỉ hỗ trợ file .docx.');
                        data = await readWordDocxToSchema(file, wordQuizTitleInput.value);
                        renderWordJson(data);
                        const detectedTotal = data.questions.reduce((sum, q) => sum + q.answers.filter(a => a.correct === true).length, 0);
                        setWordStatus('Đã chuyển đổi ' + data.questions.length + ' câu hỏi, nhận diện ' + detectedTotal + ' đáp án đúng.', 'ok');
                        return data;
                    }

                    if (raw) {
                        data = parseWordRawTextToSchema(raw, wordQuizTitleInput.value);
                        renderWordJson(data);
                        setWordStatus('Đã chuyển đổi ' + data.questions.length + ' câu hỏi từ nội dung nhập tay.', 'ok');
                        return data;
                    }

                    throw new Error('Bạn chưa chọn file hoặc dán nội dung.');
                } catch (err) {
                    setWordStatus(err?.message || 'Có lỗi xảy ra khi chuyển đổi.', 'warn');
                    return null;
                }
            }

            // --- EVENT LISTENERS ---
            startBtn.addEventListener('click', startGame);
            backToHomeBtn.addEventListener('click', () => showScreen('home'));
            backFromPlayerNameBtn.addEventListener('click', () => showScreen('home'));
            exportWrongBtn.addEventListener('click', exportWrongAnswersQuiz);
            goToCreatorBtn.addEventListener('click', () => {
                resetCreatorForm();
                showScreen('creator');
            });
            cancelCreationBtn.addEventListener('click', () => { showScreen('home'); });
            
            gameModeRadios.forEach(radio => radio.addEventListener('change', () => {
                timerSettingsDiv.style.display = radio.value === 'test' ? 'block' : 'none';
            }));
            timerEnabledCheckbox.addEventListener('change', () => {
                timerOptionsDiv.style.display = timerEnabledCheckbox.checked ? 'flex' : 'none';
            });
            
            cancelExportBtn.addEventListener('click', () => exportModal.classList.add('hidden'));
            exportPdfBtn.addEventListener('click', () => {
                exportAsDocument('pdf');
                exportModal.classList.add('hidden');
            });
            exportDocBtn.addEventListener('click', () => {
                exportAsDocument('docx');
                exportModal.classList.add('hidden');
            });
            exportJsonBtn.addEventListener('click', () => {
                exportAsDocument('json');
                exportModal.classList.add('hidden');
            });
            
            document.querySelectorAll('input[name="export-type"]').forEach(radio => {
                radio.addEventListener('change', e => {
                    const isRandom = e.target.value === 'random';
                    randomOptionsContainer.classList.toggle('hidden', !isRandom);
                    exportJsonBtn.classList.toggle('hidden', !isRandom);
                });
            });

            randomQuestionCountInput.addEventListener('input', (e) => {
                const max = parseInt(e.target.max);
                if (parseInt(e.target.value) > max) {
                    e.target.value = max;
                }
            });

            addAnswerBtn.addEventListener('click', () => addAnswerEditor());
            document.querySelectorAll('input[name="answer-type"]').forEach(radio => {
                radio.addEventListener('change', (e) => {
                    const newType = e.target.value === 'single' ? 'radio' : 'checkbox';
                    answerEditorContainer.querySelectorAll('input[name="correct-answer"]').forEach(input => {
                        input.type = newType;
                        if (newType === 'radio') {
                            const firstChecked = answerEditorContainer.querySelector('input[name="correct-answer"]:checked');
                            if (firstChecked) {
                                answerEditorContainer.querySelectorAll('input[name="correct-answer"]').forEach(r => r.checked = false);
                                firstChecked.checked = true;
                            }
                        }
                    });
                });
            });

            richTextToolbar.addEventListener('click', (e) => {
                const command = e.target.dataset.command;
                if (command) {
                    e.preventDefault();
                    document.execCommand(command, false, null);
                    newQuestionDiv.focus();
                    richTextToolbar.querySelectorAll('button').forEach(btn => {
                        btn.classList.toggle('active', document.queryCommandState(btn.dataset.command));
                    });
                }
            });
            
            newQuestionDiv.addEventListener('keyup', () => {
                richTextToolbar.querySelectorAll('button').forEach(btn => {
                    btn.classList.toggle('active', document.queryCommandState(btn.dataset.command));
                });
            });

            submitMultipleChoiceBtn.addEventListener('click', submitMultipleAnswers);

            openWordConverterBtn.addEventListener('click', () => {
                wordConverterModal.classList.remove('hidden');
            });

            closeWordConverterBtn.addEventListener('click', () => {
                wordConverterModal.classList.add('hidden');
            });

            wordClearFileBtn.addEventListener('click', () => {
                wordFileInput.value = '';
                setWordStatus('Đã xóa file đã chọn.', 'ok');
            });

            wordClearRawBtn.addEventListener('click', () => {
                wordRawInput.value = '';
                setWordStatus('Đã xóa nội dung nhập tay.', 'ok');
            });

            wordColorPreset.addEventListener('change', () => {
                if (wordColorPreset.value !== 'custom') {
                    wordColorInput.value = wordColorPreset.value;
                }
                setWordStatus('Đã chọn màu nhận diện đáp án đúng: ' + wordColorInput.value, 'ok');
            });

            wordColorInput.addEventListener('input', () => {
                const presetValues = ['#c00000', '#ff0000', '#ffc000', '#92d050', '#00b050', '#00b0f0', '#0070c0', '#002060', '#7030a0'];
                const current = wordColorInput.value.toLowerCase();
                wordColorPreset.value = presetValues.includes(current) ? current : 'custom';
                setWordStatus('Đã đổi màu nhận diện đáp án đúng sang ' + wordColorInput.value, 'ok');
            });

            wordConvertBtn.addEventListener('click', async () => {
                await runWordConvert();
            });

            wordImportAsQuizBtn.addEventListener('click', async () => {
                const data = latestConvertedQuiz || await runWordConvert();
                if (!data) return;
                if (!data.title || !Array.isArray(data.questions)) {
                    alert('Dữ liệu chuyển đổi không hợp lệ.');
                    return;
                }
                ensureQuizHasId(data);
                if (isDuplicateQuiz(data)) {
                    alert('Quiz này đã tồn tại trong danh sách. Không thể nhập trùng.');
                    return;
                }
                allQuizzes.push(data);
                saveQuizzesToStorage();
                renderQuizList();
                alert('Đã nhập quiz mới từ file Word: ' + data.title);
                wordConverterModal.classList.add('hidden');
            });

            wordLoadIntoCreatorBtn.addEventListener('click', async () => {
                const data = latestConvertedQuiz || await runWordConvert();
                if (!data) return;
                resetCreatorForm();
                quizTitleInput.value = data.title || 'Bộ câu hỏi chuyển đổi';
                newQuizQuestions = Array.isArray(data.questions) ? JSON.parse(JSON.stringify(data.questions)) : [];
                updateQuestionPreview();
                wordConverterModal.classList.add('hidden');
                showScreen('creator');
            });

            // --- INITIALIZATION ---
            loadQuizzesFromStorage();
            setupAnswerEditors();
            showScreen('home');
        });
