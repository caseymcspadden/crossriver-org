define(['backbone'], function(Backbone) {
  	return Backbone.Model.extend({
  		defaults: {
	  		name: "",
	  		owner: "",
	  		type: 1,
	  		status: 1,
	  		online_date: null,
	  		capacity: null,
	  		units: null,
	  		developer: "",
	  		energypurchaser: "",
	  		manufacturer: "",
	  		comments: ""
  		}
  });
});