// Store processed data
let processedData = {
    protocol: {},
    country: {},
    sourcePort: {},
    destinationPort: {}
};

// Add global variable to store original data
let originalData = [];

// Add time range variable
const START_DATE = new Date('2013-03-03');
const END_DATE = new Date('2013-08-09');

// Add a global variable to track current chart type
let currentChartType = 'protocol';

// Load and process JSON data
async function loadAndProcessData() {
    try {
        console.log('Starting to load data...');
        const response = await fetch('../node/data/cleaned_data.json');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Data count:', data.length);
        console.log('Raw data sample:', data[0]);

        // Directly use original data, no additional timestamp processing needed
        originalData = data;

        // Initial processing of all data
        processData(originalData);

    } catch (error) {
        console.error('Failed to load data:', error);
        throw error;
    }
}

// Get sorted top 10 data
function getTop10Data(dataObject) {
    console.log('Starting to process Top10 data, raw data:', dataObject);
    
    const result = Object.entries(dataObject)
        .sort(([,a], [,b]) => b - a)  // Sort by value in descending order
        .slice(0, 10)  // Get top 10
        .reduce((obj, [key, value]) => {
            obj.labels.push(key);
            obj.values.push(value);
            return obj;
        }, { labels: [], values: [] });
    
    console.log('Top10 processing result:', result);
    return result;
}

function loadChart(type) {
    console.log(`Loading ${type} type chart`);
    
    // Validate and update current chart type
    if (type && ['protocol', 'country', 'sourcePort', 'destinationPort'].includes(type)) {
        currentChartType = type;
    } else {
        console.error('Invalid chart type:', type);
        return;
    }
    
    const ctx = document.getElementById('honeypotChart').getContext('2d');
    if (window.chartInstance) {
        window.chartInstance.destroy();
    }

    // Ensure data exists
    if (!processedData || !processedData[type]) {
        console.error('Data not available for type:', type);
        return;
    }

    // Get top 10 data for the specified type
    const chartData = getTop10Data(processedData[type]);

    // Set random colors
    const backgroundColors = chartData.labels.map(() => 
        `rgba(${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, 0.5)`
    );

    // Create new chart
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
    
    console.log('Chart creation completed');
}

// Add function to update chart based on time range
function updateChartWithTimeRange(startDate, endDate) {
    console.log('Updating time range:', startDate, endDate);
    console.log('Current chart type:', currentChartType);
    
    try {
        // Ensure originalData exists
        if (!originalData || !Array.isArray(originalData)) {
            console.error('Original data not available');
            processData([{ proto: 'NO_DATA', country: 'NO_DATA', spt: 'NO_DATA', dpt: 'NO_DATA' }]);
            loadChart(currentChartType);
            return;
        }

        // Set start date to the start of the day (00:00:00)
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        
        // Set end date to the end of the day (23:59:59)
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        
        console.log('Filtering time range:', 
            start.toISOString(), 'to', 
            end.toISOString(),
            'Chart type:', currentChartType
        );

        // Filter data within the time range
        const filteredData = originalData.filter(item => {
            if (!item || !item.datetime) {
                return false;
            }
            
            const itemDate = new Date(item.datetime);
            return itemDate >= start && itemDate <= end;
        });

        console.log('Filtered data count:', filteredData.length);
        
        if (filteredData.length === 0) {
            console.log('No data in selected time range');
            processData([{ proto: 'NO_DATA', country: 'NO_DATA', spt: 'NO_DATA', dpt: 'NO_DATA' }]);
        } else {
            processData(filteredData);
        }

        // Ensure chart updates with correct type
        console.log('Updating chart with type:', currentChartType);
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
        step: 86400000, // Milliseconds in a day
        slide: function(event, ui) {
            const startDate = new Date(ui.values[0]);
            const endDate = new Date(ui.values[1]);
            
            // Update time range display (only show date)
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

    // Set initial time range display
    $("#timeRange").text(
        `Selected Time Range: ${formatDate(START_DATE)} - ${formatDate(END_DATE)}`
    );
}

function processData(data) {
    if (!data || !Array.isArray(data)) {
        console.error('Invalid data input');
        data = [{
            proto: 'INVALID_DATA',
            country: 'INVALID_DATA',
            spt: 'INVALID_DATA',
            dpt: 'INVALID_DATA'
        }];
    }

    console.log('Processing data, count:', data.length);
    
    // Reset processed data object
    processedData = {
        protocol: {},
        country: {},
        sourcePort: {},
        destinationPort: {}
    };

    // Process each data item
    data.forEach(item => {
        if (!item) return;
        
        // Use empty value check and default value
        const proto = (item.proto || 'Unknown').toString();
        const country = (item.country || 'Unknown').toString();
        const spt = (item.spt || 'Unknown').toString();
        const dpt = (item.dpt || 'Unknown').toString();
        
        processedData.protocol[proto] = (processedData.protocol[proto] || 0) + 1;
        processedData.country[country] = (processedData.country[country] || 0) + 1;
        processedData.sourcePort[spt] = (processedData.sourcePort[spt] || 0) + 1;
        processedData.destinationPort[dpt] = (processedData.destinationPort[dpt] || 0) + 1;
    });

    // Ensure each category has at least one data
    if (Object.keys(processedData.protocol).length === 0) processedData.protocol['NO_DATA'] = 1;
    if (Object.keys(processedData.country).length === 0) processedData.country['NO_DATA'] = 1;
    if (Object.keys(processedData.sourcePort).length === 0) processedData.sourcePort['NO_DATA'] = 1;
    if (Object.keys(processedData.destinationPort).length === 0) processedData.destinationPort['NO_DATA'] = 1;

    console.log('Data processing completed, statistics:', processedData);
}

// Add date formatting helper function
function formatDate(date) {
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
}

// Modify button click event handler (in HTML)
function initializeButtons() {
    document.querySelectorAll('.controls button').forEach(button => {
        button.addEventListener('click', function() {
            // Get button text and convert to corresponding type
            const buttonText = this.textContent.toLowerCase();
            let type;
            
            // Set correct chart type based on button text
            if (buttonText.includes('protocol')) {
                type = 'protocol';
            } else if (buttonText.includes('country')) {
                type = 'country';
            } else if (buttonText.includes('source')) {
                type = 'sourcePort';
            } else if (buttonText.includes('destination')) {
                type = 'destinationPort';
            }
            
            // Update current chart type
            currentChartType = type;
            console.log('Switching to chart type:', currentChartType);
            
            // Load new chart
            loadChart(type);
        });
    });
}

// Initialize on page load
$(document).ready(function() {
    // Set default chart type
    currentChartType = 'protocol';
    
    // Initialize buttons
    initializeButtons();
    
    // Load initial data
    loadAndProcessData().then(() => {
        loadChart(currentChartType);
    }).catch(error => {
        console.error('Failed to load data:', error);
    });
});
  