define (['underscore', 'backbone', 'collections/windcompanies', 'text!templates/editfarm.html', 'jqueryui'], function(_, Backbone, WindCompanies, EditTemplate) {

return Backbone.View.extend({
    tagName: 'div',
    
    className: "editview",
    
    idFarm: 0,
                
    events:{
    	'click #submit': 'editSubmit',
    	'click #cancel': 'editCancel',
		'click #delete': 'editDelete',
		'click #move': 'editMove'
	},
	
	coordinates: {},

	initialize: function(options) {
		this.template = _.template(EditTemplate);
		this.companyNames = [];
		this.companies = new WindCompanies();
		this.listenTo( this.companies, 'add', this.addCompany );
		//this.companyHTML = "";
		this.companies.fetch({reset:false,success:this.fetchSuccessful,context:this});		
	},
    
	render: function() {
		var attributes = _.extend(this.coordinates, _.clone(this.model.attributes));
    	this.$el.html(this.template({attributes:attributes}));
    	this.$(".wind-company").autocomplete({source:this.companyNames});
    	
    	this.$("select[name='type']").val(this.model.get("type"));
    	this.$("select[name='status']").val(this.model.get("status"));
    	
    	this.$(".tabs").tabs({heightStyle:"content"});
    	
    	return this;
	},

	setCoordinates: function(lat,lng)
	{
		this.coordinates = {latitude:lat, longitude:lng};
	},
	
	addCompany: function(model) {
		this.companyNames.push(model.get("name"));
	},
	
	/*
	fetchSuccessful: function(collection, response, options)
	{
		options.context.companyHTML += "<option value='0'>Unknown</option>";
	},	
	*/

	editSubmit: function()
	{
		this.trigger("edited",{action:"save", model:this.model, attributes:this._get_attributes()});
		return false;
	},
		
	editCancel: function()
	{
		this.trigger("edited",{action:"cancel", model:this.model, attributes:this._get_attributes()});
		return false;
	},

	editDelete: function()
	{
		this.trigger("edited",{action:"delete", model:this.model, attributes:this._get_attributes()});
		return false;
	},
	
	_get_attributes: function()
	{
		var attributes = {}
		var arr = this.$("form").serializeArray();
		_.each(arr, function(obj) {
			attributes[obj.name]=obj.value;
		});
		var coords = attributes.coordinates.split(",");
		attributes.latitude = coords[0].trim();
		attributes.longitude = coords[1].trim();
		attributes.comments.replace("'","");
		return attributes;
	}
	
});
});