define(['backbone', 'models/windfarm'], function(Backbone, WindFarm) {
  	return Backbone.Collection.extend({
  		url:"/public/windfarms",
  		model: WindFarm
  });
});