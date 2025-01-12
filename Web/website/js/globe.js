import ThreeGlobe from 'https://esm.sh/three-globe?external=three';
import * as THREE from 'https://esm.sh/three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js?external=three';

const ARCS_DATA = [];
let allData = [];

let lastDateRangeBtnClicked = null; // Store the last clicked date button


function parseCustomDate(dateString) {
    const [datePart, timePart] = dateString.split(' '); // Split date and time
    const [month, day, year] = datePart.split('/').map(Number); // Split month, day, year
    const [hour, minute] = timePart.split(':').map(Number); // Split hour, minute
    const fullYear = year < 100 ? 2000 + year : year; // Convert 2-digit year to 4-digit year
    return new Date(fullYear, month - 1, day, hour, minute); // Return Date object
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
            datetime: item.datetime // Keep original datetime field
        });
    });
    console.log('all data:', allData);  // Output all data

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

        // Button click events 
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
            const counts = { blue: 0, green: 0, red: 0 };  // Store counts for different colors
        
            allData.forEach(item => {
                const arcDate = parseCustomDate(item.datetime); // Convert to Date object
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

        // Calculate country counts within specified time range 
        const countCountriesInRange = (startDate, endDate) => {
            const countryCounts = {};  // Store counts for each country

            allData.forEach(item => {
                const arcDate = parseCustomDate(item.datetime); // Convert to Date object
                if (arcDate >= startDate && arcDate <= endDate) {
                    const country = item.country; // Get country name
                    if (country) {
                        if (!countryCounts[country]) {
                            countryCounts[country] = 1;
                        } else {
                            countryCounts[country]++;
                        }
                    }
                }
            });

            // Convert countries and counts to array and sort by count
            const sortedCountries = Object.entries(countryCounts)
                .sort((a, b) => b[1] - a[1]) // Sort by count in descending order
                .slice(0, 3);  // Get top 3

            return sortedCountries;
        };

        // Update display of top three most frequent countries
        const updateTopCountriesDisplay = (startDate, endDate) => {
            const topCountries = countCountriesInRange(startDate, endDate); // Get top 3 countries
            
            // Update first country and count
            const outputContainer1 = document.getElementById('ctry1lab');
            outputContainer1.innerHTML = topCountries[0] ? topCountries[0][0] : 'No data';
        
            const outputContainer4 = document.getElementById('ctry1ct');
            outputContainer4.innerHTML = topCountries[0] ? topCountries[0][1] : 0; // Display first country count
        
            // Update second country and count
            const outputContainer2 = document.getElementById('ctry2lab');
            outputContainer2.innerHTML = topCountries[1] ? topCountries[1][0] : 'No data';
        
            const outputContainer5 = document.getElementById('ctry2ct');
            outputContainer5.innerHTML = topCountries[1] ? topCountries[1][1] : 0; // Display second country count
        
            // Update third country and count
            const outputContainer3 = document.getElementById('ctry3lab');
            outputContainer3.innerHTML = topCountries[2] ? topCountries[2][0] : 'No data'; // Display third country 
        
        
            const outputContainer6 = document.getElementById('ctry3ct');
            outputContainer6.innerHTML = topCountries[2] ? topCountries[2][1] : 0; // Display third country count
        
        };

        // Calculate host counts within specified time range 
        const countHostsInRange = (startDate, endDate) => {
            const hostCounts = {};  // Store counts for each host

            allData.forEach(item => {
                const arcDate = parseCustomDate(item.datetime); // Convert to Date object
                if (arcDate >= startDate && arcDate <= endDate) {
                    const host = item.host; // Get host name
                    if (host) {
                        if (!hostCounts[host]) {
                            hostCounts[host] = 1;
                        } else {
                            hostCounts[host]++;
                        }
                    }
                }
            });

            // Convert hosts and counts to array and sort by count
            const sortedHosts = Object.entries(hostCounts)
                .sort((a, b) => b[1] - a[1]) // Sort by count in descending order
                .slice(0, 3);  // Get top 3

            return sortedHosts;
        };

        // Update display of top three most frequent hosts
        const updateTopHostsDisplay = (startDate, endDate) => {
            const topCountries = countHostsInRange(startDate, endDate); // Get top 3 hosts
            
            // Update first host and count
            const outputContainer1 = document.getElementById('host1lab');
            outputContainer1.innerHTML = topCountries[0] ? topCountries[0][0] : 'No data';
        
            const outputContainer4 = document.getElementById('host1ct');
            outputContainer4.innerHTML = topCountries[0] ? topCountries[0][1] : 0; // Display first host count
        
            // Update second host and count
            const outputContainer2 = document.getElementById('host2lab');
            outputContainer2.innerHTML = topCountries[1] ? topCountries[1][0] : 'No data';
        
            const outputContainer5 = document.getElementById('host2ct');
            outputContainer5.innerHTML = topCountries[1] ? topCountries[1][1] : 0; // Display second host count
        
            // Update third host and count
            const outputContainer3 = document.getElementById('host3lab');
            outputContainer3.innerHTML = topCountries[2] ? topCountries[2][0] : 'No data';
        
            const outputContainer6 = document.getElementById('host3ct');
            outputContainer6.innerHTML = topCountries[2] ? topCountries[2][1] : 0; // Display third host count
        };
        
        

        const handleDateRangeBtnClick = (buttonId, startDate, endDate) => {
            // Check if the same button was clicked
            if (lastDateRangeBtnClicked === buttonId) return;

            lastDateRangeBtnClicked = buttonId;

            const filteredArcsData = ARCS_DATA.filter(arc => {
                const arcDate = parseCustomDate(arc.datetime); 
                return arcDate >= startDate && arcDate <= endDate;
            });

            Globe.arcsData(filteredArcsData);
            console.log(filteredArcsData);
        };
        

    
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

            // Show all flight lines
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