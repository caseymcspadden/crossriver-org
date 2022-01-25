(function (factory) {
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

	L.Control.Menu = (function () {
		var Menu = L.Control.extend({
			options: {
				position: 'topleft',
				styleBase: 'leaflet-control-menu'
			},

			onAdd: function (map) {
				this._ui = this._createUI();
				this._context = this.options.context||this;
				map.whenReady(this._initEvents,this);
				return this._ui.container;
			},
			
			onRemove: function (map) {
			},
			
			_itemMouseEvent: function (e) {
				var index;
				for (index=0;index<this._ui.items.length;index++)
				{
					if (e.target == this._ui.items[index])
						break;
				}
				var button = this.options.buttons[index];
				switch (e.type) {
					case 'click':
						if (button.toggle)
							button.isActive = !button.isActive;
						if (button.select)
							button.select.call(this._context,	button.isActive);
						else if (this.options.select)	
							this.options.select.call(this._context,e.target,index,button.isActive);
						if (!button.toggle || !button.isActive)
						 	L.DomUtil.removeClass(e.target,'active');
						break;
					case 'mouseover':
						L.DomUtil.addClass(e.target,'hover');
						break;
					case 'mouseout':
						L.DomUtil.removeClass(e.target,'hover');
						if (!button.toggle)
						 	L.DomUtil.removeClass(e.target,'active');
						break;
					case 'mousedown':
					 	L.DomUtil.addClass(e.target,'active');
						break;
				}
				e.preventDefault();
			},
			
			_initEvents: function () {
				for (var i=0;i<this.options.buttons.length;i++)
				{
					L.DomEvent.on(this._ui.items[i],'click', this._itemMouseEvent, this);
					L.DomEvent.on(this._ui.items[i],'mouseenter', this._itemMouseEvent, this);
					L.DomEvent.on(this._ui.items[i],'mouseleave', this._itemMouseEvent, this);
					L.DomEvent.on(this._ui.items[i],'mousedown', this._itemMouseEvent, this);
				}
			},

			_createUI: function () {
				var ui = {}, 
						sb = this.options.styleBase;
				ui.container = L.DomUtil.create('div', sb);
				ui.items = [];
				for (var i=0;i<this.options.buttons.length;i++)
				{
					var button = this.options.buttons[i];
					button.isActive = false;
					var child = L.DomUtil.create('div', sb + '-item' + (button.className ? ' ' + button.className : ''));
					if (button.title) child.setAttribute('title', button.title);
					ui.items.push(child);
					ui.container.appendChild(child);
				}
				return ui;
			}			
		});
		return Menu;
	})();

	L.control.menu = function (options) {
		return new L.Control.Menu(options);
	};
}));