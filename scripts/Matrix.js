Matrix = function(identity)
{
	this.elements = identity ? [1,0,0,0,1,0,0,0,1] : [0,0,0,0,0,0,0,0,0];
	
	Matrix.prototype.identity = function()
	{
		this.elements = [1,0,0,0,1,0,0,0,1];
		return this;
	}
		
	Matrix.prototype.set = function(r,c,val)
	{
		this.elements[r*3+c] = val;
	}
	
	Matrix.prototype.multiply = function(M)    // multiply this by matrix M
	{
		var ret = new Matrix(false);
		
		ret.elements[0] = this.elements[0]*M.elements[0] + this.elements[1]*M.elements[3] + this.elements[2]*M.elements[6];
		ret.elements[1] = this.elements[0]*M.elements[1] + this.elements[1]*M.elements[4] + this.elements[2]*M.elements[7];
		ret.elements[2] = this.elements[0]*M.elements[2] + this.elements[1]*M.elements[5] + this.elements[2]*M.elements[8];
		
		ret.elements[3] = this.elements[3]*M.elements[0] + this.elements[4]*M.elements[3] + this.elements[5]*M.elements[6];
		ret.elements[4] = this.elements[3]*M.elements[1] + this.elements[4]*M.elements[4] + this.elements[5]*M.elements[7];
		ret.elements[5] = this.elements[3]*M.elements[2] + this.elements[4]*M.elements[5] + this.elements[5]*M.elements[8];
		
		ret.elements[6] = this.elements[6]*M.elements[0] + this.elements[7]*M.elements[3] + this.elements[8]*M.elements[6];
		ret.elements[7] = this.elements[6]*M.elements[1] + this.elements[7]*M.elements[4] + this.elements[8]*M.elements[7];
		ret.elements[8] = this.elements[6]*M.elements[2] + this.elements[7]*M.elements[5] + this.elements[8]*M.elements[8];
		
		return ret;
	}
	
	Matrix.prototype.vecMult = function(V)
	{
		var ret = {};		

		ret.x = (this.elements[0]*V.x + this.elements[1]*V.y + this.elements[2]*V.z);
		ret.y = (this.elements[3]*V.x + this.elements[4]*V.y + this.elements[5]*V.z);
		ret.z = (this.elements[6]*V.x + this.elements[7]*V.y + this.elements[8]*V.z);
		
		return ret;
	}
	
	Matrix.prototype.rotate = function(axis,angle)
	{
		var r= new Matrix(false);
		
		var dcos = Math.cos(Math.PI * angle / 180);
		var dsin = Math.sin(Math.PI * angle / 180);

		switch (axis) {
			case 0:	r.elements[0]=1; r.elements[4]=dcos; r.elements[5]=dsin; r.elements[7]=-dsin; r.elements[8]=dcos; break;
			case 1:	r.elements[0]=dcos; r.elements[2]=-dsin; r.elements[4]=1; r.elements[6]=dsin; r.elements[8]=dcos; break;
			case 2:	r.elements[0]=dcos; r.elements[1]=dsin; r.elements[3]=-dsin; r.elements[4]=dcos; r.elements[8]=1; break;
		}
				
		return r.multiply(this);
	}
}

Matrix4 = function(identity)
{
	this.elements = identity ? [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1] : [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0];
			
	Matrix4.prototype.set = function(r,c,val)
	{
		this.elements[r*4+c] = val;
	}
	
	Matrix4.prototype.projection = function(viewAngle, aspect, near, far)
	{
			var p = new Matrix4(false);
	
    	var radians = viewAngle*Math.PI / 180.0;
 
    	var halfHeight = Math.tan(radians/2)*near;
 
    	var halfScaledAspectRatio = halfHeight*aspect;
 
    	p.set(0, 0, near/halfScaledAspectRatio );
 
			p.set(1, 1, near/halfHeight );
 
			p.set(2, 2, -(far+near)/(far-near) );
			p.set(2, 3, (-2*far*near)/(far-near) );
 
			p.set(3, 2, -1);
			 
			return p.multiply(this);
	}

	Matrix4.prototype.multiply = function(M)    // multiply this by matrix M
	{
		var ret = new Matrix4();
		
		ret.elements[0] = this.elements[0]*M.elements[0] + this.elements[1]*M.elements[4] + this.elements[2]*M.elements[8] + this.elements[3]*M.elements[12];
		ret.elements[1] = this.elements[0]*M.elements[1] + this.elements[1]*M.elements[5] + this.elements[2]*M.elements[9] + this.elements[3]*M.elements[13];
		ret.elements[2] = this.elements[0]*M.elements[2] + this.elements[1]*M.elements[6] + this.elements[2]*M.elements[10] + this.elements[3]*M.elements[14];
		ret.elements[3] = this.elements[0]*M.elements[3] + this.elements[1]*M.elements[7] + this.elements[2]*M.elements[11] + this.elements[3]*M.elements[15];

		ret.elements[4] = this.elements[4]*M.elements[0] + this.elements[5]*M.elements[4] + this.elements[6]*M.elements[8] + this.elements[7]*M.elements[12];
		ret.elements[5] = this.elements[4]*M.elements[1] + this.elements[5]*M.elements[5] + this.elements[6]*M.elements[9] + this.elements[7]*M.elements[13];
		ret.elements[6] = this.elements[4]*M.elements[2] + this.elements[5]*M.elements[6] + this.elements[6]*M.elements[10] + this.elements[7]*M.elements[14];
		ret.elements[7] = this.elements[4]*M.elements[3] + this.elements[5]*M.elements[7] + this.elements[6]*M.elements[11] + this.elements[7]*M.elements[15];

		ret.elements[8] = this.elements[8]*M.elements[0] + this.elements[9]*M.elements[4] + this.elements[10]*M.elements[8] + this.elements[11]*M.elements[12];
		ret.elements[9] = this.elements[8]*M.elements[1] + this.elements[9]*M.elements[5] + this.elements[10]*M.elements[9] + this.elements[11]*M.elements[13];
		ret.elements[10] = this.elements[8]*M.elements[2] + this.elements[9]*M.elements[6] + this.elements[10]*M.elements[10] + this.elements[11]*M.elements[14];
		ret.elements[11] = this.elements[8]*M.elements[3] + this.elements[9]*M.elements[7] + this.elements[10]*M.elements[11] + this.elements[11]*M.elements[15];

		ret.elements[12] = this.elements[12]*M.elements[0] + this.elements[13]*M.elements[4] + this.elements[14]*M.elements[8] + this.elements[15]*M.elements[12];
		ret.elements[13] = this.elements[12]*M.elements[1] + this.elements[13]*M.elements[5] + this.elements[14]*M.elements[9] + this.elements[15]*M.elements[13];
		ret.elements[14] = this.elements[12]*M.elements[2] + this.elements[13]*M.elements[6] + this.elements[14]*M.elements[10] + this.elements[15]*M.elements[14];
		ret.elements[15] = this.elements[12]*M.elements[3] + this.elements[13]*M.elements[7] + this.elements[14]*M.elements[11] + this.elements[15]*M.elements[15];
		
		return ret;
	}
	
	Matrix4.prototype.vecMult = function(V)
	{
		var ret = {};		

		ret.x = (this.elements[0]*V.x + this.elements[1]*V.y + this.elements[2]*V.z  + this.elements[3]*V.w);
		ret.y = (this.elements[4]*V.x + this.elements[5]*V.y + this.elements[6]*V.z  + this.elements[7]*V.w);
		ret.z = (this.elements[8]*V.x + this.elements[9]*V.y + this.elements[10]*V.z  + this.elements[11]*V.w);
		ret.w = (this.elements[12]*V.x + this.elements[13]*V.y + this.elements[14]*V.z  + this.elements[15]*V.w);
		
		return ret;
	}
	
	Matrix4.prototype.translate = function(dx,dy,dz)
	{
		var r= new Matrix4(true);
		
		r.set(0,3,dx);
		r.set(1,3,dy);
		r.set(2,3,dz);
		
		return r.multiply(this);
	}
	
	Matrix4.prototype.rotate = function(axis,angle)
	{
		var r= new Matrix4(true);
		
		var dcos = Math.cos(Math.PI * angle / 180);
		var dsin = Math.sin(Math.PI * angle / 180);

		switch (axis) {
			case 0:	r.elements[0]=1; r.elements[5]=dcos; r.elements[6]=dsin; r.elements[9]=-dsin; r.elements[10]=dcos; break;
			case 1:	r.elements[0]=dcos; r.elements[2]=-dsin; r.elements[5]=1; r.elements[8]=dsin; r.elements[10]=dcos; break;
			case 2:	r.elements[0]=dcos; r.elements[1]=dsin; r.elements[4]=-dsin; r.elements[5]=dcos; r.elements[10]=1; break;
		}
				
		return r.multiply(this);
	}
}