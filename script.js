document.addEventListener("DOMContentLoaded", function() {
    
    let events = [];
    let mainMapMarker;
    let modalMap;
    let modalMapMarker;
    let modalMapInitialized = false;
    let newEventCoords = {};

  
    const eventForm = document.getElementById("event-form");
    const eventList = document.getElementById("events");

  
    const modal = document.getElementById('edit-modal');
    const closeModalBtn = document.querySelector('.close-btn');
    const editForm = document.getElementById('edit-form');
    const modalEditingIdInput = document.getElementById('modal-editing-id');

  
    const mainMap = L.map('map').setView([-14.235, -51.925], 4);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mainMap);

    
    const createCalendarConfig = () => {
        const handler = (selectedDates, dateStr, instance) => {
            if (!selectedDates[0]) return;

            const hoje = new Date();
            const dataSelecionada = selectedDates[0];
            const isToday = dataSelecionada.toDateString() === hoje.toDateString();

            if (isToday) {
               
                const hours = hoje.getHours().toString().padStart(2, '0');
                const minutes = hoje.getMinutes().toString().padStart(2, '0');
                instance.set('minTime', `${hours}:${minutes}`);
            } else {
                instance.set('minTime', null);
            }
        };

        return {
            enableTime: true,
            dateFormat: "d/m/Y H:i",
            time_24hr: true,
            locale: "pt",
            minDate: "today",
            onOpen: handler,   
            onChange: handler, 
        };
    };

    const mainCalendar = flatpickr("#event-datetime", createCalendarConfig());
    const editCalendar = flatpickr("#edit-event-datetime", createCalendarConfig());

    

    function renderEvents() {
        eventList.innerHTML = '';
        events.forEach(event => {
            const li = document.createElement('li');
            li.innerHTML = `
                <div class="event-info">
                    <strong>${event.name}</strong>
                    <div class="event-details">
                        <span>Data: ${event.datetime}</span><br>
                        <span>Local: <a href="${event.url}" target="_blank">Ver no Mapa</a></span>
                    </div>
                </div>
                <div class="event-actions">
                    <button class="edit-btn" data-id="${event.id}">Editar</button>
                    <button class="remove-btn" data-id="${event.id}">Remover</button>
                </div>
            `;
            eventList.appendChild(li);
        });
    }

    function openEditModal(id) {
        const eventToEdit = events.find(event => event.id == id);
        if (!eventToEdit) return;

        modalEditingIdInput.value = eventToEdit.id;
        document.getElementById('edit-event-name').value = eventToEdit.name;
        document.getElementById('edit-event-location').value = eventToEdit.url;
        editCalendar.setDate(eventToEdit.datetime, true, "d/m/Y H:i");

        newEventCoords = { ...eventToEdit.coords };
        modal.classList.remove('hidden');

        if (!modalMapInitialized) {
            modalMap = L.map('edit-map');
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(modalMap);
            modalMapInitialized = true;

            modalMap.on('click', function(e) {
                const { lat, lng } = e.latlng;
                newEventCoords = { lat, lng };
                document.getElementById('edit-event-location').value = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=16/${lat}/${lng}`;
                if (modalMapMarker) modalMap.removeLayer(modalMapMarker);
                modalMapMarker = L.marker([lat, lng]).addTo(modalMap);
            });
        }
        
        modalMap.setView(eventToEdit.coords, 16);
        if (modalMapMarker) modalMap.removeLayer(modalMapMarker);
        modalMapMarker = L.marker(eventToEdit.coords).addTo(modalMap);

        setTimeout(() => modalMap.invalidateSize(), 10);
    }

    function closeEditModal() {
        modal.classList.add('hidden');
        editForm.reset();
        newEventCoords = {};
    }

    

    mainMap.on('click', function(e) {
        const { lat, lng } = e.latlng;
        document.getElementById('event-location').value = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=16/${lat}/${lng}`;
        if (mainMapMarker) mainMap.removeLayer(mainMapMarker);
        mainMapMarker = L.marker([lat, lng]).addTo(mainMap);
    });

    eventForm.addEventListener("submit", function(event) {
        event.preventDefault();
        if (!mainMapMarker) {
            alert("Por favor, selecione um local no mapa.");
            return;
        }
        
        const newEvent = {
            id: Date.now(),
            name: document.getElementById("event-name").value,
            datetime: document.getElementById("event-datetime").value,
            url: document.getElementById("event-location").value,
            coords: mainMapMarker.getLatLng(),
        };
        
        if (!newEvent.name || !newEvent.datetime || !newEvent.url) {
            alert("Por favor, preencha todos os campos.");
            return;
        }

        events.push(newEvent);
        renderEvents();
        eventForm.reset();
        mainCalendar.clear();
        mainMap.removeLayer(mainMapMarker);
        mainMapMarker = null;
    });

    editForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const editingId = modalEditingIdInput.value;
        const eventIndex = events.findIndex(event => event.id == editingId);

        if (eventIndex > -1) {
            events[eventIndex].name = document.getElementById('edit-event-name').value;
            events[eventIndex].datetime = document.getElementById('edit-event-datetime').value;
            events[eventIndex].url = document.getElementById('edit-event-location').value;
            events[eventIndex].coords = newEventCoords;
        }

        renderEvents();
        closeEditModal();
    });

    eventList.addEventListener('click', function(e) {
        const id = e.target.dataset.id;
        if (!id) return;

        if (e.target.classList.contains('remove-btn')) {
            if (confirm('Tem certeza que deseja remover este evento?')) {
                events = events.filter(event => event.id != id);
                renderEvents();
            }
        }

        if (e.target.classList.contains('edit-btn')) {
            openEditModal(id);
        }
    });
    
    closeModalBtn.addEventListener('click', closeEditModal);
    window.addEventListener('click', function(e) {
        if (e.target == modal) {
            closeEditModal();
        }
    });
});