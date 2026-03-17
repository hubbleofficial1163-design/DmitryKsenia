// Целевая дата: 1 августа 2026
const targetDate = new Date(2026, 7, 1, 0, 0, 0);

function updateTimer() {
    const now = new Date();
    const diffMs = targetDate - now;

    if (diffMs <= 0) {
        document.getElementById('weeks').textContent = '0';
        document.getElementById('days').textContent = '0';
        document.getElementById('hours').textContent = '0';
        document.getElementById('minutes').textContent = '0';
        document.getElementById('seconds').textContent = '0';
        return;
    }

    let totalSeconds = Math.floor(diffMs / 1000);

    // const weeks = Math.floor(totalSeconds / (7 * 24 * 3600));
    // totalSeconds %= (7 * 24 * 3600);

    const days = Math.floor(totalSeconds / (24 * 3600));
    totalSeconds %= (24 * 3600);

    const hours = Math.floor(totalSeconds / 3600);
    totalSeconds %= 3600;

    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    // document.getElementById('weeks').textContent = weeks;
    document.getElementById('days').textContent = days;
    document.getElementById('hours').textContent = hours;
    document.getElementById('minutes').textContent = minutes;
    document.getElementById('seconds').textContent = seconds;
}

// ==============================================
// ОТПРАВКА ФОРМЫ В GOOGLE TABLES - УПРОЩЕННАЯ ВЕРСИЯ
// ==============================================

const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxfuknuJenlqpkk9CUoPgyIEc04VO5wmH-2L1oR0IAyFwPR5O4cFtNnxIIqF7AwB-tQ/exec';

// Функция для отправки данных
async function submitForm(form) {
    const submitBtn = document.querySelector('.submit-btn');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Отправка...';
    submitBtn.disabled = true;
    
    try {
        // Собираем данные из формы
        const formData = new FormData(form);
        
        // Создаем URL с параметрами
        const url = new URL(APPS_SCRIPT_URL);
        
        // Добавляем timestamp
        url.searchParams.append('_t', Date.now());
        
        // Перебираем все поля формы
        for (let [key, value] of formData.entries()) {
            // Для алкоголя добавляем каждый элемент отдельно
            if (key === 'alcohol') {
                url.searchParams.append('alcohol', value);
                console.log(`Добавлен алкоголь: ${value}`);
            } else {
                url.searchParams.append(key, value);
                console.log(`Добавлено поле ${key}: ${value}`);
            }
        }
        
        console.log('Отправка на URL:', url.toString());
        
        // Отправляем запрос
        await fetch(url.toString(), {
            method: 'GET',
            mode: 'no-cors' // Важно для Google Apps Script
        });
        
        // Показываем успех (с небольшой задержкой)
        setTimeout(() => {
            showNotification('Спасибо! Ваши ответы получены. Ждем вас на свадьбе!', 'success');
            form.reset();
            
            // Сбрасываем чекбоксы
            const noAlcoholCheckbox = document.querySelector('input[type="checkbox"][value="none"]');
            if (noAlcoholCheckbox) {
                noAlcoholCheckbox.checked = false;
                document.querySelectorAll('input[type="checkbox"][name="alcohol"]').forEach(cb => {
                    cb.disabled = false;
                    cb.checked = false;
                });
            }
            
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }, 2000);
        
    } catch (error) {
        console.error('Ошибка:', error);
        showNotification('Ошибка отправки. Свяжитесь с организатором: Михаил +7 985 937 8063', 'error');
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
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
            
            // Простая валидация
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
});
