// Целевая дата: 1 августа 2026
const targetDate = new Date(2026, 7, 1, 0, 0, 0);

function updateTimer() {
    const now = new Date();
    const diffMs = targetDate - now;

    if (diffMs <= 0) {
        document.getElementById('days').textContent = '0';
        document.getElementById('hours').textContent = '0';
        document.getElementById('minutes').textContent = '0';
        document.getElementById('seconds').textContent = '0';
        return;
    }

    let totalSeconds = Math.floor(diffMs / 1000);
    const days = Math.floor(totalSeconds / (24 * 3600));
    totalSeconds %= (24 * 3600);
    const hours = Math.floor(totalSeconds / 3600);
    totalSeconds %= 3600;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    document.getElementById('days').textContent = days;
    document.getElementById('hours').textContent = hours;
    document.getElementById('minutes').textContent = minutes;
    document.getElementById('seconds').textContent = seconds;
}

// Функция для показа уведомлений
function showNotification(message, type = 'success') {
    const oldNotification = document.querySelector('.form-notification');
    if (oldNotification) oldNotification.remove();
    
    const notification = document.createElement('div');
    notification.className = `form-notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: ${type === 'success' ? '#245E38' : '#493826'};
        color: white;
        padding: 15px 25px;
        border-radius: 50px;
        font-family: 'Cormorant Garamond', serif;
        font-size: 1.2rem;
        z-index: 1000;
        box-shadow: 0 5px 20px rgba(0,0,0,0.2);
        animation: slideDown 0.3s ease;
        max-width: 90%;
        text-align: center;
        border: 2px solid white;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 5000);
}

// Функция отправки формы через JSONP (работает на GitHub Pages)
function submitForm(form) {
    // Собираем данные из формы
    const formData = new FormData(form);
    
    // === ИСПРАВЛЕНО: правильный сбор ВСЕХ чекбоксов алкоголя ===
    const alcoholCheckboxes = form.querySelectorAll('input[type="checkbox"][name="alcohol"]:checked');
    const alcoholValues = Array.from(alcoholCheckboxes).map(cb => cb.value);
    
    // Базовая структура данных
    const data = {
        fullname: formData.get('fullname'),
        guests: formData.get('guests'),
        attendance: formData.get('attendance'),
        food: formData.get('food'),
        child: formData.get('child'),
        wishes: formData.get('wishes') || ''
    };
    
    // Показываем индикатор загрузки
    const submitBtn = form.querySelector('.submit-btn');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Отправка...';
    submitBtn.disabled = true;
    
    // Генерируем уникальное имя callback функции
    const callbackName = 'jsonp_callback_' + Math.round(100000 * Math.random());
    
    // URL вашего Google Apps Script веб-приложения
    // ЗАМЕНИТЕ НА ВАШ URL ПОСЛЕ ПУБЛИКАЦИИ
    const scriptURL = 'https://script.google.com/macros/s/AKfycbxNu7lxBi_TO6zjGQzo7II2bDKppkHizajBcEau_BCyiZevdWP-AIZqy3ZFoOgvMp3UXg/exec';
    
    // Создаем URL с параметрами
    const params = new URLSearchParams();
    params.append('callback', callbackName);
    
    // Добавляем основные данные
    for (let key in data) {
        if (data.hasOwnProperty(key)) {
            params.append(key, data[key]);
        }
    }
    
    // === ИСПРАВЛЕНО: добавляем КАЖДЫЙ выбранный алкоголь отдельным параметром ===
    // Это гарантирует, что ВСЕ значения попадут в таблицу
    if (alcoholValues.length > 0) {
        alcoholValues.forEach((value, index) => {
            // Добавляем каждый алкоголь с уникальным ключом
            params.append(`alcohol_${index}`, value);
        });
        // Также добавляем счетчик, чтобы на сервере знали, сколько их
        params.append('alcoholCount', alcoholValues.length);
    }
    
    const url = scriptURL + '?' + params.toString();
    
    // Создаем JSONP callback
    window[callbackName] = function(response) {
        try {
            if (response.result === 'success') {
                showNotification('Спасибо! Ваши ответы успешно отправлены!', 'success');
                form.reset();
            } else {
                showNotification('Ошибка при отправке: ' + response.message, 'error');
            }
        } catch (e) {
            showNotification('Произошла ошибка при обработке ответа', 'error');
        } finally {
            // Удаляем скрипт и callback
            document.body.removeChild(script);
            delete window[callbackName];
            
            // Восстанавливаем кнопку
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    };
    
    // Создаем и добавляем скрипт для JSONP запроса
    const script = document.createElement('script');
    script.src = url;
    script.onerror = function() {
        showNotification('Ошибка соединения. Пожалуйста, проверьте интернет и попробуйте снова.', 'error');
        document.body.removeChild(script);
        delete window[callbackName];
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    };
    
    document.body.appendChild(script);
    
    // Таймаут на случай, если сервер не отвечает
    setTimeout(function() {
        if (window[callbackName]) {
            showNotification('Превышено время ожидания. Пожалуйста, попробуйте еще раз.', 'error');
            document.body.removeChild(script);
            delete window[callbackName];
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    }, 10000);
}

// Стили для анимаций
const style = document.createElement('style');
style.textContent = `
    @keyframes slideDown {
        from {
            opacity: 0;
            transform: translate(-50%, -20px);
        }
        to {
            opacity: 1;
            transform: translate(-50%, 0);
        }
    }
    
    @keyframes fadeOut {
        from {
            opacity: 1;
            transform: translate(-50%, 0);
        }
        to {
            opacity: 0;
            transform: translate(-50%, -20px);
        }
    }
`;
document.head.appendChild(style);

// Инициализация
document.addEventListener('DOMContentLoaded', function() {
    updateTimer();
    setInterval(updateTimer, 1000);
    
    const form = document.getElementById('weddingForm');
    
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Валидация
            const fullname = form.querySelector('[name="fullname"]').value;
            if (!fullname || fullname.trim() === '') {
                showNotification('Пожалуйста, укажите ваше имя и фамилию', 'error');
                return;
            }
            
            submitForm(form);
        });
    }
    
    // Логика для чекбокса "не буду пить алкоголь"
    const noAlcoholCheckbox = document.querySelector('input[type="checkbox"][value="none"]');
    if (noAlcoholCheckbox) {
        noAlcoholCheckbox.addEventListener('change', function() {
            const alcoholCheckboxes = document.querySelectorAll('input[type="checkbox"][name="alcohol"]:not([value="none"])');
            if (this.checked) {
                alcoholCheckboxes.forEach(cb => {
                    cb.checked = false;
                    cb.disabled = true;
                });
            } else {
                alcoholCheckboxes.forEach(cb => {
                    cb.disabled = false;
                });
            }
        });
    }
});

// Музыкальный плеер
document.addEventListener('DOMContentLoaded', function() {
    const musicBtn = document.getElementById('musicToggle');
    const bgMusic = document.getElementById('bgMusic');
    
    if (musicBtn && bgMusic) {
        let isPlaying = false;

        musicBtn.addEventListener('click', function() {
            if (isPlaying) {
                bgMusic.pause();
                musicBtn.classList.remove('playing');
            } else {
                bgMusic.play().catch(e => {
                    console.log('Автовоспроизведение заблокировано');
                });
                musicBtn.classList.add('playing');
            }
            isPlaying = !isPlaying;
        });

        bgMusic.addEventListener('ended', function() {
            isPlaying = false;
            musicBtn.classList.remove('playing');
        });
    }
});
