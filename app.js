document.addEventListener('DOMContentLoaded', () => {
    const queue = [];
    let arrivalRate = 1; // λ
    let serviceRate = 1; // μ
    let timeUnit = 'minutes'; // Unidad de tiempo
    let isSimulationRunning = false;
    let isSimulationPaused = false;
    let arrivalInterval, serviceInterval, timerInterval;
    let simulationTime = 0;
    const customersServed = [];

    const queueContainer = document.getElementById('queue');
    const statsContainer = document.getElementById('stats');
    const simulationTimeContainer = document.getElementById('simulation-time');
    const metricsContainer = document.getElementById('metrics');

   
    document.getElementById('start-simulation').addEventListener('click', startSimulation);
    document.getElementById('stop-simulation').addEventListener('click', stopSimulation);
    document.getElementById('pause-simulation').addEventListener('click', function() {
        if (isSimulationRunning) {
            pauseSimulation();
            this.textContent = isSimulationPaused ? 'Reanudar Simulación' : 'Pausar Simulación';
        } else {
            alert('La simulación no está en ejecución.');
        }
    });
    document.getElementById('arrival-rate').addEventListener('input', (e) => {
        arrivalRate = parseFloat(e.target.value);
    });
    document.getElementById('service-rate').addEventListener('input', (e) => {
        serviceRate = parseFloat(e.target.value);
    });
    document.getElementById('time-unit').addEventListener('change', (e) => {
        timeUnit = e.target.value;
    });

    function startSimulation() {
        if (isSimulationRunning) {
            alert('La simulación ya está en ejecución.');
            return;
        }

        isSimulationRunning = true;
        simulationTime = 0;
        customersServed.length = 0;
        updateIntervals();
        timerInterval = setInterval(updateSimulationTime, 1000);
    }

    function stopSimulation() {
        isSimulationRunning = false;
        clearInterval(arrivalInterval);
        clearInterval(serviceInterval);
        clearInterval(timerInterval);

        // Restablecer campos de metrics y stats
        statsContainer.innerHTML = '';
        metricsContainer.innerHTML = '';

        // Restablecer tiempo de simulación
        simulationTime = 0;
        simulationTimeContainer.innerHTML = 'Tiempo de simulación: 0s';

        // Restablecer los valores de los campos
        document.getElementById('arrival-rate').value = 0;
        document.getElementById('service-rate').value = 0;
        document.getElementById('time-unit').value = 'minutes';

        resetFields(); // Llama a la función para restablecer los campos
    }

    function pauseSimulation() {
        if (!isSimulationRunning) {
            alert('La simulación no está en ejecución.');
            return;
        }
    
        if (isSimulationPaused) {
            clearInterval(arrivalInterval);
            clearInterval(serviceInterval);
            clearInterval(timerInterval);
            isSimulationPaused = false;
        } else {
            // Si la simulación no está pausada, no hagas nada en esta función.
            isSimulationPaused = true;
            return;
        }
    }

    function resetFields() {
        arrivalRate = 0; // Restablece la tasa de llegada
        serviceRate = 0; // Restablece la tasa de servicio
        timeUnit = 'minutes'; // Restablece la unidad de tiempo
    }

    function updateIntervals() {
        clearInterval(arrivalInterval);
        clearInterval(serviceInterval);

        const timeFactor = getTimeFactor(timeUnit);
        arrivalInterval = setInterval(addCustomer, 60000 / (arrivalRate * timeFactor));
        serviceInterval = setInterval(serveCustomer, 60000 / (serviceRate * timeFactor));
    }

    function addCustomer() {
        const arrivalTime = simulationTime;
        const customer = { id: queue.length + 1, arrivalTime };
        queue.push(customer);
        updateQueueDisplay();
    }

    function serveCustomer() {
        if (queue.length > 0) {
            const customer = queue.shift();
            customer.serviceTime = simulationTime;
            customersServed.push(customer);
            updateQueueDisplay();
        }
    }

    function updateQueueDisplay() {
        const queueDiv = document.getElementById('queue');
        queueDiv.innerHTML = ''; // Limpiar el contenido existente

        // Agregar una imagen de cliente por cada cliente en la cola
        queue.forEach(customer => {
            const img = document.createElement('img');
            img.src = 'https://i.gifer.com/3OlUl.gif'; // Ruta de la imagen del cliente https://i.gifer.com/3OlUe.gif
            img.alt = 'Cliente';
            queueDiv.appendChild(img);
        });

        updateStats(); // Llama a la función para actualizar las estadísticas
    }


    function updateStats() {
        const totalServed = customersServed.length;
        const averageWaitTime = totalServed === 0 ? 0 :
            (customersServed.reduce((sum, customer) => sum + (customer.serviceTime - customer.arrivalTime), 0) / totalServed).toFixed(2);

        statsContainer.innerHTML = `
            <div>Total clientes en espera: ${queue.length}</div>
            <div>Total clientes atendidos: ${totalServed}</div>
            <div>Tiempo promedio de espera: ${averageWaitTime} segundos</div>
        `;

        updateMetrics();
    }

    function updateMetrics() {
        const timeFactor = getTimeFactor(timeUnit);
        const lambda = arrivalRate * timeFactor / 60; // Convertir a clientes por segundo
        const mu = serviceRate * timeFactor / 60; // Convertir a clientes por segundo

        if (lambda >= mu) {
            metricsContainer.innerHTML = `
                <div>El sistema no es estable (λ >= μ).</div>
            `;
            return;
        }

        const rho = lambda / mu; // Utilización
        const P0 = 1 - rho; // Probabilidad de 0 clientes en el sistema
        const L = rho / (1 - rho); // Número promedio de clientes en el sistema
        const Lq = Math.pow(lambda, 2) / (mu * (mu - lambda)); // Número promedio de clientes en la cola
        const W = 1 / (mu - lambda); // Tiempo promedio en el sistema
        const Wq = lambda / (mu * (mu - lambda)); // Tiempo promedio en la cola

        metricsContainer.innerHTML = `
            <div>Utilización del sistema (ρ): ${rho.toFixed(2)}</div>
            <div>Probabilidad de 0 clientes en el sistema (P0): ${P0.toFixed(2)}</div>
            <div>Número promedio de clientes en el sistema (L): ${L.toFixed(2)}</div>
            <div>Número promedio de clientes en la cola (Lq): ${Lq.toFixed(2)}</div>
            <div>Tiempo promedio en el sistema (W): ${(W * 60).toFixed(2)} segundos</div>
            <div>Tiempo promedio en la cola (Wq): ${(Wq * 60).toFixed(2)} segundos</div>
        `;
    }

    function updateSimulationTime() {
        simulationTime++;
        simulationTimeContainer.innerHTML = `Tiempo de simulación: ${simulationTime}s`;
        updateQueueDisplay();
    }

    function getTimeFactor(unit) {
        switch (unit) {
            case 'hours':
                return 60;
            case 'days':
                return 60 * 24;
            default:
                return 1;
        }
    }



    class ImageHandler {
        constructor(imageUrl, containerId) {
            this.imageUrl = imageUrl;
            this.container = document.getElementById(containerId);
        }

        loadImage() {
            if (!this.container) {
                console.error('Container element not found.');
                return;
            }

            // Crear elemento de imagen
            const img = document.createElement('img');
            img.src = this.imageUrl;
            img.alt = 'Imagen';

            // Agregar imagen al contenedor
            this.container.innerHTML = ''; // Limpiar el contenedor antes de agregar la imagen
            this.container.appendChild(img);
        }

        // Método para cambiar la imagen
        changeImage(newImageUrl) {
            this.imageUrl = newImageUrl;
            this.loadImage();

        }

        // Otros métodos según sea necesario
    }

    // Crear una instancia de ImageHandler y cargar la imagen en el contenedor
    const imageHandler = new ImageHandler('https://i.gifer.com/3OlUQ.gif', 'image-container');
    imageHandler.loadImage(); // Cargar la imagen en el contenedor




    class ImagenPostes {
        constructor(imageUrl, containerId) {
            this.imageUrl = imageUrl;
            this.container = document.getElementById(containerId);
        }

        loadImage() {
            if (!this.container) {
                console.error('Container element not found.');
                return;
            }

            // Crear elemento de imagen
            const img = document.createElement('img');
            img.src = this.imageUrl;
            img.alt = 'Imagen';

            // Agregar imagen al contenedor
            this.container.innerHTML = ''; // Limpiar el contenedor antes de agregar la imagen
            this.container.appendChild(img);
        }

        // Método para cambiar la imagen
        changeImage(newImageUrl) {
            this.imageUrl = newImageUrl;
            this.loadImage();

        }

        // Otros métodos según sea necesario
    }

    // Crear una instancia de ImageHandler y cargar la imagen en el contenedor
    const imagePostes = new ImagenPostes('https://i.gifer.com/3OlUP.gif', 'imagenPostes');
    imagePostes.loadImage(); // Cargar la imagen en el contenedor
});
