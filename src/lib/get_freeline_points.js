// 曲线插值拟合
// https://github.com/mrdoob/three.js/blob/dev/src/extras/curves/SplineCurve.js
// https://github.com/d3/d3-shape#curves
function CatmullRom(t, p0, p1, p2, p3) {

  var v0 = (p2 - p0) * 0.5;
  var v1 = (p3 - p1) * 0.5;
  var t2 = t * t;
  var t3 = t * t2;
  return (2 * p1 - 2 * p2 + v0 + v1) * t3 + (-3 * p1 + 3 * p2 - 2 * v0 - v1) * t2 + v0 * t + p1;

}

function CubicBezierP0(t, p) {

  var k = 1 - t;
  return k * k * k * p;

}

function CubicBezierP1(t, p) {

  var k = 1 - t;
  return 3 * k * k * t * p;

}

function CubicBezierP2(t, p) {

  return 3 * (1 - t) * t * t * p;

}

function CubicBezierP3(t, p) {

  return t * t * t * p;

}

function CubicBezier(t, p0, p1, p2, p3) {

  return CubicBezierP0(t, p0) + CubicBezierP1(t, p1) + CubicBezierP2(t, p2) +
    CubicBezierP3(t, p3);

}

function SplineCurve(points) {
  this.points = points || [];
}

SplineCurve.prototype = {

  constructor: SplineCurve,

  getPoint: function(t) {
    var points = this.points;
    var p = (points.length - 1) * t;

    var intPoint = Math.floor(p);
    var weight = p - intPoint;

    var p0 = points[intPoint === 0 ? intPoint : intPoint - 1];
    var p1 = points[intPoint];
    var p2 = points[intPoint > points.length - 2 ? points.length - 1 : intPoint + 1];
    var p3 = points[intPoint > points.length - 3 ? points.length - 1 : intPoint + 2];

    return [
      CubicBezier(weight, p0[0], p1[0], p2[0], p3[0]),
      CubicBezier(weight, p0[1], p1[1], p2[1], p3[1])
    ];
  },
  
  getPoints: function(divisions) {

    if (divisions === undefined) divisions = 5;

    var points = [];

    for (var d = 0; d <= divisions; d++) {
      points.push(this.getPoint(d / divisions));
    }

    return points;
  }
};

function getFreeLinePoints(points) {
  return new SplineCurve(points).getPoints(points.length);
}

module.exports = getFreeLinePoints;