// Fetch earthquake dataset
let dataUrl = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson";
// Fetch tectonic plates dataset
let tectonicPlatesUrl = "https://raw.githubusercontent.com/fraxen/tectonicplates/master/tectonicplates.geojson";

// Initialize the map with center coordinates and zoom level
let map = L.map("map", {
  center: [37.7749, -122.4194], 
  zoom: 5,
});

// Create a layer for the base map background
let streetsLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

let topoLayer = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
  attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
});

// Satellite view layer (Esri WorldImagery)
let satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
  attribution: 'Tiles &copy; <a href="https://www.esri.com/">Esri</a> | Data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
});

// Create base layers object for toggle options
let baseLayers = {
  "Street View": streetsLayer,
  "Topographic View": topoLayer,
  "Satellite View": satelliteLayer
};

// Create a new layer group for earthquake locations
let quakeLocations = new L.LayerGroup();

// Create a new layer group for tectonic plates
let tectonicLayer = new L.LayerGroup();

// Overlay object for earthquake and tectonic layers
let overlays = {
  "Earthquake Data": quakeLocations,
  "Tectonic Plates": tectonicLayer
};

// Add layer control to the map
L.control.layers(baseLayers, overlays, {
  collapsed: true
}).addTo(map);

// Fetch the GeoJSON data for earthquakes
d3.json(dataUrl).then(function(response) {
  let featuresList = response.features;

  // Function to calculate marker size based on magnitude
  function calculateMarkerSize(magnitude) {
    return magnitude === 0 ? 2 : magnitude * 3.5; 
  }

  // Function to determine marker color based on depth
  function determineMarkerColor(depth) {
    if (depth < 10) return "#50f72f";   
    else if (depth < 30) return "#f0ff00";  
    else if (depth < 50) return "#ffdd00"; 
    else if (depth < 70) return "#ffac33"; 
    else if (depth < 90) return "#ff6f33"; 
    else return "#ff1e1e"; 
  }

  // Marker style function
  function setMarkerStyle(feature) {
    return { 
      fillColor: determineMarkerColor(feature.geometry.coordinates[2]),
      color: "#000", 
      radius: calculateMarkerSize(feature.properties.mag),
      stroke: true,
      weight: 0.6, 
      fillOpacity: 0.5, 
      opacity: 0.9
    };
  }

  // Display GeoJSON data as circle markers (Earthquake Data)
  L.geoJSON(response, {     
    pointToLayer: function (feature, latlng) {
      return L.circleMarker(latlng);
    },
    style: setMarkerStyle, 
    onEachFeature: function(feature, layer) {
      layer.bindPopup(`
        <h3>${feature.properties.place}</h3> <hr> 
        <p> 
          ${new Date(feature.properties.time)} <br>
          Magnitude: ${feature.properties.mag} <br>
          Depth: ${feature.geometry.coordinates[2]}
        </p>`);
    }   
  }).addTo(quakeLocations);

  // Fetch and display tectonic plates GeoJSON data
  d3.json(tectonicPlatesUrl).then(function(tectonicData) {
    console.log(tectonicData); // Check the data structure in the console

    // Plot tectonic plates as lines
    L.geoJSON(tectonicData, {
      style: {
        color: "#ff6600",  // Set color for tectonic plates
        weight: 3,         // Increase line thickness
        opacity: 1         // Set full opacity for visibility
      }
    }).addTo(tectonicLayer);

    tectonicLayer.addTo(map); // Add to map after plotting
  }).catch(function(error) {
    console.error("Error loading tectonic plates data:", error);
  });

  // Add the earthquake layer to the map
  quakeLocations.addTo(map);

  // Create a legend for the depth intervals
  let quakeLegend = L.control({position: "bottomright"});
  quakeLegend.onAdd = function() {
    let div = L.DomUtil.create("div", "info legend");
    let depthIntervals = [-10, 10, 30, 50, 70, 90];
    let colorScale = ["#50f72f", "#f0ff00", "#ffdd00", "#ffac33", "#ff6f33", "#ff1e1e"];

    // Generate the legend's content
    for (let i = 0; i < depthIntervals.length; i++) {
      div.innerHTML +=
        '<i style="background:' + colorScale[i] + '"></i> ' +
        depthIntervals[i] + (depthIntervals[i + 1] ? "&ndash;" + depthIntervals[i + 1] + "<br>" : "+");
    }
    return div;
  };
  quakeLegend.addTo(map);
});
