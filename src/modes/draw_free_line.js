const doubleClickZoom = require('../lib/double_click_zoom');
const Constants = require('../constants');
const createVertex = require('../lib/create_vertex');
const getFreeLinePoints = require('../lib/get_freeline_points');

const DrawFreeLine = {};

DrawFreeLine.onSetup = function() {
  const line = this.newFeature({
  	type: Constants.geojsonTypes.FEATURE,
  	properties: {},
  	geometry: {
  		type: Constants.geojsonTypes.LINE_STRING,
  		coordinates: []
  	}
  });
  this.addFeature(line);

  this.clearSelectedFeatures();
  doubleClickZoom.disable(this);
  this.updateUIClasses({ mouse: Constants.cursors.ADD });
  this.activateUIButton(Constants.types.FREE_LINE);
  this.setActionableState({
    trash: true
  });

  return {
  	line,
  	currentVertexPosition: 0,
    startPoint: null
  };
};

DrawFreeLine.onTap = DrawFreeLine.onClick = function(state, e) {
	if (!state.startPoint) {
		state.startPoint = [ e.lngLat.lng, e.lngLat.lat ];
		state.line.updateCoordinate(state.currentVertexPosition, e.lngLat.lng,  e.lngLat.lat);
	} else {
		if (state.line.isValid()) {
      const splinePoints = getFreeLinePoints(state.line.getCoordinates());
      state.line.incomingCoords(splinePoints);
      this.changeMode(Constants.modes.SIMPLE_SELECT);
    }
    this.onStop(state);
	}
};

DrawFreeLine.onMouseMove = function(state, e) {
	if (state.startPoint) {
		state.currentVertexPosition ++;
		state.line.updateCoordinate(state.currentVertexPosition, e.lngLat.lng,  e.lngLat.lat);
	}
};

DrawFreeLine.onStop = function(state) {
  doubleClickZoom.enable(this);
  this.activateUIButton();

  // check to see if we've deleted this feature
  if (this.getFeature(state.line.id) === undefined) return;

  if (state.line.isValid()) {
    this.map.fire(Constants.events.CREATE, {
      features: [state.line.toGeoJSON()]
    });
  } else {
    this.deleteFeature([state.line.id], { silent: true });
    this.changeMode(Constants.modes.SIMPLE_SELECT, {}, { silent: true });
  }
};

DrawFreeLine.onTrash = function(state) {
  this.deleteFeature([state.line.id], { silent: true });
  this.changeMode(Constants.modes.SIMPLE_SELECT);
};

DrawFreeLine.toDisplayFeatures = function(state, geojson, display) {
  const isActiveLine = geojson.properties.id === state.line.id;
  geojson.properties.active = (isActiveLine) ? Constants.activeStates.ACTIVE : Constants.activeStates.INACTIVE;
  if (!isActiveLine) return display(geojson);
  // Only render the line if it has at least one real coordinate
  if (geojson.geometry.coordinates.length < 2) return;
  geojson.properties.meta = Constants.meta.FEATURE;
  display(createVertex(
    state.line.id,
    geojson.geometry.coordinates[geojson.geometry.coordinates.length - 2],
    `${ geojson.geometry.coordinates.length - 2 }`,
    false
  ));

  display(geojson);
};

module.exports = DrawFreeLine;