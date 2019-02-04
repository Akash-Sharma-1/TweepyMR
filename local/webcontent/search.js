var key;

$("#submit").click(function()
{

	key=$("#key").val();
	var k=key.toLowerCase();

	//var firebase = require("firebase");
	
	var config = {

		apiKey : "AIzaSyDgYF1UYJkaNfc62sk2VjYaoXnJ3-V1AfE",
		authDomain: "tweepy-7845f.firebaseapp.com",
		databaseURL : "https://tweepy-7845f.firebaseio.com",
		projectId : "tweepy-7845f",
		storageBucket : "gs://tweepy-7845f.appspot.com"
	};

	if (!firebase.apps.length) {
	firebase.initializeApp(config);
	    
	}
	var ref = firebase.database().ref("Tweets");
	var list=[];
	
	
		ref.on('value',function(data)
		{
			var val=data.key;
			var len=data.numChildren();
			var i;

			for(i=0;i<len;i++)
			{
				var text=data.child(i.toString()).child("text").val();
				if(text.includes(k))
				{
					list.push(data.child(i.toString()).child("id_str").val());
				}
			}

			var arr=list;
			var i;
			var url1="<a href='https://twitter.com/narendramodi/status/";
			var url2="?ref_src=twsrc%5Etfw'></a>";
			for(i=0;i<arr.length;i++)
			{	
					var d=document.createElement('div');
					d.className='t';
					var b=document.createElement('blockquote');
					b.className='twitter-tweet';
					b.innerHTML=url1+arr[i]+url2;
					d.appendChild(b);
					var body=document.getElementById('body');
					body.appendChild(d);
			}
			twttr.widgets.load(
			  document.getElementById('body')
			);
			
		});
		
});


