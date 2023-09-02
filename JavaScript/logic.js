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

document.addEventListener("DOMContentLoaded", function() {
    // Define the link to your JSON data
    let link = "https://vickyl86.github.io/Dashboard_1/json/stateboundry_betting_info_added.json";

    // Fetch the JSON data
    d3.json(link).then(function(data) {
        // Listen to dropdown change
        document.getElementById('yearSelect').addEventListener('change', function() {
            const selectedYear = this.value;
            // Filter the data based on the 'year_legalized'
            const filteredData = data.features.filter(d => d.properties.year_legalized == selectedYear);
            createTable(filteredData);
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

