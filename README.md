# CASA0017: Cycure: Honeypot Attack Visualization and Cybersecurity Trends Analysis

## Project Overview
Cycure is an interactive platform designed to visualize honeypot attack data and analyze cybersecurity trends. Using dynamic visualization tools and interactive maps, users can intuitively understand the distribution of global honeypot attacks, hotspot locations, and major attack sources.

### Project Goals
1. Help users easily understand cybersecurity threats.
2. Raise public awareness of cybersecurity challenges and encourage proper responses.

---

## Key Features

### 1. Dynamic Data Visualization
The platform provides multiple data visualization functionalities:
- **Protocol Distribution**: Displays the most commonly used protocols in attacks (e.g., TCP and UDP).
- **Country Distribution**: Shows the geographic origins of major attacks.
- **Source Port Frequency**: Highlights the most frequently used source ports by attackers.
- **Destination Port Frequency**: Emphasizes the most targeted ports.

### 2. Interactive Global Map
- Built with **Three.js** and **Three-Globe**, the 3D map visualizes attack paths and hotspots.
- Different colors represent attack types: blue for UDP, green for TCP, and red for ICMP.
- A time range filter and dynamic statistics panel allow users to explore real-time attack data.

### 3. Responsive Design
- The website uses the **Bootstrap** framework to ensure consistent performance across desktop, tablet, and mobile devices.

---

## Data Processing and Technology Stack

### Data Processing
- **Data Source**: AWS Honeypot Attack Dataset (March–August 2013).
- **Processing Steps**:
  - Geographic coordinates were supplemented using Python scripts.
  - Raw CSV data was converted to structured JSON for efficient front-end use.

### Technology Stack
- **Frontend**:
  - HTML, CSS, JavaScript
  - Chart.js, Three.js
- **Backend**:
  - Node.js and Express.js
- **Visualization Tools**:
  - **Chart.js**: Used to create dynamic bar charts and statistical graphs.
  - **Three.js and Three-Globe**: Used for 3D map visualizations and animated attack paths.
  - **Bootstrap**: Ensures responsive layout and predefined UI components.

---

### Authors
# Sirui Luo： 

*email address✉️: sirui.luo.24@ucl.ac.uk*


# Donghao Zhang： 

*email address✉️: donghao.zhang.24@ucl.ac.uk*


# Yue Zhu：

*email address✉️: yue.zhu.24@ucl.ac.uk*

---
