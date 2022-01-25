CanvasHelper = function(id,context)
{
	this.dragging = false;
	this.mouseDown = false;
	this.data = {};
	this.data.context = context;
	this.timerID = null;
	this.obj = $("#"+id);
	
	CanvasHelper.prototype.getOffsets = function(e)
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
	
	$("#"+id).on("mousedown",{helper:this},function(event) {
		var offsets = event.data.helper.getOffsets(event);
		event.data.helper.data.origX=event.data.helper.data.X=offsets.x;
		event.data.helper.data.origY=event.data.helper.data.Y=offsets.y;
		var handled = false;
		if (event.data.helper.click!=undefined)
			handled = event.data.helper.click(event.data.helper.data);
		event.data.helper.mouseDown=!handled;
	});

	$("#"+id).on("mouseup",{helper:this},function(event) {
		event.data.helper.dragging=false;
		event.data.helper.mouseDown=false;
	});

	$("#"+id).on("mousemove",{helper:this},function(event) {
		var offsets = event.data.helper.getOffsets(event);
	
		event.data.helper.data.X=event.data.helper.data.x=offsets.x;
		event.data.helper.data.Y=event.data.helper.data.y=offsets.y;

		if (event.data.helper.mouseDown && event.data.helper.drag!=undefined)
		{
			event.data.helper.data.beginDrag=(event.data.helper.dragging==false);
			event.data.helper.dragging=true;
			event.data.helper.data.deltaX = offsets.x - event.data.helper.data.origX ;
			event.data.helper.data.deltaY = offsets.y - event.data.helper.data.origY ;			
			event.data.helper.drag(event.data.helper.data);
		}
		else if (!event.data.helper.mouseDown)
		{
		 	if (event.data.helper.move!=undefined)
		 		event.data.helper.move(event.data.helper.data);
		 	if (event.data.helper.hover!=undefined)
		 	{
				if (this.timerID!=null)
					clearTimeout(this.timerID)
					this.timerID = setTimeout(event.data.helper.hover,1000);
			}
		}
	});
}