const fileListContainer = document.getElementById('file-list');
const urlParams = new URLSearchParams(window.location.search);


function createElementFromHTML(htmlString) {
    var div = document.createElement('div');
    div.innerHTML = htmlString.trim();

    // Change this to div.childNodes to support multiple top-level nodes.
    return div.firstChild;
}

// Definir favoriteFileNames aquí para que esté disponible en todo el archivo script.js
const favorites = JSON.parse(localStorage.getItem('favorites')) || [];
const favoriteFileNames = new Set(favorites.map(file => file.name));

async function fetchMidiFiles(searchTerm = '') {
    try {
        const response = await fetch('https://api.github.com/repos/thewildwestmidis/midis/contents/');
        const data = await response.json();

        const midiFiles = data.filter(item => item.name.endsWith('.mid'));
        const favoriteFileNames = new Set(favorites.map(file => file.name)); // Create favoriteFileNames here

        // Filtrar por término de búsqueda si se proporciona
        if (searchTerm) {
            const filteredFiles = midiFiles.filter(file => file.name.toLowerCase().includes(searchTerm));
            displayFileList(filteredFiles, favoriteFileNames); // Pass favoriteFileNames here
        } else {
            displayFileList(midiFiles, favoriteFileNames); // Pass favoriteFileNames here
        }
    } catch (error) {
        console.error('Error fetching MIDI files:', error);
    }
}



function formatFileName(name) {
    // Reemplazar "_" y "-" por " " (espacio)
    const formattedName = name.replace(/_/g, ' ').replace(/-/g, ' ');

    // Eliminar espacios duplicados causados por el reemplazo anterior
    return formattedName.replace(/\s+/g, ' ');
}

async function displayFileList(files) {
    fileListContainer.innerHTML = '';

    if (files.length === 0) {
        fileListContainer.innerHTML = '<p>No results found.</p>';
        return;
    }


    const durationPromises = files.map(async file => {
        if (selectedmidi.includes(file.name)) {
            const listItem = document.createElement('li');
            const isFavorite = favoriteFileNames.has(file.name);
            listItem.innerHTML = `
            <div class="divmidiinfo">
                <p class="midiname">${formatFileName(file.name)}</p>
                <p class="duration"></p>
            </div>
            <button class="copy-button" data-url="${file.download_url}">Copy Midi Data</button>
            <button class="${isFavorite ? 'remove-favorite-button' : 'favorite-button'}" data-file='${JSON.stringify(file)}'>
                ${isFavorite ? 'Unfavorite' : 'Favorite'}
            </button>

            <!--
            <button class="stop-button" style="display: none">Stop</button>
            -->
            `;

            fileListContainer.appendChild(listItem);


            // Cargar y mostrar la duración
            try {
                const savedDuration = localStorage.getItem(`midi_duration_${file.name}`);
                if (savedDuration) {
                    const durationDiv = listItem.querySelector('.duration');
                    if (durationDiv) {
                        durationDiv.textContent = savedDuration;
                    }
                } else {
                    const midi = await Midi.fromUrl(file.download_url);
                    const durationInSeconds = midi.duration;
                    const minutes = Math.floor(durationInSeconds / 60);
                    const seconds = Math.round(durationInSeconds % 60);
                    const durationText = `${minutes} min, ${seconds < 10 ? '0' : ''}${seconds} sec`;
                    const durationDiv = listItem.querySelector('.duration');
                    if (durationDiv) {
                        durationDiv.textContent = durationText;
                    }

                    // Guardar la duración en el almacenamiento local
                    localStorage.setItem(`midi_duration_${file.name}`, durationText);
                }
            } catch (error) {
                console.error('Error loading duration of midi:', file.name, ' - ', error);
            }

            document.body.getElementsByClassName("MidiName")[0].textContent = file.name


        };
    });


    const copyButtons = document.querySelectorAll('.copy-button');
    copyButtons.forEach(button => {
        button.addEventListener('click', async function () {
            const url = this.getAttribute('data-url');
            copyToClipboard(url);

            button.textContent = 'Copied!';
            await new Promise(resolve => setTimeout(() => {
                button.textContent = 'Copy Midi Data';
            }, 1000));
        });
    });



    const favoriteButtons = document.querySelectorAll('.favorite-button');
    favoriteButtons.forEach(button => {
        button.addEventListener('click', function () {
            const fileData = JSON.parse(this.getAttribute('data-file'));
            const favorites = JSON.parse(localStorage.getItem('favorites')) || [];

            const existingIndex = favorites.findIndex(favorite => favorite.name === fileData.name);
            if (existingIndex !== -1) {
                favorites.splice(existingIndex, 1);
                this.textContent = 'Favorite';
                this.classList.remove('remove-favorite-button');
                this.classList.add('favorite-button');
            } else {
                favorites.push(fileData);
                this.textContent = 'Unfavorite';
                this.classList.remove('favorite-button');
                this.classList.add('remove-favorite-button');
            }

            localStorage.setItem('favorites', JSON.stringify(favorites));
        });
    });

    const favoriteDelButtons = document.querySelectorAll('.remove-favorite-button');
    favoriteDelButtons.forEach(button => {
        button.addEventListener('click', function () {
            const fileData = JSON.parse(this.getAttribute('data-file'));
            const favorites = JSON.parse(localStorage.getItem('favorites')) || [];

            const existingIndex = favorites.findIndex(favorite => favorite.name === fileData.name);
            if (existingIndex !== -1) {
                favorites.splice(existingIndex, 1);
                this.textContent = 'Favorite';
                this.classList.remove('remove-favorite-button');
                this.classList.add('favorite-button');
            } else {
                favorites.push(fileData);
                this.textContent = 'Unfavorite';
                this.classList.remove('favorite-button');
                this.classList.add('remove-favorite-button');
            }

            localStorage.setItem('favorites', JSON.stringify(favorites));
        });
    });

}

function copyToClipboard(text) {
    const tempInput = document.createElement('input');
    document.body.appendChild(tempInput);
    tempInput.value = text;
    tempInput.select();
    document.execCommand('copy');
    document.body.removeChild(tempInput);
}

const favoriteButtons = document.querySelectorAll('.favorite-button');
favoriteButtons.forEach(button => {
    button.addEventListener('click', function () {
        const fileData = JSON.parse(this.getAttribute('data-file'));
        const favorites = JSON.parse(localStorage.getItem('favorites')) || [];

        const existingIndex = favorites.findIndex(favorite => favorite.name === fileData.name);
        if (existingIndex !== -1) {
            // Already a favorite, remove it
            favorites.splice(existingIndex, 1);
            this.textContent = 'Favorite';
        } else {
            // Not a favorite, add it
            favorites.push(fileData);
            this.textContent = 'Unfavorite';
        }

        localStorage.setItem('favorites', JSON.stringify(favorites));
    });
});

const selectedmidi = urlParams.get('m');

if (selectedmidi) {
    // Realiza operaciones con el archivo MIDI seleccionado
    console.log('Selected midi:', selectedmidi);
    fetchMidiFiles("");
} else {
    // No se proporcionó un archivo MIDI seleccionado
    console.log('Ningún archivo MIDI seleccionado en la URL');
}

//Midi player
const BaseUrl = "https://raw.githubusercontent.com/Bertogim/The-Wild-West-Midis/main/midis/"

const midiplayer = document.getElementById("midiplayersection").getElementsByClassName("MidPlayer")[0]
const midivisualizer = document.getElementById("midiplayersection").getElementsByClassName("MidVisualizer")[0]
midiplayer.setAttribute("sound-font", "");
midiplayer.setAttribute("visualizer", "#midvis");
midiplayer.setAttribute("src", BaseUrl+selectedmidi);
midivisualizer.setAttribute("src", BaseUrl+selectedmidi);
document.getElementById("midiplayersection").appendChild(midiplayer);
document.getElementById("midiplayersection").appendChild(midivisualizer);