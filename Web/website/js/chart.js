// 存储处理后的数据
let processedData = {
    protocol: {},
    country: {},
    sourcePort: {},
    destinationPort: {}
};

// 添加全局变量来存储原始数据
let originalData = [];

// 添加时间范围变量
const START_DATE = new Date('2013-03-03');
const END_DATE = new Date('2013-08-09');

// 添加一个全局变量来跟踪当前选中的图表类型
let currentChartType = 'protocol';

// 加载并处理 JSON 数据
async function loadAndProcessData() {
    try {
        console.log('开始加载数据...');
        const response = await fetch('/node/data/cleaned_data.json');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('数据数量:', data.length);
        console.log('原始数据示例:', data[0]);

        // 直接使用原始数据，不需要额外的时间戳处理
        originalData = data;

        // 初始处理所有数据
        processData(originalData);

    } catch (error) {
        console.error('数据加载失败:', error);
        throw error;
    }
}

// 获取排序后的前10个数据
function getTop10Data(dataObject) {
    console.log('开始处理Top10数据，原始数据:', dataObject);
    
    const result = Object.entries(dataObject)
        .sort(([,a], [,b]) => b - a)  // 按数值降序排序
        .slice(0, 10)  // 获取前10个
        .reduce((obj, [key, value]) => {
            obj.labels.push(key);
            obj.values.push(value);
            return obj;
        }, { labels: [], values: [] });
    
    console.log('Top10处理结果:', result);
    return result;
}

function loadChart(type) {
    console.log(`加载${type}类型的图表`);
    
    // 验证并更新当前图表类型
    if (type && ['protocol', 'country', 'sourcePort', 'destinationPort'].includes(type)) {
        currentChartType = type;
    } else {
        console.error('无效的图表类型:', type);
        return;
    }
    
    const ctx = document.getElementById('honeypotChart').getContext('2d');
    if (window.chartInstance) {
        window.chartInstance.destroy();
    }

    // 确保数据存在
    if (!processedData || !processedData[type]) {
        console.error('数据不可用于类型:', type);
        return;
    }

    // 获取对应类型的前10个数据
    const chartData = getTop10Data(processedData[type]);

    // 设置随机颜色
    const backgroundColors = chartData.labels.map(() => 
        `rgba(${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, 0.5)`
    );

    // 创建新图表
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
    
    console.log('图表创建完成');
}

// 添加基于时间范围更新图表的函数
function updateChartWithTimeRange(startDate, endDate) {
    console.log('更新时间范围:', startDate, endDate);
    console.log('当前图表类型:', currentChartType);
    
    try {
        // 确保 originalData 存在
        if (!originalData || !Array.isArray(originalData)) {
            console.error('原始数据不可用');
            processData([{ proto: 'NO_DATA', country: 'NO_DATA', spt: 'NO_DATA', dpt: 'NO_DATA' }]);
            loadChart(currentChartType);
            return;
        }

        // 将开始日期设置为当天的开始（00:00:00）
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        
        // 将结束日期设置为当天的结束（23:59:59）
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        
        console.log('筛选时间范围:', 
            start.toISOString(), '至', 
            end.toISOString(),
            '图表类型:', currentChartType
        );

        // 过滤在时间范围内的数据
        const filteredData = originalData.filter(item => {
            if (!item || !item.datetime) {
                return false;
            }
            
            const itemDate = new Date(item.datetime);
            return itemDate >= start && itemDate <= end;
        });

        console.log('筛选后的数据数量:', filteredData.length);
        
        if (filteredData.length === 0) {
            console.log('选定时间范围内没有数据');
            processData([{ proto: 'NO_DATA', country: 'NO_DATA', spt: 'NO_DATA', dpt: 'NO_DATA' }]);
        } else {
            processData(filteredData);
        }

        // 确保使用正确的图表类型更新图表
        console.log('更新图表，使用类型:', currentChartType);
        loadChart(currentChartType);

    } catch (error) {
        console.error('更新图表时出错:', error);
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
        step: 86400000, // 一天的毫秒数
        slide: function(event, ui) {
            const startDate = new Date(ui.values[0]);
            const endDate = new Date(ui.values[1]);
            
            // 更新时间范围显示（只显示日期部分）
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

    // 设置初始时间范围显示
    $("#timeRange").text(
        `Selected Time Range: ${formatDate(START_DATE)} - ${formatDate(END_DATE)}`
    );
}

function processData(data) {
    if (!data || !Array.isArray(data)) {
        console.error('无效的数据输入');
        data = [{
            proto: 'INVALID_DATA',
            country: 'INVALID_DATA',
            spt: 'INVALID_DATA',
            dpt: 'INVALID_DATA'
        }];
    }

    console.log('处理数据，数据量:', data.length);
    
    // 重置处理后的数据对象
    processedData = {
        protocol: {},
        country: {},
        sourcePort: {},
        destinationPort: {}
    };

    // 处理每条数据
    data.forEach(item => {
        if (!item) return;
        
        // 使用空值检查和默认值
        const proto = (item.proto || 'Unknown').toString();
        const country = (item.country || 'Unknown').toString();
        const spt = (item.spt || 'Unknown').toString();
        const dpt = (item.dpt || 'Unknown').toString();
        
        processedData.protocol[proto] = (processedData.protocol[proto] || 0) + 1;
        processedData.country[country] = (processedData.country[country] || 0) + 1;
        processedData.sourcePort[spt] = (processedData.sourcePort[spt] || 0) + 1;
        processedData.destinationPort[dpt] = (processedData.destinationPort[dpt] || 0) + 1;
    });

    // 确保每个类别至少有一个数据
    if (Object.keys(processedData.protocol).length === 0) processedData.protocol['NO_DATA'] = 1;
    if (Object.keys(processedData.country).length === 0) processedData.country['NO_DATA'] = 1;
    if (Object.keys(processedData.sourcePort).length === 0) processedData.sourcePort['NO_DATA'] = 1;
    if (Object.keys(processedData.destinationPort).length === 0) processedData.destinationPort['NO_DATA'] = 1;

    console.log('数据处理完成，统计结果:', processedData);
}

// 添加日期格式化辅助函数
function formatDate(date) {
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
}

// 修改按钮点击事件处理函数（在 HTML 中）
function initializeButtons() {
    document.querySelectorAll('.controls button').forEach(button => {
        button.addEventListener('click', function() {
            // 获取按钮文本并转换为对应的类型
            const buttonText = this.textContent.toLowerCase();
            let type;
            
            // 根据按钮文本设置正确的图表类型
            if (buttonText.includes('protocol')) {
                type = 'protocol';
            } else if (buttonText.includes('country')) {
                type = 'country';
            } else if (buttonText.includes('source')) {
                type = 'sourcePort';
            } else if (buttonText.includes('destination')) {
                type = 'destinationPort';
            }
            
            // 更新当前图表类型
            currentChartType = type;
            console.log('切换到图表类型:', currentChartType);
            
            // 加载新的图表
            loadChart(type);
        });
    });
}

// 在页面加载完成后初始化
$(document).ready(function() {
    // 设置默认图表类型
    currentChartType = 'protocol';
    
    // 初始化按钮
    initializeButtons();
    
    // 加载初始数据
    loadAndProcessData().then(() => {
        loadChart(currentChartType);
    }).catch(error => {
        console.error('Failed to load data:', error);
    });
});
  