L.TileLayer.WMTS = L.TileLayer.extend({
	// 默认参数(不同坐标系的地图应传入自己的参数)
	defaultWmtsParams: {
		Service: 'WMTS',
		Request: 'GetTile',
		Version: '1.0.0',
		style: '',
		TileatrixSet: '',
		Format: 'image/png',
		tilematrixset: 'EPSG:3857'
	},

	initialize: function (url, options) {
		this._url = url;
		var wmtsParams = L.extend({}, this.defaultWmtsParams);
		var tileSize = options.tileSize || this.options.tileSize;
		if (options.detectRetina && L.Browser.retina) {
			wmtsParams.width = wmtsParams.height = tileSize * 2;
		} else {
			wmtsParams.width = wmtsParams.height = tileSize;
		}
		for (var i in options) {
			if (!this.options.hasOwnProperty(i) && i != 'matrixIds') {
				wmtsParams[i] = options[i];
			}
		}
		this.wmtsParams = wmtsParams;
		this.matrixIds = options.matrixIds || this.getDefaultMatrix();
		L.setOptions(this, options);
	},

	onAdd: function (map) {
		this._crs = this.options.crs || map.options.crs;
		L.TileLayer.prototype.onAdd.call(this, map);
	},

	getTileUrl: function (coords) {
		var tileSize = this.options.tileSize;
		var nwPoint = coords.multiplyBy(tileSize);
		nwPoint.x += 1;
		nwPoint.y -= 1;
		var sePoint = nwPoint.add(new L.Point(tileSize, tileSize));
		var zoom = this._tileZoom;
		var nw = this._crs.project(this._map.unproject(nwPoint, zoom));
		var se = this._crs.project(this._map.unproject(sePoint, zoom));
		var tilewidth = se.x - nw.x;
		var ident = 'EPSG:900913:' + this.matrixIds[zoom].identifier;
		var X0 = this.matrixIds[zoom].topLeftCorner.lng;
		var Y0 = this.matrixIds[zoom].topLeftCorner.lat;
		var tilecol = Math.floor((nw.x - X0) / tilewidth);
		var tilerow = -Math.floor((nw.y - Y0) / tilewidth);
		var url = L.Util.template(this._url, {
			s: this._getSubdomain(coords)
		});

		return url + L.Util.getParamString(this.wmtsParams, url) + '&TileMatrix=' + ident + '&TileRow=' + tilerow + '&TileCol=' + tilecol;
	},

	setParams: function (params, noRedraw) {
		L.extend(this.wmtsParams, params);
		if (!noRedraw) {
			this.redraw();
		}
		return this;
	},

	getDefaultMatrix: function () {
		// 默认是3857坐标系下的切图
		var matrixIds3857 = new Array(22);
		for (var i = 0; i < 22; i++) {
			matrixIds3857[i] = {
				identifier: '' + i,
				topLeftCorner: new L.LatLng(20037508.3428, -20037508.3428)
			};
		}
		return matrixIds3857;
	}
});

L.tileLayer.wmts = function (url, options) {
	return new L.TileLayer.WMTS(url, options);
};