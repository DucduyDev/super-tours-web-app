/* eslint-disable */

export const displayMap = (locations) => {
  mapboxgl.accessToken =
    "pk.eyJ1IjoiZHVjZHV5MTYxMCIsImEiOiJjbDN6aG90OHgyM282M2ZueXF5NHlzcjQzIn0.q8-7zPEwiuDeKsy2IVJquQ";

  const map = new mapboxgl.Map({
    container: "map",
    style: "mapbox://styles/ducduy1610/cl2vpxaqo005u15peu9653eb4",
    scrollZoom: false,
    // center: [106.7910673, 10.8712764],
    // zoom: 15,
    // interactive: false,
  });

  const bounds = new mapboxgl.LngLatBounds();

  locations.forEach((location) => {
    // coordArray.push(location.coordinates);
    // Create marker
    const element = document.createElement("div");
    element.className = "marker";

    // Add marker
    new mapboxgl.Marker({
      element,
      anchor: "bottom",
    })
      .setLngLat(location.coordinates)
      .addTo(map);

    // Add popup
    new mapboxgl.Popup({
      offset: 50,
    })
      .setLngLat(location.coordinates)
      .setHTML(`<p>Day ${location.day} : ${location.description}</p>`)
      .addTo(map);

    bounds.extend(location.coordinates);
  });

  map.fitBounds(bounds, {
    padding: {
      top: 200,
      bottom: 150,
      left: 100,
      right: 100,
    },
  });
};
