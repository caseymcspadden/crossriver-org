define (['underscore', 'backbone', 'leaflet', 'models/windfarm', 'leaflet_markercluster', 'leaflet_sidebar', 'leaflet_spin', 'leaflet_menu'], 
function(_, Backbone, L, WindFarm) {

L.WindFarmClusterGroup = L.MarkerClusterGroup.extend({

		options: {
			singleMarkerMode: false,
			zoomToBoundsOnClick: true,
			disableClusteringAtZoom: 9,

			iconCreateFunction: function(cluster) {
				var childCount = cluster.getChildCount();

				var c = 'marker-cluster-';
				if (childCount < 10) {
					c += 'small';
				} else if (childCount < 100) {
					c += 'medium';
				} else {
					c += 'large';
				}
				return new L.DivIcon({ html: '<div><span>' + childCount + '</span></div>', className: 'marker-cluster ' + c, iconSize: new L.Point(40, 40) });
			}
		}
});

WindIcon = L.Icon.extend({
	options: {
        iconSize:     [32, 32],
        iconAnchor:   [15, 19]
    }
});
	
var blackIcon = new WindIcon({iconUrl:'/images/icon-turbine.png'});
var greenIcon = new WindIcon({iconUrl:'/images/icon-turbine-green.png'});
var yellowIcon = new WindIcon({iconUrl:'/images/icon-turbine-yellow.png'});
var redIcon = new WindIcon({iconUrl:'/images/icon-turbine-red.png'});

return Backbone.View.extend({
	events:{
		"mouseup": "openEditDialog"
	},

	initialize: function(options) {
		this.filter = null;
		this.mapState = options.mapState;
		this.isMouseDown = false;
		this.isDragging = false;
		this.selectedMarker=null;
		this.markerPositionSet=false;
		this.newMarker = L.marker(new L.LatLng(0, 0), { title: "Drag to position; click to edit", icon:blackIcon, draggable: true, idfarm:0 });
		this.newMarker.on("mousedown",this.markerSelect,this);
		this.newMarker.on("drag",this.markerDrag,this);
		this.clusterGroup = new L.WindFarmClusterGroup({disableClusteringAtZoom: 8, maxClusterRadius: 60, singleMarkerMode:false, spiderifyOnMaxZoom:false, spiderfyDistanceMultiplier:1});
		this.center = options.center || L.latLng(48, -123);
		this.filterView = options.filterView;
		this.editView = options.editView;
		this.tileLayers = {};
		this.tileLayers["Google Hybrid"] = L.tileLayer("http://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}",{maxZoom: 18, attribution: "&copy 2014 Google Maps"});
		this.tileLayers["Google Street"] = L.tileLayer("http://mt0.google.com/vt/x={x}&y={y}&z={z}",{maxZoom: 18, attribution: "&copy 2014 Google Maps"});
		this.tileLayers["Google Terrain"] = L.tileLayer("http://mt1.google.com/vt/lyrs=p&x={x}&y={y}&z={z}",{maxZoom: 18, attribution: "&copy 2014 Google Maps"});
		this.tileLayers["Open Street Map"] = L.tileLayer("http://tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom: 18, attribution: "&copy 2014 OpenStreetMaps"});
		this.tileLayers["Cycle"] = L.tileLayer("http://tile.opencyclemap.org/cycle/{z}/{x}/{y}.png",{maxZoom: 18, attribution: "&copy 2014 OpenStreetMaps"});
		//this.tileLayers["MapQuest"] = L.tileLayer("http://otile2.mqcdn.com/tiles/1.0.0/osm/{z}/{x}/{y}.png",{maxZoom: 18, attribution: "&copy 2014 OpenStreetMaps"});
		this.layersControl = L.control.layers(this.tileLayers, {"Wind Farms":this.clusterGroup});
		this.popup = L.popup({maxWidth:400, closeButton:false});
		//this.miniMap = new L.Control.MiniMap(this.tileLayers["Google Street"]);
		
		this.menuButtons = [{className:'filter', toggle:true, title:'Filter Map', select:function(isActive) {this.showFilter(isActive);}}, 
												{className:'zoomIn', title:'Zoom In', select:function() {this.map.zoomIn();}}, 
												{className:'zoomOut', title:'Zoom Out', select: function() {this.map.zoomOut();}},
												{className:'refresh', title:'Fit Map to Bounds', select: function() {this.map.fitBounds(this.clusterGroup.getBounds());}},
												{className:'addItem', title:'Add a Facility', select: function() {this.selectedMarker = this.newMarker.setLatLng(this.map.getCenter()).addTo(this.map);}}
											];
		
		this.listenTo(this.editView, 'edited', this.editFinished );
		this.listenTo(this.collection, 'add', this.addModel );
		this.listenTo(this.mapState, "change:fetchcompleted",this.fetchCompleted);
		this.listenTo(this.mapState, "change:filter",this.displayMarkers);
		this.listenTo(this.mapState, "change:searchid",this.search);
	},
	
	render: function() {
		this.$el.html("<div id='leaflet-view-map'></div><div id='leaflet-view-sidebar'></div>");
		this.map = L.map(this.$("#leaflet-view-map")[0], {center: this.center, zoom: 5, zoomControl: false, layers: [this.tileLayers["Google Hybrid"]]});
		this.map.addLayer(this.clusterGroup);
		L.control.scale().addTo(this.map);
		//L.control.zoomslider().addTo(this.map);
		L.control.menu({context:this, buttons:this.menuButtons}).addTo(this.map);
		this.layersControl.addTo(this.map);
		this.filterView.setElement(this.$("#leaflet-view-sidebar")).render();
		this.sidebar = L.control.sidebar('leaflet-view-sidebar', {position: 'left', closeButton: false});
		this.map.addControl(this.sidebar);
		//this.miniMap.addTo(this.map);
		this.clusterGroup.clearLayers();
		return this;
	},
	
	resized: function() {
		this.map.invalidateSize();
	},
	
	markerSelect: function(e)
	{
		this.markerPositionSet = (e.target.options.idfarm == 0 ? false : true);
		this.selectedMarker = e.target;
		this.isMouseDown=true;
		var that = this;		
		setTimeout(function() {that.mouseHold();}, 1500);
	},
	
	markerDrag: function(e)
	{
		this.markerPositionSet = true;
	},
		
	mouseHold: function()
	{
		if (this.isMouseDown && this.selectedMarker)
		{
			this.selectedMarker.setIcon(blackIcon);
			this.isDragging=true;
			this.selectedMarker.dragging.enable();
		}
	},
	
	openEditDialog: function() {
		this.isMouseDown = false;
	
		if (this.selectedMarker && this.markerPositionSet && !this.isDragging && this.editView)
		{
			if (this.selectedMarker !== this.newMarker)
				this.selectedMarker.dragging.disable();
			var coords = this.selectedMarker.getLatLng();
			if (this.selectedMarker.options.idfarm==0)
				this.editView.model = new WindFarm();
			else
				this.editView.model = this.collection.get(this.selectedMarker.options.idfarm);
			this.editView.setCoordinates(coords.lat, coords.lng);
			this.popup.setContent(this.editView.render().el);
			this.popup.setLatLng(coords);
			this.map.openPopup(this.popup);
			//this.popup.openOn(this.map);
		}
		this.selectedMarker=null;
		this.isDragging=false;
	},
	
	editFinished: function(data)
	{
		if (data.action=="save")
		{
			if (data.model.collection===undefined)
			{
				this.map.removeLayer(this.newMarker);
				this.collection.create(data.attributes,{wait:true, success:function(a) {console.log("SUCCESS"); console.log(a);}, error:function(a,b,c) {console.log("ERROR");console.log(a);console.log(b);console.log(c);}});
			}
			else 
				data.model.save(data.attributes);
		}
		else if (data.action=="cancel")
		{
			if (data.model.id===undefined)
				this.map.removeLayer(this.newMarker);
			else {
				data.model.marker.setLatLng(L.latLng(data.model.get("latitude"), data.model.get("longitude")));
			}
		}

		if (data.model.marker)
			data.model.marker.setIcon(this._get_icon(data.model));
		
		this.editView.model = null;
		this.map.closePopup(this.popup);
	},
		
	addModel : function(item)
	{
		this.clusterGroup.addLayer(this._create_marker(item));	
	},
	
	showFilter: function(show)
	{
		if (show) this.sidebar.show();
		else this.sidebar.hide();
	},
	
	displayMarkers: function()
	{
		var filter = this.mapState.get("filter");

		this.clusterGroup.clearLayers();

		var markers=[], facilities=0, units=0, capacity=0;
		
		this.collection.forEach(function(item) {
			if (this._passes_filter(item,filter)) {
				facilities++;
				u = item.get("units");
				c = item.get("capacity");
				if (u) units += parseInt(u);
				if (c) capacity += parseFloat(c);
				markers.push(this._create_marker(item));
			}
		},this);
		this.clusterGroup.addLayers(markers);
		this.mapState.set("filterresults",{facilities:facilities, units:units, capacity:capacity});
	},
	
	newItem: function()
	{
		this.newMarker.setLatLng(this.map.getCenter()).addTo(this.map);
		this.selectedMarker = this.newMarker;
	},
	
	fitBounds: function()
	{
			this.map.fitBounds(this.clusterGroup.getBounds());
	},
	
	search: function()
	{
		var item = this.collection.get(this.mapState.get("searchid"));
		if (item) {
			this.map.setView(item.marker.getLatLng(),8,{
				pan: {animate: true, duration: 1, easeLinearity: 0.25},
				zoom: {animate: true},
				animate: true
			});
			this.selectedMarker=item.marker;
			this.markerPositionSet=true;
			this.openEditDialog();
		}
	},

	fetchCompleted: function()
	{
		if (this.clusterGroup.getLayers().length>0)
			this.fitBounds();
	},		
	
	_get_icon: function(item)
	{
		var icon = blackIcon;
		var capacity = item.get('capacity');
		if (capacity<1) icon = greenIcon;
		else if (capacity>=1 && capacity<100) icon = yellowIcon;
		else if (capacity>=100) icon = redIcon;
		return icon;
	},

	_create_marker: function(item)
	{
		var u = item.get("units");
		var c = item.get("capacity");
		var title = item.get('name') + (u ? ", " + u + " unit" + (parseInt(u)>1 ? "s" : "") : "") + (c ? " (" + c + " MW)" : "");
		var marker = L.marker(new L.LatLng(item.get('latitude'), item.get('longitude')), { title: title, icon:this._get_icon(item), idfarm:item.cid });
		marker.on("mousedown",this.markerSelect,this);
		item.marker = marker;
		return marker;
	},

	_passes_filter: function(item,filter)
	{
		if (filter.parameters.length>0)
		{		
		var status = item.get('status');
		if (!_.contains(filter.parameters,'filter-status-'+status))
			return false;
			
		var capacity = item.get('capacity');
		if (capacity==null && !_.contains(filter.parameters,'filter-capacity-0'))
			return false;
		if (capacity<1 && capacity!=null && !_.contains(filter.parameters,'filter-capacity-1'))
			return false;
		if (capacity>=1 && capacity<10 && !_.contains(filter.parameters,'filter-capacity-2'))
			return false;
		if (capacity>=10 && capacity<50 && !_.contains(filter.parameters,'filter-capacity-3'))
			return false;
		if (capacity>=50 && capacity<100 && !_.contains(filter.parameters,'filter-capacity-4'))
			return false;
		if (capacity>=100 && capacity<200 && !_.contains(filter.parameters,'filter-capacity-5'))
			return false;
		if (capacity>=200 && !_.contains(filter.parameters,'filter-capacity-6'))
			return false;
			
		var units = item.get('units');
		if (units==null && !_.contains(filter.parameters,'filter-units-0'))
			return false;
		if (units==1 && !_.contains(filter.parameters,'filter-units-1'))
			return false;
		if (units>1 && units<=5 && !_.contains(filter.parameters,'filter-units-2'))
			return false;
		if (units>5 && units<=10 && !_.contains(filter.parameters,'filter-units-3'))
			return false;
		if (units>10 && units<=20 && !_.contains(filter.parameters,'filter-units-4'))
			return false;
		if (units>20 && units<=50 && !_.contains(filter.parameters,'filter-units-5'))
			return false;
		if (units>50 && units<=100 && !_.contains(filter.parameters,'filter-units-6'))
			return false;
		if (units>100 && !_.contains(filter.parameters,'filter-units-7'))
			return false;
		}
		
		var text = filter.name;
		if (text.length>=2 && item.get('name').toLowerCase().indexOf(text)<0)
			return false;	

		var text = filter.owner;
		if (text.length>=2 && item.get('owner').toLowerCase().indexOf(text)<0)
			return false;	

		text = filter.developer;
		if (text.length>=2 && item.get('developer').toLowerCase().indexOf(text)<0)
			return false;	

		text = filter.purchaser;
		if (text.length>=2 && item.get('energy_purchaser').toLowerCase().indexOf(text)<0)
			return false;	

		text = filter.manufacturer;
		if (text.length>=2 && item.get('manufacturer').toLowerCase().indexOf(text)<0)
			return false;	

		return true;		
	}
});
});