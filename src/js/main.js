import { getRandomId } from './utils/utils.js'

// Такимбразом инициализируем карту и задаем ей координаты центра и начальный зум
let map = L.map('map').setView([55.7558, 37.6173], 10);

// Добавляем слой карты (в нашем случае это OpenStreetMap)
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

let addingMarker = false; // режим добавления маркера
let markers = [];         // массив маркеров

const addMarkerButton = document.getElementById('add-marker');
const filterInput = document.getElementById('filter-input')

// Функция переключения режима добавления маркера
function toggleAddingMarker() {
    addingMarker = !addingMarker;

    if (addingMarker) {
        addMarkerButton.textContent = 'Отменить';
        map.on('click', addMarker); // вешаем обработчик на клик по карте
    } else {
        addMarkerButton.textContent = 'Добавить маркер';
        map.off('click', addMarker); // убираем обработчик клика по карте
    }
}

addMarkerButton.addEventListener('click', toggleAddingMarker); // вешаем обработчик на клик по кнопке

// данная функция инициализирует popup для маркера
function initMarkerPopup(marker) {
    // в попап можно добавить любой html код
    // в данном случае это форма, поля ввода которой заполняются данными маркера
    const popupContent = `
        <form class="marker-edit-form">
            <div>
                <label for="name">Название:</label>
                <input type="text" id="name" value="${marker.name ? marker.name : ''}">
            </div>

            <div>
                <label for="type">Тип:</label>
                <input type="text" id="type" value="${marker.type ? marker.type : ''}">
            </div>

            <div>
                <label for="description">Описание:</label>
                <input type="text" id="description" value="${marker.description ? marker.description : ''}">
            </div>

            <button type="submit">Сохранить</button>
        </form>
    `;

    marker.bindPopup(popupContent); // добавляем попап к маркеру таким образом

    // вешаем обработчик на открытие попапа
    marker.on('popupopen', () => {
        const form = document.querySelector('.marker-edit-form');
        const name = document.getElementById('name');
        const type = document.getElementById('type');
        const description = document.getElementById('description');
        form.addEventListener('submit', (e) => {
            e.preventDefault();

            console.log(name.value, type.value, description.value)

            // изменяем данные маркера
            marker.name = name.value;
            marker.type = type.value;
            marker.description = description.value;

            console.log(marker.name, marker.type, marker.description)

            // сохраняем маркер в local storage
            saveMarkerToLocalStorage(marker);

            // закрываем попап
            // и обновляем его содержимое
            marker.closePopup();
            initMarkerPopup(marker);
        });
    });
}

// Функция добавления маркера
function addMarker(e) {
    // Создаем маркер (draggable - флаг, который позволяет перетаскивать маркер)
    // id - случайное число, которое будет использоваться как id маркера
    const marker = L.marker(e.latlng, { draggable: true, id: getRandomId() }).addTo(map);

    // Вешаем обработчик на двойной клик по маркеру
    // При двойном клике маркер удаляется
    marker.on('dblclick', function() {
        deleteMarker(marker);
        map.removeLayer(marker);
    });

    initMarkerPopup(marker); // инициализируем попап

    // Вешаем обработчик на перетаскивание маркера
    marker.on('dragend', function(event) {
        const marker = event.target;
        saveMarkerToLocalStorage(marker); // сохраняем маркер в local storage после перетаскивания
    });

    // Сохраняем маркер в local storage
    saveMarkerToLocalStorage(marker);
    // Добавляем маркер в массив маркеров
    markers.push(marker);

    // Переключаем режим добавления маркера 
    // можно этого не делать и оставить режим добавления маркера включенным чтобы пользователь мог добавить несколько маркеров подряд
    // и сам отключать режим добавления маркера
    toggleAddingMarker();
}

// Функция сохранения маркера в local storage
function saveMarkerToLocalStorage(marker) {
    // получаем массив маркеров из local storage
    let markers = JSON.parse(localStorage.getItem('markers')) || [];
    // ищем индекс маркера в массиве по id чтобы понять существует ли он в массиве
    const existingMarkerIndex = markers.findIndex(m => m.id === marker.options.id);
    
    // создаем новый маркер (а точнее объект с данными маркера)
    const newMarker = {
        id: marker.options.id,
        latlng: marker.getLatLng(),
        name: marker.name,
        type: marker.type,
        description: marker.description
    };

    // если маркер существует в массиве, то заменяем его новым маркером
    if (existingMarkerIndex !== -1) {
        markers[existingMarkerIndex] = newMarker;
    } else {
        // если маркера нет в массиве, то добавляем его в массив
        markers.push(newMarker);
    }

    localStorage.setItem('markers', JSON.stringify(markers));
}

// Функция загрузки маркеров из local storage
function loadMarkers() {
    // получаем массив маркеров из local storage либо создаем пустой массив
    const markerData = JSON.parse(localStorage.getItem('markers')) || [];

    // создаем маркеры на основе данных из local storage
    // нам снова нужно вешать обработчики на маркеры и инициализировать попапы
    markerData.forEach((data) => {
        const marker = L.marker(data.latlng, { draggable: true, id: data.id }).addTo(map);
        
        console.log(data.name, data.type, data.description)
        marker.name = data.name;
        marker.type = data.type;
        marker.description = data.description;

        marker.on('dblclick', function() {
            deleteMarker(marker);
            map.removeLayer(marker);
        });

        initMarkerPopup(marker);

        marker.on('dragend', function(event) {
            const marker = event.target;
            saveMarkerToLocalStorage(marker);
        });

        markers.push(marker);  // добавляем маркер в глобальный массив маркеров
    });
}

// Функция удаления маркера из local storage
function deleteMarker(marker) {
    // получаем массив маркеров из local storage (если он существует) и фильтруем его по id маркера
    let markers = JSON.parse(localStorage.getItem('markers')) || [];
    markers = markers.filter(m => m.id !== marker.options.id);
    // сохраняем новый массив маркеров в local storage
    localStorage.setItem('markers', JSON.stringify(markers));
}

// Функция фильтрации маркеров по описанию
// при вводе текста в инпут фильтруем массив маркеров и удаляем маркеры, которые не подходят под фильтр
filterInput.addEventListener('input', function() {
    // текст из инпута приводим к нижнему регистру
    const searchQuery = filterInput.value.toLowerCase();

    // проходимся по массиву маркеров и проверяем есть ли в описании маркера текст из инпута
    markers.forEach(function(marker) {
        if (marker.description) {

            const markerDescription = marker.description.toLowerCase();
            const match = markerDescription.includes(searchQuery);

            if (match) {
                marker.addTo(map);
            } else {
                map.removeLayer(marker);
            }
        }
    });
});

// Функция инициализации приложения
const init = () => {
    loadMarkers();
}

init();