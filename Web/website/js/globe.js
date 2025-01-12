import ThreeGlobe from 'https://esm.sh/three-globe?external=three';
import * as THREE from 'https://esm.sh/three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js?external=three';

const ARCS_DATA = [];
let allData = [];

let lastDateRangeBtnClicked = null; // 用来存储上次点击的日期按钮


function parseCustomDate(dateString) {
    const [datePart, timePart] = dateString.split(' '); // 分离日期和时间
    const [month, day, year] = datePart.split('/').map(Number); // 分离月、日、年
    const [hour, minute] = timePart.split(':').map(Number); // 分离时、分
    const fullYear = year < 100 ? 2000 + year : year; // 将两位年份转换为四位年份
    return new Date(fullYear, month - 1, day, hour, minute); // 返回 Date 对象
}


// Fetch output.json data and process it
fetch('./outputreal.json')
.then(response => response.json())
.then(jsonData => {
    allData = jsonData;
    const randomData = [];
    while (randomData.length < 500) {
        const randomIndex = Math.floor(Math.random() * jsonData.length);
        if (!randomData.includes(jsonData[randomIndex])) {
            randomData.push(jsonData[randomIndex]);
        }
    }

    // Format and add to ARCS_DATA
    randomData.forEach(item => {
        ARCS_DATA.push({
            startLat: item.latitude,
            startLng: item.longitude,
            endLat: item.hostlat,
            endLng: item.hostlong,
            color: item.color,
            datetime: item.datetime // 保留原始的 datetime 字段
        });
    });
    console.log('all data:', allData);  // 输出所有数据

    console.log(ARCS_DATA);  // Output the processed data

    // Now initialize ThreeGlobe after ARCS_DATA is populated
    fetch('./ne_110m_admin_0_countries.geojson')
    .then(res => res.json())
    .then(countries => {
        const Globe = new ThreeGlobe()
            .globeImageUrl('//unpkg.com/three-globe/example/img/earth-dark.jpg')
            .hexPolygonsData(countries.features)
            .hexPolygonResolution(3)
            .hexPolygonMargin(0.4)
            .hexPolygonUseDots(true)
            .hexPolygonColor(() => {
                const grays = ['#ffffff', '#e0e0e0', '#cccccc', '#b3b3b3', '#999999'];
                return grays[Math.floor(Math.random() * grays.length)];
            })
            .showAtmosphere(true)
            .atmosphereColor('white')
            .atmosphereAltitude(0.2)
            .arcsData(ARCS_DATA)
            .arcColor('color')
            .arcDashLength(0.7)
            .arcDashGap(4)
            //.arcStroke(1)
            .arcDashInitialGap(() => Math.random() * 5)
            .arcDashAnimateTime(550);

        // Set up the renderer
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setClearColor('#000000', 1);
        document.getElementById('globeViz').appendChild(renderer.domElement);

        // Set up the scene and camera
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera();
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        camera.position.z = 400;

        // Set up OrbitControls
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.minDistance = 200;
        controls.maxDistance = 600;
        controls.rotateSpeed = 1;
        controls.zoomSpeed = 0.8;
        controls.minPolarAngle = Math.PI / 3.5;
        controls.maxPolarAngle = Math.PI - Math.PI / 3;
        controls.enablePan = false;

        // Add background stars
        const starsGeometry = new THREE.BufferGeometry();
        const starCount = 20000;
        const minDistance = 1500;
        const maxDistance = 3000;
        const positions = new Float32Array(starCount * 3);
        for (let i = 0; i < starCount; i++) {
            let x, y, z, distance;
            do {
                x = (Math.random() - 0.5) * 2 * maxDistance;
                y = (Math.random() - 0.5) * 2 * maxDistance;
                z = (Math.random() - 0.5) * 2 * maxDistance;
                distance = Math.sqrt(x * x + y * y + z * z);
            } while (distance < minDistance);

            positions[i * 3] = x;
            positions[i * 3 + 1] = y;
            positions[i * 3 + 2] = z;
        }

        starsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const starsMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.7 });
        const starField = new THREE.Points(starsGeometry, starsMaterial);
        scene.add(starField);

        scene.add(Globe);
        scene.add(new THREE.AmbientLight(0xcccccc, Math.PI));
        scene.add(new THREE.DirectionalLight(0xffffff, 0.6 * Math.PI));

        // Handle resizing
        window.addEventListener('resize', () => {
            renderer.setSize(window.innerWidth, window.innerHeight);
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
        });

        // User inactivity check
        let lastMoveTime = Date.now();
        let isMouseActive = false;
        let isGlobeRotating = true;
        let rotationSpeed = 0.0003;

        window.addEventListener('mousemove', () => {
            lastMoveTime = Date.now();
            if (!isMouseActive) {
                isMouseActive = true;
                isGlobeRotating = false;
            }
        });

        window.addEventListener('mousedown', () => {
            isMouseActive = true;
            isGlobeRotating = false;
        });

        // 按钮点击事件
        document.getElementById('udpBtn').addEventListener('click', () => {
            
            const filteredArcsData = ARCS_DATA.filter(arc => arc.color === 'blue');

            
            Globe.arcsData(filteredArcsData);
        });

        document.getElementById('tcpBtn').addEventListener('click', () => {
            
            const filteredArcsData = ARCS_DATA.filter(arc => arc.color === 'green');

            
            Globe.arcsData(filteredArcsData);
        });

        document.getElementById('icmpBtn').addEventListener('click', () => {
            
            const filteredArcsData = ARCS_DATA.filter(arc => arc.color === 'red');

            
            Globe.arcsData(filteredArcsData);
        });

        document.getElementById('allBtn').addEventListener('click', () => {
            
            Globe.arcsData(ARCS_DATA);
 
        });

        const countColorsInRange = (startDate, endDate) => {
            const counts = { blue: 0, green: 0, red: 0 };  // 存储不同颜色的计数
        
            allData.forEach(item => {
                const arcDate = parseCustomDate(item.datetime); // 转换为 Date 对象
                if (arcDate >= startDate && arcDate <= endDate) {
                    if (item.color === 'blue') counts.blue++;
                    else if (item.color === 'green') counts.green++;
                    else if (item.color === 'red') counts.red++;
                }
            });
        
            return counts;
        };
        
        const updateColorCountDisplay = (buttonId, startDate, endDate) => {
            const counts = countColorsInRange(startDate, endDate);
        
            // 找到对应的输出容器并更新
            const outputContainer = document.getElementById('udpCount');
            outputContainer.innerHTML = `
                ${counts.blue}<br>
            `;
            const outputContainer2 = document.getElementById('tcpCount');
            outputContainer2.innerHTML = `
                ${counts.green}<br>
            `;
            const outputContainer3 = document.getElementById('icmpCount');
            outputContainer3.innerHTML = `
                ${counts.red}<br>
            `;
            const outputContainer4 = document.getElementById('allCount');
            const allcounts = counts.green + counts.blue + counts.red;
            outputContainer4.innerHTML = `
                ${allcounts}<br>
            `;
        };

        // 计算指定时间范围内的国家计数
        const countCountriesInRange = (startDate, endDate) => {
            const countryCounts = {};  // 存储每个国家的计数

            allData.forEach(item => {
                const arcDate = parseCustomDate(item.datetime); // 转换为 Date 对象
                if (arcDate >= startDate && arcDate <= endDate) {
                    const country = item.country; // 获取国家名称
                    if (country) {
                        if (!countryCounts[country]) {
                            countryCounts[country] = 1;
                        } else {
                            countryCounts[country]++;
                        }
                    }
                }
            });

            // 将国家和计数转换为数组并按计数排序
            const sortedCountries = Object.entries(countryCounts)
                .sort((a, b) => b[1] - a[1]) // 按计数从高到低排序
                .slice(0, 3);  // 获取前三名

            return sortedCountries;
        };

        // 更新显示最频繁出现的前三个国家
        const updateTopCountriesDisplay = (startDate, endDate) => {
            const topCountries = countCountriesInRange(startDate, endDate); // 获取排名前3的国家
        
            // 更新第一个国家及其计数
            const outputContainer1 = document.getElementById('ctry1lab');
            outputContainer1.innerHTML = topCountries[0] ? topCountries[0][0] : 'No data'; // 显示第一个国家
        
            const outputContainer4 = document.getElementById('ctry1ct');
            outputContainer4.innerHTML = topCountries[0] ? topCountries[0][1] : 0; // 显示第一个国家的计数
        
            // 更新第二个国家及其计数
            const outputContainer2 = document.getElementById('ctry2lab');
            outputContainer2.innerHTML = topCountries[1] ? topCountries[1][0] : 'No data'; // 显示第二个国家
        
            const outputContainer5 = document.getElementById('ctry2ct');
            outputContainer5.innerHTML = topCountries[1] ? topCountries[1][1] : 0; // 显示第二个国家的计数
        
            // 更新第三个国家及其计数
            const outputContainer3 = document.getElementById('ctry3lab');
            outputContainer3.innerHTML = topCountries[2] ? topCountries[2][0] : 'No data'; // 显示第三个国家
        
            const outputContainer6 = document.getElementById('ctry3ct');
            outputContainer6.innerHTML = topCountries[2] ? topCountries[2][1] : 0; // 显示第三个国家的计数
        };

        // 计算指定时间范围内的国家计数
        const countHostsInRange = (startDate, endDate) => {
            const hostCounts = {};  // 存储每个国家的计数

            allData.forEach(item => {
                const arcDate = parseCustomDate(item.datetime); // 转换为 Date 对象
                if (arcDate >= startDate && arcDate <= endDate) {
                    const host = item.host; // 获取国家名称
                    if (host) {
                        if (!hostCounts[host]) {
                            hostCounts[host] = 1;
                        } else {
                            hostCounts[host]++;
                        }
                    }
                }
            });

            // 将国家和计数转换为数组并按计数排序
            const sortedHosts = Object.entries(hostCounts)
                .sort((a, b) => b[1] - a[1]) // 按计数从高到低排序
                .slice(0, 3);  // 获取前三名

            return sortedHosts;
        };

        // 更新显示最频繁出现的前三个国家
        const updateTopHostsDisplay = (startDate, endDate) => {
            const topCountries = countHostsInRange(startDate, endDate); // 获取排名前3的国家
        
            // 更新第一个国家及其计数
            const outputContainer1 = document.getElementById('host1lab');
            outputContainer1.innerHTML = topCountries[0] ? topCountries[0][0] : 'No data'; // 显示第一个国家
        
            const outputContainer4 = document.getElementById('host1ct');
            outputContainer4.innerHTML = topCountries[0] ? topCountries[0][1] : 0; // 显示第一个国家的计数
        
            // 更新第二个国家及其计数
            const outputContainer2 = document.getElementById('host2lab');
            outputContainer2.innerHTML = topCountries[1] ? topCountries[1][0] : 'No data'; // 显示第二个国家
        
            const outputContainer5 = document.getElementById('host2ct');
            outputContainer5.innerHTML = topCountries[1] ? topCountries[1][1] : 0; // 显示第二个国家的计数
        
            // 更新第三个国家及其计数
            const outputContainer3 = document.getElementById('host3lab');
            outputContainer3.innerHTML = topCountries[2] ? topCountries[2][0] : 'No data'; // 显示第三个国家
        
            const outputContainer6 = document.getElementById('host3ct');
            outputContainer6.innerHTML = topCountries[2] ? topCountries[2][1] : 0; // 显示第三个国家的计数
        };
        
        

        const handleDateRangeBtnClick = (buttonId, startDate, endDate) => {
            // 检查是否点击了同一个按钮
            if (lastDateRangeBtnClicked === buttonId) return;

            lastDateRangeBtnClicked = buttonId;

            const filteredArcsData = ARCS_DATA.filter(arc => {
                const arcDate = parseCustomDate(arc.datetime); 
                return arcDate >= startDate && arcDate <= endDate;
            });

            Globe.arcsData(filteredArcsData);
            console.log(filteredArcsData);
        };
        

        // 日期范围按钮点击事件处理
        document.getElementById('dateRangeBtn1').addEventListener('click', () => {
            const startDate = new Date('2013-03-01T00:00:00');
            const endDate = new Date('2013-03-31T23:59:59');
            handleDateRangeBtnClick('dateRangeBtn1', startDate, endDate);
            updateColorCountDisplay('dateRangeBtn1', startDate, endDate);
            updateTopCountriesDisplay(startDate, endDate);
            updateTopHostsDisplay(startDate, endDate);
        });

        document.getElementById('dateRangeBtn2').addEventListener('click', () => {
            const startDate = new Date('2013-04-01T00:00:00');
            const endDate = new Date('2013-04-30T23:59:59');
            handleDateRangeBtnClick('dateRangeBtn2', startDate, endDate);
            updateColorCountDisplay('dateRangeBtn2', startDate, endDate);
            updateTopCountriesDisplay(startDate, endDate);
            updateTopHostsDisplay(startDate, endDate);
        });

        document.getElementById('dateRangeBtn3').addEventListener('click', () => {
            const startDate = new Date('2013-05-01T00:00:00');
            const endDate = new Date('2013-05-31T23:59:59');
            handleDateRangeBtnClick('dateRangeBtn3', startDate, endDate);
            updateColorCountDisplay('dateRangeBtn3', startDate, endDate);
            updateTopCountriesDisplay(startDate, endDate);
            updateTopHostsDisplay(startDate, endDate);
        });

        document.getElementById('dateRangeBtn4').addEventListener('click', () => {
            const startDate = new Date('2013-06-01T00:00:00');
            const endDate = new Date('2013-06-30T23:59:59');
            handleDateRangeBtnClick('dateRangeBtn4', startDate, endDate);
            updateColorCountDisplay('dateRangeBtn4', startDate, endDate);
            updateTopCountriesDisplay(startDate, endDate);
            updateTopHostsDisplay(startDate, endDate);
        });

        document.getElementById('dateRangeBtn5').addEventListener('click', () => {
            const startDate = new Date('2013-07-01T00:00:00');
            const endDate = new Date('2013-07-31T23:59:59');
            handleDateRangeBtnClick('dateRangeBtn5', startDate, endDate);
            updateColorCountDisplay('dateRangeBtn5', startDate, endDate);
            updateTopCountriesDisplay(startDate, endDate);
            updateTopHostsDisplay(startDate, endDate);
        });

        document.getElementById('dateRangeBtn6').addEventListener('click', () => {
            const startDate = new Date('2013-08-01T00:00:00');
            const endDate = new Date('2013-08-31T23:59:59');
            handleDateRangeBtnClick('dateRangeBtn6', startDate, endDate);
            updateColorCountDisplay('dateRangeBtn6', startDate, endDate);
            updateTopCountriesDisplay(startDate, endDate);
            updateTopHostsDisplay(startDate, endDate);
        });

        document.getElementById('dateRangeBtn7').addEventListener('click', () => {
            const startDate = new Date('2013-01-01T00:00:00');
            const endDate = new Date('2013-12-31T23:59:59');

            // 显示所有飞线
            if (lastDateRangeBtnClicked === 'dateRangeBtn7') return;
            lastDateRangeBtnClicked = 'dateRangeBtn7';
            Globe.arcsData(ARCS_DATA);
            console.log(ARCS_DATA);

            updateColorCountDisplay('dateRangeBtn6', startDate, endDate);
            updateTopCountriesDisplay(startDate, endDate);
            updateTopHostsDisplay(startDate, endDate);
        });
        

        function checkInactivity() {
            if (isMouseActive && Date.now() - lastMoveTime > 500) {
                isMouseActive = false;
                isGlobeRotating = true;
            }
        }

        (function animate() {
            checkInactivity();
            if (isGlobeRotating) {
                Globe.rotation.y -= rotationSpeed;
                starField.rotation.y -= rotationSpeed;
            }

            controls.update();
            renderer.render(scene, camera);
            requestAnimationFrame(animate);
        })();
    });
})
.catch(error => console.error('Error loading JSON:', error));