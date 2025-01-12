
let processedData = {
    protocol: {},
    country: {},
    sourcePort: {},
    destinationPort: {}
};


let originalData = [];


const START_DATE = new Date('2013-03-03');
const END_DATE = new Date('2013-08-09');


let currentChartType = 'protocol';


async function loadAndProcessData() {
    try {
        console.log('loading...');
        const response = await fetch('/node/data/cleaned_data.json');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('data number:', data.length);
        console.log('data show:', data[0]);

        
        originalData = data;

        
        processData(originalData);

    } catch (error) {
        console.error('load defalut:', error);
        throw error;
    }
}


function getTop10Data(dataObject) {
    console.log('Start processing Top10 data, raw data:', dataObject);
    
    const result = Object.entries(dataObject)
        .sort(([,a], [,b]) => b - a)  
        .slice(0, 10)  
        .reduce((obj, [key, value]) => {
            obj.labels.push(key);
            obj.values.push(value);
            return obj;
        }, { labels: [], values: [] });
    
    console.log('Top10 results:', result);
    return result;
}

function loadChart(type) {
    console.log(`load ${type} chart`);
    
    
    if (type && ['protocol', 'country', 'sourcePort', 'destinationPort'].includes(type)) {
        currentChartType = type;
    } else {
        console.error('Invalid chart types:', type);
        return;
    }
    
    const ctx = document.getElementById('honeypotChart').getContext('2d');
    if (window.chartInstance) {
        window.chartInstance.destroy();
    }

   
    if (!processedData || !processedData[type]) {
        console.error('Data not available for type:', type);
        return;
    }

    
    const chartData = getTop10Data(processedData[type]);

    
    const backgroundColors = chartData.labels.map(() => 
        `rgba(${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, 0.5)`
    );

    
    window.chartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: chartData.labels,
            datasets: [{
                label: `Top 10 ${type.charAt(0).toUpperCase() + type.slice(1)} Distribution`,
                data: chartData.values,
                backgroundColor: backgroundColors,
                borderColor: backgroundColors.map(color => color.replace('0.5', '1')),
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                x: {
                    title: {
                        display: true,
                        text: type.charAt(0).toUpperCase() + type.slice(1)
                    }
                },
                y: { 
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Number of Occurrences'
                    }
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: `Top 10 ${type.charAt(0).toUpperCase() + type.slice(1)} Distribution`
                },
                legend: {
                    display: false
                }
            }
        }
    });
    
    console.log('Chart creation complete');
}


function updateChartWithTimeRange(startDate, endDate) {
    console.log('Updated timeframe:', startDate, endDate);
    console.log('Current Chart Type:', currentChartType);
    
    try {
        
        if (!originalData || !Array.isArray(originalData)) {
            console.error('Raw data not available');
            processData([{ proto: 'NO_DATA', country: 'NO_DATA', spt: 'NO_DATA', dpt: 'NO_DATA' }]);
            loadChart(currentChartType);
            return;
        }

       
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        
        
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        
        console.log('Screening timeframe:', 
            start.toISOString(), 'to', 
            end.toISOString(),
            'Type of chart:', currentChartType
        );

        
        const filteredData = originalData.filter(item => {
            if (!item || !item.datetime) {
                return false;
            }
            
            const itemDate = new Date(item.datetime);
            return itemDate >= start && itemDate <= end;
        });

        console.log('Number of filtered data:', filteredData.length);
        
        if (filteredData.length === 0) {
            console.log('No data available for the selected time frame');
            processData([{ proto: 'NO_DATA', country: 'NO_DATA', spt: 'NO_DATA', dpt: 'NO_DATA' }]);
        } else {
            processData(filteredData);
        }

        
        console.log('Update charts, use types:', currentChartType);
        loadChart(currentChartType);

    } catch (error) {
        console.error('Error updating chart:', error);
        processData([{ proto: 'ERROR', country: 'ERROR', spt: 'ERROR', dpt: 'ERROR' }]);
        loadChart(currentChartType);
    }
}

function initializeTimeSlider() {
    $("#timeSlider").slider({
        range: true,
        min: START_DATE.getTime(),
        max: END_DATE.getTime(),
        values: [START_DATE.getTime(), END_DATE.getTime()],
        step: 86400000, 
        slide: function(event, ui) {
            const startDate = new Date(ui.values[0]);
            const endDate = new Date(ui.values[1]);
            
            
            $("#timeRange").text(
                `Selected Time Range: ${formatDate(startDate)} - ${formatDate(endDate)}`
            );
        },
        stop: function(event, ui) {
            const startDate = new Date(ui.values[0]);
            const endDate = new Date(ui.values[1]);
            updateChartWithTimeRange(startDate, endDate);
        }
    });

   
    $("#timeRange").text(
        `Selected Time Range: ${formatDate(START_DATE)} - ${formatDate(END_DATE)}`
    );
}

function processData(data) {
    if (!data || !Array.isArray(data)) {
        console.error('Invalid data entry');
        data = [{
            proto: 'INVALID_DATA',
            country: 'INVALID_DATA',
            spt: 'INVALID_DATA',
            dpt: 'INVALID_DATA'
        }];
    }

    console.log('Processing data, volume of data:', data.length);
    

    processedData = {
        protocol: {},
        country: {},
        sourcePort: {},
        destinationPort: {}
    };


    data.forEach(item => {
        if (!item) return;
        

        const proto = (item.proto || 'Unknown').toString();
        const country = (item.country || 'Unknown').toString();
        const spt = (item.spt || 'Unknown').toString();
        const dpt = (item.dpt || 'Unknown').toString();
        
        processedData.protocol[proto] = (processedData.protocol[proto] || 0) + 1;
        processedData.country[country] = (processedData.country[country] || 0) + 1;
        processedData.sourcePort[spt] = (processedData.sourcePort[spt] || 0) + 1;
        processedData.destinationPort[dpt] = (processedData.destinationPort[dpt] || 0) + 1;
    });

 
    if (Object.keys(processedData.protocol).length === 0) processedData.protocol['NO_DATA'] = 1;
    if (Object.keys(processedData.country).length === 0) processedData.country['NO_DATA'] = 1;
    if (Object.keys(processedData.sourcePort).length === 0) processedData.sourcePort['NO_DATA'] = 1;
    if (Object.keys(processedData.destinationPort).length === 0) processedData.destinationPort['NO_DATA'] = 1;

    console.log('Data processing completed, statistical results:', processedData);
}


function formatDate(date) {
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
}


function initializeButtons() {
    document.querySelectorAll('.controls button').forEach(button => {
        button.addEventListener('click', function() {
  
            const buttonText = this.textContent.toLowerCase();
            let type;
            
        
            if (buttonText.includes('protocol')) {
                type = 'protocol';
            } else if (buttonText.includes('country')) {
                type = 'country';
            } else if (buttonText.includes('source')) {
                type = 'sourcePort';
            } else if (buttonText.includes('destination')) {
                type = 'destinationPort';
            }
            
      
            currentChartType = type;
            console.log('Switch to chart type:', currentChartType);
            
       
            loadChart(type);
        });
    });
}


$(document).ready(function() {

    currentChartType = 'protocol';
    

    initializeButtons();
    

    loadAndProcessData().then(() => {
        loadChart(currentChartType);
    }).catch(error => {
        console.error('Failed to load data:', error);
    });
});
  
