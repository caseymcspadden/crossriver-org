define (['backbone', 'views/mapcontrols', 'views/leafletview', 'views/editfarm', 'views/filter', 'text!templates/mapview.html'], function(Backbone, ControlsView, LeafletView, EditFarm, FilterView, MapTemplate) {

return Backbone.View.extend({
	
	events:{
	},
	
	initialize: function(options) {
		this.template = _.template(MapTemplate);
		this.leafletView = new LeafletView({collection: options.collection, mapState:options.mapState, editView: new EditFarm(), filterView: new FilterView({mapState:options.mapState})});
		this.controlsView = new ControlsView({mapState:options.mapState});
		this.listenTo(this,"parent.resize",this.resize);
	},
	
	resize: function() {
		var mapheight = this.$el.height() - this.controlsView.$el.height() - 6;
		this.leafletView.$el.height(mapheight); 
		this.leafletView.resized();
	},
	
	render: function() {
   		this.$el.html(this.template());
		this.controlsView.setElement(this.$(".map-controls")).render();
		this.leafletView.setElement(this.$(".map")).render();
		this.resize();
	}	
});
});