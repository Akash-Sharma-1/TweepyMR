
var firebase = require("firebase");
var config = {

	apiKey : "AIzaSyDgYF1UYJkaNfc62sk2VjYaoXnJ3-V1AfE",
	authDomain: "tweepy-7845f.firebaseapp.com",
	databaseURL : "https://tweepy-7845f.firebaseio.com",
	projectId : "tweepy-7845f",
	storageBucket : "gs://tweepy-7845f.appspot.com"
};

firebase.initializeApp(config);

var ref = firebase.database().ref("Tweets");

ref.on('value',function(data)
{
	var val=data.key;
	var len=data.numChildren();
	var i;
	for( i=0;i<len;i++)
	{
	console.log(data.child(i.toString()).child("id_str").val());
	}
	
});
	

