// site/js/views/library.js

define (['underscore', 'backbone', 'views/row', 'models/preferences', 'views/preferences', 'jqueryui', 'jquerycookie'], function(_, Backbone, RowView, preferences, PreferencesView) {

return Backbone.View.extend({
    el: '#CRBody',
    
    $head: null,
    
    $body: null,
    
    $editText: null,
 
    sortHeader: null,
    
    hiddenColumns: [],
        
    resizeElement: null,
    
    filterClicked: null,         // set to true if filter has been clicked and mouse is being moved to click on a row 
            
    preferences: preferences,     // Instantiated Preferences Model  
    
	  preferencesView: null,        // preferences view contained in preferences dialog
 
    preferencesDialog: null,      // number of days in feed, etc.
    
    displayPreferences: [],        // additional view-dependent display preferences (associated with checkbox items having class "display-preference"

    displayPreferencesDialog: null,   // allows selection of display preferences, including column visibility

		rowFilters: {},
        
    name: '',

    rowViews: [],
            
    events:{
    	'mousedown #gridheader table th.inner .resize': 'beginResize',
    	'mouseup': 'endResize',
    	'mousemove': 'mouseMove',
		'click #button-refresh': 'refreshDisplay',
		'click #gridheader [type=checkbox].filter': 'filterClick',
    	'click #gridheader a.column-name': 'nameClick',
    	'click .display-preference': 'displayPreferencesChanged',
    	'click input.display-header-checkbox': 'toggleColumnVisibility',
	},

	initialize: function(options) {
		
		var that = this;
		
		this.name=options.name;
		this.template = _.template(options.template);
		this.$el.html(this.template({docroot:require.toUrl('').replace(/\/js\//,'')}));
		this.$head = this.$el.find('#gridheader thead');
		this.$head2 = this.$el.find('#gridbody thead');
		this.$body = this.$el.find('#gridbody tbody');
		
		if (options.displayPreferencesButton!==undefined)
	 	{
			this.events['click ' + options.displayPreferencesButton]='displayPreferencesClicked';
			
			
			var html = '<div>';
			if (this.$el.find('#display-preferences')[0])
				html += this.$el.find('#display-preferences').html();
				 		
	 		this.displayPreferencesDialog = $(html + '<p><b>Visible Columns:</b></p><table><tbody class="display-visible"></tbody></table></div>').dialog({
				title: 'Display Preferences',
				autoOpen: false,
				//height: def.height || 250,
				width: 350,
				modal: false,
				context: this,
				appendTo: this.el,
				position: {my:"left top", at:"left bottom", of:options.displayPreferencesButton},
				buttons: {
					"Close":  function() {$(this).dialog('close');}
					}
			});
			
			this.hiddenColumns = (this.name===undefined || $.cookie(this.name+'_hidden')===undefined) ? [] : $.cookie(this.name+'_hidden').split('!');
			
			_.each(this.collection.displayFields, function(item) {
				var checked = !_.contains(this.hiddenColumns,item.field);
				this.displayPreferencesDialog.find('tbody.display-visible').append($('<tr><td><input class="display-header-checkbox" type="checkbox" name="' + item.field + '"' + (checked ? ' checked' : '') + '></td><td>' + item.header + '</td></tr>'));
			},this);
	
	        this.displayPreferences = (this.name===undefined || $.cookie(this.name+'_display')===undefined) ? [] : $.cookie(this.name+'_display').split('!');
			$('.display-preference').each(function(i,item) {
				item.checked = _.contains(that.displayPreferences,$(item).attr('name'));
			});
			
    	}
    	
    	$('#gridbody').on('scroll', function () {
			$('#gridheader').scrollLeft($(this).scrollLeft());
		});
    
		if (options.preferencesButton !== undefined)
		{
			var that = this;
			this.preferencesView=new PreferencesView({model:preferences});
			this.$el.find('#test').html(this.preferencesView.el);
	 		this.preferencesDialog = $(this.preferencesView.el).dialog({
				title: 'Preferences',
				autoOpen: false,
				//height: def.height || 250,
				width: 350,
				modal: true,
				context: this,
				appendTo: this.el,
				position: {my:"left top", at:"left bottom", of:options.preferencesButton},
				buttons: {
					"Submit":  function() {that.preferences.save($(this).find('form').serializeObject());$(this).dialog('close');},
					"Close":  function() {$(this).dialog('close');}
					}
			});
			$(options.preferencesButton).click(function(e) {that.preferencesDialog.dialog('open');});
			this.listenTo( this.preferences, 'change', this.preferencesChanged)
		}
    
		this.renderHead();
		        
		this.collection.fetch({reset: true});
                
		this.listenTo( this.collection, 'add', this.renderRows );
		this.listenTo( this.collection, 'reset', this.renderRows );
		this.listenTo( this.collection, 'change', this.modelChanged );
		this.listenTo( this.collection, 'sort', this.renderRows );
		this.listenTo( this.collection, 'rowrender',this.setViewColumnVisibilityAndClasses);
		this.listenTo( this.collection,	'editRequest',this.editRequest);
	},
	
	refreshDisplay: function(e)
	{
		this.collection.fetch({reset: true});
		e.preventDefault();
	},
    
    render: function() {
    	this.renderHead();
		this.renderRows();
	},
     
    renderHead: function()
    {
			var html='<tr>';
			for (var i=0;i<this.collection.displayFields.length;i++)
			{
				var obj = this.collection.displayFields[i];
				//var cls = (i<this.collection.displayFields.length-1 ? 'inner' : 'outer');
				html += '<th class="inner" id="h1_' + obj.field + '"><div><input type="checkbox" class="filter"/><span class="filtertext"></span><br><a href="#" class="column-name">' + obj.header + '</a><span class="sort"></span></div><div class="CRFloatRight resize"></div></th>';
			}
			html += '<th class="outer"></th></tr>';
			this.$head.html(html);

 			html='<tr>';
 			for (var i=0;i<this.collection.displayFields.length;i++)
 			{
				var obj = this.collection.displayFields[i];
				//var cls = (i<this.collection.displayFields.length-1 ? 'inner' : 'outer');
				html += '<th class="inner" id="h2_' + obj.field + '"/>';
			}
			html += '<th class="outer"></th></tr>';
			this.$head2.html( html ); 	  	
			$('#gridbody').height($(window).height()-220);
				    	
			if ($.cookie(this.name+'_width')!==undefined)
			{
				var width = $.cookie(this.name+'_width').split('!');
				_.each(width, function(item) {
					var name_width = item.split('.');
				  this.$el.find('#h1_'+name_width[0] +',#h2_'+name_width[0]).width(name_width[1]);
				},this);
			}
    },
    
    renderRows: function( item ) {
    	_.each(this.rowViews, function(view) {
	    	view.remove();
    	})
    	this.rowViews = [];
    	
			this.collection.each(function( item ) {
      	this.renderRow( item );
			},this);
			this.setHeaderColumnVisibility();
			//this.setColumnVisibility();
    },
    
    preferencesChanged: function()
    {		
    },
    
    modelChanged: function(model)
   	{
		var $row = this.$body.find('#row-' + model.cid);
        
		_.each(this.hiddenCoumns,function(name) {
			$row.find('td.field-'+name).addClass('CRHidden');
		},this);   	
	}, 
		
    renderRow: function( item ) {
        var rowView = new RowView({
            model: item
        });
        this.rowViews.push(rowView);
        this.$body.append( rowView.render().el );
        //$('#gridbody').height($(window).height()-220);
    },
    
    editRequest: function(arg)
    {
    	if (this.filterClicked !== null)
    	{
	    	this.rowFilters[this.filterClicked] = arg.model.get(this.filterClicked);
	    	this.filterClicked = null;
    		this.setAllRowClasses();
    	}
    	else if (this.editModel)
    		this.editModel(arg);
    },
    
    
    filterClick: function(e)
    {
    	var field = $(e.target).parent().parent().attr('id').substr(3);
    	
    	if (e.target.checked)
	    	this.filterClicked = field;
    	else {
    		delete (this.rowFilters[field]);
    		this.setAllRowClasses();
    	}
    },

    nameClick: function(e)
    {
    	var $header = $(e.target).parent().parent();
    	var selected = $header.attr('id').substr(3);
    	if (selected == this.sortHeader)
    	{
	    	this.$el.find('#h1_' + selected +' span.sort').removeClass(this.collection.sortAscending ? 'ui-icon-triangle-1-n' : 'ui-icon-triangle-1-s').addClass(this.collection.sortAscending ? 'ui-icon-triangle-1-s' : 'ui-icon-triangle-1-n');
	    	this.collection.sortAscending = !this.collection.sortAscending;
    	}
    	else
    	{
    		this.collection.sortAscending = true;
    		if (this.sortHeader)
			this.$el.find('#h1_' + this.sortHeader +' span.sort').toggleClass('ui-icon ui-icon-triangle-1-n');
			this.$el.find('#h1_' + selected + ' span.sort').toggleClass('ui-icon ui-icon-triangle-1-n');
		}
		this.sortHeader = selected;
		this.collection.sortField=this.sortHeader;
		this.collection.sort();
    },

    /*
    headerClick: function(e)
    {
    	if (this.resizeElement)
    	{
			this.resizeElement=null;
    		return;
    	}
    
    	var selected = $(e.currentTarget).attr('id').substr(3);
    	if (selected == this.sortHeader)
    	{
	    	this.$el.find('#h1_' + selected +' span.sort').removeClass(this.collection.sortAscending ? 'ui-icon-triangle-1-n' : 'ui-icon-triangle-1-s').addClass(this.collection.sortAscending ? 'ui-icon-triangle-1-s' : 'ui-icon-triangle-1-n');
	    	this.collection.sortAscending = !this.collection.sortAscending;
    	}
    	else
    	{
    		this.collection.sortAscending = true;
    		if (this.sortHeader)
			this.$el.find('#h1_' + this.sortHeader +' span.sort').toggleClass('ui-icon ui-icon-triangle-1-n');
			this.$el.find('#h1_' + selected + ' span.sort').toggleClass('ui-icon ui-icon-triangle-1-n');
		}
		this.sortHeader = selected;
		this.collection.sortField=this.sortHeader;
		this.collection.sort();
		//this.collection.fetch({reset:true, data:{'sortBy': (this.collection.sortAscending ? '+' : '-')+this.sortHeader}});
    },
    */
    
    // Column resizing event handlers
    beginResize: function(e)
    {
    	var $headElement = $(e.target).parent();
		this.resizeElement = {field: $headElement.attr('id').substr(3), origWidth: $headElement.width(), origX: e.pageX};
    },
    
    endResize: function(e) 
    {
    	if (!this.resizeElement)
    		return;
    	
    	var totwidth=0;
    	_.each(this.$el.find('#gridheader .inner'), function(item) {
	    	totwidth += $(item).width();
    	});
    	var maxwidth = this.$el.width();
			this.setWidthCookie();
    	this.resizeElement=null;
    	
    	//if (totwidth < maxwidth)
    	//	this.$el.find('#gridheader table, #gridbody table').width(maxwidth);
    },
    
    mouseMove: function(e)
    {
	    if (this.resizeElement)
	    {
	    	//console.log(e);
	    	this.$el.find('#h1_'+this.resizeElement.field +',#h2_'+this.resizeElement.field).width(this.resizeElement.origWidth + e.pageX - this.resizeElement.origX);
				e.preventDefault();
			}
		},
	
	setWidthCookie: function()
	{
		width = [];
		this.$el.find('#gridheader th.inner').each(function (i,item) {
			$item = $(item);
			width.push($item.attr('id').substr(3) + '.' + $item.width());
		});
		$.cookie(this.name+'_width',width.join('!'),{expires:365});
	},
		
	displayPreferencesClicked: function(e)
	{
		if (this.displayPreferencesDialog!==null)
			this.displayPreferencesDialog.dialog('open');
		e.preventDefault();
	},
	
	displayPreferencesChanged: function(e)
 	{
 		var arr = [];
		$('.display-preference').each(function(i,item) {
			if ($(item).is(':checked'))
				arr.push($(item).attr('name'));
		});
		this.displayPreferences=arr;
		$.cookie(this.name+'_display',arr.join('!'),{expires:365});
		this.setAllRowClasses();
 	},

	
	setViewColumnVisibilityAndClasses: function(view)
	{
		_.each(this.hiddenColumns,function(name) {
				view.$el.find('td.field-'+name).addClass('CRHidden');
		},this);
		this.setRowClassesFromView(view);
	},

	setHeaderColumnVisibility: function(hidden)
	{
		this.$el.find('#gridheader th,#gridbody th').removeClass('CRHidden');
		_.each(this.hiddenColumns,function(name) {
				this.$el.find('#h1_' + name +',#h2_'+name).addClass('CRHidden');
		},this);
	},

	setColumnVisibility: function(hidden)
	{
		this.$el.find('#gridheader th,#gridbody th,#gridbody td').removeClass('CRHidden');
		_.each(this.hiddenColumns,function(name) {
				this.$el.find('#h1_' + name +',#h2_'+name+',td.field-'+name).addClass('CRHidden');
		},this);
	},

	toggleColumnVisibility: function(e)
	{
		this.hiddenColumns = [];
		var that = this;
				
		$('.display-header-checkbox').each(function(i,item) {
			if (!$(item).is(':checked'))
				that.hiddenColumns.push($(item).attr('name'));
		});
		$.cookie(this.name+'_hidden',this.hiddenColumns.join('!'),{expires:365});
		this.setColumnVisibility();
	},
	
	 setAllRowClasses: function() {
		_.each(this.rowViews, function(view) {
			this.setRowClassesFromView(view);
		},this);
 	},
	
	setRowClassesFromView: function(view)
 	{
		this.setGridRowClasses(view.$el,view.model);
	}, 	

 	setRowClassesFromModel: function(model)
 	{
		this.setGridRowClasses(this.$el.find('#gridbody #row-'+model.cid),model);
	},
	
	setGridRowClasses: function($row,model)
	{
 		$row.removeClass('CRHidden');
		_.each(this.rowFilters, function(value,key,list) {
			if (model.get(key)!=value) {
				$row.addClass('CRHidden');
			}
		});

		if (this.setRowClasses)
			this.setRowClasses($row,model);
	}
});
});