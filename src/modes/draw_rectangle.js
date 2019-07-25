const doubleClickZoom = require('../lib/double_click_zoom');
const Constants = require('../constants');

const DrawRectangle = {};

DrawRectangle.onSetup = function(opts) {
    const rectangle = this.newFeature({
        type: Constants.geojsonTypes.FEATURE,
        properties: {
          isRectangle: true
        },
        geometry: {
          type: Constants.geojsonTypes.POLYGON,
          coordinates: [[]]
        }
    });

    this.addFeature(rectangle);
    this.clearSelectedFeatures();
    doubleClickZoom.disable(this);
    this.updateUIClasses({ mouse: Constants.cursors.ADD });
    this.setActionableState({
    trash: true
    });

    return {
      rectangle
    };
};

DrawRectangle.onTap = function(state, e) {
    // emulate 'move mouse' to update feature coords
    if (state.startPoint) this.onMouseMove(state, e);
    // emulate onClick
    this.onClick(state, e);
};

DrawRectangle.onClick = function(state, e) {
    // if state.startPoint exist, means its second click
    //change to  simple_select mode
    if (
        state.startPoint &&
        state.startPoint[0] !== e.lngLat.lng &&
        state.startPoint[1] !== e.lngLat.lat
      ) {
        this.updateUIClasses({ mouse: Constants.cursors.POINTER });
        state.endPoint = [e.lngLat.lng, e.lngLat.lat];
        this.changeMode( Constants.modes.SIMPLE_SELECT , { featuresId: state.rectangle.id });
      }
      // on first click, save clicked point coords as starting for  rectangle
      const startPoint = [e.lngLat.lng, e.lngLat.lat];
      state.startPoint = startPoint;
};

DrawRectangle.onMouseMove = function(state, e) {
    // if startPoint, update the feature coordinates, using the bounding box concept
    // we are simply using the startingPoint coordinates and the current Mouse Position
    // coordinates to calculate the bounding box on the fly, which will be our rectangle
    if (state.startPoint) {
        state.rectangle.updateCoordinate(
          "0.0",
          state.startPoint[0],
          state.startPoint[1]
        ); //minX, minY - the starting point
        state.rectangle.updateCoordinate(
          "0.1",
          e.lngLat.lng,
          state.startPoint[1]
        ); // maxX, minY
        state.rectangle.updateCoordinate("0.2", e.lngLat.lng, e.lngLat.lat); // maxX, maxY
        state.rectangle.updateCoordinate(
          "0.3",
          state.startPoint[0],
          e.lngLat.lat
        ); // minX,maxY
        state.rectangle.updateCoordinate(
          "0.4",
          state.startPoint[0],
          state.startPoint[1]
        ); //minX,minY - ending point (equals to starting point)
    }
};

DrawRectangle.onKeyUp = function(state, e) {
    if (e.keyCode === 27) return this.changeMode(Constants.modes.SIMPLE_SELECT);
};

DrawRectangle.onStop = function(state, e) {
    doubleClickZoom.enable(this);
    this.updateUIClasses({ mouse: Constants.cursors.NONE });
    this.activateUIButton();

    // check to see if we've deleted this feature
    if (this.getFeature(state.rectangle.id) === undefined) return;

    //remove last added coordinate
    state.rectangle.removeCoordinate("0.4");
    if (state.rectangle.isValid()) {
      this.map.fire(Constants.events.CREATE, {
        features: [state.rectangle.toGeoJSON()]
      });
    } else {
      this.deleteFeature([state.rectangle.id], { silent: true });
      this.changeMode(Constants.modes.SIMPLE_SELECT, {}, { silent: true });
    }
};

DrawRectangle.toDisplayFeatures = function(state, geojson, display) {
    const isActivePolygon = geojson.properties.id === state.rectangle.id;
    geojson.properties.active = isActivePolygon ? "true" : "false";
    if (!isActivePolygon) return display(geojson);

    // Only render the rectangular polygon if it has the starting point
    if (!state.startPoint) return;
    return display(geojson);
};

DrawRectangle.onTrash = function(state) {
    this.deleteFeature([state.rectangle.id], { silent: true });
    this.changeMode(Constants.modes.SIMPLE_SELECT);
};

module.exports = DrawRectangle;
