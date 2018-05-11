//Класс для буфера декодированных сэмплов
class Sounds {
    constructor(audioCtx, urlsArray){
        this._audioBuffer = [];
        const thisLabel = this;

        urlsArray.forEach((url, index) => {
            const xhr = new XMLHttpRequest();
            xhr.responseType = 'arraybuffer';
            xhr.onload = () => audioCtx.decodeAudioData(xhr.response,
                (audioData) => {
                    thisLabel._audioBuffer[index] = audioData;
                    if(index === urlsArray.length - 1) {
                        thisLabel.constructor.allSoundsAreLoaded();
                    }
                },
                (error => console.error('Error occures while decoding audio data. Error code: ', error)));
            xhr.open('GET', url);
            xhr.send();
        });
    }

    get audioBuffer() {
        return this._audioBuffer;
    }

    static allSoundsAreLoaded() {
        console.log('All sounds have been succesfully loaded!');
        $(document).ready(() => {
            $('.loading').fadeOut(1000);
            $('.container').animate({
               opacity: 1
            }, 1000);
        });
    }
}


// Класс для воспроизводимого звука метронома
class TickTack {
    constructor(audioCtx, tempo, sounds, volume, metrePattern, rhytmPattern){
        this.audioCtx = audioCtx;
        this.sounds = sounds;
        this.noteLength = 0.025;
        this._latency =  60 / tempo;
        this._metrePattern = metrePattern;
        this._rhytmPattern = rhytmPattern;
        this._mainPattern = [];
        this.gain = this.audioCtx.createGain();
        this.gain.gain.setValueAtTime(volume, this.audioCtx.currentTime);
        this.gain.connect(this.audioCtx.destination);
        this.createMainPattern();
        this.currentLatency = null;
    }

    //Создание новой аудио ноды
    init (soundIndex) {
        this.tick = this.audioCtx.createBufferSource();
        this.tick.buffer = this.sounds.audioBuffer[soundIndex];
        this.tick.connect(this.gain);
    }

    //Запуск воспроизведения звука метронома
    playTick(startDelay) {
        const thisLabel = this;
        this.currentSoundIndex = this._mainPattern.length - 1;
        let nextTickSoundIndex = this._mainPattern[soundIndex()];

        //Воспроизведение первого клика для избежания задержки после нажатия на "старт"
        this.init(nextTickSoundIndex);
        this.tick.start(this.audioCtx.currentTime + startDelay);
        this.tick.stop(this.audioCtx.currentTime + startDelay + this.noteLength);
        this.tick.onended = circlePlaying;
        this.switcher = true; //Переключатель воспроизведения

        //Изменение текущего сэмпла
        function soundIndex(){
            if(thisLabel.currentSoundIndex < thisLabel._mainPattern.length - 1) {
                thisLabel.currentSoundIndex++;
                return thisLabel.currentSoundIndex;
            } else {
                thisLabel.currentSoundIndex = 0;
                return thisLabel.currentSoundIndex;
            }
        }

        //Вычисление общей паузы между тиками
        function calculateCurrentLatency() {
            return (thisLabel.audioCtx.currentTime + (thisLabel._latency / (thisLabel._rhytmPattern.length + 1))) - thisLabel.noteLength;
        }


        //Запуск циклического воспроизведения
        function circlePlaying () {
            if (thisLabel.switcher === true) {
                //Включение анимации
                if((nextTickSoundIndex === 0) || (nextTickSoundIndex === 1)) {
                    startAnimation(thisLabel._latency);
                }
                //Воспроизведение
                nextTickSoundIndex = thisLabel._mainPattern[soundIndex()];
                thisLabel.init(nextTickSoundIndex);
                thisLabel.currentLatency = calculateCurrentLatency();
                thisLabel.tick.start(thisLabel.currentLatency);
                thisLabel.tick.stop(thisLabel.currentLatency + thisLabel.noteLength);
                thisLabel.tick.onended = circlePlaying;

            }
        }
    }


    //Остановка воспроизведения
    stopTick() {
        this.switcher = false;
        this.tick.disconnect();
        this.tick.onended = null;
    }

    //Изменение темпа
    set tempo(value) {
        this._latency = 60 / value;
        if (this.switcher === true){
            this.stopTick();
            this.playTick(this._latency);
        }
    }

    //Изменение размера
    set metre(value) {
        this._metrePattern = value;
        this.createMainPattern();
        if (this.switcher === true){
            this.stopTick();
            this.playTick(this._latency);
        }
    }

    //Изменение ритма
    set rhytm(value) {
        this._rhytmPattern = value;
        this.createMainPattern();
        if (this.switcher === true){
            this.stopTick();
            this.playTick(this._latency);
        }
    }

    //Изменение громскости
    set volume(value) {
        this.gain.gain.exponentialRampToValueAtTime(value / 100, audioCtx.currentTime + 0.3);
    }

    //Создание общего паттерна
    createMainPattern() {
        this._mainPattern = [];
        this._metrePattern.forEach((rhytmValue) => {
           this._mainPattern.push(rhytmValue);
           this._rhytmPattern.forEach((metreValue) => {
               this._mainPattern.push(metreValue);
           });
        });
    }
}


const audioCtx = new (window.AudioContext || window.webkitAudioContext)(); // Создаем аудио контекст
const sounds = new Sounds(audioCtx, ['js/samples/tick1.wav', 'js/samples/tick2.wav', 'js/samples/tick3.wav']);  // Создаем аудио буфер из сэмплов
let tickTack = new TickTack(audioCtx, document.getElementById('tempo').value, sounds, 0.5, [0], []);   //Объявление экзэмпляра класса TickTack


//Старт - стоп
function toggleSound(tmp){
    if(tmp === 'START') {
        if (audioCtx.state !== 'running') {
            audioCtx.resume().then( () => {
                tickTack.playTick(0);
            });
        } else {
            tickTack.playTick(0);
        }
        return 'STOP';
    } else {
        tickTack.stopTick();
        return 'START';
    }
}


//Изменение темпа
function setTempo(value) {
    tickTack.tempo = value;
}

//Изменение размера
function toggleMetre(newMetre) {
    switch(newMetre) {
        case '1':
            tickTack.metre = [0];
            break;
        case '2':
            tickTack.metre = [0, 1];
            break;
        case '3':
            tickTack.metre = [0, 1, 1];
            break;
        case '4':
            tickTack.metre = [0, 1, 1, 1];
            break;
    }
}

//Изменение ритма
function toggleRhytm(newRhytm) {
    switch(newRhytm) {
        case 1:
            tickTack.rhytm = [];
            break;
        case 2:
            tickTack.rhytm = [2];
            break;
        case 3:
            tickTack.rhytm = [2, 2];
            break;
        case 4:
            tickTack.rhytm = [2, 2, 2];
            break;
        case 5:
            tickTack.rhytm = [2, 2, 2, 2];
            break;
        case 6:
            tickTack.rhytm = [2, 2, 2, 2, 2];
            break;

    }
}

//Изменение грмокости
function changeVolume (value) {
    tickTack.volume = value;
}