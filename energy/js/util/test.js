(function (factory) {
	// Packaging/modules magic dance
	var L;
	if (typeof define === 'function' && define.amd) {
		// AMD
		define(['leaflet'], factory);
	} else if (typeof module !== 'undefined') {
		// Node/CommonJS
		L = require('leaflet');
		module.exports = factory(L);
	} else {
		// Browser globals
		if (typeof window.L === 'undefined') {
			throw new Error('Leaflet must be loaded first');
        }
		factory(window.L);
	}
}(function (L) {
	'use strict';

	L.Control.Zoomslider = (function () {

		var Zoomslider = L.Control.extend({
			options: {
				position: 'topleft',
				styleNS: 'leaflet-control-zoomslider'
			},

			onAdd: function (map) {
				this._map = map;
				this._ui = this._createUI();
				this._knob = new Knob(this._ui.knob,
									  this.options.stepHeight,
									  this.options.knobHeight);

				map.whenReady(this._initKnob,        this)
					.whenReady(this._initEvents,      this)
					.whenReady(this._updateSize,      this)
					.whenReady(this._updateKnobValue, this)
					.whenReady(this._updateDisabled,  this);
				return this._ui.bar;
			},

		});

		return Zoomslider;
	})(function () {console.log("TEST");});

	L.Map.addInitHook(function () {
		if (this.options.zoomsliderControl) {
			this.zoomsliderControl = new L.Control.Zoomslider();
			this.addControl(this.zoomsliderControl);
		}
	});

	L.control.zoomslider = function (options) {
		return new L.Control.Zoomslider(options);
	};
}));