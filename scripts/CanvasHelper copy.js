CanvasHelper = function(id)
{
	this.dragging = false;
	this.mouseDown = false;
	this.data = {};
	this.timerID = null;
	
	$("#"+id).on("mousedown",{helper:this},function(event) {
		event.data.helper.data.origX=event.data.helper.data.X=event.offsetX;
		event.data.helper.data.origY=event.data.helper.data.Y=event.offsetY;
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
		event.data.helper.data.X=event.offsetX;
		event.data.helper.data.Y=event.offsetY;

		if (event.data.helper.mouseDown && event.data.helper.drag!=undefined)
		{
			console.log(event);
			event.data.helper.data.beginDrag=(event.data.helper.dragging==false);
			event.data.helper.dragging=true;
			event.data.helper.data.deltaX = event.offsetX - event.data.helper.data.origX ;
			event.data.helper.data.deltaY = event.offsetY - event.data.helper.data.origY ;			
			event.data.helper.drag(event.data.helper.data);
		}
		else if (!event.data.helper.mouseDown && event.data.helper.hover!=undefined)
		{
			if (this.timerID!=null)
				clearTimeout(this.timerID)
			this.timerID = setTimeout(event.data.helper.hover,1000);
		}
	});
}