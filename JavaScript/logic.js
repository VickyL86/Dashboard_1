// Fetch the list of available JSON files
const jsonFiles = [
    { name: "All State Market", url: "../json/all_state_market.json" },
    { name: "National Market", url: "../json/national_market.json" },
    { name: "State Boundaries", url: "../json/stateboundry.json" },
    { name: "State Total Data", url: "../json/stateboundry_betting_info_added.json" }
];


///-------------------VICKY------------------ NATIONAL DATA PAGE -----------------------------


// Create a dropdown for selecting feature.properties.date_legalized from stateboundry_betting_info_added.json 

// Select the dropdown element in the HTML page
const dropdown = d3.select("#selDataset");

// Add the options to the dropdown list
jsonFiles.forEach(function (jsonFile) {
    dropdown.append("option").text(jsonFile.name).property("value", jsonFile.url);
});

// Initialize Leaflet map
const map = L.map('map').setView([37.0902, -95.7129], 4);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

//______________________________________VICKY_____MAP__________

//use json with state boundries from  https://eric.clst.org/tech/usgeojson/

let link = "https://vickyl86.github.io/Dashboard_1/json/stateboundry_betting_info_added.json";

// The function that will determine the color of a state based on its Ways_to_bet
function chooseColor(Ways_to_bet) {
    if (Ways_to_bet == "Online & In-Person") return "#F39C12"; // Dark Blue
    else if (Ways_to_bet == "In Person Only") return "#194570"; // Dark Blue
    else if (Ways_to_bet == "Online Only") return "#3498DB"; // Bright Blue
    else if (Ways_to_bet == "Pending") return "#5e5e5d"; // Dark Grey
    return "#BDC3C7"; // Grey
}

// Fetch the GeoJSON data and add it to the map with custom colors
fetch(link)
    .then(response => response.json())
    .then(data => {
        const geoJsonLayer = L.geoJSON(data, {
            style: function (feature) {
                return {
                    fillColor: chooseColor(feature.properties.Ways_to_bet),
                    weight: 2,
                    opacity: 1,
                    color: 'white',
                    fillOpacity: 0.5
                };
            },
            filter: function (feature) {
                const selectedYear = parseInt(document.getElementById('yearSelect').value);
                return selectedYear === 0 || feature.properties.year_legalized == selectedYear;
            },
            onEachFeature: function (feature, layer) {
                layer.on({
                    mouseover: function (event) {
                        layer.setStyle({
                            fillOpacity: 0.9
                        });
                    },
                    mouseout: function (event) {
                        layer.setStyle({
                            fillOpacity: 0.7
                        });
                    },
                    click: function (event) {
                        map.fitBounds(event.target.getBounds());
                    }
                });

                // Create custom popup content
                const popupContent =
                    "<div class='popup-content'>" +
                    "<h1>" + feature.properties.NAME + "</h1>" +
                    "<div class='popup-details'>" +
                    "<p><strong>Ways to bet:</strong> " + feature.properties.Ways_to_bet + "</p>" +
                    "<p><strong>Legalized in:</strong> " + feature.properties.date_legalized + "</p>" +
                    "</div>" +
                    "</div>";

                // Bind popup with custom content
                layer.bindPopup(popupContent);
            }
        }).addTo(map);

        document.getElementById('yearSelect').addEventListener('change', function () {
            geoJsonLayer.clearLayers();
            geoJsonLayer.addData(data);
        });
    });

// __________________SUMMARY TABLE_________________________________________________________________________


// Create a table for the top 5 states by revenue
document.addEventListener("DOMContentLoaded", function() {
    // Define the link to your JSON data
    let link = "https://vickyl86.github.io/Dashboard_1/json/stateboundry_betting_info_added.json";

    // Fetch the JSON data
    d3.json(link).then(function(data) {
        // Populate the initial states for "All Years"
        const statesData = data.features.map(d => d); // Create a copy of the data array
        statesData.sort((a, b) => {
            const revenueA = parseInt(a.properties.revenue.replace(/[\$,]/g, ""));
            const revenueB = parseInt(b.properties.revenue.replace(/[\$,]/g, ""));
            return revenueB - revenueA;
        });
        const top5Data = statesData.slice(0, 5);
        createTable(top5Data);

        // Listen to dropdown change
        document.getElementById('yearSelect').addEventListener('change', function() {
            const selectedYear = this.value;

            if (selectedYear === "0") {
                createTable(top5Data);
            } else {
                // Filter the data based on the selected year
                const filteredData = data.features.filter(d => d.properties.year_legalized == selectedYear);
                createTable(filteredData);
            }
        });
    });
});


function createTable(data) {
    // Sort data by revenue in descending order
    data.sort((a, b) => {
        return parseInt(b.properties.revenue.replace(/[\$,]/g, "")) - parseInt(a.properties.revenue.replace(/[\$,]/g, ""));
    });
    // Get the table element
    let table = document.getElementById('summary-table');
    // Clear previous rows
    table.innerHTML = "";
    // Create table headers
    let thead = table.createTHead();
    let row = thead.insertRow();
    let headers = ["State", "Revenue", "Taxes", "Date Legalized"];
    for (let key of headers) {
        let th = document.createElement("th");
        let text = document.createTextNode(key);
        th.appendChild(text);
        th.style.textAlign = "center";  // Center align the text
        row.appendChild(th);
    }

    let totalRevenue = 0;
    let totalTaxes = 0;

    // Create table rows
    for (let element of data) {
        let row = table.insertRow();
        let keys = ["NAME", "revenue", "taxes", "date_legalized"];
        for (let i = 0; i < keys.length; i++) {
            let cell = row.insertCell();
            let value = element.properties[keys[i]];

            // If the key is 'revenue' or 'taxes', format the number
            if (keys[i] === "revenue" || keys[i] === "taxes") {
                value = parseInt(value.replace(/[\$,]/g, "")).toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 });
                cell.style.paddingLeft = "20px"; // Add padding
                cell.style.paddingRight = "20px"; // Add padding
            }

            let text = document.createTextNode(value);
            cell.appendChild(text);

            // Add text alignment style for "Date Legalized" column
            if (keys[i] === "date_legalized") {
                cell.style.textAlign = "right";
            }
        }

        // Convert and sum revenue and taxes
        totalRevenue += parseInt(element.properties.revenue.replace(/[\$,]/g, ""));
        totalTaxes += parseInt(element.properties.taxes.replace(/[\$,]/g, ""));
    }

    // Add a row for totals
    let tfoot = table.createTFoot();
    let footerRow = tfoot.insertRow();
    footerRow.style.fontWeight = "bold";  // Set the entire row to bold
    footerRow.insertCell().innerHTML = "Total";
    let revenueCell = footerRow.insertCell();
    let taxCell = footerRow.insertCell();
    revenueCell.innerHTML = parseInt(totalRevenue).toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 });
    taxCell.innerHTML = parseInt(totalTaxes).toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 });
    revenueCell.style.paddingLeft = "20px"; // Add padding
    revenueCell.style.paddingRight = "20px"; // Add padding
    taxCell.style.paddingLeft = "20px"; // Add padding
    taxCell.style.paddingRight = "20px"; // Add padding
    footerRow.insertCell().innerHTML = "";
}





//____________________Graphs_______________________________________________________

// TOTAL REVENUE -- LINE GRAPH
document.addEventListener("DOMContentLoaded", function() {
    // Fetch JSON data
    d3.json("https://vickyl86.github.io/Dashboard_1/json/rev_over_time_ways_to_bet.json").then(function(data) {
        
        // Color mapping
        const colorMap = {
            "Online & In-Person": "#F39C12",
            "In Person Only": "#194570",
            "Online Only": "#3498DB"
        };

        // Parsing date for better visualization
        const parseDate = d3.timeParse("%B %Y");
        data.forEach(d => {
            d.date = parseDate(d.date);
            d.year = d.date.getFullYear();
        });

        // Function to draw the chart
        function drawChart(filteredData) {
            // Sum up revenue for records sharing the same date and "Ways_to_bet"
            let summedData = d3.rollups(
                filteredData, 
                v => d3.sum(v, leaf => leaf.revenue), 
                d => d.date,
                d => d.Ways_to_bet
            );

            // Flatten the data
            let flattenedData = [];
            summedData.forEach(([date, entries]) => {
                entries.forEach(([Ways_to_bet, revenue]) => {
                    flattenedData.push({ date, Ways_to_bet, revenue });
                });
            });

            // Group data by 'Ways_to_bet'
            const groupedData = d3.group(flattenedData, d => d.Ways_to_bet);

            // Initialize traces
            const traces = [];

            // Create a trace for each group
            groupedData.forEach((value, key) => {
                // Sort the data by date
                value.sort((a, b) => a.date - b.date);

                const trace = {
                    x: value.map(d => d.date),
                    y: value.map(d => d.revenue),
                    mode: 'lines',
                    name: key,
                    line: { color: colorMap[key] },  // Set line color based on mapping
                    hovertemplate: `${key}<br>Revenue: %{y}<br>Date: %{x}<extra></extra>`
                };
                traces.push(trace);
            });

            // Layout
            const layout = {
                title: 'Revenue Over Time Grouped by Ways to Bet',
                xaxis: { title: 'Date' },
                yaxis: { title: 'Revenue' },
                showlegend: false // Hide the legend
            };

            // Render plot
            Plotly.newPlot('line-chart', traces, layout);
        }

        // Initial rendering
        drawChart(data);

        // Listen to dropdown change
        document.getElementById('yearSelect').addEventListener('change', function() {
            const selectedYear = this.value;
            const filteredData = data.filter(d => d.year == selectedYear || selectedYear == 0);
            drawChart(filteredData);
        });
    });
});


// INCOME TAXATION -- BAR CHART

document.addEventListener("DOMContentLoaded", function() {
    // Function to update chart based on selected year
    const updateChart = function(selectedYear) {
        // Define the color mapping for each 'Ways_to_bet' category
        const colorMap = {
            "Online & In-Person": "#F39C12",
            "In Person Only": "#194570",
            "Online Only": "#3498DB"
        };

        d3.json("https://vickyl86.github.io/Dashboard_1/json/rev_over_time_ways_to_bet.json").then(function(data) {
            // Filter data based on selected year if applicable
            if (selectedYear !== "0") {
                data = data.filter(d => d.year === parseInt(selectedYear));
            }

            // Group by date and Ways_to_bet, summing up the taxes
            const groupedData = d3.rollups(
                data,
                v => d3.sum(v, d => d.taxes),
                d => selectedYear === "0" ? d.year : d.month,
                d => d.Ways_to_bet
            );

            const traces = [];
            const allDates = Array.from(new Set(data.map(d => selectedYear === "0" ? d.year : d.month)));
            allDates.sort((a, b) => a - b);

            const preferredOrder = ['Online & In-Person', 'Online Only', 'In Person Only'];

            preferredOrder.forEach(Ways_to_bet => {
                let trace = {
                    x: allDates,
                    y: new Array(allDates.length).fill(0),
                    hovertext: new Array(allDates.length).fill(''),
                    name: Ways_to_bet,
                    type: 'bar',
                    hoverinfo: 'text',
                    marker: { color: colorMap[Ways_to_bet] } // Assign color based on the mapping
                };
                traces.push(trace);
            });

            groupedData.forEach(([date, entries]) => {
                entries.forEach(([Ways_to_bet, taxes]) => {
                    let trace = traces.find(t => t.name === Ways_to_bet);
                    if (trace) {
                        trace.y[allDates.indexOf(date)] = taxes;
                        trace.hovertext[allDates.indexOf(date)] = `${Ways_to_bet} <br>Taxes:${taxes}`;
                    }
                });
            });

            const layout = {
                title: 'Tax Revenue by Ways to Bet',
                xaxis: { title: selectedYear === "0" ? 'Year' : 'Month' },
                yaxis: { title: 'Tax Revenue' },
                barmode: 'stack',
                hovermode: 'closest',
                showlegend: false // Hide the legend
            };

            Plotly.newPlot('bar-chart', traces, layout);
        });
    };

    // Initial rendering
    updateChart("0");

    // Update chart when dropdown changes
    document.getElementById('yearSelect').addEventListener('change', function() {
        updateChart(this.value);
    });
});

// ----------------------STATE DATA PAGE----------------------------------------------

const stateDropdown = document.getElementById('stateDropdown');
const stateSearch = document.getElementById('stateSearch');
const summaryTable = document.getElementById('stateTable');

let statesData = [];

// Fetch the JSON data from the URL
async function fetchStatesData() {
    try {
        const response = await fetch('https://vickyl86.github.io/Dashboard_1/json/state_detail.json');
        const data = await response.json();
        statesData = data; // Store the fetched data
        return data;
    } catch (error) {
        console.error('Error fetching data:', error);
        return [];
    }
}

async function populateStates(searchTerm = '') {
    stateDropdown.innerHTML = '';

    const uniqueStates = [...new Set(statesData.map(item => item.state))];

    const filteredStates = uniqueStates.filter(state =>
        state.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Populate the dropdown directly with the first state
    filteredStates.forEach(state => {
        const option = document.createElement('option');
        option.value = state;
        option.textContent = state;
        stateDropdown.appendChild(option);
    });

    // Trigger the state selection and summary update for the first state
    if (filteredStates.length > 0) {
        const firstState = filteredStates[0];
        updateGraph(firstState);
        updateSummaryTable(firstState);
    }
}

// Function to calculate the sum of revenue for the selected state
function calculateTotalRevenue(selectedState) {
    const stateData = statesData.filter(item => item.state === selectedState);
    if (stateData.length > 0) {
        return stateData.reduce((sum, item) => sum + item.revenue, 0);
    }
    return 0;
}
// Function to calculate the sum of taxes for the selected state
function calculateTotalTaxes(selectedState) {
    const stateData = statesData.filter(item => item.state === selectedState);
    if (stateData.length > 0) {
        return stateData.reduce((sum, item) => sum + item.taxes, 0);
    }
    return 0;
}

// Function to update the state summary table
function updateSummaryTable(selectedState) {
    const stateData = statesData.filter(item => item.state === selectedState);

    const totalRevenue = calculateTotalRevenue(selectedState);
    const totalTaxes = calculateTotalTaxes(selectedState);

    if (stateData.length > 0) {
        const summaryTable = document.getElementById('stateSummary');
        const summaryContent = `
            <h2>State Summary Table</h2>
            <table>
                <tr><td>State:</td><td>${stateData[0].state}</td></tr>
                <tr><td>Betting:</td><td>${stateData[0].Ways_to_bet}</td></tr>
                <tr><td>Legalized in:</td><td>${stateData[0].date}</td></tr>
                <tr><td colspan="2"><h3>Census Data</h3></td></tr>
                <tr><td>Population 18+:</td><td>${Number(stateData[0].population_over_18).toLocaleString()}</td></tr>
                <tr><td>Median Income: </td><td>${Number(stateData[0].earnings_median).toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 })}</td></tr>
                <tr><td colspan="2"><h3>Revenue Data</h3></td></tr>
                <tr><td>Total Revenue:</td><td>${totalRevenue.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 })}</td></tr>
                <tr><td>Total Tax: </td><td>${totalTaxes.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 })}</td></tr>
            </table>
        `;
        summaryTable.innerHTML = summaryContent;
    } else {
        const summaryTable = document.getElementById('stateSummary');
        summaryTable.innerHTML = 'No data available for selected state.';
    }
}


// ----------------- Line Graph for revenue & taxes  ----------


const revenueTaxesGraph = document.getElementById('revenueTaxesGraph');

// Fetch the JSON data from the URL
async function fetchStatesData() {
    try {
        const response = await fetch('https://vickyl86.github.io/Dashboard_1/json/state_detail.json');
        const data = await response.json();
        statesData = data; // Store the fetched data
        return data;
    } catch (error) {
        console.error('Error fetching data:', error);
        return [];
    }
}

// Update revenue and taxes line graph based on selected state
function updateGraph(selectedState) {
    
    // Clear existing graph or message
    revenueTaxesGraph.innerHTML = '';

    const stateData = statesData.filter(item => item.state === selectedState);

    if (stateData.length > 0) {
        const dates = stateData.map(item => new Date(item.date));
        const revenue = stateData.map(item => item.revenue);
        const taxes = stateData.map(item => item.taxes);
        
        // Pick a random index for color selection
        const randomIndex = Math.floor(Math.random() * stateData.length);
        const randomWaysToBet = stateData[randomIndex].Ways_to_bet;

        const revenueTrace = {
            x: dates,
            y: revenue,
            mode: 'line',
            name: 'Revenue',
            line: {
                color: getColorForWaysToBet(randomWaysToBet),
                width: 2 // Adjust the line width
            }
        };

        const taxesTrace = {
            x: dates,
            y: taxes,
            mode: 'lines',
            name: 'Taxes',
            line: {
                color: 'darkgrey', // Set color for the taxes line
                width: 2 // Adjust the line width
            }
        };

        const layout = {
            title: `${selectedState} Revenue and Taxes Over Time`,
            xaxis: {
                title: 'Use toggles to zoom in on a date range',
                type: 'date',
                tickformat: '%b %Y', // Month name & year (e.g., Jan 2023)
                rangeslider: { visible: true },
                tickangle: -45 // Adjust the angle of tick labels
            },
            yaxis: { title: 'Amount ($)' }
        };

        const data = [revenueTrace, taxesTrace];

        Plotly.newPlot(revenueTaxesGraph, data, layout);
    } else {
        revenueTaxesGraph.innerHTML = 'No data available for selected state.';
}
}

// Function to get color based on Ways_to_bet value
function getColorForWaysToBet(waysToBet) {
    if (waysToBet === "Online & In-Person") return "#F39C12";
    if (waysToBet === "In Person Only") return "#194570";
    if (waysToBet === "Online Only") return "#3498DB";
    return "rgba(70, 70, 80, 0.7)"; // Default color
}


// ----------------- Bar Graph for revenue per capita  ----------


const revenuePerCapitaGraph = document.getElementById('revenuePerCapitaGraph');

// Fetch the JSON data from the URL
async function fetchStatesData() {
    try {
        const response = await fetch('https://vickyl86.github.io/Dashboard_1/json/state_detail.json');
        const data = await response.json();
        statesData = data; // Store the fetched data
        return data;
    } catch (error) {
        console.error('Error fetching data:', error);
        return [];
    }
}


// Fetch data and populate initial states
fetchStatesData().then(() => {
    populateStates().then(() => {
        // Get the first state from the dropdown
        const firstState = stateDropdown.options[0].value;

        // Update the bar chart with the first state
        updateBarGraph(firstState);
    });
});


// Calculate YTD start date
function getYTDStartDate() {
    const currentDate = new Date();
    return new Date(currentDate.getFullYear(), 0, 1); // January 1st of current year
}

// Calculate linear trendline
function calculateTrendline(x, y) {
    const n = x.length;
    const sumX = x.reduce((acc, val) => acc + val, 0);
    const sumY = y.reduce((acc, val) => acc + val, 0);
    const sumXY = x.reduce((acc, val, idx) => acc + val * y[idx], 0);
    const sumXSquare = x.reduce((acc, val) => acc + val * val, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXSquare - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    return x.map(val => slope * val + intercept);
}

// Update revenue per capita bar graph based on selected state
function updateBarGraph(selectedState) {
    // Clear existing graph or message
    revenuePerCapitaGraph.innerHTML = '';
  
    const stateData = statesData.filter(item => item.state === selectedState);

    if (stateData.length > 0) {
        const dates = stateData.map(item => new Date(item.date));
        const revenuePerCapita = stateData.map(item => parseFloat(item.revenue_per_capita));
        const waysToBet = stateData.map(item => item.Ways_to_bet);

        const barColors = waysToBet.map(way => {
            if (way === "Online & In-Person") return "#F39C12";
            if (way === "In Person Only") return "#194570";
            if (way === "Online Only") return "#3498DB";
            return "rgba(70, 70, 80, 0.7)"; // Default color
        });

        const barTrace = {
            x: dates,
            y: revenuePerCapita,
            type: 'bar',
            name: 'Rev per Person', // Name for the bar trace
            marker: {
                color: barColors // Set colors based on Ways_to_bet
            }
        };

        const trendlineX = dates.map(date => date.getTime()); // Convert dates to timestamps
        const trendlineY = calculateTrendline(trendlineX, revenuePerCapita);

        const trendline = {
            x: dates,
            y: trendlineY,
            mode: 'lines',
            line: {
                color: 'red',
                dash: 'dash'
            },
            name: 'Trendline'
        };

        const layout = {
            title: `${selectedState} Revenue per Capita Over Time`,
            xaxis: {
                title: 'Date',
                type: 'date',
                tickformat: '%b %Y', // Month name & year (e.g., Jan 2023)
                tickangle: -45 // Adjust the angle of tick labels
            },
            yaxis: { title: 'Revenue per Capita ($)', hoverformat: '$,.2f' }, // Add dollar sign in hover
            updatemenus: [
                {
                    buttons: [
                        { method: 'relayout', args: ['xaxis.range', [getYTDStartDate(), new Date()]], label: 'YTD' },
                        { method: 'relayout', args: ['xaxis.range', [new Date().setFullYear(new Date().getFullYear() - 1), new Date()]], label: '12 Months' },
                        { method: 'relayout', args: ['xaxis.range', [dates[0], dates[dates.length - 1]]], label: 'All Data' }
                    ],
                    direction: 'right', 
                    showactive: false,
                    type: 'buttons',
                    x: 1.05, 
                    xanchor: 'right',
                    y: 1.15,
                    yanchor: 'top'
                }
            ]
        };

        const data = [barTrace, trendline];

        Plotly.newPlot(revenuePerCapitaGraph, data, layout);
    } else {
        revenuePerCapitaGraph.innerHTML = 'No data available for selected state.';
    }
}

// Handle search input changes
stateSearch.addEventListener('input', () => {
    populateStates(stateSearch.value);  
    const selectedState = stateDropdown.value; 
    updateSummaryTable(selectedState);
    updateBarGraph(selectedState);
    updateGraph(selectedState);  // This line will update the Line Graph based on the newly selected state
});


// Handle state selection changes
stateDropdown.addEventListener('change', () => {
    const selectedState = stateDropdown.value;
    updateSummaryTable(selectedState);
    updateBarGraph(selectedState);
    updateGraph(selectedState);  
});

// Fetch data and populate initial states
fetchStatesData().then(() => {
    populateStates();
});



// ----------------- PIe char showing revenue portion ----------

