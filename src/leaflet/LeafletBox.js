import L from 'leaflet';

const TARTU_CENTRE = [58.3750373, 26.7195843];

class LeafletBox {
	constructor() {
		this.map = L.map('leaflet-map').setView(TARTU_CENTRE, 13);
		this.vehicleRouteLine = undefined;
		this.mapMarkers = [];

		L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
			attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors',
		}).addTo(this.map);
	}

	addVehicleRouteLine(positions, color = 'red') {
		if (this.vehicleRouteLine) { this.map.removeLayer(this.vehicleRouteLine); }

		if (!positions.length) {
			return;
		}

		this.vehicleRouteLine = L.polyline(positions, { color }).addTo(this.map);
		this.map.fitBounds(this.vehicleRouteLine.getBounds());
	}

	setPosition(position) {
		this.map.flyTo(position, 13);
	}

	addTooltip(position, text) {
		this.mapMarkers.push(L.marker(position)
			.bindTooltip(text)
			.addTo(this.map)
			.openTooltip());
	}

	clearAll() {
		if (this.vehicleRouteLine) { this.map.removeLayer(this.vehicleRouteLine); }
		for (const marker of this.mapMarkers) {
			this.map.removeLayer(marker);
		}
	}
}

export default new LeafletBox();