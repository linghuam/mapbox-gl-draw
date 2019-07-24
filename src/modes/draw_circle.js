const doubleClickZoom = require('../lib/double_click_zoom');
const Constants = require('../constants');
const turf_circle = require('@turf/circle').default;
const turf_distance = require('@turf/distance').default;

const DrawCircle = {};

DrawCircle.onSetup = function(opts) {
    const circle = this.newFeature({
        type: Constants.geojsonTypes.FEATURE,
        properties: {
            isCircle: true,
            center: []
        },
        geometry: {
            type: Constants.geojsonTypes.POLYGON,
            coordinates: [
                []
            ]
        }
    });

    this.addFeature(circle);

    this.clearSelectedFeatures();
    doubleClickZoom.disable(this);
    this.updateUIClasses({
        mouse: Constants.cursors.ADD
    });
    this.setActionableState({
        trash: true
    });

    return {
        circle
    };
};

DrawCircle.onTap = function(state, e) {
    // emulate 'move mouse' to update feature coords
    if (state.startPoint) this.onMouseMove(state, e);
    // emulate onClick
    this.onClick(state, e);
};

DrawCircle.onClick = function(state, e) {
    // if state.startPoint exist, means its second click
    //change to  simple_select mode
    if (
        state.startPoint &&
        state.startPoint[0] !== e.lngLat.lng &&
        state.startPoint[1] !== e.lngLat.lat
    ) {
        this.updateUIClasses({
            mouse: Constants.cursors.POINTER
        });
        state.endPoint = [e.lngLat.lng, e.lngLat.lat];
        this.changeMode( Constants.modes.SIMPLE_SELECT , {
            featuresId: state.circle.id
        });
    } else {
        // on first click, save clicked point coords as starting for  circle
        const startPoint = [e.lngLat.lng, e.lngLat.lat];
        state.startPoint = startPoint;
        // state.center.incomingCoords(startPoint);
    }
};

DrawCircle.onMouseMove = function(state, e) {
    // if startPoint, update the feature coordinates, using the bounding box concept
    // we are simply using the startingPoint coordinates and the current Mouse Position
    // coordinates to calculate the bounding box on the fly, which will be our circle
    if (state.startPoint) {
        var center = state.startPoint;
        var endPoint = [e.lngLat.lng, e.lngLat.lat];
        var distance = turf_distance(center, endPoint);
        const circleFeature = turf_circle(center, distance);
        state.circle.incomingCoords(circleFeature.geometry.coordinates);
        state.circle.properties.center = center;
        state.circle.properties.radiusInKm = distance;
    }
};

DrawCircle.onKeyUp = function(state, e) {
    if (e.keyCode === 27) return this.changeMode( Constants.modes.SIMPLE_SELECT );
};

DrawCircle.onStop = function(state, e) {
    doubleClickZoom.enable(this);
    this.updateUIClasses({
        mouse: Constants.cursors.NONE
    });
    this.activateUIButton();

    // check to see if we've deleted this feature
    if (this.getFeature(state.circle.id) === undefined) return;

    //remove last added coordinate
    state.circle.removeCoordinate("0.4");
    if (state.circle.isValid()) {
        this.map.fire(Constants.events.CREATE, {
            features: [state.circle.toGeoJSON()]
        });
    } else {
        this.deleteFeature([state.circle.id], {
            silent: true
        });
        this.changeMode( Constants.modes.SIMPLE_SELECT , {}, {
            silent: true
        });
    }
};

DrawCircle.toDisplayFeatures = function(state, geojson, display) {
    const isActivePolygon = geojson.properties.id === state.circle.id;
    geojson.properties.active = isActivePolygon ? "true" : "false";
    if (!isActivePolygon) return display(geojson);

    // Only render the circle polygon if it has the starting point
    if (!state.startPoint) return;
    return display(geojson);
};

DrawCircle.onTrash = function(state) {
    this.deleteFeature([state.circle.id], { silent: true });
    this.changeMode( Constants.modes.SIMPLE_SELECT );
};

module.exports = DrawCircle;