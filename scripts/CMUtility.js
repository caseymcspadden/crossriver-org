CMUtility = function()
{
	CMUtility.prototype.setCookie = function(c_name, value, expdays)
	{
		var expdate=new Date();
		expdate.setDate(expdate.getDate() + expdays);
		var c_value=escape(value) + ((expdays==null) ? "" : "; expires="+expdate.toUTCString());
		document.cookie = c_name + "=" + c_value;
	}
	
	CMUtility.prototype.getCookie = function(c_name)
	{
		if (c_name==null || c_name.length==0)
			return null;
	
		var c_value = document.cookie;
		var c_start = c_value.indexOf(" " + c_name + "=");
		if (c_start == -1)
		{
			c_start = c_value.indexOf(c_name + "=");
		}
		if (c_start == -1)
		{
			c_value = null;
		}
		else
		{
			c_start = c_value.indexOf("=", c_start) + 1;
			var c_end = c_value.indexOf(";", c_start);
			if (c_end == -1)
			{
				c_end = c_value.length;
			}
			c_value = unescape(c_value.substring(c_start,c_end));
		}
		return c_value;
	}
	
	CMUtility.prototype.getCreditCardType = function(str)
	{
		if (str.length<2)
			return null;
			
		if (str[0]=='4')
			return "visa";
			
		var sub = str.substr(0, 2);
		
		if (sub=="51" || sub=="52" || sub=="53" || sub=="54" || sub=="55")
			return "mastercard";
			
		if (sub=="34" || sub=="37")
			return "amex";
			
		if (sub=="60" || sub=="64" || sub=="65")
			return "discover";

		return null;
	}		
}
