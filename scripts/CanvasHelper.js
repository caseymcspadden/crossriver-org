CanvasHelper = function(id,context)
{
	var dragging = false;
	var mouseDown = false;
	var timerID = null;
	var data = {};
	data.context = context;
	this.obj = $("#"+id);
	
	var that = this;
	
	var getOffsets = function(e)
	{
		var offsets = {};
		if(e.offsetX==undefined) // this works for Firefox
		{
			offsets.x = e.pageX-this.obj.offset().left;
			offsets.y = e.pageY-this.obj.offset().top;
		}             
		else                     // works in Google Chrome
		{
			offsets.x = e.offsetX;
			offsets.y = e.offsetY;
		}
		return offsets;	
	}	
	
	var doHover = function() {
		that.hover(data);
	}

	$("#"+id).on("mousedown",function(event) {
		var offsets = getOffsets(event);
		data.origX=data.X=offsets.x;
		data.origY=data.Y=offsets.y;
		data.event = event;
		//var handled = false;
		//if (that.click!=undefined)
			//handled = that.click(data);
		//mouseDown=!handled;
		mouseDown=true;
		return true;
	});

	$("#"+id).on("mouseup",function(event) {
		if (!dragging && that.click!=undefined)
			that.click(data);
		dragging=false;
		mouseDown=false;
	});

	$("#"+id).on("mousemove",{helper:this},function(event) {
		var offsets = getOffsets(event);
	
		data.X=data.x=offsets.x;
		data.Y=data.y=offsets.y;
		data.event = event;

		if (mouseDown && that.drag!=undefined)
		{
			data.beginDrag=(dragging==false);
			dragging=true;
			data.deltaX = offsets.x - data.origX ;
			data.deltaY = offsets.y - data.origY ;			
			that.drag(data);
		}
		else if (!mouseDown)
		{
		 	if (that.move!=undefined)
		 		that.move(data);
		 	if (that.hover!=undefined)
		 	{
				if (timerID!=null)
					clearTimeout(timerID)
				timerID = setTimeout(doHover,1000);
			}
		}
	});
}