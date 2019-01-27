var key;

$("#submit").click(function()
{
	

	key=$("#key").val();
	var k=key.toLowerCase();
	var kar=k.split(" ");
	var kl=kar.length
	var stopwords=["i", "me", "my", "myself", "we", "our", "ours", "ourselves", "you", "your", "yours", "yourself", "yourselves", "he", "him", "his", "himself", "she", "her", "hers", "herself", "it", "its", "itself", "they", "them", "their", "theirs", "themselves", "what", "which", "who", "whom", "this", "that", "these", "those", "am", "is", "are", "was", "were", "be", "been", "being", "have", "has", "had", "having", "do", "does", "did", "doing", "a", "an", "the", "and", "but", "if", "or", "because", "as", "until", "while", "of", "at", "by", "for", "with", "about", "against", "between", "into", "through", "during", "before", "after", "above", "below", "to", "from", "up", "down", "in", "out", "on", "off", "over", "under", "again", "further", "then", "once", "here", "there", "when", "where", "why", "how", "all", "any", "both", "each", "few", "more", "most", "other", "some", "such", "no", "nor", "not", "only", "own", "same", "so", "than", "too", "very", "s", "t", "can", "will", "just", "don", "should", "now",""," "];
	var sarray=[];
	for(var i=0;i<kl;i++)
	{
		if(stopwords.includes(kar[i]))
		{
			console.log("stopword found");
		}
		else
			{
				sarray.push(kar[i]);
			}
	}
	console.log(sarray);

	//var firebase = require("firebase");
	
	var bd=document.getElementById('body');
	var load=document.createElement('div');
	load.className='loader';
	bd.appendChild(load);

	var config = {

		apiKey : "AIzaSyDgYF1UYJkaNfc62sk2VjYaoXnJ3-V1AfE",
		authDomain: "tweepy-7845f.firebaseapp.com",
		databaseURL : "https://tweepy-7845f.firebaseio.com",
		projectId : "tweepy-7845f",
		storageBucket : "gs://tweepy-7845f.appspot.com"
	};

	firebase.initializeApp(config);

	var ref = firebase.database().ref("Tweets");
	var list=[];
	
	
		ref.on('value',function(data)
		{
			


			var val=data.key;
			var len=data.numChildren();
			

			for(var j=0;j<sarray.length;j++)
			{	
				for(var i=0;i<len;i++)
				{
					var text=data.child(i.toString()).child("text").val();
					text=text.toLowerCase();
					var tarray=text.split(" ");
					if(tarray.includes(sarray[j]))
					{
						if(list.includes(data.child(i.toString()).child("id_str").val()))
						{
							console.log("duplicate entry found");
						}
						else
						{
							list.push(data.child(i.toString()).child("id_str").val());
						}
					}
				}
			}
			console.log(list);
			var arr=list;
			var l=arr.length;
			var url1="<a href='https://twitter.com/narendramodi/status/";
			var url2="?ref_src=twsrc%5Etfw'></a>";
			if(l>=1)
			{
				var o=document.createElement('div');
				o.className="card bg-light";
				o.innerHTML="<div class='c' style='width: 30%; margin-left: 500px; text-align: center;'><h1 style='color: #718cab; '>Search Results</h1></div>";
				var body=document.getElementById('body');
				body.appendChild(o);
				for(var i=0;i<l;i++)
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
			}
			else
			{
				var d=document.createElement('div');
				d.className='card bg-dark';
				d.innerHTML="<h1 align='center' class='text-light'> Sorry ! No Results Found !</h1>";
				var body=document.getElementById('body');
				body.appendChild(d);

			}
			
			
			bd.removeChild(load);
			
		});
		
});


